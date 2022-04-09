const streamifier = require("streamifier");
const ffmpeg = require("fluent-ffmpeg");
const BufferStream = require("./buffer-stream");
const performanceLogger = require("../performanceLogger");
const { AsyncPeekabooService } = require("../peekaboo-service");

// Update the chunkSize of the format chunk of the wav header
function fixHeaders(buf) {
  buf.writeUInt32LE(buf.length - 4, 4);
}

class NoisifyAudio extends AsyncPeekabooService {
  async onInput(node, peekaboo) {
    const performance = new performanceLogger();

    const inputData = peekaboo.data;
    const inStream = streamifier.createReadStream(inputData);
    const outStream = new BufferStream();

    // Read sample rate from wav headers
    const sampleRate = inputData.readUIntLE(24, 4);

    // Sample rate scale factor (modifies pitch/frequency)
    const maxRateF = 1 + node.pitchshift;
    const minRateF = 1 - node.pitchshift;
    let rateScaleFactor = maxRateF;
    if (!node.pitchfixednoise) {
      rateScaleFactor = Math.random() * (maxRateF - minRateF) + minRateF;
    }

    let newRate = Math.round(sampleRate * rateScaleFactor);

    // Adjust to maintain tempo after sample rate change
    const tempoBalance = 1 / rateScaleFactor;

    // Tempo scale factor
    const maxTempoF = node.temposhift;
    const minTempoF = -node.temposhift;
    let tempoScaleFactor = maxTempoF;
    if (!node.tempofixednoise) {
      tempoScaleFactor = Math.random() * (maxTempoF - minTempoF) + minTempoF;
    }

    const newTempo = tempoBalance + tempoScaleFactor;

    return new Promise((resolve) => {
      performance.start("noisify-audio");
      ffmpeg(inStream)
        .audioFilters("asetrate=" + newRate.toFixed(0))
        .audioFilters("atempo=" + newTempo.toFixed(1))
        .inputFormat("wav")
        .outputFormat("wav")
        .on("error", function (err, stdout, stderr) {
          console.error(err.message);
        })
        .on("end", function () {
          peekaboo.data = outStream.toBuffer();
          fixHeaders(peekaboo.data);
          performance.end("noisify-audio");
          peekaboo.performance = performance.getPerformance();
          resolve(peekaboo);
        })
        .output(outStream)
        .run();
    });
  }
}

module.exports = NoisifyAudio;
