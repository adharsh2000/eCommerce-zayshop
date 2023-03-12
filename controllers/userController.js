const cors = require('cors');
const User = require('../model/userModel')
const Address = require("../model/addressModel");
const Order = require("../model/ordersModel");
const Offer = require("../model/offerModel");
const session = require('express-session')
const Category = require('../model/categoryModel')
const Product = require('../model/productModel')
const Banner = require("../model/bannerModel");
const Otp = require('../model/otpModel')
const bcrypt = require('bcrypt')
const fast2sms = require('fast-two-sms');
const { ObjectID } = require('bson')
const Razorpay = require("razorpay");
require('dotenv').config();

let isLoggedin = false
let userSession = false || {}

let newUser;
let newOtp;

let offer = {
  name: "None",
  type: "None",
  discount: 0,
  usedBy: false,
};
let couponTotal = 0;
let nocoupon;

const sendMessage = function (mobile, res) {
  let randomOTP = Math.floor(Math.random() * 10000);
  var options = {
    authorization: "gfdghdhd",
    message: `your OTP verification code is ${randomOTP}`,
    numbers: [mobile],
  }
  fast2sms
    .sendMessage(options)
    .then((response) => {
      console.log("otp send successfully");
    })
    .catch((error) => {
      console.log(error);
    });
  return randomOTP;
}

const loadOtp = async (req, res) => {
  const userData = await User.findById({ _id: newUser })
  const otp = sendMessage(userData.mobile, res);
  newOtp = otp;
  console.log("otp:", otp);
  res.render('user/verifyOtp', { otp: otp, user: newUser });
}

const verifyOtp = async (req, res, next) => {
  try {
    const otp = newOtp;
    const userData = await User.findById({ _id: req.body.user })
    if (otp == req.body.otp) {
      userData.is_verified = 1;
      const user = await userData.save();
      if (user) {
        res.redirect('/login')
      }
    } else {
      res.render('user/verifyOtp', { message: "Invalid OTP" })
    }
  } catch (error) {
  
    next(error);
  }
}

const loadRegister = async (req, res, next) => {
  try {
    userSession = req.session;
    if (!userSession.userId) {
      res.render('user/usersignup')
    }
  }
  catch (error) {
    next(error);
  }
}

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  }
  catch (error) {
    console.log(error.message)
  }
}

const insertUser = async (req, res, next) => {
  try {
    const email = req.body.email
    const isEamil = await User.findOne({ email: email })
    if (isEamil) {
      res.render("user/usersignup", {
        message: "Email is already Exists",
        isLoggedin
      })
    } else {
      const spassword = await securePassword(req.body.password)
      const user = new User({
        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mno,
        password: spassword,
      });
      const userData = await user.save();
      newUser = userData._id;
      if (userData) {
        res.redirect("/otp")
      }
      else {
        res.render('user/usersignup', { message: "your registration is failed", isLoggedin })
      }
    }
  } catch (error) {
    next(error);
  }
}

const loginLoad = async (req, res, next) => {
  try {
    if (req.session.userId) {
      res.render('user/userhome', { isLoggedin })
    } else {
      res.render('user/userlogin');
    }
  }
  catch (error) {
   
    next(error);
  }
};


const verifyLogin = async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password)
      if (passwordMatch) {
        if (userData.is_verified === 0) {
          res.render("user/userlogin", { message: "oops try after any time!" })
        } else {
          userSession = req.session
          userSession.userId = userData._id
          isLoggedin = true
          res.redirect('/home')
          
        }
      }
      else {
        res.render('user/userlogin', { message: 'email and password are incorrect', isLoggedin })
      }
    }
    else {
      res.render('user/userlogin', { message: 'email and password are incorrect', isLoggedin })
    }
  }
  catch (error) {
  
    next(error);
  }
}

