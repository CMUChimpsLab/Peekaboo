const noderedutil = require("./util-nodered.js");
const _ = require("lodash");
const performanceLogger = require("./performanceLogger");
const { randomUUID } = require("crypto");

module.exports = function (RED) {
  function PeekabooAggregateNode(config) {
    RED.nodes.createNode(this, config);

    // retrieve parameters.
    var node = this;
    node.datatype = config.datatype;
    node.operation = config.operation;
    node.asnewvar = config.asnewvar;
    node.groupby = config.groupby;

    if (config.datatype == "tabular" && config.aggregatetarget == "custom") {
      node.aggregatetarget = config.customtabularfield;
    } else {
      node.aggregatetarget = config.aggregatetarget;
    }

    function groupBy(dataToGroupOn, fieldNameToGroupOn) {
      var result = _.chain(dataToGroupOn).groupBy(fieldNameToGroupOn).value();
      return result;
    }

    function getSum(grades) {
      const total = grades.reduce((acc, c) => acc + c, 0);
      return total;
    }

    function getAvg(grades) {
      return getSum(grades) / grades.length;
    }

    function aggregate_dataitems(
      dataitems,
      datatype,
      operation,
      aggregatetarget
    ) {
      var payload_data = {};
      if (operation == "count") {
        if (datatype == "scalar") {
          payload_data["count"] = dataitems.length;
        } else if (datatype == "tabular" || datatype == "radio") {
          var matchedItems = dataitems.filter(
            (dataitem) => aggregatetarget in dataitem.data
          );
          payload_data["count_" + aggregatetarget] = matchedItems.length;
        }
      } else if (operation == "average") {
        if (datatype == "scalar") {
          var scalar_vals = dataitems.map((dataitem) => dataitem.data);
          payload_data["average"] = getAvg(scalar_vals);
        } else if (datatype == "tabular" || datatype == "radio") {
          var matchedItems = dataitems.filter(
            (dataitem) => aggregatetarget in dataitem.data
          );
          var scalar_vals = matchedItems.map(
            (matchedItem) => matchedItem.data[aggregatetarget]
          );
          payload_data["average_" + aggregatetarget] = getAvg(scalar_vals);
        }
      } else if (operation == "sum") {
        if (datatype == "scalar") {
          var scalar_vals = dataitems.map((dataitem) => dataitem.data);
          payload_data["sum"] = getSum(scalar_vals);
        } else if (datatype == "tabular" || datatype == "radio") {
          var matchedItems = dataitems.filter(
            (dataitem) => aggregatetarget in dataitem.data
          );
          var scalar_vals = matchedItems.map(
            (matchedItem) => matchedItem.data[aggregatetarget]
          );
          payload_data["sum_" + aggregatetarget] = getSum(scalar_vals);
        }
      }
      return payload_data;
    }

    node.on("input", function (msg) {
      console.assert(Array.isArray(msg.payload));
      const performance = new performanceLogger(node.id);
      performance.start("aggregate");
      /* ****************  Node status **************** */
      node.status({}); //clear status

      var qualitied_items = [];
      for (let i = 0; i < msg.payload.length; i++) {
        var pkb_dataitem = msg.payload[i];
        if (pkb_dataitem.datatype === node.datatype) {
          qualitied_items.push(pkb_dataitem);
        }
      }

      var out_pkb_dataitem = {};
      out_pkb_dataitem.datatype = "tabular";
      out_pkb_dataitem.contenttype = "summary";
      // out_pkb_dataitem.data = {};
      if (node.groupby.trim().length == 0) {
        // no groupby
        const res = aggregate_dataitems(
          qualitied_items,
          node.datatype,
          node.operation,
          node.aggregatetarget
        );
        out_pkb_dataitem.data = res;
      } else {
        // with groupby
        var grouped_results = groupBy(qualitied_items, "data." + node.groupby);
        // console.log(grouped_results);
        const res = {};
        for (var key in grouped_results) {
          if (key != "undefined") {
            const aggregated = aggregate_dataitems(
              grouped_results[key],
              node.datatype,
              node.operation,
              node.aggregatetarget
            );
            res[key] = aggregated;
            out_pkb_dataitem.data = res;
          }
        }
      }
      if (out_pkb_dataitem.data) {
        noderedutil.nodeStatusSuccess(node, "Aggregated data!");
        out_pkb_dataitem.performance = performance
          .end("aggregate")
          .getPerformance();
        out_pkb_dataitem.uuid = randomUUID();
        msg.payload = [out_pkb_dataitem];
        msg.senderID = this.id;
        node.send(msg);
      } else {
        noderedutil.nodeStatusSuccess(node, "Done!");
      }
    });
  }
  RED.nodes.registerType("aggregate", PeekabooAggregateNode);
};
