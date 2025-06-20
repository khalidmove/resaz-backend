const mongoose = require("mongoose");
const Withdrawreq = mongoose.model("Withdrawreq");
const response = require("./../responses");
const User = mongoose.model("User");

module.exports = {
  // createWithdrawreq: async (req, res) => {
  //   try {
  //     req.body.request_by = req.user.id;
  //     const notify = new Withdrawreq(req.body);
  //     const noti = await notify.save();
  //     return response.ok(res, noti);
  //   } catch (e) {
  //     return response.error(res, error);
  //   }
  // },
createWithdrawreq: async (req, res) => {
  try {
    const userId = req.user.id;
    const amountRequested = parseFloat(req.body.amount);

    if (isNaN(amountRequested) || amountRequested <= 0) {
      return res.status(400).json({
        status: false,
        message: "Invalid withdrawal amount.",
      });
    }

    // const halfAmount = amountRequested / 2;
    // if (halfAmount < 100) {
    //   return res.status(400).json({
    //     status: false,
    //     message: "Minimum withdrawal amount is 200, half of it is 100.",
    //   });
    // }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const existingRequest = await Withdrawreq.findOne({
      request_by: userId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existingRequest) {
      return res.status(400).json({
        status: false,
        message: "You have already made a withdrawal request today.",
      });
    }

    const user = await User.findById(userId);
    if (!user || user.wallet < amountRequested) {
      return res.status(400).json({
        status: false,
        message: "Insufficient balance for withdrawal.",
      });
    }

    const withdrawalRequest = new Withdrawreq({
      request_by: userId,
      amount: amountRequested,
      note: req.body.note || "",
      settle: "Pending",
    });

    const savedRequest = await withdrawalRequest.save();
    return response.ok(res, savedRequest);

  } catch (error) {
    console.error("Withdrawal Request Error:", error);
    return response.error(res, error.message || "An error occurred.");
  }
},

  getWithdrawreq: async (req, res) => {
    try {
      // Pagination
      let page = parseInt(req.query.page) || 1; // For example, page 1
      let limit = parseInt(req.query.limit) || 10; // For example, 10 items per page
      let skip = (page - 1) * limit; // Calculate the number of items to skip

      const reqlist = await Withdrawreq.find({ settle: "Pending" })
        .populate("request_by", "username number wallet")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const indexedList = reqlist.map((item, index) => ({
        ...item.toObject(), // Convert Mongoose document to plain object
        index: skip + index + 1,
      }));
      const totalItems = await Withdrawreq.countDocuments({
        settle: "Pending",
      });
      const totalPages = Math.ceil(totalItems / limit);

      //   return response.ok(res, reqlist);
      return res.status(200).json({
        status: true,
        data: indexedList,
        pagination: {
          totalItems: totalItems,
          totalPages: totalPages,
          currentPage: page,
          itemsPerPage: limit,
        },
      });
    } catch (e) {
      return response.error(res, error);
    }
  },
  getWithdrawreqbyseller: async (req, res) => {
    try {
      const reqlist = await Withdrawreq.find({ request_by: req.user.id }).sort({
        createdAt: -1,
      });
      return response.ok(res, reqlist);
    } catch (e) {
      return response.error(res, error);
    }
  },
  getWithdrawreqbysellerId: async (req, res) => {
    const id = req.params.id;
    const limit = parseInt(req.query.limit) || 10;
    if (!id) {
      return response.error(res, "Seller ID is required");
    }
    try {
      const reqlist = await Withdrawreq.find({ request_by: id })
        .sort({
          createdAt: -1,
        })
        .limit(limit);
      return response.ok(res, reqlist);
    } catch (e) {
      return response.error(res, error);
    }
  },

  updateWithdrawreq: async (req, res) => {
    try {
      const payload = req?.body || {};
      const withdrawdata = await Withdrawreq.findByIdAndUpdate(payload?.id, {
        $set: { settle: "Completed" },
      });

      await User.findByIdAndUpdate(
        payload.seller_id,
        { $inc: { wallet: -withdrawdata.amount } }, // Deduct amount
        { new: true, upsert: true } // Ensure field exists
      );

      return response.ok(res, { message: "Status update succesfully" });
    } catch (error) {
      return response.error(res, error);
    }
  },
};
