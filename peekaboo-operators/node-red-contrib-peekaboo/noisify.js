const noderedutil = require("./util-nodered.js");
const NoisifyAudio = require("./filter/noisify-audio");
const performanceLogger = require("./performanceLogger");

module.exports = function (RED) {
  function PeekabooNoisifyNode(config) {
    RED.nodes.createNode(this, config);

    var node = this;
    node.datatype = config.datatype;
    node.noisifytarget = config.noisifytarget;
    node.customtabularfield = config.customtabularfield;

    node.blurradius = parseFloat(config.blurradius);
    node.blurfixednoise = config.blurfixednoise;
    node.pitchshift = parseFloat(config.pitchshift);
    node.pitchfixednoise = config.pitchfixednoise;
    node.temposhift = parseFloat(config.temposhift);
    node.tempofixednoise = config.tempofixednoise;
    node.scaleshift = parseFloat(config.scaleshift);
    node.scalefixednoise = config.scalefixednoise;


    function noisifyTabular(in_pkb_dataitem, targetdata, scaleshift, scalefixednoise) {
      if (targetdata in in_pkb_dataitem.data) {
        var out_pkb_dataitem = noderedutil.deepClone(in_pkb_dataitem); //make a deep clone of the object
        const scaleshift_val = Number(scaleshift);
        if (Number.isNaN(scaleshift_val)) {
          noderedutil.nodeStatusError(node, "noisify.errors.non-number-scale-shift.");
          return null;
        }
        if (scalefixednoise) {
          console.log(scaleshift);
          out_pkb_dataitem.data[targetdata] = in_pkb_dataitem.data[targetdata] * (1+scaleshift_val);
        } else {
          out_pkb_dataitem.data[targetdata] = in_pkb_dataitem.data[targetdata]* (1+Math.random()*scaleshift_val*2-scaleshift_val);
        }// console.log(out_pkb_dataitem);
        return out_pkb_dataitem;
      } else {
        noderedutil.nodeStatusError(node, "noisify.errors.cannot-find-target-field.");
        return null;
      }
    }

    function noisifyImage(in_pkb_dataitem, target, blurradius) {
      const sourcejimp = in_pkb_dataitem.data;
      // Find inference containing matching contenttype
      const matchingInferences = in_pkb_dataitem.inference.filter(
        (inference) => inference.contenttype == target
      );
      if (matchingInferences.length > 0) {
        const imgClone = sourcejimp.clone();
        // Blur each bounding box from inference
        for (let inference of matchingInferences) {
          const bbox = inference.data.boundingbox;
          imgClone.pixelate(blurradius, bbox.x, bbox.y, bbox.width, bbox.height);
        }
        return {
          datatype: "image",
          contenttype: target,
          data: imgClone
        };
      } else {
        noderedutil.nodeStatusError(node, "noisify.errors.cannot-find-target-field.");
        return null;
      }
    }

    node.on("input", async function (msg) {
      console.assert(Array.isArray(msg.payload));
      noderedutil.nodeStatusProcessing(node, "Processing...");
      const totalPerformance = new performanceLogger(node.id);
      totalPerformance.start("noisify");

      var o_payload = [];
      for (let i = 0; i < msg.payload.length; i++) {
        var pkb_dataitem = msg.payload[i];

        if (pkb_dataitem.datatype === node.datatype) {
          const performance = new performanceLogger(node.id);
          performance.start("noisify");
          var out_pkb_dataitem = null;
          if (pkb_dataitem.datatype == "image") {
            out_pkb_dataitem = noisifyImage(pkb_dataitem, node.noisifytarget, node.blurradius);
          } else if (pkb_dataitem.datatype == "audio") {
            const noisifyAudio = new NoisifyAudio();
            out_pkb_dataitem = await noisifyAudio.onInput(node, pkb_dataitem);
          } else if (pkb_dataitem.datatype == "tabular") {
            console.log("noisifying tabular data");
            if(node.noisifytarget == "custom") {
              out_pkb_dataitem = noisifyTabular(pkb_dataitem, node.customtabularfield, node.scaleshift, node.scalefixednoise);
            } 
          } else if (pkb_dataitem.datatype == "radio") {
            
          } else if (pkb_dataitem.datatype == "video") {

          } else if (pkb_dataitem.datatype == "scalar") {

          }
          if(out_pkb_dataitem != null)
            performance.end("noisify");
            out_pkb_dataitem.performance = performance.getPerformance();
            o_payload.push(out_pkb_dataitem);
        }
      }
      if(o_payload.length) {
        noderedutil.nodeStatusSuccess(node, "Noisified data!");
        totalPerformance.end("noisify");
        msg.performance = totalPerformance.getPerformance();
        msg.payload = o_payload;
        msg.senderID = this.id;
        node.send(msg);
      } else {
        noderedutil.nodeStatusSuccess(node, "Done!");
      }
    });
  }
  RED.nodes.registerType("noisify", PeekabooNoisifyNode);
};
