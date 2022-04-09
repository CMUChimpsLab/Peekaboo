const User = require("../models/User");
const jwt = require("jsonwebtoken");

module.exports = (app) => {
  app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });

    if (user != null) {
      // User with email already exists
      return res
        .status(400)
        .json({ message: "Account with that email already exists!" });
    } else {
      if (name == null || email == null || password == null) {
        return res.status(400).json({ message: "Bad request" });
      }
      // Create a new user
      // Only store password hash in database
      const passwordHash = User.generateHash(password);
      user = new User({ name, email, password: passwordHash });
      try {
        await user.save();
        const token = user.generateAuthToken();

        user.password = undefined;
        return res.json({ user, token });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Could not create account" });
      }
    }
  });

  app.post("/login", async (req, res) => {
    const { email, password, token } = req.body;
    if (password != null) {
      // Login with password
      const user = await User.findOne({ email });
      if (user == null) {
        return res
          .status(400)
          .json({ message: "No account associated with that email" });
      } else {
        if (!user.checkPassword(password)) {
          return res.status(403).json({ message: "Invalid password" });
        } else {
          // Authentication success
          const token = user.generateAuthToken();
          user.password = undefined;
          return res.json({ user, token });
        }
      }
    } else {
      if (token == null) {
        return res.status(400).json({ message: "Bad request" });
      }
      // Login with token
      const user = await User.getByToken(token);
      if (user == null) {
        return res.status(403).json({ message: "Invalid token" });
      } else {
        delete user.password;
        return res.json({ user });
      }
    }
  });
};
