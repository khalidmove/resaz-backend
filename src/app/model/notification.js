'use strict';

const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({

    userType: {
        type: String,
        trim: true,
        require: true
    },

    notification: {
        type: String,
        trim: true,
        require: true
    },
   

}, {
    timestamps: true
});

notificationSchema.set('toJSON', {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Notification', notificationSchema);