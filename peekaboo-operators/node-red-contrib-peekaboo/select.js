const noderedutil = require("./util-nodered.js");
const performanceLogger = require("./performanceLogger");

module.exports = function (RED) {
  function PeekabooSelectNode(config) {
    RED.nodes.createNode(this, config);

    var node = this;
    node.datatype = config.datatype;
    node.selecttarget = config.selecttarget;
    node.customtabularfield = config.customtabularfield;
    node.audioevent = config.audioevent;
    node.includechildren = config.includechildren;

    function selectTabular(in_pkb_dataitem, targetdata) {
      console.log(targetdata);
      if (targetdata in in_pkb_dataitem.data) {
        var out_pkb_dataitem = noderedutil.deepClone(in_pkb_dataitem); //make a deep clone of the object
        out_pkb_dataitem.data = {};
        out_pkb_dataitem.contenttype = targetdata;
        out_pkb_dataitem.data[targetdata] = in_pkb_dataitem.data[targetdata];
        // console.log(out_pkb_dataitem);
        return out_pkb_dataitem;
      } else {
        noderedutil.nodeStatusError(
          node,
          "select.errors.cannot-find-target-field."
        );
        return null;
      }
    }

    function selectImage(in_pkb_dataitem) {
      const sourcejimp = in_pkb_dataitem.data;
      // Find inference containing matching contenttype
      const matchingInferences = in_pkb_dataitem.inference.filter(
        (inference) => inference.contenttype == node.selecttarget
      );
      const croppedTargets = [];
      // Crop each bounding box from inference
      for (let inference of matchingInferences) {
        const bbox = inference.data.boundingbox;
        const roi = sourcejimp.clone();
        const { width, height, x, y } = bbox;
        roi.crop(x, y, width, height);
        croppedTargets.push({
          datatype: "image",
          contenttype: node.selecttarget,
          data: roi,
        });
      }
      return croppedTargets;
    }

    function selectAudio(in_pkb_dataitem) {
      if (!in_pkb_dataitem.inference) {
        console.error("Missing inference: audio event");
        return null;
      } else {
        const inference = in_pkb_dataitem.inference.find(
          (inference) => inference.contenttype == "audio event"
        );
        if (inference == null) {
          console.error("Missing inference: audio event");
          return null;
        }
        const predictions = inference.data;
        const isPredicted = predictions.includes(node.audioevent);
        let isParent = false;
        if (node.includechildren) {
          const ontologyNames = ontology.map((event) => event.name);
          const ontologyIds = ontology.map((event) => event.id);
          let parent = ontology[ontologyNames.indexOf(node.audioevent)];
          let childIds = parent.child_ids;
          let children = childIds.map(
            (id) => ontology[ontologyIds.indexOf(id)]
          );
          let childLabels = children.map((child) => child.name);
          isParent = predictions.some((x) => childLabels.includes(x));
        }
        if (isPredicted || (node.includechildren && isParent)) {
          return in_pkb_dataitem;
        }
        return null;
      }
    }

    node.on("input", function (msg) {
      console.assert(Array.isArray(msg.payload));
      noderedutil.nodeStatusProcessing(node, "Processing...");
      const totalPerformance = new performanceLogger(node.id);
      totalPerformance.start("select");

      var o_payload = [];
      msg.senderID = this.id;

      for (let i = 0; i < msg.payload.length; i++) {
        var pkb_dataitem = msg.payload[i];

        if (pkb_dataitem.datatype === node.datatype) {
          const performance = new performanceLogger(node.id);
          performance.start("select");
          var out_pkb_dataitem = null;
          if (pkb_dataitem.datatype == "image") {
            const croppedTargets = selectImage(pkb_dataitem);
            croppedTargets.forEach((entry) => o_payload.push(entry));
          } else if (pkb_dataitem.datatype == "audio") {
            out_pkb_dataitem = selectAudio(pkb_dataitem);
          } else if (pkb_dataitem.datatype == "tabular") {
            if (node.selecttarget == "custom") {
              out_pkb_dataitem = selectTabular(
                pkb_dataitem,
                node.customtabularfield
              );
            }
          } else if (pkb_dataitem.datatype == "radio") {
            out_pkb_dataitem = selectTabular(pkb_dataitem, node.selecttarget);
          } else if (pkb_dataitem.datatype == "video") {
          } else if (pkb_dataitem.datatype == "scalar") {
          }
          if (out_pkb_dataitem) {
            performance.end("select");
            out_pkb_dataitem.performance = performance.getPerformance();
            o_payload.push(out_pkb_dataitem);
          }
        }
      }
      if (o_payload.length) {
        noderedutil.nodeStatusSuccess(node, "Selected data!");
        totalPerformance.end("select");
        msg.performance = totalPerformance.getPerformance();
        msg.payload = o_payload;
        node.send(msg);
      } else {
        noderedutil.nodeStatusSuccess(node, "No matches found!");
      }
    });
  }
  RED.nodes.registerType("select", PeekabooSelectNode);
};
