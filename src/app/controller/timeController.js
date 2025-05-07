"use strict";
const mongoose = require("mongoose");
const TimeSlot = mongoose.model("TimeSlot");
const response = require("./../responses");

function timeToMinutes(t) {
  const [time, meridian] = t.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (meridian === "PM" && hours !== 12) hours += 12;
  if (meridian === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

module.exports = {
  createTimeSlot: async (req, res) => {
    try {
      const { startTime, endTime } = req.body;

      const requestedStart = timeToMinutes(startTime);
      const requestedEnd = timeToMinutes(endTime);
      let adjustedEnd = requestedEnd;

      if (requestedEnd <= requestedStart) {
        adjustedEnd += 1440;
      }

      if (adjustedEnd === requestedStart) {
        return response.error(res, {
          message: "End time must be after start time",
        });
      }

      const isOverlapping = (slotStartStr, slotEndStr) => {
        const slotStart = timeToMinutes(slotStartStr);
        const slotEnd = timeToMinutes(slotEndStr);
        if (slotEnd <= slotStart) slotEnd += 1440;

        return slotStart < requestedEnd && slotEnd > requestedStart;
      };

      // Check for overlapping time slots
      const existingSlots = await TimeSlot.find();

      const conflict = existingSlots.find((slot) =>
        isOverlapping(slot.startTime, slot.endTime)
      );

      if (conflict) {
        return response.conflict(
          res,
          "Time slot overlaps with an existing slot."
        );
      }

      const timeSlot = new TimeSlot({ startTime, endTime });
      await timeSlot.save();
      return response.ok(res, {
        message: "Time slot created successfully",
        timeSlot,
      });
    } catch (error) {
      console.error("Error creating time slot:", error);
      return response.error(res, { message: "Error creating time slot" });
    }
  },

  getAllTimeSlots: async (req, res) => {
    try {
      const timeSlots = await TimeSlot.find();
      return response.ok(res, {
        message: "Time slots fetched successfully",
        timeSlots,
      });
    } catch (error) {
      console.error("Error fetching time slots:", error);
      return response.error(res, { message: "Error fetching time slots" });
    }
  },

  deleteTimeSlot: async (req, res) => {
    try {
      const { id } = req.params;
      const timeSlot = await TimeSlot.findByIdAndDelete(id);
      if (!timeSlot) {
        return response.notFound(res, { message: "Time slot not found" });
      }
      return response.ok(res, {
        message: "Time slot deleted successfully",
        timeSlot,
      });
    } catch (error) {
      console.error("Error deleting time slot:", error);
      return response.error(res, { message: "Error deleting time slot" });
    }
  },
};
