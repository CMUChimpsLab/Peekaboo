const performanceLogger = require("../performanceLogger");
const { AsyncPeekabooService } = require("../peekaboo-service");
const { isNumber } = require("lodash");

class OccupancyDetectionService extends AsyncPeekabooService {
  async onInput(node, peekaboo) {
    let performance = new performanceLogger(node.id);
    performance.start("occupancy-detection");

    const data = peekaboo.data.map((entry) => entry[node.tabularField]);
    const sampleCount = parseInt(node.sampleCount) || 50;
    const threshold = parseInt(node.occupancyThreshold) || 0.3;
    const occupancyInterval = (parseInt(node.occupancyInterval) || 60) * 1000;

    // accumulator for accelerometer samples
    let ambientMean = 0;
    let occupancy = false;

    for (let i = 0; i < data.length; i++) {
      const val = Math.abs(data[i]);
      if (i < sampleCount) {
        // Accumulate samples into running sum
        ambientMean += val;
      } else {
        // Check if percent difference of window mean vs ambient mean is
        // greater than activation threshold
        const percentDiff = Math.abs(val - ambientMean) / ambientMean;
        if (percentDiff >= threshold) {
          occupancy = true;
          break;
        }
      }
      if (i == sampleCount - 1) {
        // Divide running sum by count to get mean
        ambientMean /= sampleCount;
      }
    }

    // Generate performance statistics
    performance.end("occupancy-detection");
    peekaboo.performance = performance.getPerformance();

    peekaboo.inference.push({
      datatype: "scalar",
      contenttype: "occupancy",
      data: occupancy,
    });

    return Promise.resolve(peekaboo);
  }
}

module.exports = OccupancyDetectionService;
