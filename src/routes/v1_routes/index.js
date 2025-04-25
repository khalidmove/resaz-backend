"use strict";
const router = require("express").Router();
const user = require("../../app/controller/user");
const isAuthenticated = require("../../middlewares/isAuthenticated");
const blog = require("../../app/controller/blogs");
const category = require("../../app/controller/category");
const product = require("../../app/controller/product");
const withdrawreq = require("../../app/controller/withdrawreq");
const { upload } = require("../../app/services/fileUpload");
const setting = require("../../app/controller/setting");
const theme = require("../../app/controller/theme");
const { getStoreById } = require("../../app/controller/store");
const store = require("../../app/controller/store");
const favourite = require("../../app/controller/favourite");
const notification = require("../../app/controller/notification");
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
router.get("/getuserlist/:type", user.getUserList);
router.get("/getDriverList/:type", isAuthenticated(["USER", "ADMIN", "SELLER", "DRIVER"]), user.getDriverList);
router.post("/updateStatus", isAuthenticated(["ADMIN", "DRIVER"]), user.updateStatus);
router.get("/getSellerList", isAuthenticated(["USER", "ADMIN", "SELLER"]), user.getSellerList);
router.post("/getInTouch", user.createGetInTouch);
router.patch("/getInTouch/:id", user.updateGetInTouch);
router.post("/get-getInTouch", user.getGetInTouch);
router.delete("/user/delgetintouch/:id", user.deleteGetInTouch);

// Update admin details
router.patch(
    "/updateAdminDetails/:id",
    isAuthenticated(["ADMIN"]),
    user.updateAdminDetails
);
router.get("/confirm-update",  user.confirmUpdate);

router.post("/add-subscriber", user.addNewsLetter);
router.get("/get-subscriber", user.getNewsLetter);
router.post("/del-subscriber", user.DeleteNewsLetter);
router.post(
  "/profile/changePassword",
  isAuthenticated(["USER", "ADMIN","SELLER"]),
  user.changePasswordProfile
);

router.get("/getProfile", isAuthenticated(["USER", "ADMIN", "SELLER","DRIVER"]), user.getProfile);
router.post("/updateProfile", isAuthenticated(["USER", "ADMIN", "SELLER","DRIVER"]), user.updateProfile);
router.post(
    "/updateUserLocation",
    isAuthenticated(["USER", "DRIVER", "ADMIN"]),
    user.driverupdatelocation
  );
  router.get(
    "/getdriverlocation/:id", user.getdriverlocation
  );

//notification
router.get("/getnotification", isAuthenticated(["USER", "ADMIN", "SELLER","DRIVER"]), notification.getnotification);


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
router.get("/getTopSoldProduct", product.getTopSoldProduct);
router.post("/createProduct", isAuthenticated(["USER", "ADMIN", "SELLER"]), product.createProduct);
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

router.patch(
    "/refundProduct/:id",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    product.refundProduct
);

router.post(
    "/getOrderBySeller",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    product.getOrderBySeller
);
router.post(
    "/getSellerOrderByAdmin",
    isAuthenticated(["ADMIN"]),
    product.getSellerOrderByAdmin
);
router.post(
    "/getSellerReturnOrderByAdmin",
    isAuthenticated(["ADMIN", "SELLER"]),
    product.getSellerReturnOrderByAdmin
);
router.get(
    "/getSellerProductByAdmin",
    isAuthenticated(["ADMIN"]),
    product.getSellerProductByAdmin
);
router.post(
    "/getAssignedOrder",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    product.getAssignedOrder
);
router.post(
    "/changeorderstatus",
    isAuthenticated(["USER", "ADMIN", "SELLER","DRIVER"]),
    product.changeorderstatus
);
router.get(
    "/onthewaytodelivery/:id",
    isAuthenticated(["USER", "ADMIN", "SELLER","DRIVER"]),
    product.onthewaytodelivery
);
router.post(
    "/cashcollected",
    isAuthenticated(["USER", "ADMIN", "SELLER","DRIVER"]),
    product.cashcollected
);

