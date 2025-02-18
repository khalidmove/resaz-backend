'use strict';

const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema({
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: {
      type: [Number],
    },
  });

const productrequestchema = new mongoose.Schema({
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
            image: [{
                type: String,
            }],
            color: {
                type: String
            },
            total: {
                type: Number
            },
            qty: {
                type: Number
            },
            price: {
                type: Number
            },
            status: {
                type: String,
                default: 'Pending'
            },
            seller_id: {
                // user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                // },
            },
        }
    ],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    shipping_address: {
        type: Object,
    },
    total: {
        type: Number
    },
    location: {
        type: pointSchema,
      },

}, {
    timestamps: true
});

productrequestchema.set('toJSON', {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    }
});
productrequestchema.index({ location: "2dsphere" });

module.exports = mongoose.model('ProductRequest', productrequestchema);