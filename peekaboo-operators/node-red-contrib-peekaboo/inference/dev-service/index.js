const express = require("express");
const PORT = process.env.PORT || 5000;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/model/metadata', (req, res) => {
  res.json({
    id: "example-model",
    name: "Peekaboo Example Model",
    description: "Peekaboo Example Inference Model",
    type: "image_classification",
    source: null
  });
});

app.post('/model/detect', (req, res) => {
  res.json({
    status: "ok",
    predictions: [
      {
        "label_id": "/m/09x0r",
        "label": "Speech",
        "probability": 0.7939221858978271
      }
    ]
  })
});

app.post('/model/classify', (req, res) => {
  res.json({
    status: "ok",
    predictions: [
      {
        "label_id": "/m/09x0r",
        "label": "Speech",
        "probability": 0.7939221858978271
      }
    ]
  })
});

app.listen(PORT, () =>
  console.log(`Development service listening on port ${PORT}`)
);
