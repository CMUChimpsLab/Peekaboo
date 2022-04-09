Template structure for resources.json as a typescript interface.

```typescript
interface Resources {
  "data-action": {
    "data-type": {
      manipulations?: [TaskOption]; // filter
      targets?: [TaskOption]; // inference
      models?: [Model]; // inference
    };
  };
}

interface TaskOption {
  name: String; // Name passed to config
  label: String; // Display name of target for HTML
  options: [Option]; // List of target/manipulation options
  service?: String; // Service node to configure with task
}

interface Model {
  name: String; // Name of model to display
  src: String; // URL to page of model
}

type ValueType = String | Number | Boolean;

interface Option {
  name: String; // Name of option (passed to node)
  label: String; // Display name for HTML
  /** Dependency on another option. Option not displayed unless
   *  dependency is satisfied. **/
  dependency?: Dependency;
  type: String; // Input type for this option
  default?: ValueType; // Optional default value
  values?: [Value]; // Possible values to choose from
  rules?: [Rule]; // Configurable rules (for scalar)
  placeholder?: String; // Optional placeholder value
  icon?: String; // Font awesome icon to display (fa-cog by default)
  source?: String; // Source of values if type == dynamic-select
}

interface Dependency {
  name: String; // Name of dependency option
  value: ValueType; // Required value of dependency option to be fulfilled
}

interface Value {
  label: String; // Display name of value
  value: ValueType; // Value stored in config
}

interface Rule {
  operator: String; // Operator to use for comparison
  value: String; // Value to compare against using operator
}
```