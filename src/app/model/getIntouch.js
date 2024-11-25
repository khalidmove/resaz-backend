"use strict";
const mongoose = require("mongoose");
const getintouch = new mongoose.Schema(
  {
    last_name: {
      type: String,
    },
    first_name: {
      type: String,
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
    },
    description: {
      type: String,
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
  }
);

getintouch.set("toJSON", {
  getters: true,
  virtuals: false,
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Getintouch", getintouch);