const loadHome = async (req, res, next) => {
  try {
    userSession = req.session;
    userSession.couponTotal = couponTotal;
    userSession.nocoupon = nocoupon;
    userSession.offer = offer;
    const banner = await Banner.findOne({ is_active: 1 });
    
    res.render('user/userhome', {
      isLoggedin,
      banners: banner,
    })
  }
  catch (error) {
   
    next(error);
  }
}

const userLogout = async (req, res, next) => {
  try {
    userSession = req.session;
    userSession.userId = null
    isLoggedin = false
    
    res.redirect('/')
  }
  catch (error) {
   
    next(error);
  }
}


const loadProducts = async (req, res,next) => {
  try {
    userSession = req.session;
    const userData = await User.findById({ _id: userSession.userId });
    const cartCount = userData.cart.item.length;
    const wishlist = userData.wishlist.item.length;
    let search = "";
    if (req.query.search) {
      search = req.query.search;
    }
    
    const productData = await Product.find({
      isAvailable: 1,
      $or: [
        { name: { $regex: ".*" + search + ".*", $options: "i" } },
        { name: { $regex: ".*" + search + ".*", $options: "i" } },
      ]
    })

    const categoryData = await Category.find({ isAvailable: 1 });
    const ID = req.query.id;


    const data = await Category.findOne({ _id: ID });

    if (data) {
      const productData = await Product.find({ category: data.name });
      
      res.render("user/userproducts", {
        products: productData,
        isLoggedin,
        id: userSession.userId,
        Category: categoryData,
        cartcount: cartCount,
        wishCount: wishlist,
      });
    } else {
     
      res.render("user/userproducts", {
        isLoggedin,
        Category: categoryData,
        products: productData,
        id: userSession.userId,
        cartcount: cartCount,
        wishCount: wishlist,
      });
    }
  } catch (error) {
    next(error)
  }
};



const guestProducts = async (req, res, next) => {
  try {

    const productData = await Product.find({ isAvailable: 1 })
    const categoryData = await Category.find()
    res.render('user/userproducts', {
      isLoggedin,
      products: productData,
      Category: categoryData,
    })
  }
  catch (error) {
    
    next(error);
  }
}


const   singleProduct = async (req, res, next) => {
  try {
    const id = req.query.id
   
    const products = await Product.find()
    let productData;
    try {
       productData = await Product.findById({ _id: id }) 
    } catch (error) {
      next(error)
    }
    if (productData) {
      res.render('user/singleProduct', { product: productData, products: products, isLoggedin })
    } else {
      res.redirect('/home')
    }
   
  } catch (error) {
    
    next(error);
  }
}

const loadCart = async (req, res, next) => {
  try {
   
    userSession = req.session
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId })
      const completeUser = await userData.populate('cart.item.productId')
      const cartCount = userData.cart.item.length;
     
      res.render('user/cart', {
        isLoggedin,
        id: userSession.userId,
        cartProducts: completeUser.cart,
        cartcount: cartCount
      })
    } else {
      res.render('user/cart', {
        isLoggedin,
        id: userSession.userId
      })
    }
  }
  catch (error) {
   
    next(error);
  }
};


const addToCart = async (req, res, next) => {
  try {
    const productId = req.query.id
    userSession = req.session
    const userData = await User.findById({ _id: userSession.userId })
    const productData = await Product.findById({ _id: productId })
    userData.addToCart(productData)
    res.redirect('/products')
  } catch (error) {

    next(error);
  }
}




const editCart = async (req, res, next) => {
  try {
    const id = req.query.id;
    userSession = req.session;
    const userData = await User.findById({ _id: userSession.userId });
    const foundProduct = userData.cart.item.findIndex(
      (objInItems) => objInItems.productId == id
    );
    const qty = { a: parseInt(req.body.qty) }
    userData.cart.item[foundProduct].qty = qty.a
    userData.cart.totalPrice = 0;
    const price = userData.cart.item[foundProduct].price
    const totalPrice = userData.cart.item.reduce((acc, curr) => {
      return acc + curr.price * curr.qty;
    }, 0);
    userData.cart.totalPrice = totalPrice;
    await userData.save();
   
    res.json({ totalPrice, price })
  } catch (error) {
    
    next(error);
  }
};



