# Connecting the Service to the Program

The generic service library for Peekaboo checks for two specific endpoints for any given task:

1. Metadata
2. Prediction

The format of the metadata endpoint must be given as such:

```
GET /model/metadata
```

The metadata schema is based on IBM's MAX implementation:

```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "type": "string",
  "source": "string",
  "license": "string"
}
```

The format of the prediction endpoint must be given as such:

```
POST /model/{dataAction}
```

where `dataAction` is one of the Peekaboo data actions, e.g. classify, detect, extract, select, noisify, spoof.

The prediction body and response schema is based on IBM's MAX implementation:

Body:
```json
{
  "filetype": "formData", // Required
  "option1": "",
  "option2": "",
}
```

Response (Depends on your implementation):
```json
{
  "status": "string",
  "predictions": [
    {
      "label_id": "string",
      "label": "string",
      "probability": 0
    }
  ]
}
```
> This is just one example of the prediction structure. Other structures have a string `predictions` value.