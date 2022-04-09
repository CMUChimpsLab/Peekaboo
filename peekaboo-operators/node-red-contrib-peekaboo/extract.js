const inferenceServices = require("./inference/inference-services");
const FFTAudioService = require("./inference/fft-audio-service");
const FFTTabularService = require("./inference/fft-tabular-service");
const BrightnessService = require("./inference/brightness-service");
const models = require("./resources/models/extract.json");
const noderedutil = require("./util-nodered.js");
const performanceLogger = require("./performanceLogger");

const resourceMap = {
  services: [],
};

function registerTarget(datatype, target, service, handler) {
  if (!resourceMap[datatype]) {
    resourceMap[datatype] = {};
  }
  if (!resourceMap[datatype][target]) {
    resourceMap[datatype][target] = {
      name: target,
      services: [service],
      handler,
    };
  } else {
    if (!resourceMap[datatype][target].services.includes(service)) {
      resourceMap[datatype][target].services.push(service);
    }
  }
  if (service != null && !resourceMap.services.includes(service)) {
    resourceMap.services.push(service);
  }
}

module.exports = function (RED) {
  /* Register targets */
  const externalService = new inferenceServices.ExternalService();
  const fftAudioService = new FFTAudioService();
  const fftTabularService = new FFTTabularService();
  const brightnessService = new BrightnessService();
  for (let model of models) {
    model.targets.forEach((target) => {
      let handler = externalService;
      if (model.model == "fft-audio") {
        handler = fftAudioService;
      } else if (model.model == "brightness") {
        handler = brightnessService;
      } else if (model.model == "fft-tabular") {
        handler = fftTabularService;
      }
      registerTarget(model.datatype, target, model.service, handler);
    });
  }


  function PeekabooExtractNode(config) {
    RED.nodes.createNode(this, config);

    var node = this;
    node.dataaction = "extract";
    node.datatype = config.datatype;
    node.model = models.find((model) => model.model == config.model);
    node.tabularfield = config.tabularfield;
    node.fftresolution = config.fftresolution;
    console.assert(node.model != null, "Unknown model:", config.model);

    // Attach target
    node.target = resourceMap[node.datatype][config.target];
    if (!node.target) {
      console.error("Unsupported type+target:", node.datatype, config.target);
      return;
    }

    // Attach target
    const target = resourceMap[node.datatype][config.target];
    if (!target) {
      console.error("Unsupported type", node.datatype);
      return;
    }
    node.target = target;

    // Attach service
    if (node.model.service) {
      if (config[node.model.service]) {
        node.service = RED.nodes.getNode(config[node.model.service]);
      } else {
        // If config node was not specified, populate with defaults
        node.service = { host: node.model.host };
        // For models with no default cloud services configured
        // e.g. those requiring special hardware like the coral
        if (node.model.host == "") {
          console.error("No available default host. Please configure one.");
        }
      }
    }

    // Run any initializations before listening
    node.target.handler.onInit(node);

    node.on("input", async function (msg) {
      console.assert(Array.isArray(msg.payload));
      noderedutil.nodeStatusProcessing(node, "Processing...");

      const performance = new performanceLogger(node.id);
      performance.start("extract");

      let found = false;
      const promises = [];

      // Run inference on every matching peekaboo object on the payload
      for (let i = 0; i < msg.payload.length; i++) {
        const peekaboo = msg.payload[i];
        // Purge old performance stats
        peekaboo.performance = {};
        if (peekaboo.inference == null) {
          peekaboo.inference = [];
        }

        // Run inference
        if (peekaboo && peekaboo.datatype === node.datatype) {
          found = true;
          promises.push(node.target.handler.onInput(node, peekaboo));
        }
      }

      msg.senderID = this.id;
      if (promises.length > 0) {
        // Run async promises in parallel
        Promise.all(promises)
          .then((values) => {
            noderedutil.nodeStatusSuccess(node, "Done!");
            performance.end("extract");
            msg.performance = performance.getPerformance();
            node.send(msg);
          })
          .catch((error) => {
            console.error(error);
            noderedutil.nodeStatusError(node, "An error occured");
          });
      } else {
        // Just propagate if no matching types
        noderedutil.nodeStatusError(node, "No matching types found.");
        node.send(msg);
      }
    });
  }
  RED.nodes.registerType("extract", PeekabooExtractNode);
  inferenceServices.registerServices(RED, resourceMap.services);
};
