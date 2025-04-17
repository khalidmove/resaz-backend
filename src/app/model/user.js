"use strict";

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const pointSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Point'],
        required: true
    },
    coordinates: {
        type: [Number],
        required: true
    }
});
const userSchema = new mongoose.Schema(
  {
    img: {
      type: String,
    },
    username: {
      type: String,
    },
    email: {
      type: String,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
    },
    number: {
      type: String,
      unique: true,
      sparse: true,
    },
    location: {
      type: pointSchema,
    },
    referal: {
      type: String,
      unique: true,
      sparse: true,
    },
    referalpoints: {
      type: Number,
      default:0
    },
    company: {
      type: String,
    },
    shipping_address: {
      type: Object,
    },
    type: {
      type: String,
      enum: ["USER", "ADMIN", "SELLER", "DRIVER", "EMPLOYEE"],
      default: "USER",
    },
    status: {
      type: String,
      default:"Pending"
    },
    store_name: {
      type:String
    },
    address: {
      type:String
    },
    country: {
      type:String
    },
    store_doc: {
      type:String
    },
    national_id_no: {
      type:String
    },
    national_id: {
      type:String
    },
    // licences: {
    //   type: String
    // },
    // numberPlate: {
    //   type: String
    // },
    // numberPlateImg: {
    //   type: String
    // },
    dl_number: {
      type:String
    },
    number_plate_no: {
      type:String
    },
    dl_image: {
      type:String
    },
    number_plate_image: {
      type:String
    },
    address_support_letter: {
      type:String
    },
    background_check_document:{
      type:String
    },
    wallet:{
      type:Number,
    },
    parent_vendor_id:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"User"
    },
  },
  {
    timestamps: true,
  }
);
userSchema.set("toJSON", {
  getters: true,
  virtuals: false,
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  },
});

userSchema.methods.encryptPassword = (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
};
userSchema.methods.isValidPassword = function isValidPassword(password) {
  return bcrypt.compareSync(password, this.password);
};
userSchema.index({ location: "2dsphere" });
module.exports = mongoose.model("User", userSchema);
