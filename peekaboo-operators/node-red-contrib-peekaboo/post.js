const Jimp = require("jimp");
const FormData = require("form-data");
const noderedutil = require("./util-nodered.js");
const performanceLogger = require("./performanceLogger.js");
const axios = require("axios");

const sendForm = async (node, payload) => {
  const form = new FormData();
  form.append("payload", JSON.stringify(payload));

  var performance = new performanceLogger(node.id);
  performance.start("network");
  try {
    const res = await axios.post(node.serveraddress, form, {
      headers: form.getHeaders(),
    });
    noderedutil.nodeStatusSuccess(node, "Data sent");
    performance.end("network");
    console.log(performance.getPerformance("network"));
    noderedutil.appendToAFile(
      "network.txt",
      "" + performance.getTimeinMS("network") + "\n"
    );
    console.log("sent data");
    return res;
  } catch (err) {
    noderedutil.nodeStatusError(node, "Data failed to send");
    console.log(err);
    return;
  }
};

const sendBody = async (node, payload, api_key_field, api_key, data_id) => {
  const performance = new performanceLogger(node.id);
  let body = { payload, data_id };
  if (api_key_field != null) {
    body[api_key_field] = api_key;
  }
  performance.start("network");
  try {
    const response = await axios.post(node.serveraddress, body);
    noderedutil.nodeStatusSuccess(node, "Data sent");
    performance.end("network");
    console.log(performance.getPerformance("network"));
    noderedutil.appendToAFile(
      "network.txt",
      "" + performance.getTimeinMS("network") + "\n"
    );
    console.log("sent data");
    return response;
  } catch (err) {
    noderedutil.nodeStatusError(node, "Data failed to send");
    console.log(err);
    console.error(err);
    return err;
  }
};

const sendIFTTT = async (node, payload) => {
  const performance = new performanceLogger(node.id);
  performance.start("network");
  try {
    const response = await axios.post(node.serveraddress, {
      value1: JSON.stringify(payload),
    });
    noderedutil.nodeStatusSuccess(node, "Data sent");
    performance.end("network");
    console.log(performance.getPerformance("network"));
    noderedutil.appendToAFile(
      "network.txt",
      "" + performance.getTimeinMS("network") + "\n"
    );
    console.log("sent data");
    return response;
  } catch (err) {
    noderedutil.nodeStatusError(node, "Data failed to send");
    return err;
  }
};

async function preparePayload(payload_items) {
  var prepared_payload = [];
  for (let i = 0; i < payload_items.length; i++) {
    var pkb_dataitem = payload_items[i];
    if (pkb_dataitem.datatype == "image") {
      var tmp_pkb_dataitem = noderedutil.deepClone(pkb_dataitem);
      const jimpimg = pkb_dataitem.data;
      const b64 = await jimpimg.getBase64Async(Jimp.AUTO);
      // Remove "data:image/png;base64," from output b64 string
      tmp_pkb_dataitem.data = b64.split("base64,")[1];
      // tmp_pkb_dataitem.data = b64.substring(0, 2000);
      prepared_payload.push(tmp_pkb_dataitem);
    } else {
      prepared_payload.push(pkb_dataitem);
    }
  }
  return prepared_payload;
}

module.exports = function (RED) {
  function postDataNode(config) {
    RED.nodes.createNode(this, config);

    var node = this;
    node.datatype = config.datatype;
    node.serveraddress = config.serveraddress;
    node.method = config.method;
    node.api_key_field = config.api_key_field;
    node.api_key = config.api_key;
    node.data_id = config.data_id;

    node.on("input", async function (msg) {
      noderedutil.nodeStatusProcessing(node, "Sending data.");
      const performance = new performanceLogger(node.id);
      performance.start("hubprogram");

      var o_payload = [];
      for (let i = 0; i < msg.payload.length; i++) {
        var pkb_dataitem = msg.payload[i];
        if (pkb_dataitem.datatype === node.datatype) {
          o_payload.push(pkb_dataitem);
        }
      }

      let response;
      if (o_payload.length != 0) {
        const prepared_payload = await preparePayload(o_payload);
        if (node.method == "form") {
          response = (await sendForm(node, prepared_payload)).data;
        } else if (node.method == "body") {
          response = (await sendBody(
            node,
            prepared_payload,
            node.api_key_field,
            node.api_key,
            node.data_id
          )).data;
        } else if (node.method == "ifttt") {
          response = (await sendIFTTT(node, prepared_payload)).data;
        }
      }
      msg = { payload: response };
      node.send(msg);
      performance.end("hubprogram");
      noderedutil.appendToAFile(
        "hubprogram.txt",
        "" + performance.getTimeinMS("hubprogram") + "\n"
      );
      console.log("hubprogram: ");
      console.log(performance.getPerformance("hubprogram"));
    });
  }
  RED.nodes.registerType("post", postDataNode);
};
