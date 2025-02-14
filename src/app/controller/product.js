const mongoose = require("mongoose");
const Product = mongoose.model("Product");
const ProductRequest = mongoose.model("ProductRequest")
const User = mongoose.model("User");
const response = require("./../responses");
const mailNotification = require("../services/mailNotification");
const { getReview } = require("../helper/user");
// const { User } = require("@onesignal/node-onesignal");
const Review = mongoose.model("Review");
const Favourite = mongoose.model("Favourite");
const Category = mongoose.model("Category");



module.exports = {

    createProduct: async (req, res) => {
        try {
            const payload = req?.body || {};
            payload.slug = payload.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
            let cat = new Product(payload);
            await cat.save();
            return response.ok(res, { message: 'Product added successfully' });
        } catch (error) {
            return response.error(res, error);
        }
    },



    getProduct: async (req, res) => {
        try {
            let data = {}
            if (req.query.seller_id) {
                data.userid = req.query.seller_id
            }
            let product = await Product.find(data).populate('category').sort({ 'createdAt': -1 });
            return response.ok(res, product);
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
            let product = await Product.find({userid:req.user.id}).sort({ 'createdAt': -1 }).limit(limit * 1)
            .skip((page - 1) * limit);
            return response.ok(res, product);
        } catch (error) {
            return response.error(res, error);
        }
    },

    getSponseredProduct: async (req, res) => {
        try {
            let data = { sponsered: true }
            if (req.query.seller_id) {
                data.userid = req.query.seller_id
            }
            let product = await Product.find(data).populate('category').sort({ 'createdAt': -1 });
            return response.ok(res, product);
        } catch (error) {
            return response.error(res, error);
        }
    },

    getProductByslug: async (req, res) => {
        try {
            let product = await Product.findOne({ slug: req?.params?.id }).populate('category', 'name slug');
            let reviews = await Review.find({ product: product._id }).populate('posted_by', 'username')
            let favourite
            if (req.query.user) {
                favourite = await Favourite.findOne({ product: product._id, user: req.query.user })
            }
            let d = {
                ...product._doc,
                rating: await getReview(product._id),
                reviews,
                favourite: favourite ? true : false
            }
            return response.ok(res, d);
        } catch (error) {
            return response.error(res, error);
        }
    },

    getProductById: async (req, res) => {
        try {
            let product = await Product.findById(req?.params?.id).populate('category', 'name');
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
            let product = await Product.find({ _id: { $in: req.body.ids } }).populate('category');
            return response.ok(res, product);
        } catch (error) {
            return response.error(res, error);
        }
    },
    getProductbycategory: async (req, res) => {
        try {
            let product = await Product.find({ category: req.params.id }).populate('category');
            return response.ok(res, product);
        } catch (error) {
            return response.error(res, error);
        }
    },

    getProductBycategoryId: async (req, res) => {
        console.log(req.query)
        try {
            let cond = {}
            if (req?.query?.category && req?.query?.category !== 'all') {
                const cat = await Category.findOne({ slug: req?.query?.category })
                cond.category = cat._id
            }
            if (req?.query?.product_id) {
                cond._id = { $ne: req?.query?.product_id }
            }
            let sort_by = {}
            if (req.query.is_top) {
                cond.is_top = true
            }
            if (req.query.is_new) {
                cond.is_new = true
            }

            if (req.query.colors && req.query.colors.length > 0) {
                cond.varients = { $ne: [], $elemMatch: { color: { $in: req.query.colors } } }
            }

            if (req.query.sort_by) {
                if (req.query.sort_by === 'featured' || req.query.sort_by === 'new') {
                    sort_by.createdAt = -1
                }

                if (req.query.sort_by === 'old') {
                    sort_by.createdAt = 1
                }

                if (req.query.sort_by === 'a_z') {
                    sort_by.name = 1
                }

                if (req.query.sort_by === 'z_a') {
                    sort_by.name = -1
                }

                if (req.query.sort_by === 'low') {
                    sort_by.price = 1
                }

                if (req.query.sort_by === 'high') {
                    sort_by.price = -1
                }
            } else {
                sort_by.createdAt = -1
            }
            console.log(cond)
            let product
            if (req?.query?.product_id) {
                product = await Product.find(cond).populate('category').sort(sort_by).limit(4);
            } else {
                product = await Product.find(cond).populate('category').sort(sort_by);
            }

            return response.ok(res, product);
        } catch (error) {
            return response.error(res, error);
        }
    },

    getProductBythemeId: async (req, res) => {
        console.log(req.query)
        try {
            let cond = {
                theme: { $in: [req?.params?.id] }
            }
            let sort_by = {}
            if (req.query.is_top) {
                cond.is_top = true
            }
            if (req.query.is_new) {
                cond.is_new = true
            }

            if (req.query.colors && req.query.colors.length > 0) {
                cond.varients = { $ne: [], $elemMatch: { color: { $in: req.query.colors } } }
            }

            if (req.query.sort_by) {
                if (req.query.sort_by === 'featured' || req.query.sort_by === 'new') {
                    sort_by.createdAt = -1
                }

                if (req.query.sort_by === 'old') {
                    sort_by.createdAt = 1
                }

                if (req.query.sort_by === 'a_z') {
                    sort_by.name = 1
                }

                if (req.query.sort_by === 'z_a') {
                    sort_by.name = -1
                }

                if (req.query.sort_by === 'low') {
                    sort_by.price = 1
                }

                if (req.query.sort_by === 'high') {
                    sort_by.price = -1
                }
            } else {
                sort_by.createdAt = -1
            }
            const product = await Product.find(cond).populate('theme').sort(sort_by);
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
                        uniqueColors: { $addToSet: "$varients.color" } // $addToSet ensures uniqueness
                    }
                },
                {
                    $project: {
                        _id: 0, // Exclude _id from the output
                        uniqueColors: 1
                    }
                }
            ])

            return response.ok(res, product[0]);
        } catch (error) {
            return response.error(res, error);
        }
    },

    updateProduct: async (req, res) => {
        try {
            const payload = req?.body || {};
            if (payload.name) {
                payload.slug = payload.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
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
            const newid = req.body.products.map(f => new mongoose.Types.ObjectId(f))
            await Product.deleteMany({ _id: { $in: newid } });
            return response.ok(res, { meaasge: "Deleted successfully" });
        } catch (error) {
            return response.error(res, error);
        }
    },

    requestProduct: async (req, res) => {
        try {
            const payload = req?.body || {};
            payload.user = req.user.id
            let cat = new ProductRequest(payload);
            await cat.save();
            if (payload.shiping_address) {
                await User.findByIdAndUpdate(req.user.id, { shiping_address: payload.shiping_address })
            }
            // await Product.findByIdAndUpdate(payload?.productDetail._id, payload.productDetail);
            return response.ok(res, { message: 'Product request added successfully' });
        } catch (error) {
            return response.error(res, error);
        }
    },
    getrequestProduct: async (req, res) => {
        try {
            const product = await ProductRequest.find().populate('user category', '-password -varients').sort({ createdAt: -1 })
            return response.ok(res, product);
        } catch (error) {
            return response.error(res, error);
        }
    },

    getOrderBySeller: async (req, res) => {
        try {
            let cond = {}
            if(req.body.curDate){
                const newEt = new Date(new Date(req.body.curDate).setDate(new Date(req.body.curDate).getDate() + 1))
                cond.createdAt = { $gte: new Date(req.body.curDate), $lte: newEt };
              } 
            if (req.user.type === "SELLER") {
                cond = {
                    productDetail: { $elemMatch: { seller_id: req.user.id } },
                }
            }
            const product = await ProductRequest.find(cond).populate('user', '-password -varients').populate('productDetail.product').sort({ createdAt: -1 })
            return response.ok(res, product);
        } catch (error) {
            return response.error(res, error);
        }
    },

    productSearch: async (req, res) => {
        try {
            let cond = {
                '$or': [
                    { name: { $regex: req.query.key, $options: "i" } },
                    // { categoryName: { $in: [{ $regex: req.query.key, $options: "i" }] } },
                    // { themeName: { $in: [{ $regex: req.query.key, $options: "i" }] } },
                    { categoryName: { $regex: req.query.key, $options: "i" } },
                    // { details: { $regex: q.location, $options: "i" } },
                ]
            };
            const product = await Product.find(cond).sort({ 'createdAt': -1 }).limit(4);
            return response.ok(res, product);
        } catch (error) {
            return response.error(res, error);
        }
    },

    updaterequestProduct: async (req, res) => {
        try {
            const product = await ProductRequest.findByIdAndUpdate(req.params.id, req.body, { upsert: true, new: true })
            return response.ok(res, product);
        } catch (error) {
            return response.error(res, error);
        }
    },

    getrequestProductbyid: async (req, res) => {
        try {
            const product = await ProductRequest.findById(req.params.id).populate('user', '-password').populate('productDetail.product')
            return response.ok(res, product);
        } catch (error) {
            return response.error(res, error);
        }
    },

    getrequestProductbyuser: async (req, res) => {
        try {
            // const product = await ProductRequest.find({ user: req.user.id }).populate('productDetail.product', '-varients')
            const product = await ProductRequest.aggregate([
                {
                    $match: { user: new mongoose.Types.ObjectId(req.user.id) }
                },
                {
                    $unwind: {
                        path: '$productDetail',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'productDetail.product',
                        foreignField: '_id',
                        as: 'productDetail.product',
                        pipeline: [

                            {
                                $project: {
                                    name: 1
                                }
                            },

                        ]
                    }
                },
                {
                    $unwind: {
                        path: '$productDetail.product',
                        preserveNullAndEmptyArrays: true
                    }
                },

            ])

            return response.ok(res, product);
        } catch (error) {
            return response.error(res, error);
        }
    },
    uploadProducts : async (req, res) => {
        try {
            const products = req.body;
            
            const insertedProducts = await Product.insertMany(products);
            return res.status(201).json({ message: "Products uploaded successfully", data: insertedProducts });
        } catch (error) {
            return res.status(500).json({ message: "Server Error", error: error.message });
        }
    },

     suspendProduct : async (req, res) => {
        try {
          const { id } = req.params;

          const product = await Product.findById(id);
       
          if (!product) {
            return res.status(404).json({ message: 'Product not found' });
          }
      
          if (product.status === 'suspended') {
            return res.status(200).json({ message: 'Product is already suspended' });
          }
      
          product.status = 'suspended';
          const updatedProduct = await product.save();
      
          res.status(200).json(updatedProduct);
        } catch (error) {
          res.status(500).json({ message: error.message });
        }
      },
      
      

};