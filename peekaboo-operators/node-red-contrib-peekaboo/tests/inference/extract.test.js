const helper = require("node-red-node-test-helper");
const ExtractNode = require("../../extract");
const { createPayload } = require("../test_util");

describe("Extract node", () => {
  beforeEach((done) => {
    helper.startServer(done);
  });
  afterEach((done) => {
    helper.unload();
    helper.stopServer(done);
  });

  test("loads node", (done) => {
    const flow = [
      {
        id: "extract-node",
        type: "extract",
        name: "extract node",
        datatype: "audio",
        target: "speech",
        model: "max-stt",
      },
    ];
    helper.load(ExtractNode, flow, () => {
      const node = helper.getNode("extract-node");
      expect(node).not.toBeNull();
      expect(node).toMatchObject({ name: "extract node" });
      done();
    });
  });

  // Check that output payload matches payload data structure invariant
  test("output matches structure", (done) => {
    const flow = [
      {
        id: "extract-node",
        type: "extract",
        name: "extract node",
        datatype: "audio",
        target: "speech",
        model: "max-stt",
        "peekaboo-speech-text-service": "speech-text-service",
        wires: [["helper-node"]],
      },
      {
        id: "speech-text-service",
        type: "peekaboo-speech-text-service",
        host: "http://54.92.254.6:5001/",
        name: "cloud",
      },
      {
        id: "helper-node",
        type: "helper",
      },
    ];
    helper.load(ExtractNode, flow, async () => {
      const node = helper.getNode("extract-node");
      const debug = helper.getNode("helper-node");

      const payload = await createPayload("audio");

      return new Promise((resolve) => {
        debug.on("input", (msg) => {
          try {
            expect(msg.payload).toBePayload();
            done();
          } catch (e) {
            console.error("Encountered malformed payload");
          }
        });

        node.receive({ payload });
      });
    });
  }, 12*1000); // set 12s timeout for speech to text 

});
