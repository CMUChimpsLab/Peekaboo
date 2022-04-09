const Sensor = require("../models/Sensor");
const SoilMoisture = require("../models/SoilMoisture");
const User = require("../models/User");
const uuidAPIKey = require("uuid-apikey");
const { bad, forbidden, error } = require("./util");

module.exports = (app) => {
  // Authenticate a user based on access token
  const isAuthenticated = async (req, res, next) => {
    const token = req.headers["x-access-token"];
    const user = await User.getByToken(token);
    if (user != null) {
      req.user = user;
      next();
    } else {
      forbidden(res);
    }
  };

  // Check if authenticated user is an admin
  const isAdmin = (req, res, next) => {
    const user = req.user;
    if (user.admin) {
      next();
    } else {
      forbidden(res);
    }
  };

  // Retrieve all sensors belonging to a user
  app.get("/sensors/all", isAuthenticated, async (req, res) => {
    const id = req.user._id;
    try {
      const sensors = await Sensor.find({ user: id }).select("-user");
      return res.json(sensors);
    } catch (err) {
      error(res);
    }
  });

  // Create new sensor
  app.post("/sensors/create", isAuthenticated, async (req, res) => {
    const { name } = req.body;
    const id = req.user._id;
    try {
      const apiKey = uuidAPIKey.create().apiKey;
      const sensor = new Sensor({ user: id, name, key: apiKey });
      await sensor.save();
      return res.json(sensor);
    } catch (err) {
      error(res);
    }
  });

  // Get all data associated with a sensor id
  app.get("/data/:id", isAuthenticated, async (req, res) => {
    const id = req.params.id;
    try {
      const sensors = await SoilMoisture.find({ sensor: id });
      return res.json(sensors);
    } catch (err) {
      error(res);
    }
  });

  // Insert soil moisture data
  app.post("/data/insert", async (req, res) => {
    // Peekaboo payload
    const { payload, api_key } = req.body;
    if (payload != null && api_key != null) {
      const sensor = await Sensor.findOne({ key: api_key });
      if (sensor != null) {
        const peekabooObject = payload[0];
        const { raw, moisture } = peekabooObject.data;
        const doc = new SoilMoisture({ sensor: sensor._id, raw, moisture });
        try {
          await doc.save();
          return res.json(doc);
        } catch (err) {
          return error(res);
        }
      } else {
        console.log("Could not find sensor with key", api_key);
        bad(res);
      }
    } else {
      bad(res);
    }
  });
};
