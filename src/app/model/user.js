"use strict";

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
//const pointSchema = new mongoose.Schema({
//     type: {
//         type: String,
//         enum: ['Point'],
//         required: true
//     },
//     coordinates: {
//         type: [Number],
//         required: true
//     }
// });
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
    },
    email: {
      type: String,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
    },
    number: {
      type: String,
      unique: true,
    },
    referal: {
      type: String,
      unique: true,
    },
    company: {
      type: String,
    },
    shiping_address: {
      type: Object,
    },
    type: {
      type: String,
      enum: ["USER", "ADMIN", "SELLER"],
      default: "USER",
    },
  },
  {
    timestamps: true,
  }
);
userSchema.set("toJSON", {
  getters: true,
  virtuals: false,
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  },
});

userSchema.methods.encryptPassword = (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
};
userSchema.methods.isValidPassword = function isValidPassword(password) {
  return bcrypt.compareSync(password, this.password);
};
module.exports = mongoose.model("User", userSchema);
