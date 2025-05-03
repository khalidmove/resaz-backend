"use strict";
const mongoose = require("mongoose");
const TimeSlot = mongoose.model("TimeSlot");
const response = require("./../responses");

module.exports = {
    createTimeSlot: async (req, res) => {
        try {
            const { startTime, endTime } = req.body;

            // Check for overlapping time slots
            const existingSlot = await TimeSlot.findOne({
                $or: [
                    { startTime: { $lt: endTime, $gte: startTime } },
                    { endTime: { $gt: startTime, $lte: endTime } },
                    { startTime: { $lte: startTime }, endTime: { $gte: endTime } },
                ],
            });

            if (existingSlot) {
                return response.conflict(res, "Time slot overlaps with an existing slot.");
            }

            const timeSlot = new TimeSlot({ startTime, endTime });
            await timeSlot.save();
            return response.ok(res,{message: "Time slot created successfully", timeSlot});
        } catch (error) {
            console.error("Error creating time slot:", error);
            return response.error(res, {message: "Error creating time slot" });
        }
    },

    getAllTimeSlots: async () => {
        try {
            const timeSlots = await TimeSlot.find();
            return timeSlots;
        } catch (error) {
            throw new Error("Error fetching time slots: " + error.message);
        }
    },
};
