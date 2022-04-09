/* ========== Saving functions ========== */
function saveState(node) {
  const resources = node.resources;

  // Save top level types
  const dataaction = $("#node-input-dataaction").val();
  node.dataaction = dataaction;

  const datatype = $("#node-input-datatype").val();
  node.datatype = datatype;

  const task = getTask(resources);
  console.assert(task != null);

  // Clear target
  node.target.name = "";
  node.target.options = {};

  // Save target
  if (task.targets) {
    node.target.name = $("#input-target").val();

    const target = getTarget(resources);
    if (target.options) {
      for (let option of target.options) {
        const name = option.name;
        let val = $(`#option-target-${name}`).val();
        if (option.type === "checkbox") {
          val = $(`#option-target-${name}`).prop("checked");
        }
        node.target.options[name] = val;
      }
    }
    if (resources.services) {
      for (service of resources.services) {
        if (target.service !== service && node[service]) {
          delete node[service];
        }
      }
    }
  }

  // Clear manipulations
  node.manipulation = {};

  // Save manipulations
  if (task.manipulations) {
    for (let manipulation of task.manipulations) {
      const name = manipulation.name;
      const enabled = $(`#manipulation-${name}`).is(":checked");
      if (enabled) {
        const entry = { name: name, options: {} };

        if (manipulation.options) {
          for (let option of manipulation.options) {
            const optionName = option.name;
            let val = $(`#option-manipulation-${optionName}`).val();
            if (option.type === "checkbox") {
              val = $(`#option-manipulation-${optionName}`).prop("checked");
            }
            entry.options[optionName] = val;
          }
        }
        node.manipulation = entry;
        break;
      }
    }
  }

}

function loadOptionState(type, option, options) {
  const name = option.name;
  const val = options[name];
  if (val != null) {
    if (option.type === "checkbox") {
      $(`#option-${type}-${name}`).prop("checked", val);
    } else {
      $(`#option-${type}-${name}`).val(val);
    }
  }
}

// TODO: implement dependency
function applyOptionDependency(type, option) {
  // if (option.dependency) {
  //   const optionName = option.name;
  //   const { name, value } = option.dependency;
  //   if ($(`#option-${type}-${name}`).val() != value) {
  //     $(`#option-${type}-${optionName}`).hide();
  //   }
  // }
}

// Load saved state if it exists
function loadSavedState(node, staticData) {
  const resources = node.resources;

  $("#node-input-dataaction").val(node.dataaction);
  loadDataTypes(node, staticData);

  $("#node-input-datatype").val(node.datatype);
  loadTaskOptions(node, staticData);

  const task = getTask(resources);
  console.assert(task != null);

  // Load targets
  if (task.targets) {
    $("#input-target").val(node.target.name);

    const target = getTarget(resources);
    if (target.options) {
      loadTargetOptions(target, staticData);
      for (let option of target.options) {
        loadOptionState("target", option, node.target.options);
      }
      for (let option of target.options) {
        applyOptionDependency("target", option);
      }
    }
    if (target.service) {
      loadServices(target);
    }
  }

  // Load manipulations
  if (task.manipulations) {
    const manipulation = node.manipulation;
    const name = manipulation.name;
    $(`#manipulation-${name}`).prop("checked", true);
    $(`#manipulation-options-${name}`).toggle(true);

    const manipulationRef = task.manipulations.find(
      (entry) => entry.name === name
    );
    console.assert(manipulationRef, "Unknown manipulation:", name);

    for (let option of manipulationRef.options) {
      loadOptionState("manipulation", option, manipulation.options);
    }

    for (let option of manipulationRef.options) {
      applyOptionDependency("manipulation", option);
    }

  }

  // TODO: implement service state save/load
  // const task = getTask(resources);
  // $("#input-target").on("change", () => {
  //   const target = getTarget(resources);
  //   loadTargetOptions(target, staticData);
  // });
}
