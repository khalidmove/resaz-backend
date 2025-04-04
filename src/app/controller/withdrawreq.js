const mongoose = require("mongoose");
const Withdrawreq = mongoose.model("Withdrawreq");
const response = require("./../responses");
const User = mongoose.model("User");

module.exports = {
  createWithdrawreq: async (req, res) => {
    try {
      req.body.request_by = req.user.id;
      const notify = new Withdrawreq(req.body);
      const noti = await notify.save();
      return response.ok(res, noti);
    } catch (e) {
      return response.error(res, error);
    }
  },

  getWithdrawreq: async (req, res) => {
    try {
      // Pagination
      let page = parseInt(req.query.page) || 1; // For example, page 1
      let limit = parseInt(req.query.limit) || 10; // For example, 10 items per page
      let skip = (page - 1) * limit; // Calculate the number of items to skip

      const reqlist = await Withdrawreq.find({ settle: "Pending" })
        .populate("request_by", "username number")
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