const deleteCart = async (req, res, next) => {
  try {
    userSession = req.session
    const productId = req.query.id
    const userData = await User.findById({ _id: userSession.userId })
    userData.removefromCart(productId)
    res.redirect('/cart');
  } catch (error) {

    next(error);
  }
}


const loadWishlist = async (req, res, next) => {
  try {
    const userData = await User.findById({ _id: userSession.userId });
    const completeUser = await userData.populate("wishlist.item.productId");
    
    res.render("user/wishlist", {
      isLoggedin,
      id: userSession.userId,
      wishlistProducts: completeUser.wishlist,
    });
  } catch (error) {
   
    next(error);
  }
};


const addToWishlist = async (req, res, next) => {
  try {
    const productId = req.query.id;
    userSession = req.session;
    const userData = await User.findById({ _id: userSession.userId });
    const productData = await Product.findById({ _id: productId });
    userData.addToWishlist(productData);
   
    res.redirect("/products");
  } catch (error) {
    
    next(error);
  }
};

const addCartDeleteWishlist = async (req, res, next) => {
  try {
    userSession = req.session;
    const productId = req.query.id;
    const userData = await User.findById({ _id: userSession.userId });
    const productData = await Product.findById({ _id: productId });
    const add = await userData.addToCart(productData);
    if (add) {
      await userData.removefromWishlist(productId);
    }
    res.redirect("/wishlist");
  } catch (error) {
    
    next(error);
  }
};

const deleteWishlist = async (req, res, next) => {
  try {
    const productId = req.query.id;
    userSession = req.session;
    const userData = await User.findById({ _id: userSession.userId });
    await userData.removefromWishlist(productId);
    res.redirect("/wishlist");
  } catch (error) {
   
    next(error);
  }
};



const loadCheckout = async (req, res, next) => {
  try {
    userSession = req.session;
    const id = req.query.addressid;
    const userData = await User.findById({ _id: userSession.userId });
    const completeUser = await userData.populate("cart.item.productId");
    if (userSession.userId && completeUser.cart.totalPrice) {
      const addressData = await Address.find({ userId: userSession.userId });
      const selectAddress = await Address.findOne({ _id: id });
      const offer = await Offer.findOne({ _id: userSession.userId });
      let updatedTotal = userData.cart.totalPrice;
      if (userSession.couponTotal == 0) {
        //update coupon
        userSession.couponTotal = userData.cart.totalPrice;
      }
      
      if (updatedTotal < userSession.offer.discount) {
        let m="you need to buy more items";
      res.render("user/checkout", {
        isLoggedin,
        id: userSession.userId,
        cartProducts: completeUser.cart,
        offer: userSession.offer,
        couponTotal: userSession.couponTotal,
        nocoupon,
        qty: completeUser.cart.item.qty,
        addSelect: selectAddress,
        userAddress: addressData,
        message:m,
      });
    }else{
      res.render("user/checkout", {
        isLoggedin,
        id: userSession.userId,
        cartProducts: completeUser.cart,
        offer: userSession.offer,
        couponTotal: userSession.couponTotal,
        nocoupon,
        qty: completeUser.cart.item.qty,
        addSelect: selectAddress,
        userAddress: addressData,})
    }
      nocoupon = false;
    } else {
      res.redirect("/cart");
    }
  } catch (error) {
   
    next(error);
  }
};



const dashboard = async (req, res, next) => {
  try {
    userSession = req.session;
    const userData = await User.findById({ _id: userSession.userId });
    const orderData = await Order.find({ userId: userSession.userId }).sort({ createdAt: -1 })
    const addressData = await Address.find({ userId: userSession.userId });
  
    res.render("user/userDashboard", {
      isLoggedin,
      user: userData,
      userAddress: addressData,
      userOrders: orderData,
      id: userSession.userId,
    });
  } catch (error) {
   
    next(error);
  }
};


