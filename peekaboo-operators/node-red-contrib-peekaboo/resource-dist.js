const path = require("path");

module.exports = function (RED) {
  // Resource list for provider node
  RED.httpAdmin.get("/provider/resources.json", (req, res) => {
    res.sendFile(path.join(__dirname, "provider/resources.json"));
  });

  // Models for classify, detect, and extract nodes
  RED.httpAdmin.get("/models/classify.json", (req, res) => {
    res.sendFile(path.join(__dirname, "resources/models/classify.json"));
  });
  RED.httpAdmin.get("/models/detect.json", (req, res) => {
    res.sendFile(path.join(__dirname, "resources/models/detect.json"));
  });
  RED.httpAdmin.get("/models/extract.json", (req, res) => {
    res.sendFile(path.join(__dirname, "resources/models/extract.json"));
  });
  RED.httpAdmin.get("/resources/ontology.json", (req, res) => {
    res.sendFile(path.join(__dirname, "resources/ontology.json"));
  });

  // For DOM utility functions
  RED.httpAdmin.get("/peekaboo/dom-util.js", (req, res) => {
    res.sendFile(path.join(__dirname, "dom/dom-util.js"));
  });

  // DOM related libraries
  RED.httpAdmin.get("/widgets/select2.min.js", (req, res) => {
    res.sendFile(path.join(__dirname, "widgets/select2.min.js"));
  });
  RED.httpAdmin.get("/widgets/select2.min.css", (req, res) => {
    res.sendFile(path.join(__dirname, "widgets/select2.min.css"));
  });
  RED.httpAdmin.get("/widgets/helptip.css", (req, res) => {
    res.sendFile(path.join(__dirname, "widgets/helptip.css"));
  });
};
