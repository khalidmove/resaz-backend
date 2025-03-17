const mongoose = require("mongoose");
const Withdrawreq = mongoose.model('Withdrawreq');
const response = require("./../responses");
const User = mongoose.model("User");

module.exports = {

    createWithdrawreq: async (req, res) => {
        try {
            req.body.request_by = req.user.id;
            const notify = new Withdrawreq(req.body)
            const noti = await notify.save();
            return response.ok(res, noti);
        } catch (e) {
            return response.error(res, error);
        }
    },

    getWithdrawreq: async (req, res) => {
        try {

            const reqlist = await Withdrawreq.find({settle:"Pending"}).populate("request_by",'username number');

            return response.ok(res, reqlist);

        } catch (e) {
            return response.error(res, error);
        }
    },
    getWithdrawreqbyseller: async (req, res) => {
        try {

            const reqlist = await Withdrawreq.find({request_by:req.user.id}).sort({ createdAt: -1 });
            return response.ok(res, reqlist);
        } catch (e) {
            return response.error(res, error);
        }
    },

    updateWithdrawreq: async (req, res) => {
        try {
            const payload = req?.body || {};
            const withdrawdata= await Withdrawreq.findByIdAndUpdate(payload?.id, {$set:{settle:'Completed'}});

            await User.findByIdAndUpdate(
                payload.seller_id,
                { $inc: { wallet: -withdrawdata.amount } }, // Deduct amount
                { new: true, upsert: true } // Ensure field exists
            );
            

            return response.ok(res, {message:'Status update succesfully'});
        } catch (error) {
            return response.error(res, error);
        }
    }

}