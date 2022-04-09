const noderedutil = require("./util-nodered.js");
const performanceLogger = require("./performanceLogger");

module.exports = function (RED) {
  function PeekabooSpoofNode(config) {
    RED.nodes.createNode(this, config);

    var node = this;
    node.datatype = config.datatype;
    node.spooftarget = config.spooftarget;
    node.customtabularfield = config.customtabularfield;
    node.spoofreplacement = config.spoofreplacement;

    function spoofTabular(in_pkb_dataitem, targetdata, spoofreplacement) {
      if (targetdata == "raw") {
        try {
          const received = JSON.parse(spoofreplacement);
          var out_pkb_dataitem = noderedutil.deepClone(in_pkb_dataitem); //make a deep clone of the object
          out_pkb_dataitem.data = received;
          return out_pkb_dataitem;
        } catch (e) {
          noderedutil.nodeStatusError(
            node,
            "spoof.errors.non-valid-spoofreplacement"
          );
          return null;
        }
      } else if (targetdata in in_pkb_dataitem.data) {
        try {
          var out_pkb_dataitem = noderedutil.deepClone(in_pkb_dataitem); //make a deep clone of the object
          out_pkb_dataitem.data[targetdata] = JSON.parse(spoofreplacement);
          return out_pkb_dataitem;
        } catch (e) {
          noderedutil.nodeStatusError(
            node,
            "spoof.errors.non-valid-spoofreplacement"
          );
          return null;
        }
      } else {
        noderedutil.nodeStatusError(
          node,
          "spoof.errors.cannot-find-target-field."
        );
        return null;
      }
    }

    node.on("input", function (msg) {
      console.assert(Array.isArray(msg.payload));
      const totalPerformance = new performanceLogger(node.id);
      totalPerformance.start("spoof");

      /* ****************  Node status **************** */
      node.status({}); //clear status

      var o_payload = [];
      for (let i = 0; i < msg.payload.length; i++) {
        var pkb_dataitem = msg.payload[i];

        if (pkb_dataitem.datatype === node.datatype) {
          const performance = new performanceLogger(node.id);
          performanceLogger.start("spoof");
          var out_pkb_dataitem = null;
          if (pkb_dataitem.datatype == "image") {
            // TODO:
          } else if (pkb_dataitem.datatype == "audio") {
            // TODO:
          } else if (pkb_dataitem.datatype == "tabular") {
            console.log("spoofing tabular data");
            if (node.spooftarget == "custom") {
              out_pkb_dataitem = spoofTabular(
                pkb_dataitem,
                node.customtabularfield,
                node.spoofreplacement
              );
            } else {
              out_pkb_dataitem = spoofTabular(
                pkb_dataitem,
                node.spooftarget,
                node.spoofreplacement
              );
            }
          } else if (pkb_dataitem.datatype == "radio") {
          } else if (pkb_dataitem.datatype == "video") {
          } else if (pkb_dataitem.datatype == "scalar") {
          }
          if (out_pkb_dataitem != null) {
            performance.end("spoof")
            out_pkb_dataitem.performance = performance.getPerformance();
            o_payload.push(out_pkb_dataitem);
          }
        }
      }
      if (o_payload.length) {
        noderedutil.nodeStatusSuccess(node, "Spoofed data!");
        totalPerformance.end("spoof");
        msg.performance = totalPerformance.getPerformance();
        msg.payload = o_payload;
        msg.senderID = this.id;
        node.send(msg);
      } else {
        noderedutil.nodeStatusSuccess(node, "Done!");
      }
    });
  }
  RED.nodes.registerType("spoof", PeekabooSpoofNode);
};
