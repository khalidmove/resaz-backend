"use strict";
const userHelper = require("./../helper/user");
const response = require("./../responses");
const passport = require("passport");
const jwtService = require("./../services/jwtService");
const mailNotification = require("./../services/mailNotification");
const mongoose = require("mongoose");
const Device = mongoose.model("Device");
const User = mongoose.model("User");
const Getintouch = mongoose.model("Getintouch");
const Newsletter = mongoose.model("Newsletter");
const Store = mongoose.model("Store");
const Verification = mongoose.model("Verification");
const Notification = mongoose.model("Notification");
const Review = mongoose.model("Review");
const { v4: uuidv4 } = require("uuid");
const generateUniqueId = require("generate-unique-id");
const Tax = require("../model/tax");
const Setting = mongoose.model("Setting");
const jwt = require("jsonwebtoken");
const Product = mongoose.model("Product");
const ProductRequest = mongoose.model("ProductRequest");
const ExcelJS = require("exceljs");

module.exports = {
  // login controller
  login: (req, res) => {
    console.log("request came here");
    passport.authenticate("local", async (err, user, info) => {
      if (err) {
        return response.error(res, err);
      }
      if (!user) {
        return response.unAuthorize(res, info);
      }
      let token = await new jwtService().createJwtToken({
        id: user._id,
        // user: user.fullName,
        type: user.type,
        tokenVersion: new Date(),
      });
      await Device.updateOne(
        { device_token: req.body.device_token },
        { $set: { player_id: req.body.player_id, user: user._id } },
        { upsert: true }
      );
      await user.save();
      let data = {
        token,
        ...user._doc,
      };
      if (user.type === "SELLER") {
        let store = await Store.findOne({ userid: user._id });
        data.store = store;
      }
      delete data.password;
      return response.ok(res, { ...data });
    })(req, res);
  },

  signUp: async (req, res) => {
    try {
      const payload = req.body;
      const mail = req.body.email;
      if (!mail) {
        return response.badReq(res, { message: "Email required." });
      }
      let user2 = await User.findOne({
        email: payload.email.toLowerCase(),
      });
      const user = await User.findOne({ number: payload.number });
      console.log(user);
      if (user) {
        return res.status(404).json({
          success: false,
          message: "Phone number already exists.",
        });
      }
      if (user2) {
        return res.status(404).json({
          success: false,
          message: "Email Id already exists.",
        });
      } else {
        let name = payload?.username;
        const id3 = generateUniqueId({
          includeSymbols: ["@", "#"],
          length: 8,
        });
        let n = name.replaceAll(" ", "");
        var output =
          n.substring(0, 2) + id3 + n.substring(n.length - 2, n.length);
        let d = output.toUpperCase();
        console.log(d);

        //////////////////
        // if (payload.type === "DRIVER") {
        //   if (!payload.numberPlate || !payload.licences || !payload.numberPlateImg) {
        //     return res.status(400).json({
        //       success: false,
        //       message: "Number plate image and licences are required for DRIVER type.",
        //     });
        //   }
        // }
        /////////////
        let user = new User({
          username: payload?.username,
          email: payload?.email,
          number: payload?.number,
          referal: d,
          type: payload?.type,
          numberPlate: payload?.numberPlate,
          numberPlateImg: payload?.numberPlateImg,
          licences: payload?.licences,
        });
        user.password = user.encryptPassword(req.body.password);
        await user.save();
        // if (payload?.referal) {
        //   const refuser = await User.findOne({ referal: payload.referal });
        //   const setting = await Setting.findOne();
        //   refuser.referalpoints =
        //     (Number(refuser.referalpoints) || 0) + Number(setting.referelpoint);
        //   await refuser.save();
        // }
        if (payload?.referal) {
          const refuser = await User.findOne({ referal: payload.referal });
          const setting = await Setting.findOne();

          if (refuser && setting) {
            user.referredBy = refuser._id;
            const referredUsersCount = await User.countDocuments({
              referredBy: refuser._id,
            });

            let points = 0;

            if (referredUsersCount < 100) {
              points = 100;
            } else if (referredUsersCount < 150) {
              points = 120;
            } else if (referredUsersCount < 200) {
              points = 150;
            } else {
              points = 200;
            }

            refuser.referalpoints =
              (Number(refuser.referalpoints) || 0) + points;

            if (!refuser.pointHistory) refuser.pointHistory = [];

            refuser.pointHistory.push({
              points,
              earnedAt: new Date(),
              expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year later
            });

            await refuser.save();
          }
        }
        // await mailNotification.welcomeMail(user)
        res.status(200).json({ success: true, data: user });
      }
    } catch (error) {
      return response.error(res, error);
    }
  },
  changePasswordProfile: async (req, res) => {
    try {
      let user = await User.findById(req.user.id);
      if (!user) {
        return response.notFound(res, { message: "User doesn't exists." });
      }
      user.password = user.encryptPassword(req.body.password);
      await user.save();
      // mailNotification.passwordChange({ email: user.email });
      // return response.ok(res, { message: "Password changed." });
      await mailNotification.passwordChange({ email: user.email });
      return response.ok(res, { message: "Password changed." });
    } catch (error) {
      return response.error(res, error);
    }
  },
  me: async (req, res) => {
    try {
      let user = userHelper.find({ _id: req.user.id }).lean();
      return response.ok(res, user);
    } catch (error) {
      return response.error(res, error);
    }
  },
  updateUser: async (req, res) => {
    try {
      delete req.body.password;
      await User.updateOne({ _id: req.user.id }, { $set: req.body });
      return response.ok(res, { message: "Profile Updated." });
    } catch (error) {
      return response.error(res, error);
    }
  },
  updateAdminDetails: async (req, res) => {
    try {
      const payload = req.body;
      const userId = req.params.id;
      const user = await User.findById(userId);

      if (!user) return response.error(res, "User not found");

      const changes = {};
      const pendingChanges = {};

      if (payload.email && payload.email !== user.email) {
        pendingChanges.email = payload.email;
      }

      if (payload.password) {
        pendingChanges.password = payload.password;
      }

      if (Object.keys(pendingChanges).length > 0) {
        const token = jwt.sign(
          { userId, changes: pendingChanges },
          process.env.SECRET,
          { expiresIn: "15m" }
        );

        const confirmUrl = `${process.env.APP_URL}/confirm-update?token=${token}`;

        await mailNotification.updateMail({
          email: user.email,
          confirmUrl,
        });

        return response.ok(res, {
          message:
            "Confirmation email sent. Please verify to complete the update.",
        });
      }

      await User.findByIdAndUpdate(userId, payload, { new: true });
      return response.ok(res, { message: "Details updated." });
    } catch (error) {
      return response.error(res, error);
    }
  },
  confirmUpdate: async (req, res) => {
    try {
      const { token } = req.query;

      const decoded = jwt.verify(token, process.env.SECRET);
      const { userId, changes } = decoded;

      if (changes.password) {
        const bcrypt = require("bcryptjs");
        changes.password = await bcrypt.hash(changes.password, 10);
      }

      await User.findByIdAndUpdate(userId, changes, { new: true });

      return response.ok(res, { message: "Update confirmed and applied." });
    } catch (err) {
      return response.error(res, "Invalid or expired token.");
    }
  },
  sendOTP: async (req, res) => {
    try {
      const email = req.body.email;
      const user = await User.findOne({ email });

      if (!user) {
        return response.badReq(res, { message: "Email does exist." });
      }
      let ran_otp = Math.floor(1000 + Math.random() * 9000);
      await mailNotification.sendOTPmail({
        code: ran_otp,
        email: email,
      });
      // OTP is fixed for Now: 0000
      // let ran_otp = "0000";

      let ver = new Verification({
        //email: email,
        user: user._id,
        otp: ran_otp,
        expiration_at: userHelper.getDatewithAddedMinutes(5),
      });
      await ver.save();
      // }
      let token = await userHelper.encode(ver._id);

      return response.ok(res, { message: "OTP sent.", token });
    } catch (error) {
      return response.error(res, error);
    }
  },
  verifyOTP: async (req, res) => {
    try {
      const otp = req.body.otp;
      const token = req.body.token;
      if (!(otp && token)) {
        return response.badReq(res, { message: "otp and token required." });
      }
      let verId = await userHelper.decode(token);
      let ver = await Verification.findById(verId);
      if (
        otp == ver.otp &&
        !ver.verified &&
        new Date().getTime() < new Date(ver.expiration_at).getTime()
      ) {
        let token = await userHelper.encode(
          ver._id + ":" + userHelper.getDatewithAddedMinutes(5).getTime()
        );
        ver.verified = true;
        await ver.save();
        return response.ok(res, { message: "OTP verified", token });
      } else {
        return response.notFound(res, { message: "Invalid OTP" });
      }
    } catch (error) {
      return response.error(res, error);
    }
  },
  changePassword: async (req, res) => {
    try {
      const token = req.body.token;
      const password = req.body.password;
      const data = await userHelper.decode(token);
      const [verID, date] = data.split(":");
      if (new Date().getTime() > new Date(date).getTime()) {
        return response.forbidden(res, { message: "Session expired." });
      }
      let otp = await Verification.findById(verID);
      if (!otp.verified) {
        return response.forbidden(res, { message: "unAuthorize" });
      }
      let user = await User.findById(otp.user);
      if (!user) {
        return response.forbidden(res, { message: "unAuthorize" });
      }
      await Verification.findByIdAndDelete(verID);
      user.password = user.encryptPassword(password);
      await user.save();
      //mailNotification.passwordChange({ email: user.email });
      return response.ok(res, { message: "Password changed! Login now." });
    } catch (error) {
      return response.error(res, error);
    }
  },

  // getUserList: async (req, res) => {
  //   try {
  //     const page = parseInt(req.query.page) || 1;
  //     const limit = parseInt(req.query.limit) || 10;
  //     const skip = (page - 1) * limit;

  //     const typeParam = req.params.type;
  //     let typeFilter = {};

  //     if (typeParam === "all") {
  //       typeFilter.type = { $in: ["USER", "SELLER"] };
  //     } else if (typeParam === "users") {
  //       typeFilter.type = { $ne: "USER" }; // assuming "USER" is not a customer
  //     } else if (typeParam === "sellers") {
  //       typeFilter.type = { $ne: "SELLER" }; // assuming "SELLER" is not a seller
  //     } else {
  //       typeFilter.type = typeParam; // specific type
  //     }

  //     const users = await User.find(typeFilter)
  //       .sort({ createdAt: -1 })
  //       .skip(skip)
  //       .limit(limit);

  //     const indexedUser = users.map((item, index) => ({
  //       ...(item.toObject?.() || item),
  //       indexNo: skip + index + 1,
  //     }));

  //     const totalUsers = await User.countDocuments(typeFilter);
  //     const totalPages = Math.ceil(totalUsers / limit);

  //     return res.status(200).json({
  //       status: true,
  //       data: indexedUser,
  //       pagination: {
  //         totalItems: totalUsers,
  //         totalPages: totalPages,
  //         currentPage: page,
  //         itemsPerPage: limit,
  //       },
  //     });
  //   } catch (error) {
  //     console.error("Error fetching user list:", error);
  //     return res.status(500).json({
  //       status: false,
  //       message: "Internal Server Error",
  //       error: error.message,
  //     });
  //   }
  // },

  getUserList: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const returnAllIds = req.query.all === "true";

      const typeParam = req.params.type;
      console.log("User type:", typeParam);
      let typeFilter = {};

      if (typeParam === "all") {
        typeFilter.type = { $in: ["USER", "SELLER", "DRIVER"] };
      } else if (typeParam === "users") {
        typeFilter.type = "USER";
      } else if (typeParam === "sellers") {
        typeFilter.type = "SELLER";
      } else if (typeParam === "drivers") {
        typeFilter.type = "DRIVER";
      } else {
        typeFilter.type = typeParam;
      }

      if (returnAllIds) {
        const allUsers = await User.find(typeFilter).select("_id");
        return res.status(200).json({
          status: true,
          allUserIds: allUsers.map((u) => u._id),
        });
      }

      const users = await User.find(typeFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const indexedUser = users.map((item, index) => ({
        ...(item.toObject?.() || item),
        indexNo: skip + index + 1,
      }));

      const totalUsers = await User.countDocuments(typeFilter);
      const totalPages = Math.ceil(totalUsers / limit);

      return res.status(200).json({
        status: true,
        data: indexedUser,
        pagination: {
          totalItems: totalUsers,
          totalPages,
          currentPage: page,
          itemsPerPage: limit,
        },
      });
    } catch (error) {
      console.error("Error fetching user list:", error);
      return res.status(500).json({
        status: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  },

  getSellerList: async (req, res) => {
    try {
      let page = parseInt(req.query.page) || 1;
      let limit = parseInt(req.query.limit) || 10;
      let skip = (page - 1) * limit;

      const search = req.query.search?.trim() || null;

      const matchStage = {
        type: "SELLER",
      };

      if (search) {
        const searchRegex = new RegExp(search, "i");
        matchStage.$or = [
          { name: { $regex: searchRegex } },
          { email: { $regex: searchRegex } },
          { number: { $regex: searchRegex } },
        ];
      }

      let users = await User.aggregate([
        {
          $match: matchStage,
        },
        {
          $lookup: {
            from: "stores",
            let: { userId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$userid", "$$userId"] },
                },
              },
              { $sort: { createdAt: -1 } },
              { $limit: 1 },
            ],
            as: "store",
          },
        },
        {
          $unwind: {
            path: "$store",
            preserveNullAndEmptyArrays: true,
          },
        },
      ])
        .skip(skip)
        .limit(limit);

      // Attach stats to each seller individually
      const indexedUsers = await Promise.all(
        users.map(async (user, index) => {
          const sellerId = user._id;

          const [totalOrders, totalProducts, totalEmployees, incomeTaxStats] =
            await Promise.all([
              ProductRequest.countDocuments({ seller_id: sellerId }),
              Product.countDocuments({ userid: sellerId }),
              User.countDocuments({
                type: "EMPLOYEE",
                parent_vendor_id: sellerId,
              }),
              ProductRequest.aggregate([
                {
                  $match: { seller_id: new mongoose.Types.ObjectId(sellerId) },
                },
                {
                  $group: {
                    _id: null,
                    totalIncome: { $sum: { $ifNull: ["$total", 0] } },
                    totalTax: { $sum: { $ifNull: ["$tax", 0] } },
                  },
                },
              ]),
            ]);

          const returnRefundStats = await ProductRequest.aggregate([
            { $match: { seller_id: new mongoose.Types.ObjectId(sellerId) } },
            { $unwind: "$productDetail" },
            {
              $group: {
                _id: null,
                returnedItems: {
                  $sum: {
                    $cond: ["$productDetail.returnDetails.isReturned", 1, 0],
                  },
                },
                refundedItems: {
                  $sum: {
                    $cond: ["$productDetail.returnDetails.isRefunded", 1, 0],
                  },
                },
                totalRefundAmount: {
                  $sum: {
                    $cond: [
                      "$productDetail.returnDetails.isRefunded",
                      {
                        $ifNull: [
                          "$productDetail.returnDetails.refundAmount",
                          0,
                        ],
                      },
                      0,
                    ],
                  },
                },
              },
            },
          ]);

          const stats = {
            totalOrders,
            totalProducts,
            totalEmployees,
            returnedItems: returnRefundStats[0]?.returnedItems || 0,
            refundedItems: returnRefundStats[0]?.refundedItems || 0,
            totalRefundAmount: returnRefundStats[0]?.totalRefundAmount || 0,
            totalIncome: incomeTaxStats[0]?.totalIncome || 0,
            totalTax: incomeTaxStats[0]?.totalTax || 0,
          };

          return {
            ...(user.toObject?.() || user),
            indexNo: skip + index + 1,
            stats,
          };
        })
      );

      const totalUsers = await User.countDocuments({ type: "SELLER" });
      const totalPages = Math.ceil(totalUsers / limit);

      return res.status(200).json({
        status: true,
        data: indexedUsers,
        pagination: {
          totalItems: totalUsers,
          totalPages,
          currentPage: page,
          itemsPerPage: limit,
        },
      });
    } catch (error) {
      console.error("Error in getSellerList:", error);
      return response.error(res, error);
    }
  },

  getDriverList: async (req, res) => {
    try {
      const { type } = req.query;
      if (type && type !== "DRIVER") {
        return res.status(400).json({
          success: false,
          message: "Invalid type. Only 'DRIVER' is allowed.",
        });
      }

      let page = parseInt(req.query.page) || 1; // For example, page 1
      let limit = parseInt(req.query.limit) || 10; // For example, 10 items per page
      let skip = (page - 1) * limit; // Calculate the number of items to skip

      const drivers = await User.find({ type: "DRIVER" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const indexedDrivers = drivers.map((item, index) => ({
        ...(item.toObject?.() || item),
        indexNo: skip + index + 1,
      }));

      const totalDrivers = await User.countDocuments({ type: "DRIVER" }); // Get the total number of drivers
      const totalPages = Math.ceil(totalDrivers / limit); // Calculate total pages

      // return response.ok(res, drivers);
      return res.status(200).json({
        status: true,
        data: indexedDrivers,
        pagination: {
          totalItems: totalDrivers,
          totalPages: totalPages,
          currentPage: page,
          itemsPerPage: limit,
        },
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateStatus: async (req, res) => {
    try {
      const payload = req?.body || {};
      let driver = await User.findByIdAndUpdate(payload?.id, payload, {
        new: true,
        upsert: true,
      });
      return response.ok(res, driver);
    } catch (error) {
      return response.error(res, error);
    }
  },

  notification: async (req, res) => {
    try {
      let notifications = await Notification.find({ for: req.user.id })
        .populate({
          path: "invited_for",
          populate: { path: "job" },
        })
        .lean();
      return response.ok(res, { notifications });
    } catch (error) {
      return response.error(res, error);
    }
  },
  updateSettings: async (req, res) => {
    try {
      await User.findByIdAndUpdate(req.user.id, { $set: req.body });
      return response.ok(res, { message: "Settings updated." });
    } catch (error) {
      return response.error(res, error);
    }
  },
  getSettings: async (req, res) => {
    try {
      const settings = await User.findById(req.user.id, {
        notification: 1,
        distance: 1,
      });
      return response.ok(res, { settings });
    } catch (error) {
      return response.error(res, error);
    }
  },

  allOrganization: async (req, res) => {
    try {
      const users = await userHelper.findAll({ isOrganization: true }).lean();
      return response.ok(res, { users });
    } catch (error) {
      return response.error(res, error);
    }
  },

  guardListSearch: async (req, res) => {
    try {
      const cond = {
        type: "PROVIDER",
        $or: [
          { username: { $regex: req.body.search } },
          { email: { $regex: req.body.search } },
        ],
      };
      let guards = await User.find(cond).lean();
      return response.ok(res, { guards });
    } catch (error) {
      return response.error(res, error);
    }
  },

  verifyGuard: async (req, res) => {
    try {
      await User.updateOne(
        { email: req.body.email },
        { $set: { verified: req.body.verified } }
      );
      return response.ok(res, {
        message: req.body.verified ? "Guard Verified." : "Guard Suspended.",
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getStaffList: async (req, res) => {
    try {
      //let cond = { type: 'PROVIDER'};
      let guards = await User.find({ type: "PROVIDER" }, { username: 1 });
      return response.ok(res, { guards });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getProfile: async (req, res) => {
    try {
      const u = await User.findById(req.user.id, "-password");
      return response.ok(res, u);
    } catch (error) {
      return response.error(res, error);
    }
  },
  updateProfile: async (req, res) => {
    const payload = req.body;
    const userId = req?.body?.userId || req.user.id;
    try {
      // const data = await User.findByIdAndUpdate(userId, payload, { new: true, upsert: true })
      // return response.ok(res, data);
      // let userDetail = await User.findById(userId);
      // console.log(userDetail.number, req.body.number)
      // if (req.body.number && userDetail.number !== req.body.number && !req.body.otp) {
      //   let u = await User.findOne({ number: req.body.number });
      //   if (u) {
      //     return response.conflict(res, { message: "Phone Number already exist." });
      //   }
      //   // await sendOtp.sendOtp(req.body.phone)
      //   // let ran_otp = Math.floor(1000 + Math.random() * 9000);
      //   let ran_otp = '0000';
      //   // const data = req.body;
      //   const newPoll = new Verification({
      //     phone: req.body.phone,
      //     otp: ran_otp,
      //     expiration_at: userHelper.getDatewithAddedMinutes(5),
      //   });
      //   await newPoll.save();
      //   return response.ok(res, { otp: true, message: "OTP sent to your phone number" });
      // } else {
      // if (payload.otp) {
      //   let ver = await Verification.findOne({ phone: payload.phone });
      //   console.log(ver)
      //   if (payload.otp === ver.otp &&
      //     !ver.verified &&
      //     new Date().getTime() < new Date(ver.expiration_at).getTime()) {
      //     const u = await User.findByIdAndUpdate(
      //       userId,
      //       { $set: payload },
      //       {
      //         new: true,
      //         upsert: true,
      //       }
      //     );
      //     // let token = await new jwtService().createJwtToken({
      //     //   id: u._id,
      //     //   type: u.type,
      //     // });
      //     const data = {
      //       // token,
      //       ...u._doc,
      //     };
      //     delete data.password;
      //     await Verification.findOneAndDelete({ phone: payload.phone });
      //     return response.ok(res, data);

      //   } else {
      //     return res.status(404).json({ success: false, message: "Invalid OTP" });
      //   }
      // } else {

      // if (req.query.for === 'bankdetail') {
      //   let user = await User.findById(userId)
      //   const accountdata = await addAccount(user, payload)
      //   if (accountdata.status) {
      //     user.razorpay_bankaccount_id = accountdata.data.id
      //     if (accountdata.storeContactid) {
      //       user.razorpay_contact_id = accountdata.data.contact_id
      //     }
      //     await user.save();
      //   }
      // }

      // For confirmation through email umcomment it
      // const user = await User.findById(userId);
      // if (!user) return response.error(res, "User not found");

      // const pendingChanges = {};

      // if (payload.email && payload.email !== user.email) {
      //   pendingChanges.email = payload.email;
      // }

      // if (payload.password) {
      //   pendingChanges.password = payload.password;
      // }

      // if (Object.keys(pendingChanges).length > 0) {
      //   const token = jwt.sign(
      //     { userId, changes: pendingChanges },
      //     process.env.SECRET,
      //     { expiresIn: "15m" }
      //   );

      //   const confirmUrl = `${process.env.APP_URL}/confirm-update?token=${token}`;

      //   await mailNotification.updateMail({
      //     email: user.email,
      //     confirmUrl,
      //   });

      //   return response.ok(res, {
      //     message:
      //       "Confirmation email sent. Please verify to complete the update.",
      //   });
      // }

      const u = await User.findByIdAndUpdate(
        userId,
        { $set: payload },
        {
          new: true,
          upsert: true,
        }
      );

      let token = await new jwtService().createJwtToken({
        id: u._id,
        type: u.type,
      });
      const data = {
        token,
        ...u._doc,
      };
      delete data.password;
      // await Verification.findOneAndDelete({ phone: payload.phone });

      await mailNotification.updateUser({
        email: u.email,
        name: u.username,
      });

      // return response.ok(res, {
      //   message:
      //     "Confirmation email sent. Please verify to complete the update.",
      //   data,
      // });
      return response.ok(res, {
        message: "Profile updated.",
        data,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  fileUpload: async (req, res) => {
    try {
      let key = req.file && req.file.key;
      return response.ok(res, {
        message: "File uploaded.",
        file: `${process.env.ASSET_ROOT}/${key}`,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  createGetInTouch: async (req, res) => {
    try {
      const payload = req.body;
      let getintouch = new Getintouch(payload);
      // await mailNotification.supportmail(payload)
      const blg = await getintouch.save();
      return response.ok(res, blg);
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateGetInTouch: async (req, res) => {
    try {
      const { id } = req.params;
      const status = req.body.status;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return response.badReq(res, { message: "Invalid or missing ID." });
      }
      const updated = await Getintouch.findByIdAndUpdate(
        id,
        { read: true, status },
        { new: true }
      );
      if (!updated) {
        return response.notFound(res, {
          message: "GetInTouch entry not found.",
        });
      }
      return response.ok(res, { message: "read", data: updated });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getGetInTouch: async (req, res) => {
    try {
      let cond = {};
      if (req.body.curDate) {
        const newEt = new Date(
          new Date(req.body.curDate).setDate(
            new Date(req.body.curDate).getDate() + 1
          )
        );
        cond.createdAt = { $gte: new Date(req.body.curDate), $lte: newEt };
      }

      if (req.body.status) {
        cond.status = req.body.status;
      }

      console.log("condition", cond);

      let page = parseInt(req.query.page) || 1; // For example, page 1
      let limit = parseInt(req.query.limit) || 10; // For example, 10 items per page
      let skip = (page - 1) * limit; // Calculate the number of items to skip

      let blog = await Getintouch.find(cond)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const indexedBlog = blog.map((item, index) => ({
        ...(item.toObject?.() || item),
        indexNo: skip + index + 1,
      }));

      const totalBlogs = await Getintouch.countDocuments(cond); // Get the total number of blogs
      const totalPages = Math.ceil(totalBlogs / limit); // Calculate total pages

      // return response.ok(res, blog);
      return res.status(200).json({
        status: true,
        data: indexedBlog,
        pagination: {
          totalItems: totalBlogs,
          totalPages: totalPages,
          currentPage: page,
          itemsPerPage: limit,
        },
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  deleteGetInTouch: async (req, res) => {
    try {
      let blog = await Getintouch.findByIdAndDelete(req.params.id);
      return response.ok(res, { message: "Deleted successfully" });
    } catch (error) {
      return response.error(res, error);
    }
  },
  addNewsLetter: async (req, res) => {
    try {
      const payload = req?.body || {};
      const u = await Newsletter.find(payload);
      if (u.length > 0) {
        return response.conflict(res, {
          message: "Email already exists.",
        });
      } else {
        let news = new Newsletter(payload);
        const newsl = await news.save();
        return response.ok(res, { message: "Subscribed successfully" });
      }
    } catch (error) {
      return response.error(res, error);
    }
  },

  getNewsLetter: async (req, res) => {
    try {
      let news = await Newsletter.find();
      return response.ok(res, news);
    } catch (error) {
      return response.error(res, error);
    }
  },

  DeleteNewsLetter: async (req, res) => {
    try {
      let news = await Newsletter.findByIdAndDelete(req.body.id);
      return response.ok(res, { message: "Deleted successfully" });
    } catch (error) {
      return response.error(res, error);
    }
  },

  giverate: async (req, res) => {
    console.log(req.body);
    try {
      let payload = req.body;
      const re = await Review.findOne({
        product: payload.product,
        posted_by: req.user.id,
      });
      if (re) {
        re.description = payload.description;
        re.rating = payload.rating;
        await re.save();
      } else {
        payload.posted_by = req.user.id;
        const u = new Review(payload);
        await u.save();
      }

      return response.ok(res, { message: "successfully" });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getReview: async (req, res) => {
    try {
      const cond = {};
      if (req.params.id) {
        cond.user = req.params.id;
      }
      const allreview = await Review.find(cond).populate(
        "posted_by user",
        "-password"
      );
      res.status(200).json({
        success: true,
        data: allreview,
      });
      // });
    } catch (e) {
      return res.status(500).json({
        success: false,
        message: e.message,
      });
    }
  },

  getShippingAddress: async (req, res) => {
    try {
      const userId = req.user?.id || req.params.id;
      const user = await User.findById(userId);

      if (!user) {
        return response.notFound(res, "User not found");
      }

      return response.ok(res, user.shipping_address);
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateShippingAddress: async (req, res) => {
    try {
      const payload = req.body;
      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { shiping_address: payload },
        { new: true, runValidators: true }
      );
      if (!updatedUser) {
        return response.error(res, { message: "User not found" });
      }
      return response.ok(res, {
        message: "Shipping address updated successfully.",
        shiping_address: updatedUser.shiping_address,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },
  driverupdatelocation: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      user.currentlocation = req?.body?.track;
      await user.save();
      return response.ok(res, user);
    } catch (error) {
      return response.error(res, error);
    }
  },
  getdriverlocation: async (req, res) => {
    try {
      const user = await User.findById(req.params.id, "-password");
      return response.ok(res, user);
    } catch (error) {
      return response.error(res, error);
    }
  },
  // tax controller
  getTax: async (req, res) => {
    try {
      const taxes = await Tax.find();
      if (!taxes || taxes?.length === 0) {
        return response.notFound(res, { message: "No tax found" });
      }
      return response.ok(res, taxes);
    } catch (error) {
      return response.error(res, error);
    }
  },
  addOrUpdateTax: async (req, res) => {
    try {
      const payload = req.body;

      const updatedTax = await Tax.findOneAndUpdate(
        // { userId: payload.userId },
        {},
        payload,
        { new: true, upsert: true, runValidators: true }
      );

      return response.ok(res, {
        message: "Tax updated successfully.",
        // message: updatedTax ? "Tax updated successfully." : "Tax added successfully.",
        data: updatedTax,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  // Employee creation by vendor
  createEmployee: async (req, res) => {
    try {
      const payload = req.body;
      const vendorId = req.user.id;
      const user = await User.findById(vendorId);
      if (!user) {
        return response.notFound(res, { message: "Vendor not found" });
      }
      const existingEmployee = await User.findOne({
        email: payload.email,
        type: "EMPLOYEE",
      });

      if (existingEmployee) {
        return response.conflict(res, { message: "Employee already exists" });
      }

      const employee = new User({
        ...payload,
        type: "EMPLOYEE",
        parent_vendor_id: vendorId,
      });

      employee.password = employee.encryptPassword(payload.password);
      await employee.save();
      return response.ok(res, { message: "Employee created successfully" });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getEmployeeList: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const returnAllIds = req.query.all === "true";

      if (returnAllIds) {
        const allEmployees = await User.find({
          type: "EMPLOYEE",
          parent_vendor_id: req.user.id,
        }).select("_id username");
        if (!allEmployees || allEmployees.length === 0) {
          return response.notFound(res, { message: "No employees found" });
        }
        return res.status(200).json({
          status: true,
          data: allEmployees,
        });
      }

      const vendorId = req.user.id;
      const employees = await User.find({
        type: "EMPLOYEE",
        parent_vendor_id: vendorId,
      })
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const indexedEmployees = employees.map((item, index) => ({
        ...(item.toObject?.() || item),
        indexNo: skip + index + 1,
      }));

      const totalEmployees = await User.countDocuments({
        type: "EMPLOYEE",
        parent_vendor_id: vendorId,
      });

      const totalPages = Math.ceil(totalEmployees / limit);
      return res.status(200).json({
        status: true,
        data: indexedEmployees,
        pagination: {
          totalItems: totalEmployees,
          totalPages: totalPages,
          currentPage: page,
          itemsPerPage: limit,
        },
      });
      // return response.ok(res, employees);
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateEmployee: async (req, res) => {
    try {
      const payload = req.body;
      const employeeId = req.body.id;
      const updatedEmployee = await User.findByIdAndUpdate(
        employeeId,
        payload,
        { new: true, runValidators: true }
      );

      if (!updatedEmployee) {
        return response.notFound(res, { message: "Employee not found" });
      }

      return response.ok(res, { message: "Employee updated successfully" });
    } catch (error) {
      return response.error(res, error);
    }
  },

  deleteEmployee: async (req, res) => {
    try {
      const employeeId = req.params.id;
      let vendorId;

      if (req.user.type === "ADMIN"){
        vendorId = req.body.vendor
      } else {
        vendorId = req.user.id
      }

      const employee = await User.findById(employeeId);

      if (!employee) {
        return response.notFound(res, { message: "Employee not found" });
      }

      if (
        !employee.parent_vendor_id ||
        employee.parent_vendor_id.toString() !== vendorId
      ) {
        return response.error(res, { message: "Unauthorized" });
      }

      await employee.deleteOne();

      return response.ok(res, { message: "Employee deleted successfully" });
    } catch (error) {
      console.log(error)
      return response.error(res, error);
    }
  },

  getEmployeeById: async (req, res) => {
    try {
      const employeeId = req.params.id;
      const employee = await User.findById(employeeId).select("-password");

      if (!employee) {
        return response.notFound(res, { message: "Employee not found" });
      }

      return response.ok(res, employee);
    } catch (error) {
      return response.error(res, error);
    }
  },

  loginEmployee: async (req, res) => {
    passport.authenticate("local", async (err, user, info) => {
      if (err) {
        return response.error(res, err);
      }
      if (!user) {
        return response.unAuthorize(res, info);
      }
      let token = await new jwtService().createJwtToken({
        id: user._id,
        // user: user.fullName,
        type: user.type,
        tokenVersion: new Date(),
      });
      await Device.updateOne(
        { device_token: req.body.device_token },
        { $set: { player_id: req.body.player_id, user: user._id } },
        { upsert: true }
      );
      await user.save();
      let data = {
        token,
        ...user._doc,
      };
      // if (user.type === "SELLER") {
      //   let store = await Store.findOne({ userid: user._id });
      //   data.store = store;
      // }
      delete data.password;
      return response.ok(res, { ...data });
    })(req, res);
  },

  // Send employee to admin by vendor details
  getSellerEmployeeByAdmin: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      let matchStage  = {type:"EMPLOYEE"};

      if (req.query.curDate) {
        const newEt = new Date(
          new Date(req.query.curDate).setDate(
            new Date(req.query.curDate).getDate() + 1
          )
        );
        matchStage.createdAt = { $gte: new Date(req.query.curDate), $lte: newEt };
      }   

      const search = req.query.search?.trim() || null;

      const pipeline = [
        {
          $match: matchStage,
        },
        {
          $lookup: {
            from: "users",
            localField: "parent_vendor_id",
            foreignField: "_id",
            as: "parent_vendor",
          },
        },
        {
          $unwind: "$parent_vendor",
        },
      ];
      
      // Add search condition
      if (search) {
        const searchRegex = new RegExp(search, "i");
        pipeline.push({
          $match: {
            $or: [
              { name: { $regex: searchRegex } },
              { "parent_vendor.username": { $regex: searchRegex } },
            ],
          },
        });
      }
      
      pipeline.push(
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            password: 0,
            "parent_vendor.password": 0,
          },
        }
      );
      
      const employees = await User.aggregate(pipeline);

      const indexedEmployees = employees.map((item, index) => ({
        ...(item.toObject?.() || item),
        indexNo: skip + index + 1,
      }));

      // const totalEmployees = await User.countDocuments({
      //   type: "EMPLOYEE",
      //   parent_vendor_id: req.params.id,
      // });

      const totalEmployees = await User.countDocuments(matchStage);

      const totalPages = Math.ceil(totalEmployees / limit);
      return res.status(200).json({
        status: true,
        data: indexedEmployees,
        pagination: {
          totalItems: totalEmployees,
          totalPages: totalPages,
          currentPage: page,
          itemsPerPage: limit,
        },
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getDashboardStats: async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId).select("-password");

      if (!user) {
        return response.notFound(res, { message: "User not found" });
      }

      let stats;

      if (user.type === "ADMIN") {
        // Admin gets global stats
        stats = {
          totalVendors: await User.countDocuments({ type: "VENDOR" }),
          totalEmployees: await User.countDocuments({ type: "EMPLOYEE" }),
          totalCustomers: await User.countDocuments({ type: "USER" }),
          totalOrders: await Order.countDocuments(),
          totalProducts: await Product.countDocuments(),
        };
      } else if (user.type === "VENDOR") {
        // Vendor sees their own stats
        stats = {
          totalEmployees: await User.countDocuments({
            type: "EMPLOYEE",
            parent_vendor_id: userId,
          }),
          totalOrders: await Order.countDocuments({ vendor_id: userId }),
          totalProducts: await Product.countDocuments({ vendor_id: userId }),
          totalCustomers: await User.countDocuments({
            type: "USER",
            parent_vendor_id: userId,
          }),
        };
      } else {
        return response.unAuthorize(res, {
          message: "Unauthorized access to dashboard stats",
        });
      }

      return response.ok(res, stats);
    } catch (error) {
      return response.error(res, error);
    }
  },
  getSellerStats: async (req, res) => {
    try {
      const { sellerId } = req.params;

      const seller = await User.findById(sellerId).select(
        "_id username email number type status"
      );

      const totalOrders = await ProductRequest.countDocuments({
        seller_id: sellerId,
      });
      const totalProducts = await Product.countDocuments({ userid: sellerId });
      const totalEmployees = await User.countDocuments({
        type: "EMPLOYEE",
        parent_vendor_id: sellerId,
      });

      // Aggregate for returned items, refunded items, and total refund amount
      const returnRefundStats = await ProductRequest.aggregate([
        { $match: { seller_id: new mongoose.Types.ObjectId(sellerId) } },
        { $unwind: "$productDetail" },
        {
          $group: {
            _id: null,
            returnedItems: {
              $sum: {
                $cond: ["$productDetail.returnDetails.isReturned", 1, 0],
              },
            },
            refundedItems: {
              $sum: {
                $cond: ["$productDetail.returnDetails.isRefunded", 1, 0],
              },
            },
            totalRefundAmount: {
              $sum: {
                $cond: [
                  "$productDetail.returnDetails.isRefunded",
                  { $ifNull: ["$productDetail.returnDetails.refundAmount", 0] },
                  0,
                ],
              },
            },
          },
        },
      ]);

      const stats = {
        sellerInfo: seller,
        totalOrders,
        totalProducts,
        totalEmployees,
        returnedItems: returnRefundStats[0]?.returnedItems || 0,
        refundedItems: returnRefundStats[0]?.refundedItems || 0,
        totalRefundAmount: returnRefundStats[0]?.totalRefundAmount || 0,
      };

      return response.ok(res, stats);
    } catch (error) {
      console.error("Error in getSellerStats:", error);
      return response.error(res, error);
    }
  },
  exportDetailedSellerReport: async (req, res) => {
    try {
      const { reportTypes = [] } = req.body;
      console.log("reportTypes", reportTypes);
      const { id } = req.body;

      const sellers = await User.findById(id).select(
        "_id username email number type status"
      );

      if (!reportTypes || reportTypes.length === 0) {
        return res
          .status(400)
          .json({ status: false, message: "No report types provided" });
      }
      const workbook = new ExcelJS.Workbook();

      // Sheet 0: Seller Products
      if (reportTypes.includes("Products")) {
        const productSheet = workbook.addWorksheet("Seller Products");
        productSheet.columns = [
          { header: "Seller Name", key: "sellerName", width: 25 },
          { header: "Product Name", key: "productName", width: 30 },
          { header: "Category", key: "category", width: 20 },
          { header: "Manufacturer", key: "manufacturer", width: 20 },
          { header: "Expiry Date", key: "expiryDate", width: 15 },
          { header: "Product Image", key: "productImage", width: 20 },
          { header: "Sold Pieces", key: "soldPieces", width: 15 },
          // price slot will be array
          { header: "Price Slot", key: "priceSlot", width: 30 },
        ];

        const sellerProducts = await Product.find({
          userid: id,
        });

        sellerProducts.forEach((item) => {
          productSheet.addRow({
            sellerName: sellers.username,
            productName: item?.name || "Unknown Product",
            category: item?.categoryName || "Unknown Category",
            manufacturer: `${item?.manufacturername || ""}, ${
              item?.manufactureradd || ""
            }`,
            expiryDate: item?.expirydate?.toISOString().split("T")[0] || "N/A",
            productImage: item?.image || "N/A",
            soldPieces: item?.sold_pieces || 0,
            priceSlot: item?.price_slot && item.price_slot.length
            ? item.price_slot.map((slot) => {
                return `Qty: ${slot.value}${slot.unit}, Price: ${slot.our_price}, Other Price: ${slot.other_price}`;
              }).join(" | ")
            : "N/A",
          });
        });
      }

      // Sheet 1: Seller Orderse
      if (reportTypes.includes("Orders")) {
        const orderSheet = workbook.addWorksheet("Seller Order");
        orderSheet.columns = [
          { header: "Seller Name", key: "sellerName", width: 25 },
          { header: "Customer Name", key: "customerName", width: 25 },
          { header: "Customer Email", key: "email", width: 30 },
          { header: "Customer Phone", key: "number", width: 20 },
          { header: "Product Name", key: "productName", width: 30 },
          { header: "Category", key: "category", width: 20 },
          { header: "Price", key: "price", width: 15 },
          { header: "Quantity", key: "qty", width: 10 },
          // { header: "Total", key: "total", width: 15 },
        ];

        const sellerProducts = await ProductRequest.find({
          seller_id: id,
        })
          .populate("productDetail.product")
          .populate("user", "username email number");

        sellerProducts.forEach((order) => {
          order.productDetail.forEach((item) => {
            orderSheet.addRow({
              sellerName: sellers.username,
              customerName: order.user?.username || "",
              email: order.user?.email || "",
              number: order.user?.number || "",
              productName: item.product?.name || "Unknown Product",
              category: item.product?.categoryName || "Unknown Category",
              price: item.price,
              qty: item.qty,
              // total: item.total,
            });
          });
        });
      }

      // Sheet 2: Seller Employees
      if (reportTypes.includes("Employees")) {
        const employeeSheet = workbook.addWorksheet("Seller Employees");
        employeeSheet.columns = [
          { header: "Seller Name", key: "sellerName", width: 25 },
          { header: "Employee Name", key: "employeeName", width: 25 },
          { header: "Email", key: "email", width: 30 },
          { header: "Mobile", key: "number", width: 20 },
        ];

        const employees = await User.find({
          parent_vendor_id: id,
          type: "EMPLOYEE",
        });

        employees.forEach((emp) => {
          employeeSheet.addRow({
            sellerName: sellers.username,
            employeeName: emp.username,
            email: emp.email,
            number: emp.number,
          });
        });
      }

      // Sheet 3: Returned Items
      if (reportTypes.includes("Returns") || reportTypes.includes("Refunds")) {
        const returnSheet = workbook.addWorksheet("Returned Items");
        returnSheet.columns = [
          { header: "Seller Name", key: "sellerName", width: 25 },
          { header: "Customer Name", key: "customerName", width: 25 },
          { header: "Customer Email", key: "email", width: 30 },
          { header: "Customer Phone", key: "number", width: 20 },
          { header: "Product Name", key: "productName", width: 30 },
          { header: "Reason", key: "reason", width: 30 },
          { header: "Refund Amount", key: "refundAmount", width: 20 },
          { header: "Returned", key: "isReturned", width: 15 },
          { header: "Refunded", key: "isRefunded", width: 15 },
        ];

        const returns = await ProductRequest.find({ seller_id: id })
          .populate("user")
          .populate("productDetail.product");

        returns.forEach((order) => {
          order.productDetail.forEach((item) => {
            if (
              item.returnDetails?.isReturned ||
              item.returnDetails?.isRefunded
            ) {
              returnSheet.addRow({
                sellerName: sellers.username,
                customerName: order.user?.username || "",
                email: order.user?.email || "",
                number: order.user?.number || "",
                productName: item.product?.title || "Unknown Product",
                reason: item.returnDetails?.reason || "",
                refundAmount: item.returnDetails?.refundAmount || 0,
                isReturned: item.returnDetails?.isReturned ? "Yes" : "No",
                isRefunded: item.returnDetails?.isRefunded ? "Yes" : "No",
              });
            }
          });
        });
      }

      // Loop through sellers and populate sheets
      // for (const seller of sellers) {
      //   const sellerName = seller.username;

      //   // 1. Seller Items
      //   if (reportTypes.includes("Orders")) {
      //     const sellerProducts = await ProductRequest.find({
      //       seller_id: seller._id,
      //     }).populate("productDetail.product");

      //     sellerProducts.forEach((order) => {
      //       order.productDetail.forEach((item) => {
      //         orderSheet.addRow({
      //           sellerName,
      //           productName: item.product?.name || "Unknown Product",
      //           category: item.product?.categoryName || "Unknown Category",
      //           price: item.price,
      //           qty: item.qty,
      //           total: item.total,
      //         });
      //       });
      //     });
      //   }

      //   // 2. Seller Employees
      //   const employees = await User.find({
      //     parent_vendor_id: seller._id,
      //     type: "EMPLOYEE",
      //   });
      //   employees.forEach((emp) => {
      //     employeeSheet.addRow({
      //       sellerName,
      //       employeeName: emp.username,
      //       email: emp.email,
      //       number: emp.number,
      //     });
      //   });

      //   // 3. Returned Items
      //   const returnedOrders = await ProductRequest.find({
      //     seller_id: seller._id,
      //   })
      //     .populate("user")
      //     .populate("productDetail.product");

      //   returnedOrders.forEach((order) => {
      //     order.productDetail.forEach((item) => {
      //       if (
      //         item.returnDetails?.isReturned ||
      //         item.returnDetails?.isRefunded
      //       ) {
      //         returnSheet.addRow({
      //           sellerName,
      //           customerName: order.user?.username || "",
      //           email: order.user?.email || "",
      //           number: order.user?.number || "",
      //           productName: item.product?.title || "Unknown Product",
      //           reason: item.returnDetails?.reason || "",
      //           refundAmount: item.returnDetails?.refundAmount || 0,
      //           isReturned: item.returnDetails?.isReturned ? "Yes" : "No",
      //           isRefunded: item.returnDetails?.isRefunded ? "Yes" : "No",
      //         });
      //       }
      //     });
      //   });
      // }

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=detailed-seller-report.xlsx"
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("Export error:", error);
      return res
        .status(500)
        .json({ status: false, message: "Export failed", error });
    }
  },

  exportAllSellerReport: async (req, res) => {
    try {
      const { reportTypes = [] } = req.body;
      const { id } = req.body;

      if (!reportTypes || reportTypes.length === 0) {
        return res
          .status(400)
          .json({ status: false, message: "No report types provided" });
      }
      const sellers = await User.find({ type: "SELLER" });

      const workbook = new ExcelJS.Workbook();

      // Sheet 1: Seller Orderse
      if (reportTypes.includes("Orders")) {
        const orderSheet = workbook.addWorksheet("Seller Order");
        orderSheet.columns = [
          { header: "Seller Name", key: "sellerName", width: 25 },
          { header: "Product Name", key: "productName", width: 30 },
          { header: "Category", key: "category", width: 20 },
          { header: "Price", key: "price", width: 15 },
          { header: "Quantity", key: "qty", width: 10 },
          { header: "Total", key: "total", width: 15 },
        ];
      }

      // Sheet 2: Seller Employees
      const employeeSheet = workbook.addWorksheet("Seller Employees");
      employeeSheet.columns = [
        { header: "Seller Name", key: "sellerName", width: 25 },
        { header: "Employee Name", key: "employeeName", width: 25 },
        { header: "Email", key: "email", width: 30 },
        { header: "Mobile", key: "number", width: 20 },
      ];

      // Sheet 3: Returned Items
      const returnSheet = workbook.addWorksheet("Returned Items");
      returnSheet.columns = [
        { header: "Seller Name", key: "sellerName", width: 25 },
        { header: "Customer Name", key: "customerName", width: 25 },
        { header: "Customer Email", key: "email", width: 30 },
        { header: "Customer Phone", key: "number", width: 20 },
        { header: "Product Name", key: "productName", width: 30 },
        { header: "Reason", key: "reason", width: 30 },
        { header: "Refund Amount", key: "refundAmount", width: 20 },
        { header: "Returned", key: "isReturned", width: 15 },
        { header: "Refunded", key: "isRefunded", width: 15 },
      ];

      // Loop through sellers and populate sheets
      for (const seller of sellers) {
        const sellerName = seller.username;

        // 1. Seller Items
        if (reportTypes.includes("Orders")) {
          const sellerProducts = await ProductRequest.find({
            seller_id: seller._id,
          }).populate("productDetail.product");

          sellerProducts.forEach((order) => {
            order.productDetail.forEach((item) => {
              orderSheet.addRow({
                sellerName,
                productName: item.product?.name || "Unknown Product",
                category: item.product?.categoryName || "Unknown Category",
                price: item.price,
                qty: item.qty,
                total: item.total,
              });
            });
          });
        }

        // 2. Seller Employees
        const employees = await User.find({
          parent_vendor_id: seller._id,
          type: "EMPLOYEE",
        });
        employees.forEach((emp) => {
          employeeSheet.addRow({
            sellerName,
            employeeName: emp.username,
            email: emp.email,
            number: emp.number,
          });
        });

        // 3. Returned Items
        const returnedOrders = await ProductRequest.find({
          seller_id: seller._id,
        })
          .populate("user")
          .populate("productDetail.product");

        returnedOrders.forEach((order) => {
          order.productDetail.forEach((item) => {
            if (
              item.returnDetails?.isReturned ||
              item.returnDetails?.isRefunded
            ) {
              returnSheet.addRow({
                sellerName,
                customerName: order.user?.username || "",
                email: order.user?.email || "",
                number: order.user?.number || "",
                productName: item.product?.title || "Unknown Product",
                reason: item.returnDetails?.reason || "",
                refundAmount: item.returnDetails?.refundAmount || 0,
                isReturned: item.returnDetails?.isReturned ? "Yes" : "No",
                isRefunded: item.returnDetails?.isRefunded ? "Yes" : "No",
              });
            }
          });
        });
      }

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=detailed-seller-report.xlsx"
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("Export error:", error);
      return res
        .status(500)
        .json({ status: false, message: "Export failed", error });
    }
  },
};