const addAddress = async (req, res, next) => {
  try {
    userSession = req.session;
    const addressData = Address({
      userId: userSession.userId,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      country: req.body.country,
      address: req.body.streetAddress,
      city: req.body.city,
      state: req.body.state,
      zip: req.body.zip,
      phone: req.body.mno,
    });
    await addressData.save();
    res.redirect("/dashboard");
  } catch (error) {
    
    next(error);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    userSession = req.session;
    const id = req.query.id;
    const userData = await User.findById({ _id: userSession.userId });
    const addressData = await Address.findByIdAndRemove({ _id: id })
    res.redirect("/dashboard")
  } catch (error) {
    
    next(error);
  }
}

const addCoupon = async (req, res, next) => {
  try {
    
    userSession = req.session;
    if (userSession.userId) {
      
      const userData = await User.findById({ _id: userSession.userId });
      
      const offerData = await Offer.findOne({ name: req.body.offer, expireAt: { $gt: Date.now() } }); // check if offer is not expired
      console.log(offerData);
      if (offerData) {
        
        if (offerData.usedBy.includes(userSession.userId)) {
          nocoupon = true;
          res.redirect("/checkout");
        } else {
          
          userSession.offer.name = offerData.name;
          userSession.offer.type = offerData.type;
          userSession.offer.discount = offerData.discount;
          let updatedTotal = userData.cart.totalPrice;
          if (userSession.offer.type === "percentage") {
            updatedTotal =
              updatedTotal -
              (updatedTotal * userSession.offer.discount) / 100;
            userSession.couponTotal = updatedTotal;
            offerData.usedBy.push(userSession.userId); // mark offer as used by current user
            await offerData.save();
            res.redirect("/checkout");
            
          } else if (userSession.offer.type === "flat") {
            
            if (updatedTotal > userSession.offer.discount) {
              updatedTotal = updatedTotal - userSession.offer.discount;
              userSession.couponTotal = updatedTotal;
              offerData.usedBy.push(userSession.userId); // mark offer as used by current user
              await offerData.save();
              res.redirect("/checkout");
            } else {
              res.redirect('/checkout')
            }
          }
          
        }
      } else {
        res.redirect("/checkout");
      }
    } else {
      res.redirect("/cart");
    }
  } catch (error) {
    
    next(error);
  }
};



