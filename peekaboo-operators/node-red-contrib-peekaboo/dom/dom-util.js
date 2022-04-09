/* General purpose DOM util functions */
// Apply section toggle collapse functionality
function loadSectionToggle() {
  function applyCaretFlip() {
    if ($("#target-options-container").is(":visible")) {
      $("#target-options-caret").attr("class", "fa fa-caret-up");
    } else {
      $("#target-options-caret").attr("class", "fa fa-caret-down");
    }
  }
  $("#target-options-label").on("click", () => {
    $("#target-options-container").toggle();
    applyCaretFlip();
  });
  applyCaretFlip();
}

/* Inference node DOM util functions */
// Load map of targets to available models for inference nodes
async function loadTargetMap(resource) {
  const models = await $.getJSON(resource);

  const targets = {}; // map of targets to models
  for (let model of models) {
    model.targets.forEach((target) => {
      if (targets[model.datatype] == null) {
        targets[model.datatype] = {};
      }
      if (targets[model.datatype][target] == null) {
        targets[model.datatype][target] = [];
      }
      targets[model.datatype][target].push(model);
    });
  }

  return { targets, models };
}

// Load the inference node template
async function loadInferenceNode(node, nodetype) {
  // Apply section toggle collapse functionality
  loadSectionToggle();

  // Load map of targets to available models (from dom-util.js)
  const { targets, models } = await loadTargetMap(
    `models/${nodetype}.json`
  );

  // List of supported datatypes
  const datatypes = [...new Set(models.map((model) => model.datatype))];

  // Load datatype select options
  const datatypeSelectData = datatypes.map((type) => {
    return { id: type, text: type };
  });
  $("#node-input-datatype").html("").select2({ data: datatypeSelectData });
  $("#node-input-datatype").trigger("change");

  // Load onchange listener to display available targets
  $("#node-input-datatype").on("change", function (e) {
    loadInferenceTargetOptions(node, targets);
  });

  // Load onchange listener to display available models
  $("#node-input-target").on("change", function (e) {
    const selected = e.target.value;
    const datatype = node.datatype;
    if (selected != "" && selected != "custom") {
      $("#model-select-container").show();
      $("#service-containers").show();
      $("#custom-field-container").hide();
      $("#tabular-custom-container").hide();
      const modelSelectData = targets[datatype][selected].map((model) => {
        return { id: model.model, text: model.name };
      });
      // Load model options for select2
      $("#node-input-model").html("").select2({
        data: modelSelectData,
      });
      $("#node-input-model").trigger("change");
    } else if (
      nodetype == "classify" &&
      datatype == "tabular" &&
      selected == "custom"
    ) {
      // Support classifying tabular fields
      $("#model-select-container").hide();
      $("#service-containers").hide();
      $("#custom-field-container").show();
      $("#tabular-custom-container").show();
    }
  });

  // Load onchange listener for model to display associated service
  $("#node-input-model").on("change", function (e) {
    const model = models.find((entry) => entry.model == e.target.value);
    // Hide options section if none available
    if (model == null) {
      $("#target-options").hide();
      return;
    } else {
      $("#target-options").show();
    }
    const service = model.service;
    // Show only relevant service container
    $("#service-containers").children().hide();
    if (service) {
      $(`#${service}-container`).show();
    }
  });

  // Load saved state if present
  if (node.datatype != "") {
    $("#node-input-datatype").val(node.datatype).trigger("change");
  }
  loadInferenceTargetOptions(node, targets);
  if (node.target != "") {
    $("#node-input-target").val(node.target).trigger("change");
  }
  if (node.model != "") {
    $("#node-input-model").val(node.model).trigger("change");
  }
}

// Load inference target options for inference nodes
function loadInferenceTargetOptions(node, targets) {
  const datatype = $("#node-input-datatype").val();
  node.datatype = datatype;
  const targetSelectData = Object.keys(targets[datatype]).map((target) => {
    return { id: target, text: target };
  });
  // Load model options for select2
  $("#node-input-target").html("").select2({
    data: targetSelectData,
  });
  $("#node-input-target").trigger("change");
}

/* Filter node DOM util functions */
// Load map of datatypes to list of available detected targets for filter nodes
async function loadModelMap() {
  const detectModels = await $.getJSON("models/detect.json");

  // Map of datatypes to list of available targets
  const modelMap = {};
  for (let model of detectModels) {
    const type = model.datatype;
    if (modelMap[type] == null) {
      modelMap[type] = new Set();
    }
    model.targets.forEach((target) => modelMap[type].add(target));
  }
  for (let type of Object.keys(modelMap)) {
    modelMap[type] = Array.from(modelMap[type]).sort();
  }

  return modelMap;
}

// Load available targets for the chosen resource for filter nodes
function updateTargets(options, curtarget, nodetype) {
  const targetDOM = $(`#node-input-${nodetype}target`);
  targetDOM.empty();
  for (let option of options) {
    let domOption = $("<option/>");
    domOption.attr("value", option);
    domOption.text(option);
    targetDOM.append(domOption);
  }
  targetDOM.val(curtarget).trigger("change");
}
