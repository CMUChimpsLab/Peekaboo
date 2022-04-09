var Jimp = require("jimp");
var util = require("util");
var isUtf8 = require("is-utf8");
var ws = require("ws");
var url = require("url");

// Create a properly formed wav buffer from raw PCM samples
const createAudioWav = (data) => {
  const datalen = data.length;
  // wav headers
  const headers = Buffer.alloc(44);

  // Configuration vars
  const numChannels = 1;
  const sampleRate = 8000;
  const bitsPerSample = 16;

  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);

  // RIFF header
  headers.writeUIntBE(0x52494646, 0, 4); // ChunkID ("RIFF" in ASCII)
  headers.writeUIntLE(36 + datalen, 4, 4); // ChunkSize
  headers.writeUIntBE(0x57415645, 8, 4); // Format ("WAVE" in ASCII)

  // fmt subchunk
  headers.writeUIntBE(0x666d7420, 12, 4); // Subchunk1ID ("fmt" in ASCII)
  headers.writeUIntLE(16, 16, 4); // Subchunk1Size (PCM = 16)
  headers.writeUIntLE(1, 20, 2); // AudioFormat (PCM = 1)
  headers.writeUIntLE(numChannels, 22, 2); // NumChannels (Mono = 1)
  headers.writeUIntLE(sampleRate, 24, 4); // Sample Rate
  headers.writeUIntLE(byteRate, 28, 4); // Byte Rate
  headers.writeUIntLE(blockAlign, 32, 2); // Bytes per sample across channels
  headers.writeUIntLE(bitsPerSample, 34, 2); // Bits per sample

  // data subchunk
  headers.writeUIntBE(0x64617461, 36, 4); // Subchunk2ID ("data" in ASCII)
  headers.writeUIntLE(datalen, 40, 4); // Subchunk2size

  return Buffer.concat([headers, data]);
};

