"use strict";

const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  termsAndConditions: {
    type: String,
  },
  privacy: {
    type: String,
  },
  returnPolicy: {
    type: String,
  },
});


contentSchema.set("toJSON", {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    },
})



module.exports = mongoose.model('Content', contentSchema);



