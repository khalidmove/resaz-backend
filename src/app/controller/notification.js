const mongoose = require("mongoose");
const Notification = mongoose.model('Notification');

module.exports = {

    createNotification: async (req, res) => {
        try {
            const usertype = req.body.userType;
            const notification = req.body.notification;
            // Create blogs in db

            const notify = new Notification({
                userType: usertype,
                notification: notification,

                // posteddate: new Date()
            })
            const noti = await notify.save();
            return res.status(201).json({
                success: true,
                message: 'Data Saved successfully!',
                data: noti
            })
        } catch (e) {
            return res.status(500).json({
                success: false,
                message: e.message
            });
        }
    },

    getNotification: async (req, res) => {
        try {
            if (req && req.body && req.body.role == 'ADMIN') { //How this line is working need to ask from chetan
                const notifications = await Notification.find({});

                res.status(200).json({
                    success: true,
                    message: 'Fetched all notification successfully',
                    notificationList: notifications
                })
            } else {
                const notifications = await Notification.find({ $or: [{ userType: "All" }, { userType: req.body.userType }] });
                res.status(200).json({
                    success: true,
                    message: 'Fetched all notification successfully',
                    notificationList: notifications
                })
            }

        } catch (e) {
            return res.status(500).json({
                success: false,
                message: e.message
            });
        }
    },

    deletenotification: async (req, res) => {
        try {
            // if (req) {
            //     if (req.body.notificationId) {
            //         const notificationID = req.body.notificationId;
            //         await Notification.deleteOne({ _id: notificationID });
            //         res.status(200).json({
            //             success: true,
            //             message: "Notification Deleted Successfuly!!",
            //         })
            //     } else {
            //         res.status(404).json({
            //             success: false,
            //             message: "Not found notificationId",
            //         })
            //     }
            // } else {
            await Notification.deleteMany({});
            res.status(200).json({
                success: true,
                message: "Notification Deleted Successfuly!!",
            })
            // }

        } catch (e) {
            return res.status(500).json({
                success: false,
                message: e.message
            });
        }
    }

}