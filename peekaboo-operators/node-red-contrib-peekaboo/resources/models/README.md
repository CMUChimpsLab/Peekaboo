Model json files follow the following format:
```typescript
[
  {
    model: String,
    url: String,
    datatype: String,
    targets: [String]
  }
]
```

Each json object contains a root list object containing model entries.
Each model entry contains the name of the model, a default URL for a service
that supports the model, the datatype that it performs operations on, and
the targets that it supports.