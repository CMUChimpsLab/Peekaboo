const Jimp = require("jimp");
const FormData = require("form-data");

function setErrorStatus(node) {
    node.status({
        fill: "red",
        shape: "dot",
        text: "error occured",
    });
}
function setSuccessStatus(node) {
    node.status({
        fill: "green",
        shape: "dot",
        text: "sent data",
    });
}

function sendPayload(node, payload) {
    const form = new FormData();
    form.append("dataType", payload.dataType);
    form.append("data", payload.data);
    if (payload.processes) {
        form.append("processes", payload.processes);
    }
    if (payload.meta) {
        form.append("meta", payload.meta);
    }
    form.submit(node.serverAddress, (err, res) => {
        if (err) {
            setErrorStatus(node);
            console.log(err);
            return;
        }
        setSuccessStatus(node);
    });
}

module.exports = function (RED) {
    function publishDataNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.serverAddress = config.serverAddress;

        node.on("input", function (msg) {
            node.status({
                fill: "yellow",
                shape: "dot",
                text: "sending data.",
            });
            if (msg.payload.dataType && msg.payload.data) {
                if (msg.payload.dataType === "image") {
                    const jimpimg = msg.payload.data;
                    jimpimg.getBase64(Jimp.AUTO, (err, b64) => {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        // Remove "data:image/png;base64," from output b64 string
                        msg.payload.data = b64.substring(22);
                        sendPayload(node, msg.payload);
                    });
                } else if (msg.payload.data instanceof Buffer) {
                    msg.payload.data = msg.payload.data.toString("base64");
                    sendPayload(node, msg.payload);
                } else {
                    sendPayload(node, msg.payload);
                }
            } else {
                setErrorStatus();
                console.log("Malformed payload received:");
                console.log(msg.payload);
            }
        });
    }
    RED.nodes.registerType("publish", publishDataNode);
};
