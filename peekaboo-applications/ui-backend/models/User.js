const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt-nodejs");

const User = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    admin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: {
      created_at: "created_at",
    },
    verisonKey: false,
  }
);

User.methods.generateAuthToken = function () {
  return jwt.sign(this._id.toString(), process.env.JWT_SECRET);
};

User.methods.checkPassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

User.statics.generateHash = (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

User.statics.getByToken = async function (token) {
  try {
    const id = await jwt.verify(token, process.env.JWT_SECRET);
    const user = await this.findOne({ _id: id });
    user.password = undefined;
    return user;
  } catch (err) {
    return null;
  }
};

module.exports = mongoose.model("User", User);