const storeOrder = async (req, res, next) => {
  try {

    userSession = req.session;
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId });
      const completeUser = await userData.populate("cart.item.productId");
    
      userData.cart.totalPrice = userSession.couponTotal;
      const updatedTotal = await userData.save();
      if (!req.body.payment) {
        return res.status(400).send({ message: 'select payment type' });
      } else if(!req.body.firstname){
        return res.status(400).send({ message: 'fill first name' });
      }else if(!req.body.lastname){
        return res.status(400).send({ message: 'fill last name' });
      }else if(!req.body.country){
        return res.status(400).send({ message: 'fill country field' });
      }else if(!req.body.address){
        return res.status(400).send({ message: 'fill address field' });
      }else if(!req.body.city){
        return res.status(400).send({ message: 'fill city field' });
      }else if(!req.body.state){
        return res.status(400).send({ message: 'fill state field' });
      }else if(!req.body.zip){
        return res.status(400).send({ message: 'fill zip field' });
      }else if(!req.body.phone){
        return res.status(400).send({ message: 'fill phone field' });
      }
      

      if (completeUser.cart.totalPrice > 0) {
        const order = Order({
          userId: userSession.userId,
          payment: req.body.payment,
          firstname: req.body.firstname,
          lastname: req.body.lastname,
          country: req.body.country,
          address: req.body.address,
          city: req.body.city,
          state: req.body.state,
          zip: req.body.zip,
          phone: req.body.phone,
          products: completeUser.cart,
          offer: userSession.offer.name,
          discount: userSession.offer.discount,
          type: userSession.offer.type,
        });
        
        const orderProductStatus = [];
        for (const key of order.products.item) {
          orderProductStatus.push(0);
        }
        order.productReturned = orderProductStatus;

        const orderData = await order.save();
       
        userSession.currentOrder = orderData._id;

        req.session.currentOrder = order._id;

        const ordern = await Order.findById({ _id: userSession.currentOrder });
        const productDetails = await Product.find({ isAvailable: 1 });
        for (let i = 0; i < productDetails.length; i++) {
          for (let j = 0; j < ordern.products.item.length; j++) {
            if (
              productDetails[i]._id.equals(ordern.products.item[j].productId)
            ) {
              productDetails[i].sales += ordern.products.item[j].qty;
            }
          }
          productDetails[i].save();
        }

        const offerUpdate = await Offer.updateOne(
          { name: userSession.offer.name },
          { $push: { usedBy: userSession.userId } }
        );
        
        if (req.body.payment == "cod") {
          res.redirect("/orderSuccess");
        } else if (req.body.payment == "RazorPay") {
          res.render("user/razorPay", {
            isLoggedin,
            userId: userSession.userId,
            total: completeUser.cart.totalPrice,
            id: userSession.userId
          });
          
        } else {
          res.redirect("/checkout");
        }
      } else {
        res.redirect("/shop");
      }
    } else {
      res.redirect("/login");
    }
  } catch (error) {

    next(error);
  }
};


const loadSuccess = async (req, res, next) => {
  try {
    userSession = req.session;
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId });
      const productData = await Product.find();
      for (const key of userData.cart.item) {
        
        for (const prod of productData) {
          if (new String(prod._id).trim() == new String(key.productId).trim()) {
            prod.quantity = prod.quantity - key.qty;
            await prod.save();
          }
        }
      }
      await Order.find({
        userId: userSession.userId,
      });
      await Order.updateOne(
        { userId: userSession.userId, _id: userSession.currentOrder },
        { $set: { status: "Build" } }
      );
      await User.updateOne(
        { _id: userSession.userId },
        {
          $set: {
            "cart.item": [],
            "cart.totalPrice": "0",
          },
        },
        { multi: true }
      );
      console.log("Order Built and Cart is Empty.");
    }
    userSession.couponTotal = 0;
    res.render("user/orderSuccess", {
      orderId: userSession.currentOrder,
      id: userSession.userId,
      isLoggedin,
    });
  } catch (error) {
   
    next(error);
  }
};

const viewOrder = async (req, res, next) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      const id = req.query.id;
      userSession.currentOrder = id;
      const orderData = await Order.findById({ _id: id });
      const userData = await User.findById({ _id: userSession.userId });
      const offer = await Offer.find(); 
      let couponName
      let couponDiscount
      await orderData.populate("products.item.productId")
      res.render("user/viewOrder", {
        isLoggedin,
        order: orderData,
        user: userData,
        id: userSession.userId,
        offername:couponName,
        offerdiscount:couponDiscount,
        offer:offer,
      });
    } else {
      res.redirect("/login")
    }
  } catch (error) {
    
    next(error);
  }
}


const cancelOrder = async (req, res, next) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      const id = req.query.id;
      await Order.deleteOne({ _id: id })
      res.redirect("/dashboard")
    } else {
      res.redirect("/login")
    }
  } catch (error) {
   
    next(error);
  }
}



const returnProduct = async (req, res,next) => {
  try {
   userSession = req.session
       if(userSession = req.session){
           const id = req.query.id;
           
        

           await Order.updateOne({_id:id},{$set:{status:'Return requested'}})

           res.redirect('/dashboard')
  }
} catch (error) {
   next(error)
   }
}

const loadProfile = (req, res, next) => {
  try {
    res.render('profile')
  } catch (error) {
   
    next(error);
  }
}

