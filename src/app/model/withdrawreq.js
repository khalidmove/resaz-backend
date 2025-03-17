"use strict";

const mongoose = require("mongoose");
const withdrawreqSchema = new mongoose.Schema(
  {
    note: {
      type: String,
    },
    request_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    amount: {
      type: Number,
    },
    settle: {
        type: String,
        default: 'Pending'
      },
  },
  {
    timestamps: true,
  }
);

withdrawreqSchema.set("toJSON", {
  getters: true,
  virtuals: false,
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Withdrawreq", withdrawreqSchema);
