const _ = require("lodash");

const preparePayload = (squashpayload, msg, inflight) => {
  const o_payload = [];
  if (squashpayload) {
    // Flatten payload data and store in one entry on the payload
    let pkbObj = { data: [] };
    if (msg.payload.length > 0) {
      pkbObj = { ...msg.payload[0], data: [] };
    }
    for (let key in inflight) {
      const inflightPayload = inflight[key]["msg"]["payload"];
      const dataList = [...inflightPayload.map((pkbObj) => pkbObj.data)];
      pkbObj.data.push(...dataList);
    }
    o_payload.push(pkbObj);
  } else {
    // Otherwise, store each entire msg payload on the list
    for (var key in inflight) {
      o_payload.push(...inflight[key]["msg"]["payload"]);
    }
  }
  return o_payload;
};

// Send the accumulated message once a a certain amount of time has elapsed
const groupByTimeout = (context, node, msg, id) => {
  const timenow = Date.now();
  const inflight = context.get(id) || {
    startTime: timenow,
  };
  if (!inflight.startTime) {
    inflight.startTime = timenow;
  }
  inflight[msg._msgid] = { time: timenow, msg: msg };
  if (timenow - inflight.startTime >= node.blocktimeout) {
    delete inflight.startTime;
    msg.payload = preparePayload(node.squashpayload, msg, inflight);
    msg.senderID = node.id;
    node.send(msg);
    context.set(id, {});
  } else {
    context.set(id, inflight);
  }
};

// Send the message once the number of received parts reaches a fixed number
const groupByNumParts = (context, node, msg, id) => {
  const timenow = Date.now();
  const inflight = context.get(id) || {};
  inflight[msg._msgid] = { time: timenow, msg: msg };

  if (Object.keys(inflight).length == this.partsnum) {
    msg.payload = preparePayload(node.squashpayload, msg, inflight);
    msg.senderID = node.id;
    node.send(msg);
    context.set(id, {});
  } else {
    context.set(id, inflight);
  }
};

// Send messages based on whichever of timeout and number of message parts is met
// first
const groupByFirstCondition = (context, node, msg, id) => {
  const timenow = Date.now();
  const inflight = context.get(id) || {
    startTime: timenow,
  };
  if (!inflight.startTime) {
    inflight.startTime = timenow;
  }
  inflight[msg._msgid] = { time: timenow, msg: msg };
  if (
    timenow - inflight.startTime >= node.blocktimeout ||
    Object.keys(inflight).length == this.partsnum
  ) {
    delete inflight.startTime;
    msg.payload = preparePayload(node.squashpayload, msg, inflight);
    msg.senderID = node.id;
    node.send(msg);
    context.set(id, {});
  } else {
    context.set(id, inflight);
  }
};

// Group messages by both timeout and number of message parts and send
// the msg if both conditions are met
// Sends only `partsNum` message parts if number of accumulated parts exceeds that
const groupByBothConditions = (context, node, msg, id) => {
  const timenow = Date.now();
  // Retrieve cached items
  let inflight = context.get(id) || {};

  // Group by `groupby` then key by _msgid
  inflight[msg._msgid] = { time: timenow, msg: msg };
  inflight = _.pickBy(inflight, function (value, key) {
    return timenow - value["time"] < config.blocktimeout;
  });

  if (Object.keys(inflight).length == this.partsnum) {
    msg.payload = preparePayload(node.squashpayload, msg, inflight);
    msg.senderID = node.id;
    node.send(msg);
    context.set(id, {});
  } else {
    context.set(id, inflight);
  }
};

module.exports = function (RED) {
  function pkbJoinNode(config) {
    RED.nodes.createNode(this, config);

    var node = this;
    node.joinmode = config.joinmode;
    node.partsnum = parseInt(config.partsnum);
    node.blocktimeout = parseInt(config.blocktimeout) * 1000;
    node.groupby = config.groupby;
    node.squashpayload = config.squashpayload;
    node.sendcondition = config.sendcondition;

    const context = this.context();

    node.on("input", function (msg) {
      if (node.joinmode === "nonblocking") {
        msg.senderID = node.id;
        node.send(msg);
      } else {
        const id = msg[node.groupby];
        if (node.sendcondition === "timeout") {
          groupByTimeout(context, node, msg, id);
        } else if (node.sendcondition === "numparts") {
          groupByNumParts(context, node, msg, id);
        } else if (node.sendcondition === "first") {
          groupByFirstCondition(context, node, msg, id);
        } else if (node.sendcondition === "both") {
          groupByBothConditions(context, node, msgs, id);
        }
      }
    });
  }
  RED.nodes.registerType("pkbJoin", pkbJoinNode);
};
