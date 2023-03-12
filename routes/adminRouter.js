const express = require("express");
const adminRouter = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware')
const adminController = require('../controllers/adminController')
const multer = require('../util/multer')

//gets

adminRouter.get('/',adminController.loadAdminLogin)

adminRouter.get('/dashBoard',adminMiddleware.isLogin,adminController.loadDashboard)

adminRouter.get('/user',adminMiddleware.isLogin,adminController.loadAdminUser)

adminRouter.get('/addProduct',adminMiddleware.isLogin,adminController.loadAddProduct)

adminRouter.get('/adminCategory',adminMiddleware.isLogin,adminController.loadCategory)

adminRouter.get('/adminProduct',adminMiddleware.isLogin,adminController.adminProduct)

adminRouter.get('/adminProduct',adminMiddleware.isLogin,adminController.adminProduct)

adminRouter.get('/blockUser',adminMiddleware.isLogin,adminController.blockUser)

adminRouter.get('/adminLogout',adminMiddleware.isLogin,adminController.adminLogout)

adminRouter.get('/editProduct',adminMiddleware.isLogin,adminController.loadEditProduct)

adminRouter.get('/listProduct',adminMiddleware.isLogin,adminController.listProduct)

adminRouter.get('/unlistProduct',adminMiddleware.isLogin,adminController.unlistProduct)

adminRouter.get('/unlistCategory',adminMiddleware.isLogin,adminController.unlistCategory)

adminRouter.get('/listCategory',adminMiddleware.isLogin,adminController.listCategory)

adminRouter.get("/offer",adminMiddleware.isLogin,adminController.loadOffer)

adminRouter.get("/deleteOffer",adminMiddleware.isLogin,adminController.deleteOffer)

adminRouter.get("/orderReport",adminMiddleware.isLogin,adminController.adminViewOrder)

adminRouter.get('/adminOrderDetails',adminMiddleware.isLogin,adminController.adminOrderDetails)

adminRouter.get('/adminCancelOrder', adminMiddleware.isLogin,adminController.cancelOrder);

adminRouter.get('/confirmOrder',adminMiddleware.isLogin, adminController.confirmOrder);

adminRouter.get('/adminDeliveredOrder',adminMiddleware.isLogin,adminController.adminDeliveredOrder);

adminRouter.get("/loadBanner",adminMiddleware.isLogin,adminController.loadBanner)

adminRouter.get('/currentBanner',adminMiddleware.isLogin,adminController.activeBanner)

adminRouter.get('/stockReport',adminMiddleware.isLogin,adminController.stockReport)

adminRouter.get('/viewProduct',adminMiddleware.isLogin,adminController.viewProduct)

adminRouter.get('/stockReport',adminMiddleware.isLogin,adminController.stockReport)

adminRouter.get('/download',adminMiddleware.isLogin,adminController.adminDownload);

adminRouter.get('/datedownload',adminMiddleware.isLogin,adminController.adminDateDownload);

adminRouter.get('/loadFullsales',adminMiddleware.isLogin,adminController.salesReport)

adminRouter.get('/loadAdminReturn',adminMiddleware.isLogin,adminController.loadAdminReturn)

adminRouter.get('/AdminReturnProduct',adminMiddleware.isLogin,adminController.AdminReturnProduct)

adminRouter.get('/AdminNoReturn',adminMiddleware.isLogin,adminController.AdminNoReturn)


//posts

adminRouter.post('/login',adminController.verifyAdminLogin)

adminRouter.post('/adminCategory',adminController.addCategory)

adminRouter.post('/addProduct',multer.upload.array('sImage'),adminController.addProduct)

adminRouter.post('/editProduct',multer.upload.array('sImage'),adminController.editProduct)

adminRouter.post('/offers', adminController.addOffer)

adminRouter.post('/loadBanner',multer.upload.array('bannerImage',3),adminController.addBanner)

adminRouter.post('/datewiseReport',adminController.datewiseReport)

module.exports = adminRouter;



