// Determine if a payload is well-structured
const isPayload = (payload) => {
  let status = true;
  status &= Array.isArray(payload);
  if (!status) {
    console.warn("Payload not array");
    return false;
  }
  for (let peekaboo of payload) {
    status &= peekaboo.datatype != null;
    status &= peekaboo.contenttype != null;
    status &= peekaboo.data != null;
    if (!status) {
      console.warn("Data object has null primary field");
    }

    status &= typeof peekaboo.datatype === "string";
    status &= typeof peekaboo.contenttype === "string";
    if (!status) {
      console.warn("Data object has non-string label field");
    }

    if (peekaboo.inference != null) {
      status &= Array.isArray(peekaboo.inference);
      if (!status) {
        console.warn("Data object has non-array inference field");
        return false;
      }
      status &= peekaboo.inference.every((inference) => isInference(inference));
      if (!status) {
        console.warn("Data object has malformed inference");
        return false;
      }
    }
  }
  return status;
};

// Determine if an object is of a "scalar" type
// Currently supported scalar types: number
const isScalar = (object) => {
  return object == null || typeof object == "number";
};

// Determine if an object is of a "tabular" type
// Currently supported tabular types: array, string, object
const isTabular = (object) => {
  return (
    object == null ||
    Array.isArray(object) ||
    typeof object == "string" ||
    typeof object == "object"
  );
};

// Determine if an inference object is well-structured
const isInference = (inference) => {
  let status = true;
  status &= inference.contenttype != null;
  status &= inference.datatype != null;
  status &= inference.data != null;
  if (!status) {
    console.warn("Inference has null primary field");
    return false;
  }

  status &= typeof inference.contenttype === "string";
  status &= typeof inference.datatype === "string";
  if (!status) {
    console.warn("Inference has non-string label field");
  }

  // Check if datatype matches data
  if (inference.datatype == "scalar" && !isScalar(inference.data)) {
    status = false;
    console.warn("Expected scalar type. Encountered: " + typeof inference.data);
  }
  if (inference.datatype == "tabular" && !isTabular(inference.data)) {
    status = false;
    console.warn(
      "Expected tabular type. Encountered: " + typeof inference.data
    );
  }
  return status;
};

module.exports = { isPayload, isInference };
