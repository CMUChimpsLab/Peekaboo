const lib = require("./lib-generic");
const performanceLogger = require("../performanceLogger");
const { AsyncPeekabooService } = require("../peekaboo-service.js");
const Jimp = require("jimp");

function registerServices(RED, services) {
  function ServiceNode(n) {
    RED.nodes.createNode(this, n);
    this.host = n.host;
  }

  function registerNode(name) {
    RED.nodes.registerType(name, ServiceNode);
  }
  services.forEach(service => console.log("Registering", service));
  for (let service of services) {
    registerNode(service);
  }
}

class ExternalService extends AsyncPeekabooService {
  async onInput(node, peekaboo) {
    var serviceOptions = {};
    const datatype = node.datatype;
    const dataaction = node.dataaction;
    const target = node.target.name;
    if (datatype === "audio") {
      serviceOptions = { filename: "audio.wav" };
    } else if (datatype === "video") {
      serviceOptions = { filename: "video.mp4" };
    } else if (datatype === "image") {
      serviceOptions = { filename: "image.jpg" };
    }

    serviceOptions.model = node.model.model;

    const service = node.service;
    const options = node.options || {};
    options.method = "predict";
    options.target = target;

    // Start logging
    var performance = new performanceLogger(node.id);
    performance.start(target);

    // Initialize lib client
    var client;
    if (service && service.host) {
      service.host = service.host.replace(/\/+$/, "");
      client = new lib.PeekabooService({
        domain: service.host,
        dataaction: dataaction,
        datatype: datatype,
        target: target,
        options: serviceOptions,
        targetOptions: options,
      });
      client.body = peekaboo;
    } else {
      return Promise.reject("Host in configuration node is not specified", peekaboo);
    }

    // Configure client request
    var result;
    var parameters = [];

    if (typeof peekaboo.data === "object") {
      if (datatype === "audio") {
        parameters.audio = peekaboo.data;
      } else if (datatype === "video") {
        parameters.video = peekaboo.data;
      } else if (datatype === "image") {
        parameters.image = await peekaboo.data.getBufferAsync(Jimp.AUTO);
      }
    } else {
      return Promise.reject("Data must be a dict");
    }

    result = client.predict(parameters);

    if (result === undefined) {
      node.error("Method is not specified.", peekaboo);
      return;
    }

    // Create server response handler
    const setData = (peekaboo, data) => {
      console.assert(peekaboo.inference != null);
      console.assert(Array.isArray(peekaboo.inference));
      if (data != null && data.data != null) {
        // Return prediction results
        let prediction = {
          contenttype: target,
          datatype: "tabular",
        };

        // Assign predictions in response to data
        prediction.data = data.data.predictions || data.data.prediction;

        // Data specific manipulations
        if (
          dataaction == "detect" &&
          datatype == "image" &&
          ["face", "person"].includes(target)
        ) {
          prediction.data.forEach((bbox) =>
            peekaboo.inference.push({
              contenttype: target,
              datatype: "tabular",
              data: {
                boundingbox: bbox,
              },
            })
          );
          prediction = null;
        } else if (
          dataaction == "classify" &&
          datatype == "audio" &&
          target == "audio event"
        ) {
          prediction.data = prediction.data
            .slice(0, 5)
            .map((entry) => entry.label);
        } else if (
          dataaction == "extract" &&
          datatype == "video" &&
          target == "heart rate"
        ) {
          prediction.contenttype = "scalar";
          prediction.data = prediction.data[0].label;
        }
        if (prediction != null) {
          peekaboo.inference.push(prediction);
        }
      } else {
        console.error("Bad response", data);
      }
      performance.end(target);
      peekaboo.performance = performance.getPerformance();

      return peekaboo;
    };

    // Send client request and update node status accordingly
    try {
      const data = await result;
      setData(peekaboo, data.response);
      return Promise.resolve(peekaboo);
    } catch (error) {
      console.error(error);
      if (error && error.code == "ECONNREFUSED") {
        error = `Could not connect to ${error.config.url}`;
      }
      return Promise.reject(error);
    }
  }
}

module.exports = {
  registerServices,
  ExternalService,
};
