const mongoose = require("mongoose");
const Product = mongoose.model("Product");
const ProductRequest = mongoose.model("ProductRequest");
const ComboProduct = mongoose.model("ComboProduct");
const User = mongoose.model("User");
const Tax = mongoose.model("Tax");
const ServiceFee = require("../model/servicefee");
const response = require("./../responses");
const mailNotification = require("../services/mailNotification");
const { getReview } = require("../helper/user");
const { notify } = require("../services/notification");
// const { User } = require("@onesignal/node-onesignal");
const Review = mongoose.model("Review");
const Favourite = mongoose.model("Favourite");
const Category = mongoose.model("Category");
const FlashSale = mongoose.model("FlashSale");

module.exports = {
  createProduct: async (req, res) => {
    try {
      const payload = req?.body || {};
      payload.slug = payload.name
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");
      let cat = new Product(payload);
      await cat.save();
      return response.ok(res, { message: "Product added successfully" });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getProduct: async (req, res) => {
    try {
      let query = {};
      if (req.query.seller_id) {
        query.userid = req.query.seller_id;
      }

      // Pagination
      let page = parseInt(req.query.page) || 1;
      let limit = parseInt(req.query.limit) || 10;
      let skip = (page - 1) * limit;

      let products = await Product.find(query)
        .populate("category")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      let productResults = [...products];
      let totalCount = await Product.countDocuments(query);

      // Also send combo products if requested
      if (req.query.combo === "true") {
        const comboProducts = await ComboProduct.find(query)
          .populate("comboItems.product")
          .populate("userid", "-password")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);

        productResults = [...productResults, ...comboProducts];
        const comboCount = await ComboProduct.countDocuments(query);
        totalCount += comboCount;
      }

      const totalPages = Math.ceil(totalCount / limit);

      return res.status(200).json({
        status: true,
        data: productResults,
        pagination: {
          totalItems: totalCount,
          totalPages: totalPages,
          currentPage: page,
          itemsPerPage: limit,
        },
      });
    } catch (error) {
      return response.error(res, error);
    }
  },
  getProductforseller: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      // let data = {}
      // if (req.query.seller_id) {
      //     data.userid = req.query.seller_id
      // }
      let product = await Product.find({ userid: req.user.id })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },

  getSponseredProduct: async (req, res) => {
    try {
      let data = { sponsered: true };
      if (req.query.seller_id) {
        data.userid = req.query.seller_id;
      }
      let product = await Product.find(data)
        .populate("category")
        .sort({ createdAt: -1 });
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },

  getProductByslug: async (req, res) => {
    try {
      let product = await Product.findOne({ slug: req?.params?.id }).populate(
        "category",
        "name slug"
      );
      let reviews = await Review.find({ product: product._id }).populate(
        "posted_by",
        "username"
      );
      let favourite;
      if (req.query.user) {
        favourite = await Favourite.findOne({
          product: product._id,
          user: req.query.user,
        });
      }
      let d = {
        ...product._doc,
        rating: await getReview(product._id),
        reviews,
        favourite: favourite ? true : false,
      };
      return response.ok(res, d);
    } catch (error) {
      return response.error(res, error);
    }
  },

  getProductById: async (req, res) => {
    try {
      let product = await Product.findById(req?.params?.id).populate(
        "category",
        "name"
      );
      // let reviews = await Review.find({ product: product._id }).populate('posted_by', 'username')
      // let favourite
      // if (req.query.user) {
      //     favourite = await Favourite.findOne({ product: product._id, user: req.query.user })
      // }
      // let d = {
      //     ...product._doc,
      //     rating: await getReview(product._id),
      //     reviews,
      //     favourite: favourite ? true : false
      // }
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },

  compareProduct: async (req, res) => {
    try {
      let product = await Product.find({ _id: { $in: req.body.ids } }).populate(
        "category"
      );
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },
  getProductbycategory: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      let product = await Product.find({ category: req.params.id })
        .populate("category")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },

  getProductBycategoryId: async (req, res) => {
    console.log(req.query);
    try {
      let cond = { status: "verified" };

      // Filter by category
      if (req?.query?.category && req?.query?.category !== "all") {
        const cat = await Category.findOne({
          slug: req?.query?.category,
        }).lean();
        if (cat) cond.category = cat._id;
      }

      // Exclude specific product
      if (req?.query?.product_id) {
        cond._id = { $ne: req?.query?.product_id };
      }

      // Filter by new
      if (req.query.is_new) {
        cond.is_new = true;
      }

      // Filter by colors
      if (req.query.colors && req.query.colors.length > 0) {
        cond.varients = {
          $ne: [],
          $elemMatch: { color: { $in: req.query.colors } },
        };
      }

      // Pagination config
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 12;
      const skip = (page - 1) * limit;

      // Fetch all matching products first
      let products = await Product.find(cond).populate("category").lean();

      // Manual sort
      const sortBy = req.query.sort_by;
      if (sortBy === "low") {
        products = products.sort((a, b) => {
          const aPrice = parseFloat(a.price_slot?.[0]?.our_price) || 0;
          const bPrice = parseFloat(b.price_slot?.[0]?.our_price) || 0;
          return aPrice - bPrice;
        });
      } else if (sortBy === "high") {
        products = products.sort((a, b) => {
          const aPrice = parseFloat(a.price_slot?.[0]?.our_price) || 0;
          const bPrice = parseFloat(b.price_slot?.[0]?.our_price) || 0;
          return bPrice - aPrice;
        });
      } else if (sortBy === "a_z") {
        products = products.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sortBy === "z_a") {
        products = products.sort((a, b) => b.name.localeCompare(a.name));
      } else if (sortBy === "old") {
        products = products.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
      } else {
        // Default or "new", "featured", "is_top"
        products = products.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      }

      // Slice products for pagination after sorting
      const totalProducts = products.length;
      const totalPages = Math.ceil(totalProducts / limit);
      const paginatedProducts = products.slice(skip, skip + limit);

      return res.status(200).json({
        status: true,
        data: paginatedProducts,
        pagination: {
          totalItems: totalProducts,
          totalPages: totalPages,
          currentPage: page,
          itemsPerPage: limit,
        },
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getProductBythemeId: async (req, res) => {
    console.log(req.query);
    try {
      let cond = {
        theme: { $in: [req?.params?.id] },
      };
      let sort_by = {};
      if (req.query.is_top) {
        cond.is_top = true;
      }
      if (req.query.is_new) {
        cond.is_new = true;
      }

      if (req.query.colors && req.query.colors.length > 0) {
        cond.varients = {
          $ne: [],
          $elemMatch: { color: { $in: req.query.colors } },
        };
      }

      if (req.query.sort_by) {
        if (req.query.sort_by === "featured" || req.query.sort_by === "new") {
          sort_by.createdAt = -1;
        }

        if (req.query.sort_by === "old") {
          sort_by.createdAt = 1;
        }

        if (req.query.sort_by === "a_z") {
          sort_by.name = 1;
        }

        if (req.query.sort_by === "z_a") {
          sort_by.name = -1;
        }

        if (req.query.sort_by === "low") {
          sort_by.price = 1;
        }

        if (req.query.sort_by === "high") {
          sort_by.price = -1;
        }
      } else {
        sort_by.createdAt = -1;
      }
      const product = await Product.find(cond).populate("theme").sort(sort_by);
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },
  getColors: async (req, res) => {
    try {
      let product = await Product.aggregate([
        { $unwind: "$varients" },
        {
          $group: {
            _id: null, // We don't need to group by a specific field, so use null
            uniqueColors: { $addToSet: "$varients.color" }, // $addToSet ensures uniqueness
          },
        },
        {
          $project: {
            _id: 0, // Exclude _id from the output
            uniqueColors: 1,
          },
        },
      ]);

      return response.ok(res, product[0]);
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateProduct: async (req, res) => {
    try {
      const payload = req?.body || {};
      if (payload.name) {
        payload.slug = payload.name
          .toLowerCase()
          .replace(/ /g, "-")
          .replace(/[^\w-]+/g, "");
      }
      let product = await Product.findByIdAndUpdate(payload?.id, payload, {
        new: true,
        upsert: true,
      });
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },

  topselling: async (req, res) => {
    try {
      let product = await Product.find({ is_top: true });
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },

  getnewitem: async (req, res) => {
    try {
      let product = await Product.find({ is_new: true });
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },

  deleteProduct: async (req, res) => {
    try {
      await Product.findByIdAndDelete(req?.params?.id);
      return response.ok(res, { meaasge: "Deleted successfully" });
    } catch (error) {
      return response.error(res, error);
    }
  },

  deleteAllProduct: async (req, res) => {
    try {
      const newid = req.body.products.map(
        (f) => new mongoose.Types.ObjectId(f)
      );
      await Product.deleteMany({ _id: { $in: newid } });
      return response.ok(res, { meaasge: "Deleted successfully" });
    } catch (error) {
      return response.error(res, error);
    }
  },

  requestProduct: async (req, res) => {
    try {
      const payload = req?.body || {};
      const sellersNotified = new Set();
      const sellerOrders = {};

      const productIds = payload.productDetail.map((item) => item.product);
      const products = await Product.find({ _id: { $in: productIds } }).select(
        "category"
      );
      const categoryIds = products.map((p) => p.category);
      const categories = await Category.find({
        _id: { $in: categoryIds },
      }).select("is_refundable");

      const productCategoryMap = new Map();
      products.forEach((product) => {
        const category = categories.find((c) => c._id.equals(product.category));
        productCategoryMap.set(
          product._id.toString(),
          !(category?.is_refundable ?? true)
        );
      });

      for (const item of payload.productDetail) {
        const sellerId = item.seller_id?.toString();
        if (!sellerId) return;

        if (!sellerOrders[sellerId]) {
          sellerOrders[sellerId] = {
            user: req.user.id,
            seller_id: sellerId,
            status: "Pending",
            productDetail: [],
            shipping_address: payload.shipping_address,
            total: 0,
            location: payload.location,
            paymentmode: payload.paymentmode,
            timeslot: payload.timeslot,
            deliveryCharge: payload.deliveryCharge,
            deliveryTip: payload.deliveryTip,
          };
        }

        if (!sellersNotified.has(sellerId)) {
          await notify(
            sellerId,
            "Order received",
            "You have received a new order"
          );
          sellersNotified.add(sellerId);
        }

        const isReturnable = productCategoryMap.get(item.product.toString());

        sellerOrders[sellerId].productDetail.push({
          product: item.product,
          image: item.image,
          qty: item.qty,
          price: item.price,
          price_slot: item.price_slot,
          isReturnable,
        });

        // Calculate total price for this product
        sellerOrders[sellerId].total += item.qty * item.price;
      }

      const savedOrders = [];
      for (const sellerId in sellerOrders) {
        // Calculate tax before saving
        const taxData = await Tax.findOne();
        const feeData = await ServiceFee.findOne();
        const taxRate = taxData?.taxRate || 0;
        const baseTotal = sellerOrders[sellerId].total;
        const taxAmount = (baseTotal * taxRate) / 100;
        const deliveryCharge = sellerOrders[sellerId].deliveryCharge || 0;
        const deliveryTip = sellerOrders[sellerId].deliveryTip || 0;

        sellerOrders[sellerId].tax = taxAmount;
        sellerOrders[sellerId].servicefee = feeData?.Servicefee;
        sellerOrders[sellerId].total = baseTotal;
        sellerOrders[sellerId].finalAmount =
          baseTotal + taxAmount + deliveryCharge + deliveryTip;
        // sellerOrders[sellerId].total = baseTotal + taxAmount;

        const newOrder = new ProductRequest(sellerOrders[sellerId]);
        await newOrder.save();
        savedOrders.push(newOrder);

        // Update sold_pieces for each product
        for (const productItem of sellerOrders[sellerId].productDetail) {
          await Product.findByIdAndUpdate(
            productItem.product,
            { $inc: { sold_pieces: productItem.qty } }, // Increment sold_pieces
            { new: true }
          );
        }

        //  Ensure the seller's wallet is updated if paymentmode is "pay"
        if (payload.paymentmode === "pay") {
          await User.findByIdAndUpdate(
            sellerId,
            { $inc: { wallet: Number(sellerOrders[sellerId].total) } },
            { new: true, upsert: true }
          );
        }
      }

      // if (payload.shiping_address) {
      //     await User.findByIdAndUpdate(req.user.id, { shiping_address: payload.shiping_address })
      // }

      if (payload.shipping_address) {
        const updatedUser = await User.findByIdAndUpdate(
          req.user.id,
          {
            shipping_address: payload.shipping_address,
            location: payload.location,
          },
          { new: true, runValidators: true }
        );

        if (!updatedUser) {
          return response.error(res, { message: "User not found" });
        }
      }

      if (payload.user && payload.pointtype === "REDEEM") {
        let userdata = await User.findById(payload.user);
        // if (payload.pointtype === "REDEEM") {
        userdata.referalpoints = userdata.referalpoints - Number(payload.point);
        userdata.save();
        // }
        // else {
        //   userdata.point = userdata.point + Number(payload.point);
        //   userdata.save();
        // }
      }

      return response.ok(res, {
        message: "Product request added successfully",
        orders: savedOrders,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },
  getTopSoldProduct: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      // const products = await Product.find({ sold_pieces: { $gte: 1 } }) // Only products with at least 1 sold
      const products = await Product.find()
        .sort({ sold_pieces: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      return response.ok(res, products);
    } catch (error) {
      return response.error(res, error);
    }
  },
  getrequestProduct: async (req, res) => {
    try {
      const product = await ProductRequest.find()
        .populate("user category", "-password -varients")
        .sort({ createdAt: -1 });
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },
  refundProduct: async (req, res) => {
    try {
      const productId = req.body.product_id;
      const { reason, refundProof } = req.body;

      const order = await ProductRequest.findById(req.params.id).populate(
        "seller_id",
        "username email"
      );

      if (!order) {
        return response.error(res, { message: "Order not found" });
      }

      if (order.status === "Refunded") {
        return response.error(res, { message: "Product already refunded" });
      }

      if (order.status !== "Delivered" || !order.deliveredAt) {
        return response.error(res, {
          message: "Return is allowed only after delivery",
        });
      }

      const deliveredTime = new Date(order.deliveredAt).getTime();
      const currentTime = Date.now();
      const refundWindow = 15 * 60 * 1000;

      if (currentTime - deliveredTime > refundWindow) {
        return response.error(res, {
          message:
            "Return window expired. Returns are only allowed within 15 minutes after delivery.",
        });
      }

      const orderedProduct = order.productDetail.find(
        (item) => item.product.toString() === productId
      );

      if (!orderedProduct) {
        return response.error(res, { message: "Product not found in order" });
      }

      const returnAmount = orderedProduct.price || 0;

      const isReturnable = orderedProduct?.isReturnable ?? true;

      if (!isReturnable) {
        // order.status = "Refund-Requested";
        orderedProduct.returnDetails.returnStatus = "Auto-Refunded";
        orderedProduct.returnDetails.isRefunded = true;
        orderedProduct.returnDetails.returnRequestDate = new Date();
        orderedProduct.returnDetails.reason = reason;
        orderedProduct.returnDetails.proofImages = refundProof;
        orderedProduct.returnDetails.refundAmount = returnAmount;

        // order.returnAmount = returnAmount;
        // order.refundby = req.user.id;
        // order.returnreason = "Auto-refunded: non-returnable item";
        // order.returnproof = refundProof || null;
        // order.returndate = new Date();
        // order.returnstatus = "Refunded";
        // order.refundedWithoutReturn = true;

        // await User.findByIdAndUpdate(
        //   order.user,
        //   { $inc: { wallet: Number(returnAmount) } },
        //   { new: true }
        // );

        // await User.findByIdAndUpdate(
        //   order.seller_id._id,
        //   { $inc: { wallet: -Number(returnAmount) } },
        //   { new: true }
        // );

        // await mailNotification.sendMail(
        //   order.user,
        //   "Refund Requested",
        //   `Your refund for a non-returnable item was processed successfully. Amount: ₹${returnAmount}`
        // );
        await mailNotification.returnMail({
          email: order.seller_id.email,
          returnAmount: returnAmount,
        });
      } else {
        // order.status = "Return-requested";
        orderedProduct.returnDetails.returnStatus = "Return-requested";
        orderedProduct.returnDetails.isReturned = true;
        orderedProduct.returnDetails.returnRequestDate = new Date();
        orderedProduct.returnDetails.reason = reason;
        orderedProduct.returnDetails.proofImages = refundProof;

        // order.return = true;
        // order.returnAmount = returnAmount;
        // order.returnreason = reason;
        // order.returnproof = refundProof;
        // order.returndate = new Date();
        // order.returnstatus = "Pending";
        // order.productId = productId;
      }

      await mailNotification.returnMail({
        email: order.seller_id.email,
        returnAmount: returnAmount,
      });

      console.log(order);

      await order.save();

      return response.ok(res, {
        data: order,
        message: "Your refund request has been processed successfully",
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getOrderBySeller: async (req, res) => {
    try {
      let cond = {};
      const { curDate } = req.body;

      if (req.user.type === "SELLER") {
        cond = {
          seller_id: req.user.id,
          assignedEmployee: { $exists: false },
          // status: { $in: ["Pending", "Packed"] }
          status: { $in: ["Pending", "Packed"] },
        };
      }

      if (req.user.type === "ADMIN") {
        if (req.body.seller_id) {
          cond = {
            seller_id: req.body.seller_id,
          };
        }
      }

      if (curDate) {
        cond.createdAt = {
          $gte: new Date(`${curDate}T00:00:00.000Z`),
          $lt: new Date(`${curDate}T23:59:99.999Z`),
        };
      }

      // Added to handle the date request for admin
      if (req.body.curentDate) {
        const newEt = new Date(
          new Date(req.body.curentDate).setDate(
            new Date(req.body.curentDate).getDate() + 1
          )
        );
        cond.createdAt = { $gte: new Date(req.body.curentDate), $lte: newEt };
      }

      // Pagination
      let page = parseInt(req.query.page) || 1;
      let limit = parseInt(req.query.limit) || 10;
      let skip = (page - 1) * limit;

      const product = await ProductRequest.find(cond)
        .populate("user", "-password -varients")
        .populate("productDetail.product")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const indexedProducts = product.map((item, index) => ({
        ...(item.toObject?.() || item),
        indexNo: skip + index + 1,
      }));

      const totalBlogs = await ProductRequest.countDocuments(cond);
      const totalPages = Math.ceil(totalBlogs / limit);

      return res.status(200).json({
        status: true,
        data: indexedProducts,
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

  getSellerOrderByAdmin: async (req, res) => {
    try {
      let cond = {};
      const { curDate, sellerName, customerName, returnOrders } = req.body;

      if (curDate) {
        cond.createdAt = {
          $gte: new Date(`${curDate}T00:00:00.000Z`),
          $lt: new Date(`${curDate}T23:59:99.999Z`),
        };
      }

      if (req.body.curentDate) {
        const newEt = new Date(
          new Date(req.body.curentDate).setDate(
            new Date(req.body.curentDate).getDate() + 1
          )
        );
        cond.createdAt = { $gte: new Date(req.body.curentDate), $lte: newEt };
      }

      if (customerName) {
        const user = await User.findOne({
          username: new RegExp("^" + customerName.trim(), "i"), // Case-insensitive search
        });

        if (user) {
          cond["user"] = user._id;
        } else {
          return res
            .status(404)
            .json({ status: false, message: "Customer not found." }); // Handle user not found
        }
      }
      if (sellerName) {
        const seller = await User.findOne({
          username: new RegExp("^" + sellerName.trim(), "i"), // Case-insensitive search
        });

        if (seller) {
          cond["seller_id"] = seller._id;
        } else {
          return res
            .status(404)
            .json({ status: false, message: "Seller not found." }); // Handle seller not found
        }
      }

      if (req.body.returnOrders) {
        cond.return = req.body.returnOrders;
      }

      let page = parseInt(req.query.page) || 1;
      let limit = parseInt(req.query.limit) || 10;
      let skip = (page - 1) * limit;

      const product = await ProductRequest.find(cond)
        .populate("user", "-password -varients")
        .populate("productDetail.product")
        .populate("seller_id", "-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const indexedProducts = product.map((item, index) => ({
        ...(item.toObject?.() || item),
        indexNo: skip + index + 1,
      }));

      const totalBlogs = await ProductRequest.countDocuments(cond);
      const totalPages = Math.ceil(totalBlogs / limit);

      return res.status(200).json({
        status: true,
        data: indexedProducts,
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
  getSellerReturnOrderByAdmin: async (req, res) => {
    try {
      let cond = {};
      const { curDate, curentDate, sellerName, customerName } = req.body;

      if (curDate) {
        cond.createdAt = {
          $gte: new Date(`${curDate}T00:00:00.000Z`),
          $lt: new Date(`${curDate}T23:59:59.999Z`),
        };
      }

      if (req.body.seller_id) {
        cond.seller_id = req.body.seller_id;
      }

      if (curentDate) {
        const startDate = new Date(curentDate);
        const endDate = new Date(
          new Date(curentDate).setDate(startDate.getDate() + 1)
        );
        cond.createdAt = { $gte: startDate, $lt: endDate };
      }

      if (req.user.type === "SELLER") {
        cond.seller_id = req.user.id;
      }

      if (customerName) {
        const user = await User.findOne({
          username: new RegExp("^" + customerName.trim(), "i"), // Case-insensitive search
        });

        if (user) {
          cond["user"] = user._id;
        } else {
          return res
            .status(404)
            .json({ status: false, message: "Customer not found." }); // Handle user not found
        }
      }
      if (sellerName) {
        const seller = await User.findOne({
          username: new RegExp("^" + sellerName.trim(), "i"), // Case-insensitive search
        });

        if (seller) {
          cond["seller_id"] = seller._id;
        } else {
          return res
            .status(404)
            .json({ status: false, message: "Seller not found." }); // Handle seller not found
        }
      }

      cond.productDetail = {
        $elemMatch: {
          returnDetails: { $exists: true },
          $or: [
            { "returnDetails.isReturned": true },
            { "returnDetails.isRefunded": true },
          ],
        },
      };

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const orders = await ProductRequest.find(cond)
        .populate("user", "-password -varients")
        .populate("productDetail.product")
        .populate("seller_id", "-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const filteredOrders = orders
        .map((order, index) => {
          const orderObj = order.toObject?.() || order;

          const returnedItems =
            orderObj.productDetail?.filter(
              (item) => item.returnDetails?.isReturned === true
            ) || [];

          // const refundedItems =
          // orderObj.productDetail?.filter(
          //   (item) => item.returnDetails?.isRefunded === true
          // ) || [];

          // if (returnedItems.length > 0 || refundedItems.length > 0) {
          //   return {
          //     ...orderObj,
          //     indexNo: skip + index + 1,
          //     productDetail: returnedItems.concat(refundedItems),
          //   };
          // }
          if (returnedItems.length > 0) {
            return {
              ...orderObj,
              indexNo: skip + index + 1,
              productDetail: returnedItems,
            };
          }

          return null;
        })
        .filter(Boolean);

      const totalOrders = await ProductRequest.countDocuments(cond);
      const totalPages = Math.ceil(totalOrders / limit);

      return res.status(200).json({
        status: true,
        data: filteredOrders,
        pagination: {
          totalItems: totalOrders,
          totalPages: totalPages,
          currentPage: page,
          itemsPerPage: limit,
        },
      });
    } catch (error) {
      console.error("Error in getSellerReturnOrderByAdmin:", error);
      return response.error(res, error);
    }
  },

  getSellerProductByAdmin: async (req, res) => {
    try {
      let page = parseInt(req.query.page) || 1;
      let limit = parseInt(req.query.limit);
      let skip = (page - 1) * limit;

      let query = {};

      if (req.query.search) {
        const searchRegex = new RegExp(req.query.search, "i");

        query.$or = [{ name: searchRegex }];
      }

      let product = await Product.find(query)
        .populate("category")
        .populate("userid", "-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      console.log(product);
      // Filter again after populate (category.name and seller name)
      if (req.query.search) {
        const searchRegex = new RegExp(req.query.search, "i");

        product = product.filter(
          (p) =>
            searchRegex.test(p.name) ||
            searchRegex.test(p.categoryName || "") ||
            searchRegex.test(p.userid?.username || "")
        );
      }

      const totalProducts = product.length;
      const totalPages = Math.ceil(totalProducts / limit);

      return res.status(200).json({
        status: true,
        data: product,
        pagination: {
          totalItems: totalProducts,
          totalPages: totalPages,
          currentPage: page,
          itemsPerPage: limit,
        },
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getAssignedOrder: async (req, res) => {
    try {
      let cond = {};
      if (req.user.type === "SELLER") {
        cond = {
          seller_id: req.user.id,
          assignedEmployee: { $exists: true },
          status: { $ne: "Delivered" },
        };
      }
      const product = await ProductRequest.find(cond)
        .populate("user", "-password")
        .populate("productDetail.product")
        .sort({ createdAt: -1 });
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },
  cashcollected: async (req, res) => {
    try {
      const product = await ProductRequest.findById(req.body.id);

      const driver = await User.findById(product.driver_id);

      if (driver?.wallet) {
        driver.wallet = driver.wallet + Number(product.total);
      } else {
        driver.wallet = Number(product.total);
      }
      driver.save();

      product.cashcollected = "Yes";

      product.save();

      await User.findByIdAndUpdate(
        product.seller_id,
        { $inc: { wallet: Number(product.total) } },
        { new: true, upsert: true }
      );

      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },

  changeorderstatus: async (req, res) => {
    try {
      const product = await ProductRequest.findById(req.body.id);
      product.status = req.body.status;
      if (req.body.status === "Driverassigned") {
        let driverlist = await User.find({
          type: "Driver",
          location: {
            $near: {
              $maxDistance: 1609.34 * 10,
              $geometry: product.location,
            },
          },
        });
        {
          driverlist.length > 0 &&
            (await notify(
              driverlist,
              "New Order receive",
              "You New Order receive for delivery"
            ));
        }
      }
      if (req.body.status === "Delivered") {
        product.onthewaytodelivery = false;
        product.deliveredAt = new Date();
        await notify(
          product.user,
          "Order delivered",
          "You order delivered successfully"
        );
      }
      if (req.body.status === "Collected") {
        await notify(
          product.user,
          "Order collected",
          "Order collected by driver"
        );
      }

      product.save();
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },
  onthewaytodelivery: async (req, res) => {
    try {
      const product = await ProductRequest.findById(req.params.id);
      product.onthewaytodelivery = true;

      product.save();
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },

  productSearch: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      let cond = {
        $or: [
          { name: { $regex: req.query.key, $options: "i" } },
          { categoryName: { $regex: req.query.key, $options: "i" } },
        ],
      };
      const product = await Product.find(cond)
        .sort({ createdAt: -1 })
        // .select("name offer price userid varients")
        .limit(limit * 1)
        .skip((page - 1) * limit);
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },

  updaterequestProduct: async (req, res) => {
    try {
      const product = await ProductRequest.findByIdAndUpdate(
        req.params.id,
        req.body,
        { upsert: true, new: true }
      );
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },

  getrequestProductbyid: async (req, res) => {
    try {
      const product = await ProductRequest.findById(req.params.id)
        .populate("user driver_id seller_id", "-password")
        .populate("productDetail.product");
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },
  nearbyorderfordriver: async (req, res) => {
    try {
      let orders = await ProductRequest.find({
        status: "Driverassigned",
        driver_id: { $exists: false },
        location: {
          $near: {
            $maxDistance: 1609.34 * 10,
            $geometry: {
              type: "Point",
              coordinates: req.body.location,
            },
          },
        },
      })
        .sort({ createdAt: -1 })
        .populate("user", "-password");
      return response.ok(res, orders);
    } catch (err) {
      return response.error(res, err);
    }
  },
  acceptedorderfordriver: async (req, res) => {
    try {
      const product = await ProductRequest.find({
        driver_id: req.user.id,
        status: { $ne: "Delivered" },
      })
        .sort({ createdAt: -1 })
        .populate("user", "-password");
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },
  acceptorderdriver: async (req, res) => {
    try {
      const product = await ProductRequest.findById(req.params.id);
      if (product.driver) {
        return response.badReq(res, { message: "Order already accepted" });
      }
      product.driver_id = req.user.id;
      // product.status='Driveraccepted'
      product.save();
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },

  orderhistoryfordriver: async (req, res) => {
    try {
      const product = await ProductRequest.find({
        driver_id: req.user.id,
        status: "Delivered",
      })
        .sort({ createdAt: -1 })
        .populate("user", "-password");
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },
  orderhistoryforvendor: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const product = await ProductRequest.find({
        seller_id: req.user.id,
        status: "Delivered",
      })
        .sort({ createdAt: -1 })
        .populate("user", "-password")
        .limit(limit * 1)
        .skip((page - 1) * limit);
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },

  getrequestProductbyuser: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const product = await ProductRequest.find({ user: req.user.id })
        .populate("productDetail.product", "-varients")
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });
      // const product = await ProductRequest.aggregate([
      //     {
      //         $match: { user: new mongoose.Types.ObjectId(req.user.id) }
      //     },
      //     {
      //         $unwind: {
      //             path: '$productDetail',
      //             preserveNullAndEmptyArrays: true
      //         }
      //     },
      //     {
      //         $lookup: {
      //             from: 'products',
      //             localField: 'productDetail.product',
      //             foreignField: '_id',
      //             as: 'productDetail.product',
      //             pipeline: [

      //                 {
      //                     $project: {
      //                         name: 1
      //                     }
      //                 },

      //             ]
      //         }
      //     },
      //     {
      //         $unwind: {
      //             path: '$productDetail.product',
      //             preserveNullAndEmptyArrays: true
      //         }
      //     },

      // ])

      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },
  uploadProducts: async (req, res) => {
    try {
      const products = req.body;

      const insertedProducts = await Product.insertMany(products);
      return res.status(201).json({
        status: true,
        message: "Products uploaded successfully",
        data: insertedProducts,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Server Error", error: error.message });
    }
  },

  suspendProduct: async (req, res) => {
    try {
      const { id } = req.params;

      const product = await Product.findById(id);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.status === "suspended") {
        return res
          .status(200)
          .json({ message: "Product is already suspended" });
      }

      product.status = "suspended";
      const updatedProduct = await product.save();

      res.status(200).json(updatedProduct);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getdriveramount: async (req, res) => {
    try {
      // Pagination
      let page = parseInt(req.query.page) || 1;
      let limit = parseInt(req.query.limit) || 10;
      let skip = (page - 1) * limit;

      const product = await User.find({ wallet: { $gt: 0 }, type: "DRIVER" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const indexedProducts = product.map((item, index) => ({
        ...(item.toObject?.() || item),
        indexNo: skip + index + 1,
      }));

      const totalProducts = await User.countDocuments({
        wallet: { $gt: 0 },
        type: "DRIVER",
      });

      const totalPages = Math.ceil(totalProducts / limit);

      // return response.ok(res, product);
      return res.status(200).json({
        status: true,
        data: indexedProducts,
        pagination: {
          totalItems: totalProducts,
          totalPages: totalPages,
          currentPage: page,
          itemsPerPage: limit,
        },
      });
    } catch (error) {
      return response.error(res, error);
    }
  },
  getdriverpendingamount: async (req, res) => {
    try {
      const product = await ProductRequest.find({
        driver_id: req.params.id,
        cashcollected: "Yes",
        amountreceivedbyadmin: "No",
      }).populate("productDetail.product", "-varients");
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },

  collectcash: async (req, res) => {
    try {
      const product = await ProductRequest.updateMany(
        {
          driver_id: req.params.id,
          cashcollected: "Yes",
          amountreceivedbyadmin: "No",
        },
        { $set: { amountreceivedbyadmin: "Yes" } }
      );

      const driverdata = await User.findById(req.params.id);
      if (driverdata) {
        driverdata.wallet = 0;
      }
      await driverdata.save();
      return response.ok(res, { message: "Status update succesfully" });
    } catch (error) {
      return response.error(res, error);
    }
  },

  assignOrderToEmployee: async (req, res) => {
    try {
      const { orderId, assignedEmployee } = req.body;
      const order = await ProductRequest.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      order.assignedEmployee = assignedEmployee;
      await order.save();
      return res.status(200).json({ message: "Order assigned successfully" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
  getOrderByEmployee: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const product = await ProductRequest.find({
        assignedEmployee: req.user.id,
        status: { $in: ["Pending", "Packed"] },
      })
        .populate("user", "-password -varients")
        .populate("productDetail.product")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      return res.status(200).json({
        status: true,
        data: product,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },
  getOrderHistoryByEmployee: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const product = await ProductRequest.find({
        assignedEmployee: req.user.id,
        status: { $nin: ["Pending", "Packed"] },
      })
        .populate("user", "-password -varients")
        .populate("productDetail.product")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      return res.status(200).json({
        status: true,
        data: product,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  reminderSellerForReturn: async (req, res) => {
    try {
      const { orderId, sellerId } = req.body;
      const seller = await User.findById(sellerId).select("email");

      if (!seller) {
        return res.status(404).json({ message: "Seller not found" });
      }

      await mailNotification.returnReminderMail({
        email: seller.email,
        orderId: orderId,
      });
      return response.ok(res, {
        message: "Reminder email sent to seller successfully",
      });
    } catch (error) {
      console.log("Error in reminderSellerForReturn:", error);
      return response.error(res, error);
    }
  },

  createComboProduct: async (req, res) => {
    try {
      const { comboProducts, userid, old_price, offer_price } = req.body;

      if (!comboProducts?.length || !userid || !old_price || !offer_price) {
        return res.status(400).json({ message: "Missing required data" });
      }

      const newCombo = new ComboProduct({
        comboItems: comboProducts.map((item) => ({
          product: item.product,
          selected_slot: item.selected_slot,
        })),
        userid,
        old_price,
        offer_price,
      });

      const comboProduct = await newCombo.save();

      return response.ok(res, {
        message: "Combo product created successfully",
        product: comboProduct,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getComboProduct: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const comboProducts = await ComboProduct.find()
        .populate({
          path: "comboItems.product",
          select: "name price category",
          populate: {
            path: "category",
            select: "name",
          },
        })
        .populate("userid", "username email")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      const totalComboProducts = await ComboProduct.countDocuments();
      const totalPages = Math.ceil(totalComboProducts / limit);
      return res.status(200).json({
        status: true,
        data: comboProducts,
        pagination: {
          totalItems: totalComboProducts,
          totalPages: totalPages,
          currentPage: page,
          itemsPerPage: limit,
        },
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getComboProductById: async (req, res) => {
    try {
      const comboProduct = await ComboProduct.findById(req.params.id)
        .populate({
          "path": "comboItems.product",
          "select": "name price category price_slot",
          "populate": {
            "path": "category",
            "select": "name"
          }
        })
        .populate("userid", "username email");
      if (!comboProduct) {
        return res.status(404).json({ message: "Combo product not found" });
      }
      return response.ok(res, comboProduct);
    } catch (error) {
      console.error("Error fetching combo product by ID:", error);
      return response.error(res, error);
    }
  },
  updateComboProduct: async (req, res) => {
    try {
      const { comboProducts, old_price, offer_price } = req.body;

      if (!comboProducts?.length || !old_price || !offer_price) {
        return res.status(400).json({ message: "Missing required data" });
      }

      const comboProduct = await ComboProduct.findByIdAndUpdate(
        req.params.id,
        {
          comboItems: comboProducts.map((item) => ({
            product: item.product,
            selected_slot: item.selected_slot,
          })),
          old_price,
          offer_price,
        },
        { new: true }
      );

      if (!comboProduct) {
        return res.status(404).json({ message: "Combo product not found" });
      }

      return response.ok(res, {
        message: "Combo product updated successfully",
        product: comboProduct,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },
  deleteComboProduct: async (req, res) => {
    try {
      const comboProduct = await ComboProduct.findByIdAndDelete(req.params.id);
      if (!comboProduct) {
        return res.status(404).json({ message: "Combo product not found" });
      }
      return response.ok(res, {
        message: "Combo product deleted successfully",
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getProductBySale: async (req, res) => {
    try {
      const flashSales = await FlashSale.find();

      if (!flashSales || flashSales.length === 0) {
        return response.ok(res, []);
      }

      const productIds = flashSales.flatMap((flashSale) => flashSale.products);
      if (!productIds || productIds.length === 0) {
        return response.ok(res, []);
      }

      const productDetails = await Product.find({ _id: { $in: productIds } });

      return response.ok(res, productDetails);
    } catch (error) {
      console.error("Error fetching products by sale:", error);
      return response.error(res, error);
    }
  },
};
