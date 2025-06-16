const mongoose = require("mongoose");
const response = require("./../responses");

const FlashSale = mongoose.model("FlashSale");

module.exports = {
    
  createFlashSale: async (req, res) => {
    try {
      const payload = req?.body || {};

      if (!payload.SellerId) {
        return response.error(res, {
          message: "Seller ID is required",
        });
      }

      const existingSale = await FlashSale.findOne({
        SellerId: payload.SellerId,
      });

      if (existingSale) {
        return response.error(res, {
          message:
            "A flash sale already exists for this seller. Please end it before creating a new one.",
        });
      }

      const sale = new FlashSale(payload);
      const flashSale = await sale.save();

      return response.ok(res, flashSale, {
        message: "Flash Sale added successfully",
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getFlashSale: async (req, res) => {
    try {
      const SellerId = req.query.SellerId;
      console.log(SellerId);
      if (!SellerId) {
        return response.error(res, {
          message: "Seller ID is required",
        });
      }

      const flashSales = await FlashSale.find({ SellerId }).populate(
        "products"
      );

      return response.ok(res, flashSales);
    } catch (error) {
      return response.error(res, error);
    }
  },
  deleteFlashSaleProduct: async (req, res) => {
    try {
      const { _id, SellerId } = req.body;

      if (!_id || !SellerId) {
        return res
          .status(400)
          .json({ message: "Product ID and Seller ID are required" });
      }

   
      const updatedFlashSale = await FlashSale.findOneAndUpdate(
        { SellerId }, 
        { $pull: { products: _id } }, 
        { new: true, runValidators: true }
      );

      if (!updatedFlashSale) {
        return res
          .status(404)
          .json({ message: "Flash sale not found for this seller." });
      }

      return response.ok(res, updatedFlashSale, {
        message: "Product deleted from Flash Sale successfully",
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  deleteFlashSale: async (req, res) => {
    try {
      const { SellerId } = req.query;

      if (!SellerId) {
        return res.status(400).json({ message: "Seller ID is required" });
      }

      const result = await FlashSale.deleteMany({ SellerId });

      if (result.deletedCount === 0) {
        return res.status(404).json({
          message: "No flash sales found for this seller to delete.",
        });
      }

      return response.ok(res, {
        message: "Flash sales deleted successfully for this seller",
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  endExpiredFlashSales: async () => {
    try {
      const now = new Date();
      const result = await FlashSale.deleteMany({ endDateTime: { $lt: now } });
    } catch (error) {
      console.error("Error deleting expired flash sales:", error);
    }
  },
};
