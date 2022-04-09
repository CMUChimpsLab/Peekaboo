const performanceLogger = require("../performanceLogger");
const { PeekabooService } = require("../peekaboo-service");
const { min, max } = require("lodash");

// Operator map
const operators = {
  eq: (a, b) => a == b,
  neq: (a, b) => a != b,
  lt: (a, b) => a < b,
  lte: (a, b) => a <= b,
  gt: (a, b) => a > b,
  gte: (a, b) => a >= b,
  hask: (a, prop) => a.hasOwnProperty(prop.toString()),
  btwn: (a, b, c) => min(b, c) <= a && a <= max(b, c),
  cont: (a, b) => a.toString().indexOf(b) != -1,
  regex: (a, regex) => a.toString().match(new RegExp(regex)),
  true: (a) => a === true,
  false: (a) => a === false,
  null: (a) => a == null,
  nnull: (a) => a != null,
  empty: (a) => {
    if (typeof a === "string" || Array.isArray(a) || Buffer.isBuffer(a)) {
      return a.length == 0;
    } else if (typeof a === "object" && a != null) {
      return Object.keys(a).length == 0;
    }
    return false;
  },
  nempty: (a) => !operators["empty"](a),
  istype: (a, b) => {
    if (b === "array") return Array.isArray(a);
    else if (b === "buffer") return Buffer.isBuffer(a);
    else if (b === "json") {
      try {
        JSON.parse(a);
        return true;
      } catch (e) {
        return false;
      }
    } else if (b === "null") return a === null;
    else return typeof a === b;
  },
};

class CustomRuleService extends PeekabooService {
  onInput(node, peekaboo) {
    let performance = new performanceLogger(node.id);

    const property = node.RED.util.evaluateNodeProperty(
      node.customfield,
      "msg",
      node,
      peekaboo.data
    );
    let result;
    if (node.ruleand) {
      // logical AND of all rules (match all)
      result = true;
      for (let rule of node.rules) {
        const { op, val, type } = rule;
        const func = operators[op];
        if (op === "istype") {
          result &= func(property, type);
        } else if (func.length == 1) {
          result &= func(property);
        } else if (func.length == 2) {
          result &= func(property, val);
        } else if (func.length == 3) {
          result &= func(property, val, rule.val2);
        }
        if (!result) break;
      }
      if (node.rules.length == 0) result = false;
    } else {
      // logical OR of all rules (match at least one)
      result = false;
      for (let rule of node.rules) {
        const { op, val, type } = rule;
        const func = operators[op];
        if (op === "istype") {
          result |= func(property, type);
        } else if (func.length == 1) {
          result |= func(property);
        } else if (func.length == 2) {
          result |= func(property, val);
        } else if (func.length == 3) {
          result |= func(property, val, rule.val2);
        }
        if (result) break;
      }
    }

    result = Boolean(result);

    performance.end("total");
    peekaboo.performance = performance.getPerformance();

    return Promise.resolve(result ? peekaboo : null);
  }
}

module.exports = CustomRuleService;
