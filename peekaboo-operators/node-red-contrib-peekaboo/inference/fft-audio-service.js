const FFT = require("fft.js");
const wav = require("node-wav");
const performanceLogger = require("../performanceLogger");
const { AsyncPeekabooService } = require("../peekaboo-service");

// Resolution of each fft spectral line.
// Lower resolution = more accurate but slower
// TODO: make into node option
const fftResolution = 8;

class FFTAudioService extends AsyncPeekabooService {
  async onInput(node, peekaboo) {
    let performance = new performanceLogger(node.id);
    performance.start("fft-audio");

    // Decode the raw audio
    const buffer = peekaboo.data;
    try {
      var { sampleRate, channelData } = wav.decode(buffer);
    } catch (e) {
      return Promise.reject("Error occured while parsing wav buffer");
    }

    // Compute FFT
    const dataSize = sampleRate / fftResolution;
    const fftSize = 1.0 << Math.ceil(Math.log(dataSize) / Math.log(2));
    const fft = new FFT(fftSize);
    const output = fft.createComplexArray();

    // Only read from channel 1
    fft.realTransform(output, channelData[0]);

    // Generate performance statistics
    performance.end("fft-audio");
    peekaboo.performance = performance.getPerformance();

    peekaboo.inference.push({
      datatype: "tabular",
      contenttype: "fft-audio",
      data: output,
    });

    return Promise.resolve(peekaboo);
  }
}

module.exports = FFTAudioService;
