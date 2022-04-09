const Jimp = require("jimp");
const axios = require("axios");
const helper = require("node-red-node-test-helper");
const { isPayload } = require("./invariants");

helper.init(require.resolve("node-red"));

// Extend `expect` with operator for checking if payload is well-structured
expect.extend({
  toBePayload(payload) {
    const status = isPayload(payload);
    if (status) {
      return {
        message: () => "Expected payload to be malformed",
        pass: true,
      };
    } else {
      return {
        message: () => {
          console.log(msg.payload);
          return "Unexpected malformed payload";
        },
        pass: false,
      };
    }
  },
});

// Simulate a pull node
const createPayload = async (type) => {
  let data;
  if (type == "image") {
    data = await Jimp.read(
      "https://peekaboo-resource.s3.amazonaws.com/emulator/3-people.jpg"
    );
  } else if (type == "audio") {
    const response = await axios.get(
      "https://peekaboo-resource.s3.amazonaws.com/emulator/voice2.wav",
      {
        responseType: "arraybuffer",
      }
    );
    data = response.data;
  } else if (type == "video") {
    const response = await axios.get(
      "https://peekaboo-resource.s3.amazonaws.com/emulator/earth_640.mp4",
      {
        responseType: "arraybuffer",
      }
    );
    data = response.data;
  } else if (type == "tabular") {
    const reponse = await axios.get(
      "https://peekaboo-resource.s3.amazonaws.com/emulator/tvlog.js",
      {
        responseType: "text",
      }
    );
    const tab_json = respone.data;
    const res = [];
    for (let i = 0; i < tab_json.length; i++) {
      // console.log(tab_json[i]);
      const cur_pkb_item = {};
      cur_pkb_item.datatype = "tabular";
      cur_pkb_item.contenttype = "raw";
      cur_pkb_item.data = tab_json[i];
      res.push(cur_pkb_item);
    }
    return res;
  }
  return [
    {
      datatype: type,
      contenttype: "raw",
      data: data,
    },
  ];
};

module.exports = { createPayload };
