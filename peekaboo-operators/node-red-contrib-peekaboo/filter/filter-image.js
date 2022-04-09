const performanceLogger = require("../performanceLogger");
const Jimp = require("jimp");

function onInit(node) {}

function onInput(node, peekaboo, callback) {
  var target;
  var performance = new performanceLogger(node.id);
  const options = node.options;

  /* **************** Get parameters **************** */
  if (node.manipulation.name == "customobj") {
    target = options.customobj;
  } else {
    options.customobj = "";
    target = options.target;
  }

  /* **************** Process and send results **************** */
  performance.start("total");
  if (!peekaboo.data) {
    error("Error getting image data", peekaboo, "Error reading data");
    return;
  }
  if (!peekaboo.inference) {
    error("No inference data found", peekaboo, "Missing inference data");
  }
  if (!(target in peekaboo.inference)) {
    console.error("Missing inference data for", target, peekaboo);
  }
  let sourcejimp = peekaboo.data.clone();

  if (node.manipulation.name === "crop") {
    const output = [];
    for (let bbox of peekaboo.inference[target].data) {
      const roi = sourcejimp.clone();
      const { width, height, x, y } = bbox;
      roi.crop(x, y, width, height);
      output.push(roi);
    }
    peekaboo.data = output;
  } else if (node.manipulation.name === "block") {
    const inferenceFields = ["face", "person"];
    if (target === "background") {
      // Use previous inference results to detect person bounds in "background"
      for (let field of inferenceFields) {
        if (!(field in peekaboo.inference)) {
          continue;
        }
        let protectedRegions = peekaboo.inference[field].data;
        let imgcpy = sourcejimp.clone();
        if (node.manipulation.name == "block") {
          sourcejimp.color([{ apply: "darken", params: [100] }]);
        }
        protectedRegions.forEach((rect, i) => {
          sourcejimp.blit(
            imgcpy,
            rect.x,
            rect.y,
            rect.x,
            rect.y,
            rect.width,
            rect.height
          );
        });
      }
      peekaboo.data = sourcejimp;

      performance.end("total");
      peekaboo.performance = performance.getPerformance();
    } else {
      // Use previous inference results for other target objects
      if (inferenceFields.includes(target)) {
        console.log("here");
        for (let bbox of peekaboo.inference[target].data) {
          const { width, height, x, y } = bbox;
          if (node.manipulation.name === "block") {
            sourcejimp.scan(x, y, width, height, (x, y, idx) => {
              sourcejimp.setPixelColor(0x000000ff, x, y);
            });
          }
        }
      } else {
        for (let field of inferenceFields) {
          if (!(field in peekaboo.inference)) {
            continue;
          }
          for (let bbox of peekaboo.inference[field].data) {
            const { width, height, x, y } = bbox;
            if (node.manipulation.name === "block") {
              sourcejimp.scan(x, y, width, height, (x, y, idx) => {
                sourcejimp.setPixelColor(0x000000ff, x, y);
              });
            }
          }
        }
      }
      peekaboo.data = sourcejimp;
      performance.end("total");
      peekaboo.performance = performance.getPerformance();
    }
  }
  if (callback) {
    callback(node, peekaboo);
  }
}

module.exports = {
  onInit,
  onInput,
};