const editUser = async (req, res, next) => {
  try {
    userSession = req.session;
    const userData = await User.findById({ _id: userSession.userId })
    if (userData) {
      await User.findByIdAndUpdate(
        { _id: userSession.userId },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
          },
        }
      );
      res.redirect('/dashboard');
    }
  } catch (error) {
    
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    userSession = req.session;
    const password1 = req.body.password1
    const password2 = req.body.password2
    const password3 = req.body.password3
    const userData = await User.findById({ _id: userSession.userId })
    if (userData) {
      const passwordMatch = await bcrypt.compare(password1, userData.password)
      if (passwordMatch) {
        if (password2 === password3) {
          const spassword = await securePassword(req.body.password2)
          await User.findByIdAndUpdate(
            { _id: userSession.userId },
            {
              $set: {
                password: spassword
              },
            }
          );
          res.redirect('/dashboard');
        }
      }
    }
  } catch (error) {
    next(error)
  }
}

const razorpayCheckout = async (req, res) => {
  userSession = req.session;
  const userData = await User.findById({ _id: userSession.userId });
  const completeUser = await userData.populate("cart.item.productId");
  var instance = new Razorpay({
    key_id: process.env.key_id,
    key_secret: process.env.key_secret,
  });
  let order = await instance.orders.create({
    amount: completeUser.cart.totalPrice * 100,
    currency: "INR",
    receipt: "receipt#1",
  });
 
  res.status(201).json({
    success: true,
    order,
});

};


const forgetPassword = (req,res,next)=>{
  try {
    res.render('user/forgetPassword')
  } catch (error) {
    next(error)
  }
}

const loginMobileload = (req,res,next)=>{
  try {
    res.render('user/otpMobile')
  } catch (error) {
    next(error)
  }
}

const loginOtpLoad = (req,res,next) => {
  try {
    res.render('user/otpLogin')
  } catch (error) {
    next(error);
  }
}

const readMobile = (req,res,next)=>{
  try {
  const mobile = req.body.mno;
  const otp = sendMessage(mobile, res);
  const timestamp = new Date();
  console.log('otp'+otp);

  // Store OTP in database or cache
  const otpData = new Otp({ mobile, otp, timestamp });
  otpData.save((err) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error saving OTP');
    } else {
      // res.redirect('/loginOtp')
      res.render('user/otpLogin',{mobile:mobile})
    }});
  } catch (error) {
    next(error)
  }
}

const mobileLogin =async (req,res,next)=> {
  try {
    const mobile = req.body.mno;
  const otp = req.body.otp;
 

  // Retrieve stored OTP from database or cache
  const otpData = await Otp.findOneAndRemove({ otp:otp });
  
  if(otpData){
    const userData = await User.findOne({ mobile: mobile });
    userSession = req.session
          userSession.userId = userData._id
          
          isLoggedin = true
    res.redirect('/home')
  }else{
    res.render('user/otpLogin',{message:"invalid Otp try again",mobile:mobile})
  }
  } catch (error) {
    next(error)
  }
}

const forgotPassword = async (req, res,next) => {
  try {
    res.render("user/forgetPassword", {
      email: true,
      enterOtp: false,
      changePassword: false,
      success: false,
    });
  } catch (error) {
    next(error)
  }
};

const forgotPasswordEmail = async (req, res,next) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
    
    const otp = sendMessage(userData.mobile, res);
    newOtp = otp;
    console.log("otp:", otp);
    res.render("user/forgetPassword", {
      email: false,
      enterOtp: true,
      changePassword: false,
      otp: newOtp,
      user: email,
      success: false,
    });
  } catch(error){
    next(error)
  }
};

