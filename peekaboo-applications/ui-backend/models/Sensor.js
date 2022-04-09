const mongoose = require("mongoose");

const Sensor = new mongoose.Schema({
  user: {
    type: "ObjectId",
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true
  },
  key: {
    type: String,
    required: true
  }
}, {
  timestamps: {
    created_at: "created_at"
  },
  versionKey: false
});

module.exports = mongoose.model("Sensor", Sensor);
