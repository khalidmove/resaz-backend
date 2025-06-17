"use strict";

const mongoose = require("mongoose");

const PriceSlotSchema = new mongoose.Schema({
  unit: String,
  value: String,
  our_price: Number,
  other_price: Number,
});

const ComboItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  selected_slot: PriceSlotSchema,
});

const ComboProductSchema = new mongoose.Schema(
  {
    comboItems: [ComboItemSchema],
    userid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    old_price: {
      type: Number,
      required: true,
    },
    offer_price: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ComboProduct", ComboProductSchema);
