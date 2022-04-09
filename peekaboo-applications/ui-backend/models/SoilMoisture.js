const mongoose = require("mongoose");

const SoilMoisture = new mongoose.Schema(
  {
    sensor: {
      type: "ObjectId",
      ref: "Sensor",
    },
    raw: Number,
    moisture: {
      type: Number,
      required: true,
    },
  },
  {
    collection: "soil_moisture",
    timestamps: { createdAt: "created_at" },
    versionKey: false,
  }
);

module.exports = mongoose.model("SoilMoisture", SoilMoisture);
