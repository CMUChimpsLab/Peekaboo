// Top-level function to be called by template HTML file
// Loads static assets before generating template
function loadTemplate(node, nodeType, staticFiles) {
  const nodeTypes = ["filter", "inference"];
  console.assert(nodeType != null && staticFiles != null);
  console.assert(nodeTypes.includes(nodeType));

  let staticData = {};
  staticData.count = staticFiles.length;
  staticData.counter = 0;
  for (let file of staticFiles) {
    $.getJSON(file, function (data) {
      staticData[file] = data;
      staticData.counter++;
      generateTemplate(node, nodeType, staticData);
    });
  }
}

// Template generator after all static assets have been loaded
function generateTemplate(node, nodeType, staticData) {
  console.assert(staticData != null);
  console.assert(staticData.count != null);
  console.assert(staticData.counter != null);

  // Wait for all static data to be loaded
  if (staticData.counter != staticData.count) {
    return;
  }
  const resources = staticData[nodeType + "/resources.json"];
  if (resources == null) {
    console.error("Warning: resources not loaded!");
    return;
  }
  node.resources = resources;
  staticData.resources = resources;
  // Initialize options
  loadDataActions(node, staticData);

  $("#node-input-dataaction").on("change", () =>
    loadDataTypes(node, staticData)
  );
  $("#node-input-datatype").on("change", () =>
    loadTaskOptions(node, staticData)
  );
  $("#input-target").on("change", () => {
    const target = getTarget(resources);
    loadTargetOptions(target, staticData);
    loadServices(target);
  });

  loadSectionToggleCollapse("manipulations");
  loadSectionToggleCollapse("target-options");

  loadSavedState(node, staticData);
}

/* ========== Level 1 option ========== */

// Populate data action options
function loadDataActions(node, staticData) {
  console.assert(staticData != null && staticData.resources != null);
  const resources = staticData.resources;
  const actions = Object.keys(resources);
  $("#node-input-dataaction").empty();

  for (let action of actions) {
    const option = $("<option/>");
    option.attr("value", action);
    option.attr("id", "action-" + action);
    option.text(action);
    $("#node-input-dataaction").append(option);
  }

  loadDataTypes(node, staticData);
}

/* ========== Level 2 option ========== */

// Populate available data types for the chosen data action
function loadDataTypes(node, staticData) {
  console.assert(staticData != null && staticData.resources != null);
  const dataaction = $("#node-input-dataaction").val();
  const resources = staticData.resources;

  if (!resources.hasOwnProperty(dataaction)) {
    console.error("Unknown data action encountered:", dataaction);
    return;
  }

  $("#node-input-datatype").empty();
  const types = Object.keys(resources[dataaction]);
  for (let type of types) {
    const option = $("<option/>");
    option.attr("value", type);
    option.text(type);
    $("#node-input-datatype").append(option);
  }

  loadTaskOptions(node, staticData);
}

/* ========== Level 3 option ========== */

// Populate available targets/manipulations for the chosen data type
function loadTaskOptions(node, staticData) {
  console.assert(staticData != null && staticData.resources != null);
  const dataaction = $("#node-input-dataaction").val();
  const datatype = $("#node-input-datatype").val();
  const resources = staticData.resources;

  if (!(resources[dataaction] && resources[dataaction][datatype])) {
    console.error("Unknown resource:", [dataaction, datatype]);
    return;
  }

  const resource = resources[dataaction][datatype];
  if (resource.targets && resource.targets.length) {
    $("#targets").show();
    loadTargets(resource, staticData);
  } else {
    $("#targets").hide();
    $("#target-options").hide();
    $("#service-containers").hide();
  }
  if (resource.manipulations && resource.manipulations.length) {
    // Load manipulations if any are defined
    $("#manipulations").show();
    loadManipulations(resource, staticData);
  } else {
    $("#manipulations").hide();
  }
}

// Load available manipulations for the chosen resource (for filter node)
// More than one manipulation may be set per resource
function loadManipulations(resource, staticData) {
  console.assert(resource.manipulations);

  const manipulations = resource.manipulations;
  const container = $("#manipulations-container");
  container.empty();
  for (let manipulation of manipulations) {
    const name = manipulation.name;
    const label = manipulation.label;
    const options = manipulation.options;

    const div = $("<div/>");
    div.attr("style", "margin-left: 10%");
    div.addClass("form-row");

    const icon = $("<i/>");
    icon.attr("class", "fa fa-pencil-square-o");

    const labelDOM = $("<label/>");
    labelDOM.html(icon.prop("outerHTML") + " " + label);
    div.append(labelDOM);

    const enableManip = $("<input/>");
    enableManip.attr("type", "radio");
    enableManip.attr("name", "manipulation");
    enableManip.attr("val", name);
    enableManip.attr("id", "manipulation-" + name);
    enableManip.addClass("manipulationToggle");
    div.append(enableManip);

    const divOptions = $("<div/>");
    divOptions.attr("id", "manipulation-options-" + name);
    if (options) {
      for (let option of options) {
        divOptions.append(buildInputLabelDOM(option));
        divOptions.append(buildInputDOM("manipulation", option, staticData));
      }
    }
    divOptions.hide();
    div.append(divOptions);
    container.append(div);
  }
  $(".manipulationToggle").on("change", () => {
    $(".manipulationToggle").each((idx, dom) => {
      const input = $(dom);
      const id = "manipulation-options-" + input.attr("val");
      $("#" + id).toggle(input.is(":checked"));
    });
  })
}

