const noderedutil = require("./util-nodered.js");
const performanceLogger = require("./performanceLogger.js");

module.exports = function (RED) {
  function RetrieveInferenceNode(config) {
    RED.nodes.createNode(this, config);

    var node = this;
    node.datatype = config.datatype;
    node.target = config.target;
    node.nonexist = config.nonexist;

    node.on("input", function (msg) {
      console.assert(Array.isArray(msg.payload));
      noderedutil.nodeStatusProcessing(node, "Processing...");
      const performance = new performanceLogger(node.id);
      performance.start("retrieve");

      // Create a copy of the payload with only matching targets
      const retrievedObjs = [];
      const filtered = msg.payload.filter(peekaboo => peekaboo.datatype === node.datatype);
      for (let peekaboo of filtered) {
        for (let inference of peekaboo.inference) {
          if (inference.contenttype === node.target) {
            retrievedObjs.push({
              ...peekaboo,
              inference: {}
            });
            break;
          }
        }
      }
      performance.end("retrieve");
      msg.performance = performance.getPerformance();
      msg.senderID = this.id;
      if (node.nonexist == true) {
        if (retrievedObjs.length == 0) {
          // return an empty obj to trigger the next operator.
          msg.payload = [];
          node.send(msg);
          node.status({
            fill: "green",
            shape: "dot",
            text: "Did not find target content. Propagated",
          });
        } else {
          node.status({
            fill: "yellow",
            shape: "dot",
            text: "Found target content. Did not propagate.",
          });
        }
      } else {
        if (retrievedObjs.length != 0) {
          // return an empty obj to trigger the next operator.
          msg.payload = retrievedObjs;
          node.send(msg);
          node.status({
            fill: "green",
            shape: "dot",
            text: "Found target content. Propagated",
          });
        } else {
          node.status({
            fill: "yellow",
            shape: "dot",
            text: "Did not find target content. Did not propagate",
          });
        }
      }
    });
  }
  RED.nodes.registerType("retrieve", RetrieveInferenceNode);
};
