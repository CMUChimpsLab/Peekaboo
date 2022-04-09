const helper = require("node-red-node-test-helper");
const ClassifyNode = require("../../classify");
const { createPayload } = require("../test_util");

describe("Classify node", () => {
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
        id: "classify-node",
        type: "classify",
        name: "classify node",
        datatype: "audio",
        target: "audio event",
        model: "max-audio",
      },
    ];
    helper.load(ClassifyNode, flow, () => {
      const node = helper.getNode("classify-node");
      expect(node).not.toBeNull();
      expect(node).toMatchObject({ name: "classify node" });
      done();
    });
  });

  // Check that output payload matches payload data structure invariant
  test("output matches structure", (done) => {
    const flow = [
      {
        id: "classify-node",
        type: "classify",
        name: "classify node",
        datatype: "audio",
        target: "audio event",
        model: "max-audio",
        "peekaboo-audio-classifier-service": "audio-classifier-service",
        wires: [["helper-node"]],
      },
      {
        id: "audio-classifier-service",
        type: "peekaboo-audio-classifier-service",
        host: "http://54.92.254.6:5000/",
        name: "cloud",
      },
      {
        id: "helper-node",
        type: "helper",
      },
    ];
    helper.load(ClassifyNode, flow, async () => {
      const node = helper.getNode("classify-node");
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
  });
});