router.get("/orderhistoryfordriver",isAuthenticated(["USER", "ADMIN","DRIVER","SELLER"]), product.orderhistoryfordriver);
router.get("/orderhistoryforvendor",isAuthenticated(["USER", "ADMIN","DRIVER","SELLER"]), product.orderhistoryforvendor);

router.get(
    "/productsearch",
    product.productSearch
);
router.get(
    "/getdriveramount",
    product.getdriveramount
);
router.get(
    "/getdriverpendingamount/:id",
    product.getdriverpendingamount
);

router.post(
    "/updateProductRequest/:id",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    product.updaterequestProduct
);

router.get(
    "/getProductRequest/:id",
    isAuthenticated(["USER", "ADMIN", "SELLER","DRIVER"]),
    product.getrequestProductbyid
);
router.get(
    "/collectcash/:id",
    isAuthenticated(["USER", "ADMIN", "SELLER","DRIVER"]),
    product.collectcash
);

router.get(
    "/getProductRequestbyUser",
    isAuthenticated(["USER", "ADMIN", "SELLER"]),
    product.getrequestProductbyuser
);
router.post(
    "/nearbyorderfordriver",
    isAuthenticated(["DRIVER"]),
    product.nearbyorderfordriver
);
router.get("/acceptedorderfordriver",isAuthenticated(["USER", "ADMIN","DRIVER","SELLER"]), product.acceptedorderfordriver);
router.post("/acceptorderdriver/:id",isAuthenticated(["USER", "ADMIN","DRIVER","SELLER"]), product.acceptorderdriver);
router.post("/getOrderByEmployee",isAuthenticated(["EMPLOYEE"]), product.getOrderByEmployee);
router.post("/getOrderHistoryByEmployee",isAuthenticated(["EMPLOYEE"]), product.getOrderHistoryByEmployee);

///withdrawreq
router.post("/createWithdrawreq",isAuthenticated(["USER", "ADMIN","DRIVER","SELLER"]), withdrawreq.createWithdrawreq);
router.get("/getWithdrawreq",isAuthenticated(["USER", "ADMIN","DRIVER","SELLER"]), withdrawreq.getWithdrawreq);
router.get("/getWithdrawreqbyseller",isAuthenticated(["USER", "ADMIN","DRIVER","SELLER"]), withdrawreq.getWithdrawreqbyseller);
router.post("/updateWithdrawreq",isAuthenticated(["USER", "ADMIN","DRIVER","SELLER"]), withdrawreq.updateWithdrawreq);


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

// Shipping Addres API
router.get("/getShippingAddress", isAuthenticated(["USER", "ADMIN", "SELLER"]), user.getShippingAddress);

// Tax calculation API
router.post("/addOrUpdateTax", isAuthenticated(["ADMIN", "SELLER"]), user.addOrUpdateTax);
router.get("/getTax", user.getTax);
// router.post("/updateTax", isAuthenticated(["USER", "ADMIN", "SELLER"]), user.updateTax);

// Employee API
router.post("/createEmployee", isAuthenticated(["SELLER"]), user.createEmployee);
router.get("/getEmployee", isAuthenticated(["ADMIN","SELLER"]), user.getEmployeeList);
router.post("/updateEmployee", isAuthenticated(["ADMIN","SELLER"]), user.updateEmployee);
router.delete("/deleteEmployee/:id", isAuthenticated(["ADMIN","SELLER"]), user.deleteEmployee);
router.get("/getEmployeeById/:id", isAuthenticated(["ADMIN","SELLER"]), user.getEmployeeById);
// router.post("/assignOrder", isAuthenticated(["SELLER"]), product.assignOrderToEmployee);
router.post("/assignOrder", isAuthenticated(["SELLER"]), product.assignOrderToEmployee);
router.get("/getSellerEmployeeByAdmin", isAuthenticated(["ADMIN"]), user.getSellerEmployeeByAdmin);

router.get("/getSellerStats/:sellerId", isAuthenticated(["ADMIN", "SELLER"]), user.getSellerStats);
router.post("/export/detailed-seller-report", isAuthenticated(["ADMIN"]), user.exportDetailedSellerReport);

// Dashboard stats
// router.get("/getDashboardStats", isAuthenticated(["ADMIN", "SELLER"]), user.getDashboardStats);

module.exports = router;
