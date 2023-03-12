const express = require("express");
const user_route = express.Router();
const userController = require("../controllers/userController");
const auth = require("../middleware/auth");



//gets
user_route.get("/register",auth.isLogout, userController.loadRegister);

user_route.get("/otp",userController.loadOtp)

user_route.get("/",userController.loadHome);

user_route.get("/login",auth.isLogout, userController.loginLoad);

user_route.get("/home",auth.isLogin, userController.loadHome);

user_route.get("/products",auth.isLogin, userController.loadProducts);

user_route.get("/Gproducts", userController.guestProducts);

user_route.get("/cart",auth.isLogin,userController.loadCart);

user_route.get("/logout", userController.userLogout);

user_route.get("/singleProduct",userController.singleProduct)

user_route.get("/addToCart",auth.isLogin,userController.addToCart)

user_route.get("/deleteCart",auth.isLogin,userController.deleteCart)

user_route.get('/wishlist',auth.isLogin,userController.loadWishlist)

user_route.get("/checkout",auth.isLogin,userController.loadCheckout)

user_route.get("/dashboard",auth.isLogin,userController.dashboard)

user_route.get("/deleteaddress",auth.isLogin,userController.deleteAddress)

user_route.get('/orderSuccess',auth.isLogin, userController.loadSuccess)

user_route.get("/viewOrder",auth.isLogin,userController.viewOrder)

user_route.get("/cancelOrder",auth.isLogin,userController.cancelOrder)

user_route.get('/returnProduct',auth.isLogin, userController.returnProduct)

user_route.get('/AddToWishlist',auth.isLogin, userController.addToWishlist)

user_route.get('/deleteWishlist', auth.isLogin,userController.deleteWishlist)

user_route.get('/addToCartDeleteWishlist',auth.isLogin, userController.addCartDeleteWishlist)

user_route.get('/profile',auth.isLogin,userController.loadProfile)

user_route.get('/forgetPassword',auth.isLogout,userController.forgetPassword)

user_route.get('/loginMobile',auth.isLogout,userController.loginMobileload)

user_route.get('/loginOtp',auth.isLogout,userController.loginOtpLoad)

user_route.get('/forgotPassword',auth.isLogout,userController.renderForgotPasswordForm)

user_route.get("*",userController.errorPage)

//posts

user_route.post("/register", userController.insertUser);

user_route.post("/verifyOtp",userController.verifyOtp)

user_route.post("/login", userController.verifyLogin);

user_route.post('/editCart',userController.editCart)

user_route.post("/addAddress",userController.addAddress)

user_route.post('/addCoupon',userController.addCoupon)

user_route.post('/checkout',userController.storeOrder)

user_route.post('/editUser',userController.editUser);

user_route.post('/send-otp',userController.readMobile)

user_route.post('/otpLogin',userController.mobileLogin)

user_route.post('/changePassword',userController.changePassword)

user_route.post('/razorpay', userController.razorpayCheckout)

user_route.post('/forgot-password',userController.handleForgotPassword)

user_route.post('/enter-otp',userController.handleEnterOTP)

user_route.post('/change-password',userController.handleChangePassword)




module.exports = user_route;