// Load available targets for the chosen resource
function loadTargets(resource, staticData) {
  console.assert(resource.targets);

  const targets = resource.targets;
  const targetDOM = $("#input-target");
  targetDOM.empty();

  for (let target of targets) {
    let domOption = $("<option/>");
    domOption.attr("value", target.name);
    domOption.text(target.label);
    targetDOM.append(domOption);
  }

  resources = staticData.resources;
  const target = getTarget(resources);
  loadTargetOptions(target, staticData);
  loadServices(target);
}

// Load available models for the chosen resource (for inference node)
function loadModels(resource, staticData) {}

/* ========== Level 4 option ========== */

// Load target specific options
function loadTargetOptions(target, staticData) {
  console.assert(target && staticData);

  if (target.options) {
    $("#target-options").show();
    const container = $("#target-options-container");
    container.empty();
    for (let option of target.options) {
      // Build label
      container.append(buildInputLabelDOM(option));
      container.append(buildInputDOM("target", option, staticData));
    }
  } else {
    $("#target-options").hide();
  }
}

// Load service containers
function loadServices(target) {
  $("#service-containers").hide();
  if (target && target.service) {
    $("#service-containers").show();
    $("#service-containers").children("div").hide();
    $(`#${target.service}-container`).show();
  }
}

/* ========== Miscellaneous functions ========== */

// Build input types for options
function buildInputDOM(type, option, staticData) {
  console.assert(option != null);
  console.assert(option.type != null);

  let input;
  if (option.type === "select") {
    // Drop down select type
    input = $("<select/>");
    for (let value of option.values) {
      let domOption = $("<option/>");
      domOption.attr("value", value.value);
      domOption.text(value.label);
      input.append(domOption);
    }
  } else if (option.type === "text") {
    // Text field input
    input = $("<input/>");
    input.attr("type", "text");
    if (option.placeholder) {
      input.attr("placeholder", option.placeholder);
    }
  } else if (option.type === "checkbox") {
    // Checkbox input
    input = $("<input/>");
    input.attr("type", "checkbox");
  } else if (option.type === "dynamic-select") {
    // Drop down select with fields populated from a resource file
    input = $("<select/>");
    let values = staticData[option.source];
    for (let value of values) {
      let domOption = $("<option/>");
      domOption.attr("value", value.name);
      domOption.text(value.name);
      input.append(domOption);
    }
  }
  input.attr("id", `option-${type}-${option.name}`);
  return input;
}

// Build input label for options
function buildInputLabelDOM(option) {
  let label = $("<label/>");
  label.attr("for", `option-${option.name}`);
  let html = "";
  if (option.icon) {
    html += `<i class="fa ${option.icon}"></i> ${option.label}`;
  } else {
    html += `<i class="fa fa-cog"></i> ${option.label}`;
  }
  label.html(html);
  return label;
}

// Apply section toggle collapse functionality
function loadSectionToggleCollapse(section) {
  function applyCaretFlip() {
    if ($(`#${section}-container`).is(":visible")) {
      $(`#${section}-caret`).attr("class", "fa fa-caret-up");
    } else {
      $(`#${section}-caret`).attr("class", "fa fa-caret-down");
    }
  }
  $(`#${section}-label`).on("click", () => {
    $(`#${section}-container`).toggle();
    applyCaretFlip();
  });
  applyCaretFlip();
}

// Get the current set of selected options to load advanced options
function getTask(resources) {
  console.assert(resources != null);
  const dataaction = $("#node-input-dataaction").val();
  const datatype = $("#node-input-datatype").val();
  if (resources && resources[dataaction]) {
    return resources[dataaction][datatype];
  }
}

// Get the target given the selected task
function getTarget(resources) {
  const task = getTask(resources);
  console.assert(task.targets != null);

  const targetVal = $("#input-target").val();
  const target = task.targets.find((entry) => entry.name === targetVal);
  console.assert(
    target != null,
    `Target: ${targetVal} not found for task: ${JSON.stringify(task)}`
  );

  return target;
}