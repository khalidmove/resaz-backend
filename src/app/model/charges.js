'use strict';

const mongoose = require('mongoose');

const taxSchema = new mongoose.Schema({
    deliveryCharge: {
        type: Number,
        required: true
    },
    serviceCharge: {
        type: Number,
        required: true
    },
    deliveryPartnerTip: [{
        type: Number,
        required: true
    }],
}, {
    timestamps: true
});

module.exports = mongoose.model('Charge', taxSchema);
