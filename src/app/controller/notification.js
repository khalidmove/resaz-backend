const mongoose = require("mongoose");
const Notification = mongoose.model('Notification');
const response = require("./../responses");

module.exports = {

    getnotification:async(req,res)=>{
        try {
            const ids=req.user.id
            const data=await Notification.find({ for: { $in: ids } }).sort({ createdAt: -1 })
            console.log('data fetched');
            return response.ok(res, data);
            // res.status(200).json(data);
        } catch (err) {
            console.log(err);
            return response.error(res, err);
            // res.status(500).json({error:'Internal Server Error'});
        }
    },

}