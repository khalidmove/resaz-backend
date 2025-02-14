"use strict";
const router = require("express").Router();
const user = require("../../app/controller/user");
const isAuthenticated = require("../../middlewares/isAuthenticated");
const blog = require("../../app/controller/blogs");
const category = require("../../app/controller/category");
const product = require("../../app/controller/product");
const { upload } = require("../../app/services/fileUpload");
const setting = require("../../app/controller/setting");
const theme = require("../../app/controller/theme");
const { getStoreById } = require("../../app/controller/store");
const store = require("../../app/controller/store");
const favourite = require("../../app/controller/favourite");
const { createContent, getContent, updateContent } = require("../../app/controller/ContentManagement");
const { getFaqs, createFaq, updateFaq, deleteFaq } = require('../../app/controller/Faq');

router.post("/login", user.login);
router.post("/signUp", user.signUp);
router.post("/sendOTP", user.sendOTP);
router.post("/verifyOTP", user.verifyOTP);
router.post("/changePassword", user.changePassword);
router.post(
    "/user/fileupload",
    upload.single("file"),
    user.fileUpload
);
router.get("/getuserlist/:type", isAuthenticated(["USER", "ADMIN", "SELLER"]), user.getUserList);
router.get("/getDriverList/:type", isAuthenticated(["USER", "ADMIN", "SELLER", "DRIVER"]), user.getDriverList);
router.post("/updateStatus", isAuthenticated(["ADMIN", "DRIVER"]), user.updateStatus);
router.get("/getSellerList", isAuthenticated(["USER", "ADMIN", "SELLER"]), user.getSellerList);
router.post("/getInTouch", user.createGetInTouch);
router.get("/getInTouch/:id", user.updateGetInTouch);
router.post("/get-getInTouch", user.getGetInTouch);
router.delete("/user/delgetintouch/:id", user.deleteGetInTouch);

router.post("/add-subscriber", user.addNewsLetter);
router.get("/get-subscriber", user.getNewsLetter);
router.post("/del-subscriber", user.DeleteNewsLetter);
router.post(
  "/profile/changePassword",
  isAuthenticated(["USER", "ADMIN","SELLER"]),
  user.changePasswordProfile
);

router.get("/getProfile", isAuthenticated(["USER", "ADMIN", "SELLER"]), user.getProfile);
router.post("/updateProfile", isAuthenticated(["USER", "ADMIN", "SELLER"]), user.updateProfile);


//blogs
router.get("/getblogcategory", blog.getBloggCategory);
router.post(
    "/create-blog",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    blog.createBlog
);
router.get("/get-blog", blog.getBlog);
router.post(
    "/update-blog",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    blog.updateBlog
);
router.post("/getBlogById", blog.getBlogById);
router.post("/getBlogByCategory", blog.getBlogByCategory);
router.delete(
    "/delete-blog",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    blog.deleteBlog
);

//Category
router.get("/getCategoryById/:id", category.getCategoryById);
router.post(
    "/createCategory",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    category.createCategory
);
router.get("/getCategory", category.getCategory);
router.get("/getPopularCategory", category.getPopularCategory);
router.post(
    "/updateCategory",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    category.updateCategory
);
router.delete(
    "/deleteCategory/:id",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    category.deleteCategory
);
router.post(
    "/deleteAllCategory",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    category.deleteAllCategory
);


//Theme
router.get("/getThemeById/:id", theme.getThemeById);
router.post(
    "/createTheme",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    theme.createTheme
);
router.get("/getTheme", theme.getTheme);
router.post(
    "/updateTheme",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    theme.updateTheme
);
router.delete(
    "/deleteTheme/:id",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    theme.deleteTheme
);
router.post(
    "/deleteAllCategory",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    theme.deleteAllTheme
);

//Product
router.get("/getProductById/:id", product.getProductById);
router.get("/getProductByslug/:id", product.getProductByslug);
router.post("/compareProduct", product.compareProduct);
router.get("/getProductbycategory/:id", product.getProductbycategory);
router.get("/getProductBycategoryId", product.getProductBycategoryId);
router.get("/getProductBythemeId/:id", product.getProductBythemeId);
router.post(
    "/createProduct",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    product.createProduct
);
router.get("/getProduct", product.getProduct);
router.get("/getProductforseller",isAuthenticated(["USER", "ADMIN", "SELLER"]), product.getProductforseller);
router.get("/getSponseredProduct", product.getSponseredProduct);

router.post(
    "/updateProduct",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    product.updateProduct
);

router.get(
    "/topselling",
    // isAuthenticated(["USER", "ADMIN","SELLER"]),
    product.topselling
);

router.get(
    "/getnewitem",
    // isAuthenticated(["USER", "ADMIN","SELLER"]),
    product.getnewitem
);

router.get(
    "/getcolors",
    // isAuthenticated(["USER", "ADMIN","SELLER"]),
    product.getColors
);

router.delete(
    "/deleteProduct/:id",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    product.deleteProduct
);
router.post(
    "/deleteAllProduct",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    product.deleteAllProduct
);
router.post(
    "/Suspend/:id",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    product.suspendProduct
);


//Store
router.get("/getStoreById/:id", store.getStoreById);
router.post(
    "/createStore",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    store.createStore
);
router.get("/getStore", isAuthenticated(["USER", "ADMIN", "SELLER"]), store.getStore);
router.post(
    "/updateStore",
    isAuthenticated(["ADMIN", "SELLER"]),
    store.updateStore
);

router.delete(
    "/deleteStore/:id",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    store.deleteStore
);
router.post(
    "/deleteAllStore",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    store.deleteAllStore
);


/// setting
router.post("/createsetting", setting.createSetting);
router.get("/getsetting", setting.getSetting);
router.post(
    "/updatesetting",
    setting.updateSetting)


// product request
router.post(
    "/createProductRquest",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    product.requestProduct
);

router.get(
    "/getProductRquest",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    product.getrequestProduct
);

router.post(
    "/getOrderBySeller",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    product.getOrderBySeller
);

router.get(
    "/productsearch",
    product.productSearch
);

router.post(
    "/updateProductRequest/:id",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    product.updaterequestProduct
);

router.get(
    "/getProductRequest/:id",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    product.getrequestProductbyid
);

router.get(
    "/getProductRequestbyUser",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    product.getrequestProductbyuser
);


//Favourite

router.post(
    "/addremovefavourite",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    favourite.AddFavourite
);

router.get(
    "/getFavourite",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    favourite.getFavourite
);


//Review

router.post(
    "/giverate",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    user.giverate
);

router.get(
    "/getReview",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    user.getReview
);
router.post("/uploadAllproduct", 
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    product.uploadProducts);

router.get("/getAlluploadproduct",product.uploadProducts);


router.post('/content', 
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    createContent);

router.get('/content',
    getContent);

router.post('/content/update',
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    updateContent);


router.get('/faq',getFaqs);

router.post('/faq', 
isAuthenticated(["USER", "ADMIN", "SELLER"]),
createFaq);

router.post('/updatefaq/:id', 
isAuthenticated(["USER", "ADMIN", "SELLER"]),
updateFaq);

router.delete('/deletefaq/:id',
isAuthenticated(["USER", "ADMIN", "SELLER"]),
deleteFaq);


module.exports = router;
