const FFT = require("fft.js");
const performanceLogger = require("../performanceLogger");
const { AsyncPeekabooService } = require("../peekaboo-service");

class FFTTabularService extends AsyncPeekabooService {
  async onInput(node, peekaboo) {
    let performance = new performanceLogger(node.id);
    performance.start("fft-tabular");

    const signal = peekaboo.data.map(entry => entry[node.tabularfield]);
    const fftSize = 1.0 << Math.ceil(Math.log(signal.length) / Math.log(2));

    const fft = new FFT(fftSize);
    const filler = Array(Math.max(fftSize - signal.length, 0)).fill(0)
    const arr = [...signal, ...filler];
    console.log(arr.length);
    const out = fft.createComplexArray();
    fft.realTransform(out, arr)
    fft.completeSpectrum(out);

    // Generate performance statistics
    performance.end("fft-tabular");
    peekaboo.performance = performance.getPerformance();

    peekaboo.inference.push({
      datatype: "tabular",
      contenttype: "fft-tabular",
      data: { fft: out },
    });

    return Promise.resolve(peekaboo);
  }
}

module.exports = FFTTabularService;