const forgotPasswordOtp = async (req, res,next) => {
  try {
    const otp = newOtp;
    console.log("OTP: " + otp);
    const userData = req.body.user;
    const otpBody = req.body.otp;
    console.log("otpBody:" + otpBody);
    if (otp == req.body.otp) {
      res.render("user/forgetPassword", {
        email: false,
        enterOtp: false,
        changePassword: true,
        user: userData,
        success: false,
      });
    } else {
      res.render("user/verifyOtp", { message: "Invalid OTP",otp:otp,user:userData });
    }
  } catch (error) {
    next(error)
  }
};

const changePasswd = async (req, res,next) => {
  try {
    const password1 = req.body.password1;
    const password2 = req.body.password2;
    const user = req.body.user;
    const userData = await User.find({ email: user });

    if (userData) {
      if (password1 == password2) {
        const spassword = await securePassword(req.body.password2);

        await User.findOneAndUpdate(
          { email: user },
          {
            $set: {
              password: spassword,
            },
          }
        );
        res.render("user/forgetPassword", {
          email: false,
          enterOtp: false,
          changePassword: false,
          user: userData,
          success: true,
        });
      }
    }
  } catch (error) { 
    next(error);
  }
};

const renderForgotPasswordForm = (req, res) => {
  res.render('user/forgetPassword', { message: null });
};

const handleForgotPassword = async (req, res,next) => {
  try {
    const email = req.body.email;

    // Find the user by email
    const user = await User.findOne({ email: email });

    if (!user) {
      // User not found with given email
      res.render('user/forgetPassword', { message: 'User not found' });
      return;
    }

    // Generate and send OTP to user
    const otp = sendMessage(user.mobile, res);
    console.log(otp);

    // Save the OTP in session
    req.session.otp = otp;
    req.session.userEmail = email;

    // Render enter OTP form
    res.render('user/enter-otp', { message: null });
  } catch (error) {
    next(error)
  }
};

// Handle enter OTP request
const handleEnterOTP = (req, res,next) => {
  try {
    const enteredOTP = req.body.otp;
    const savedOTP = req.session.otp;
    console.log("ent"+enteredOTP);
    console.log("sav"+savedOTP);

    if (enteredOTP != savedOTP) {
      // Invalid OTP
      
      res.render('user/enter-otp', { message: 'Invalid OTP' });
      return;
    }
    

    // OTP is valid, render change password form
    res.render('user/change-password', { message: null });
  } catch (error) {
    next(error)
  }
};

// Handle change password request
const handleChangePassword = async (req, res,next) => {
  try {
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    if (password != confirmPassword) {
      // Passwords do not match
      res.render('user/change-password', { message: 'Passwords do not match' });
      return;
    }

    // Passwords match, update the user's password
    const userEmail = req.session.userEmail;
    const hashedPassword = await securePassword(password);

    await User.updateOne({ email: userEmail }, { password: hashedPassword });

    // Password changed successfully
    res.render('user/userlogin', { message: 'Password changed successfully' });
  } catch (error) {
    next(error)
  }
};


const errorPage = (req, res) => {
  res.render('user/404');
}


module.exports = {
  loadRegister,
  securePassword,
  insertUser,
  loadOtp,
  verifyOtp,
  loginLoad,
  verifyLogin,
  loadHome,
  userLogout,
  loadProducts,
  guestProducts,
  loadCart,
  singleProduct,
  addToCart,
  editCart,
  deleteCart,
  loadWishlist,
  addToWishlist,
  addCartDeleteWishlist,
  deleteWishlist,
  loadCheckout,
  dashboard,
  addAddress,
  errorPage,
  deleteAddress,
  addCoupon,
  storeOrder,
  loadSuccess,
  viewOrder,
  cancelOrder,
  returnProduct,
  loadProfile,
  editUser,
  changePassword,
  razorpayCheckout,
  forgetPassword,
  loginMobileload,
  loginOtpLoad,
  readMobile,
  mobileLogin,
  forgotPassword,
  forgotPasswordEmail,
  forgotPasswordOtp,
  changePasswd,
  renderForgotPasswordForm,
  handleForgotPassword,
  handleEnterOTP,
  handleChangePassword,
}
