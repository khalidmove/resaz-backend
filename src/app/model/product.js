'use strict';

const mongoose = require('mongoose');
const productchema = new mongoose.Schema({
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
    },
    theme: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Theme",
    }],
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    categoryName: {
        type: String,
    },
    gender: {
        type: String,
    },
    origin: {
        type: String,
    },
    selflife: {
        type: String,
    },
    manufacturername: {
        type: String,
    },
    manufactureradd: {
        type: String,
    },
    expirydate: {
        type: Date,
    },
    name: {
        type: String,
    },
    slug: {
        type: String,
    },
    image: {
        type: String,
    },
    short_description: {
        type: String,
    },
    long_description: {
        type: String,
    },
    price: {
        type: Number,
    },
    offer: {
        type: Number,
    },
    pieces: {
        type: Number,
    },
    sold_pieces: {
        type: Number,
        default: 0
    },
    varients: {
        type: [],
    },
    decoration_method: [],
    decoration_location: [],
    minQuantity: {
        type: Number
    },
    parameter_type: {
        type: String
    },
    price_slot: [],
    is_verified: {
        type: Boolean,
        default: false
    },
    is_quality: {
        type: Boolean,
        default: false
    },
    sponsered: {
        type: Boolean
    },
    attributes: [
        {
            name: { type: String },
            value: { type: String, default: '' }
        }
    ]
}, {
    timestamps: true
});

productchema.set('toJSON', {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Product', productchema);