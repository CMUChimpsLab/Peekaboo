const Jimp = require("jimp");
const axios = require("axios");
const fs = require("fs");
const noderedutil = require("./util-nodered.js");

const performanceLogger = require("./performanceLogger.js");

module.exports = function (RED) {
  function ProviderPullNode(config) {
    RED.nodes.createNode(this, config);

    var node = this;
    node.datatype = config.datatype;
    node.datasource = config.datasource;
    node.emulateoption = config.emulateoption;
    node.customUrl = config.customUrl;
    node.videoLocation = config.videoLocation;
    node.queryParameters = config.queryParameters;

    async function retrieveImage(url, queryParameters) {
      try {
        const params = new URLSearchParams(queryParameters);
        url = url + "?" + params.toString();
        let image = await Jimp.read(url);
        var cur_pkb_item = {};
        cur_pkb_item.datatype = "image";
        cur_pkb_item.contenttype = "raw";
        cur_pkb_item.data = image;
        return [cur_pkb_item];
      } catch (error) {
        console.log(error);
        return;
      }
    }

    async function retrieveVideo(url, queryParameters) {
      try {
        let video = await axios.get(url, {
          responseType: "arraybuffer",
          params: queryParameters
        });
        var cur_pkb_item = {};
        cur_pkb_item.datatype = "video";
        cur_pkb_item.contenttype = "raw";
        cur_pkb_item.data = video.data;
        return [cur_pkb_item];
      } catch (error) {
        console.log(error);
        return;
      }
    }

    async function retrieveAudio(url, queryParameters) {
      try {
        let audio = await axios.get(url, {
          responseType: "arraybuffer",
          params: queryParameters
        });
        var cur_pkb_item = {};
        cur_pkb_item.datatype = "audio";
        cur_pkb_item.contenttype = "raw";
        cur_pkb_item.data = audio.data;
        return [cur_pkb_item];
      } catch (error) {
        console.log(error);
      }
    }

    async function retrieveTabular(url, queryParameters) {
      try {
        let tabular = await axios.get(url, {
          responseType: "text",
          params: queryParameters
        });
        let tab_json = tabular.data;
        var res = [];
        for (var i = 0; i < tab_json.length; i++) {
          // console.log(tab_json[i]);
          var cur_pkb_item = {};
          cur_pkb_item.datatype = "tabular";
          cur_pkb_item.contenttype = "raw";
          cur_pkb_item.data = tab_json[i];
          res.push(cur_pkb_item);
        }
        return res;
      } catch (error) {
        console.log(error);
      }
    }

    node.on("input", async function (msg) {
      var performance = new performanceLogger(node.id);

      /* **************** Get parameters **************** */
      if (node.datasource === "emulation") {
        // emulation
        let emulateUrl = "";
        let queryParameters = {};
        if (node.emulateoption === "custom") {
          emulateUrl = node.customUrl;
          console.log(node.queryParameters);
          for (const { key, value } of node.queryParameters) {
            queryParameters[key] = value;
          }
        } else {
          node.customUrl = "";
          emulateUrl = node.emulateoption;
        }

        node.status({ fill: "blue", shape: "dot", text: "Downloading..." });
        if (!msg.payload || !Array.isArray(msg.payload)) {
          msg.payload = [];
        }

        let payload;
        performance.start("hubprogram");
        switch (node.datatype) {
          case "image":
            payload = await retrieveImage(emulateUrl, queryParameters);
            break;
          case "video":
            payload = await retrieveVideo(emulateUrl, queryParameters);
            // if (node.videoLocation === "disk") { // for debugging purpose.
            //   let timestamp = Date.now();
            //   let filename = timestamp + ".mp4";
            //   let dir = process.env.HOME + "/.node-red/data/";
            //   let location = dir + filename;
            //   if (!fs.existsSync(dir)) fs.mkdirSync(dir);
            //   fs.writeFileSync(location, video);
            //   cur_pkb_item.data = location;
            // } else {
            //   cur_pkb_item.data = video;
            // }
            // msg.payload.push(cur_pkb_item);
            break;
          case "audio":
            payload = await retrieveAudio(emulateUrl, queryParameters);
            break;
          case "rfid":
            break;
          case "tabular":
            payload = await retrieveTabular(emulateUrl, queryParameters);
            break;
          case "scalar":
          case "generic":
          default:
            break;
        }
        if (payload != null) {
          msg.payload = msg.payload.concat(payload);
        }

        if (msg.payload.length == 0) {
          noderedutil.nodeStatusError(
            node,
            `Error downloading the ${node.datatype} data`
          );
        } else {
          performance.end("hubprogram")
          msg.performance = performance.getPerformance();
          msg.senderID = this.id;
          node.send(msg);
          noderedutil.nodeStatusSuccess(node, `sent...`);
        }
      } else {
        // code to process hardware drivers.
      }
    });
  }
  RED.nodes.registerType("pull", ProviderPullNode);
};

// Comment RFID temporarily
// /** Splits a string by line (CRLF and LF) */
// function splitByLine(input) {
//   return input.split(/\r?\n/);
// }

// /** Splits a string by tab */
// function splitByTab(input) {
//   return input.split(/\t/);
// }

// /**
//  * Reads the RFID output file and returns a data object
//  * @returns {Array} Array of data objects
//  */
// function readRfidInput(input) {
//   // Remove first line
//   input.shift();

//   let result = [];
//   for (const line of input) {
//     const lineArray = splitByTab(line);
//     let data = {
//       uuid: lineArray[0],
//       phase: lineArray[1],
//       frequency: lineArray[2],
//       signalStrength: lineArray[3],
//       observations: lineArray[4],
//       timestamp: lineArray[5],
//     };
//     result.push(data);
//   }
//   return result;
// }

// async function retrieveRfid(url) {
//   let rfid;
//   try {
//     let input = await axios.get(url, {
//       responseType: "text",
//     });
//     rfid = readRfidInput(splitByLine(input.data));
//   } catch (error) {
//     rfid = error;
//   }
//   return rfid;
// }
