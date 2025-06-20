"use strict";

const mongoose = require("mongoose");
const crypto = require("crypto");

const generateShortTimestamp = () => {
  const now = Date.now();
  return now.toString(36).toUpperCase();
};

const generateUniqueOrderId = () => {
  const timestampPart = generateShortTimestamp();
  const randomPart = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `ORD-${timestampPart}-${randomPart}`;
};

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Point"],
  },
  coordinates: {
    type: [Number],
  },
});

const productrequestchema = new mongoose.Schema(
  {
    // category: [{
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Category",
    // }],
    productDetail: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        image: [
          {
            type: String,
          },
        ],
        total: {
          type: Number,
        },
        qty: {
          type: Number,
        },
        price: {
          type: Number,
        },
        price_slot: {
          value: { type: Number },
          unit: { type: String },
          our_price: { type: Number },
          other_price: { type: Number },
        },
        // return and refund related
        isReturnable: { type: Boolean }, // capture it from product at order time
        returnDetails: {
          isReturned: { type: Boolean, default: false }, // for return request
          isRefunded: { type: Boolean, default: false }, // for refund request
          returnRequestDate: Date, // for return request date
          returnDate: Date, // for return date when product is picked up again by seller
          returnStatus: {
            type: String,
            enum: [
              "Pending",
              "Approved",
              "Rejected",
              "Refunded",
              "Auto-Refunded",
              "Return-requested",
              "Completed",
            ],
          }, // status of the return and refund
          reason: String, // reason for return and refund
          proofImages: [String], // images for proof of return and refund
          refundAmount: Number, // amount to be refunded
          refundedAt: Date, // date when refund is processed
          refundWithoutReturn: { type: Boolean }, // for refund without return ----> for auto-refund
        },
      },
    ],
    comboProductDetail: [
      {
        comboId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Combo",
        },
        qty: Number,
        price: Number,
        total: Number,
        comboItems: [
          {
            product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            seller_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            qty: Number,
            price: Number,
            price_slot: {
              value: Number,
              unit: String,
              our_price: Number,
              other_price: Number,
            },
          },
        ],
      },
    ],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      default: "Pending",
    },
    seller_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    driver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    onthewaytodelivery: {
      type: Boolean,
      default: false,
    },
    shipping_address: {
      type: Object,
    },
    tax: {
      type: Number,
      default: 0,
    },
    servicefee: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
    },
    deliveryCharge: {
      type: Number,
    },
    deliveryTip: {
      type: Number,
    },
    finalAmount: {
      type: Number,
    },
    location: {
      type: pointSchema,
    },
    paymentmode: {
      type: String,
    },
    timeslot: {
      type: String,
    },
    cashcollected: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },
    amountreceivedbyadmin: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },
    assignedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    deliveredAt: {
      type: Date,
    },
    orderId: {
      type: String,
      maxlength: 100,
      unique: true,
      index: true,
    },
    deliverylocation: {
      type: pointSchema,
    },
    deliveryimg: [{ imgname: { type: String } }],

    // return: {
    //   type: Boolean,
    // },
    // refund: {
    //   type: Boolean,
    // },
    // returnAmount: {
    //   type: Number,
    // },
    // returnreason: { type: String },
    // returnproof: [{ type: String }],
    // returnStatus: {
    //   type: String,
    //   enum: ["Pending", "Approved", "Rejected", "Refunded"],
    // },
    // productId: [{
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Product",
    // }],
    // returndate: {
    //   type: Date,
    // },
  },
  {
    timestamps: true,
  }
);


productrequestchema.set("toJSON", {
  getters: true,
  virtuals: false,
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  },
});
productrequestchema.index({ location: "2dsphere" });
productrequestchema.index({ orderId: 1 }, { unique: true });

productrequestchema.pre("save", async function (next) {
  const ProductRequest = this.constructor;

  if (!this.orderId) {
    let newOrderId;
    let existing;

    do {
      newOrderId = generateUniqueOrderId();
      existing = await ProductRequest.findOne({ orderId: newOrderId });
    } while (existing);

    this.orderId = newOrderId;
  }

  next();
});

module.exports = mongoose.model("ProductRequest", productrequestchema);
