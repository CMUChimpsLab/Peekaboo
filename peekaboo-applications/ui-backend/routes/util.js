// Send Bad request HTTP response
const bad = (res) => {
  res.status(400).json({ message: "Bad request" });
};

// Send Forbidden HTTP response
const forbidden = (res, message) => {
  res.status(403).json({ message: "Forbidden" });
};

// Send Internal Error HTTP response
const error = (res) => {
  res.status(500).json({ message: "An internal server error occured" });
};

module.exports = { forbidden, error, bad };
