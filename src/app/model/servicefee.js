'use strict';

const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  
    Servicefee: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    
}, {
    timestamps: true
});

module.exports = mongoose.model('servicefee', feeSchema);