module.exports = function (RED) {
  var serverUpgradeAdded = false;
  function handleServerUpgrade(request, socket, head) {
    const pathname = url.parse(request.url).pathname;
    if (listenerNodes.hasOwnProperty(pathname)) {
      listenerNodes[pathname].server.handleUpgrade(
        request,
        socket,
        head,
        function done(ws) {
          listenerNodes[pathname].server.emit("connection", ws, request);
        }
      );
    } else {
      // Don't destroy the socket as other listeners may want to handle the
      // event.
    }
  }
  var listenerNodes = {};
  var activeListenerNodes = 0;

  // A node red node that sets up a local websocket server
  function WebSocketListenerNode(n) {
    // Create a RED node
    RED.nodes.createNode(this, n);
    var node = this;

    // Store local copies of the node configuration (as defined in the .html)
    node.path = n.path;

    node._inputNodes = []; // collection of nodes that want to receive events
    node._clients = {};
    // match absolute url
    node.isServer = !/^ws{1,2}:\/\//i.test(node.path);
    node.closing = false;
    node.tls = n.tls;

    function startconn() {
      // Connect to remote endpoint
      node.tout = null;
      var prox, noprox;
      if (process.env.http_proxy) {
        prox = process.env.http_proxy;
      }
      if (process.env.HTTP_PROXY) {
        prox = process.env.HTTP_PROXY;
      }
      if (process.env.no_proxy) {
        noprox = process.env.no_proxy.split(",");
      }
      if (process.env.NO_PROXY) {
        noprox = process.env.NO_PROXY.split(",");
      }

      var noproxy = false;
      if (noprox) {
        for (var i in noprox) {
          if (node.path.indexOf(noprox[i].trim()) !== -1) {
            noproxy = true;
          }
        }
      }

      var agent = undefined;
      if (prox && !noproxy) {
        agent = new HttpsProxyAgent(prox);
      }

      var options = {};
      if (agent) {
        options.agent = agent;
      }
      if (node.tls) {
        var tlsNode = RED.nodes.getNode(node.tls);
        if (tlsNode) {
          tlsNode.addTLSOptions(options);
        }
      }
      var socket = new ws(node.path, options);
      socket.setMaxListeners(0);
      node.server = socket; // keep for closing
      handleConnection(socket);
    }

    function handleConnection(/*socket*/ socket) {
      var id = (1 + Math.random() * 4294967295).toString(16);
      if (node.isServer) {
        node._clients[id] = socket;
        node.emit("opened", {
          count: Object.keys(node._clients).length,
          id: id,
        });
      }
      socket.on("open", function () {
        if (!node.isServer) {
          node.emit("opened", { count: "", id: id });
        }
      });
      socket.on("close", function () {
        if (node.isServer) {
          delete node._clients[id];
          node.emit("closed", {
            count: Object.keys(node._clients).length,
            id: id,
          });
        } else {
          node.emit("closed", { count: "", id: id });
        }
        if (!node.closing && !node.isServer) {
          clearTimeout(node.tout);
          node.tout = setTimeout(function () {
            startconn();
          }, 3000); // try to reconnect every 3 secs... bit fast ?
        }
      });
      socket.on("message", function (data, flags) {
        node.handleEvent(id, socket, "message", data, flags);
      });
      socket.on("error", function (err) {
        node.emit("erro", { err: err, id: id });
        if (!node.closing && !node.isServer) {
          clearTimeout(node.tout);
          node.tout = setTimeout(function () {
            startconn();
          }, 3000); // try to reconnect every 3 secs... bit fast ?
        }
      });
    }

    if (node.isServer) {
      activeListenerNodes++;
      if (!serverUpgradeAdded) {
        RED.server.on("upgrade", handleServerUpgrade);
        serverUpgradeAdded = true;
      }

      var path = RED.settings.httpNodeRoot || "/";
      path =
        path +
        (path.slice(-1) == "/" ? "" : "/") +
        (node.path.charAt(0) == "/" ? node.path.substring(1) : node.path);
      node.fullPath = path;

      if (listenerNodes.hasOwnProperty(path)) {
        node.error(
          RED._("websocket.errors.duplicate-path", { path: node.path })
        );
        return;
      }
      listenerNodes[node.fullPath] = node;
      var serverOptions = {
        noServer: true,
      };
      if (RED.settings.webSocketNodeVerifyClient) {
        serverOptions.verifyClient = RED.settings.webSocketNodeVerifyClient;
      }
      // Create a WebSocket Server
      node.server = new ws.Server(serverOptions);
      node.server.setMaxListeners(0);
      node.server.on("connection", handleConnection);
    } else {
      node.closing = false;
      startconn(); // start outbound connection
    }

    node.on("close", function () {
      if (node.isServer) {
        delete listenerNodes[node.fullPath];
        node.server.close();
        node._inputNodes = [];
        activeListenerNodes--;
        // if (activeListenerNodes === 0 && serverUpgradeAdded) {
        //     RED.server.removeListener('upgrade', handleServerUpgrade);
        //     serverUpgradeAdded = false;
        // }
      } else {
        node.closing = true;
        node.server.close();
        if (node.tout) {
          clearTimeout(node.tout);
          node.tout = null;
        }
      }
    });
  }
  RED.nodes.registerType("push-websocket-listener", WebSocketListenerNode);

  WebSocketListenerNode.prototype.registerInputNode = function (
    /*Node*/ handler
  ) {
    this._inputNodes.push(handler);
  };

  WebSocketListenerNode.prototype.removeInputNode = function (
    /*Node*/ handler
  ) {
    this._inputNodes.forEach(function (node, i, inputNodes) {
      if (node === handler) {
        inputNodes.splice(i, 1);
      }
    });
  };

  WebSocketListenerNode.prototype.handleEvent = async function (
    id,
    /*socket*/ socket,
    /*String*/ event,
    /*Object*/ data,
    /*Object*/ flags
  ) {
    // Parse utf-8 encoded payload
    received = data.toString();

    const dataObject = {};
    dataObject.datatype = this.datatype;
    dataObject.contenttype = "raw";

    if (this.datatype == "image") {
      const buf = Buffer.from(received, "base64");
      try {
        const image = await Jimp.read(buf);
        dataObject.data = image;
      } catch (err) {
        this.error("Invalid base64 string", {
          pushed: received,
        });
        return;
      }
      const msg = {
        payload: [dataObject],
        senderID: this.id,
      };
      for (var i = 0; i < this._inputNodes.length; i++) {
        this._inputNodes[i].send(msg);
      }
      this.status({
        fill: "green",
        shape: "dot",
        text: "Received data at " + new Date().toLocaleTimeString(),
      });
    } else if (this.datatype == "scalar") {
      dataObject.data = {
        data: received,
      };
      try {
        // Convert to number if data is numeric
        const num = Number(received);
        dataObject.data.data = num;
      } catch (err) {
        dataObject.data.data = received;
      }
      const msg = {
        payload: [dataObject],
        senderID: this.id,
      };
      for (var i = 0; i < this._inputNodes.length; i++) {
        this._inputNodes[i].send(msg);
      }
      this.status({
        fill: "green",
        shape: "dot",
        text: "Received data at " + new Date().toLocaleTimeString(),
      });
    } else if (this.datatype == "tabular" || this.datatype == "radio") {
      try {
        received = JSON.parse(received);
      } catch (e) {
        this.error("Invalid JSON parse", {
          pushed: received,
        });
        return;
      }
      dataObject.data = {
        ...received,
      };
      const msg = {
        payload: [dataObject],
        senderID: this.id,
      };
      for (var i = 0; i < this._inputNodes.length; i++) {
        this._inputNodes[i].send(msg);
      }
      this.status({
        fill: "green",
        shape: "dot",
        text: "Received data at " + new Date().toLocaleTimeString(),
      });
    } else if (this.datatype === "audio") {
      const dataObject = {
        datatype: this.datatype,
        contenttype: "raw",
        data: createAudioWav(data),
      };
      const msg = {
        payload: [dataObject],
        senderID: this.id,
      };
      for (var i = 0; i < this._inputNodes.length; i++) {
        this._inputNodes[i].send(msg);
      }
      this.status({
        fill: "green",
        shape: "dot",
        text: "Received data at " + new Date().toLocaleTimeString(),
      });
    } else {
      this.error("Invalid type", {
        pushed: data,
      });
      return;
    }
  };

  WebSocketListenerNode.prototype.broadcast = function (data) {
    if (this.isServer) {
      for (let client in this._clients) {
        if (this._clients.hasOwnProperty(client)) {
          try {
            this._clients[client].send(data);
          } catch (err) {
            this.warn(
              RED._("websocket.errors.send-error") +
                " " +
                client +
                " " +
                err.toString()
            );
          }
        }
      }
    } else {
      try {
        this.server.send(data);
      } catch (err) {
        this.warn(RED._("websocket.errors.send-error") + " " + err.toString());
      }
    }
  };

  WebSocketListenerNode.prototype.reply = function (id, data) {
    var session = this._clients[id];
    if (session) {
      try {
        session.send(data);
      } catch (e) {
        // swallow any errors
      }
    }
  };

  function RetrieveImagePushNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    node.datasource = config.datasource;
    if (node.datasource == "mqtt") {
      node.datatype = config.datatype;
      node.broker = config.broker;
      node.mqtttopic = config.mqtttopic;
      node.mqttqos = parseInt(config.mqttqos);

      node.brokerConn = RED.nodes.getNode(this.broker);
      if (
        !/^(#$|(\+|[^+#]*)(\/(\+|[^+#]*))*(\/(\+|#|[^+#]*))?$)/.test(this.topic)
      ) {
        return this.warn(RED._("mqtt.errors.invalid-topic"));
      }

      if (node.brokerConn) {
        node.status({
          fill: "red",
          shape: "ring",
          text: "node-red:common.status.disconnected",
        });
        if (node.mqtttopic) {
          async function onPacketReceived(topic, received, packet) {
            if (isUtf8(received)) {
              // Parse utf-8 encoded payload
              received = received.toString();

              const dataObject = {};
              dataObject.datatype = node.datatype;
              dataObject.contenttype = "raw";

              if (node.datatype == "image") {
                const buf = Buffer.from(received, "base64");
                try {
                  const image = await Jimp.read(buf);
                  dataObject.data = image;
                } catch (err) {
                  node.error(RED._("mqtt.errors.invalid-b64string-image"), {
                    pushed: received,
                    topic: topic,
                    qos: packet.qos,
                    retain: packet.retain,
                  });
                  return;
                }
              } else if (node.datatype == "scalar") {
                dataObject.data = {
                  topic: topic,
                  qos: packet.qos,
                  retain: packet.retain,
                  data: received,
                };
                try {
                  // Convert to number if data is numeric
                  const num = Number(received);
                  dataObject.data.data = num;
                } catch (err) {
                  dataObject.data.data = received;
                }
              } else if (
                node.datatype == "tabular" ||
                node.datatype == "radio"
              ) {
                try {
                  received = JSON.parse(received);
                } catch (e) {
                  node.error(RED._("mqtt.errors.invalid-json-parse"), {
                    pushed: received,
                    topic: topic,
                    qos: packet.qos,
                    retain: packet.retain,
                  });
                  return;
                }
                dataObject.data = {
                  topic: topic,
                  qos: packet.qos,
                  retain: packet.retain,
                  ...received,
                };
              }
              const msg = {
                payload: [dataObject],
                senderID: node.id,
                _topic: topic,
              };
              node.send(msg);
              node.status({
                fill: "green",
                shape: "dot",
                text: "Received data at " + new Date().toLocaleTimeString(),
              });
            } else if (node.datatype === "audio") {
              const dataObject = {
                datatype: node.datatype,
                contenttype: "raw",
                data: createAudioWav(received),
              };
              const msg = {
                payload: [dataObject],
                senderID: node.id,
                _topic: topic,
              };
              node.send(msg);
              node.status({
                fill: "green",
                shape: "dot",
                text: "Received data at " + new Date().toLocaleTimeString(),
              });
            } else {
              node.error(RED._("mqtt.errors.non-utf8-string"), {
                pushed: received,
                topic: topic,
                qos: packet.qos,
                retain: packet.retain,
              });
              return;
            }
          }
          node.brokerConn.register(node);
          node.brokerConn.subscribe(
            node.mqtttopic,
            node.mqttqos,
            onPacketReceived,
            node.id
          );
          if (node.brokerConn.connected) {
            node.status({
              fill: "green",
              shape: "dot",
              text: "node-red:common.status.connected",
            });
          }
        } else {
          node.error(RED._("mqtt.errors.not-defined"));
        }
        node.on("close", function (removed, done) {
          if (node.brokerConn) {
            node.brokerConn.unsubscribe(node.topic, node.id, removed);
            node.brokerConn.deregister(node, done);
          }
        });
      }
    } else if (node.datasource == "hardware") {
      node.hardwareDriver = config.hardwareDriver;
    } else if (node.datasource == "websocket") {
      node.datatype = config.datatype;
      node.websocket = config.websocket;
      node.websocketConn = RED.nodes.getNode(node.websocket);
      if (node.websocketConn) {
        node.websocketConn.registerInputNode(node);
        node.websocketConn.datatype = node.datatype;
        node.websocketConn.on("opened", function (event) {
          node.status({
            fill: "green",
            shape: "dot",
            text: "Connected " + event.count,
            event: "connect",
            _session: { type: "websocket", id: event.id },
          });
        });
        node.websocketConn.on('erro', function(event) {
          node.status({
              fill:"red",shape:"ring",text:"An error occurred",
              event:"error",
              _session: {type:"websocket",id:event.id}
          })
        });
        node.websocketConn.on("closed", function (event) {
          var status;
          if (event.count > 0) {
            status = {
              fill: "green",
              shape: "dot",
              text: "Connected " + event.count,
            };
          } else {
            status = { fill: "red", shape: "ring", text: "Disconnected" };
          }
          status.event = "disconnect";
          status._session = { type: "websocket", id: event.id };
          node.status(status);
        });
      }
    } else {
      node.status({
        fill: "red",
        shape: "ring",
        text: "Data source not configured.",
      });
    }
  }
  RED.nodes.registerType("push", RetrieveImagePushNode);
};
