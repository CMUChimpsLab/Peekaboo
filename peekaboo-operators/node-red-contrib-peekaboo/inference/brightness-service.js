const Jimp = require("jimp");
const performanceLogger = require("../performanceLogger");
const { AsyncPeekabooService } = require("../peekaboo-service");

class BrightnessService extends AsyncPeekabooService {
  async onInput(node, peekaboo) {
    let performance = new performanceLogger(node.id);

    let image = peekaboo.data;
    const bitmap = image.bitmap.data;
    console.log(bitmap);
    let total = 0;
    for (let i = 0; i < bitmap.length / 4; i++) {
      total +=
        0.2126 * bitmap[4 * i] +
        0.7152 * bitmap[4 * i + 1] +
        0.0722 * bitmap[4 * i + 2];
    }
    const percentage = total / (image.bitmap.width * image.bitmap.height) / 255;

    performance.end("total");
    peekaboo.performance = performance.getPerformance();

    peekaboo.inference.push({
      datatype: "scalar",
      contenttype: "brightness",
      data: percentage,
    });

    return Promise.resolve(peekaboo);
  }
}

module.exports = BrightnessService;
