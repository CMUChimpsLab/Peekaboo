const helper = require("node-red-node-test-helper");
const DetectNode = require("../../detect");
const { createPayload } = require("../test_util");

describe("Detect node", () => {
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
        id: "detect-node",
        type: "detect",
        name: "detect node",
        datatype: "image",
        target: "face",
        model: "haar",
      },
    ];
    helper.load(DetectNode, flow, () => {
      const node = helper.getNode("detect-node");
      expect(node).not.toBeNull();
      expect(node).toMatchObject({ name: "detect node" });
      done();
    });
  });

  // Check that output payload matches payload data structure invariant
  test("output matches structure", (done) => {
    const flow = [
      {
        id: "detect-node",
        type: "detect",
        name: "detect node",
        datatype: "image",
        target: "face",
        model: "haar",
        "peekaboo-human-detector-service": "human-detect-service",
        wires: [["helper-node"]],
      },
      {
        id: "human-detect-service",
        type: "peekaboo-human-detector-service",
        host: "http://54.92.254.6:5003/",
        name: "cloud",
      },
      {
        id: "helper-node",
        type: "helper",
      },
    ];
    helper.load(DetectNode, flow, async () => {
      const node = helper.getNode("detect-node");
      const debug = helper.getNode("helper-node");

      const payload = await createPayload("image");

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
