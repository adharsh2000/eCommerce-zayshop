const cors = require('cors');
const User = require('../model/userModel')
const Address = require("../model/addressModel");
const Order = require("../model/ordersModel");
const Offer = require("../model/offerModel");
const session = require('express-session')
const Category = require('../model/categoryModel')
const Product = require('../model/productModel')
const Banner = require("../model/bannerModel");
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
    authorization: process.env.OTP_KEY,
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
    // console.log(error.message);
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
    // console.log(error.message)
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
    // console.log(error.message);
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
    // console.log(error.message);
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
        // if (userData.is_admin === 1) {
        //     res.render('userlogin', { message: "not a user" })
        // } else {
        //     userSession = req.session;
        //     userSession.userId = userData._id
        //     isLoggedin = true;
        //     res.redirect('/home')
        //     console.log("log in")
        // }
        if (userData.is_verified === 0) {
          res.render("user/userlogin", { message: "oops try after any time!" })
        } else {
          userSession = req.session
          userSession.userId = userData._id
          // console.log(userSession.userId);
          isLoggedin = true
          res.redirect('/home')
          console.log("log in");
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
    // console.log(error.message);
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
    // const userData = await User.findById({ _id: userSession.userId })
    // const productData = await Product.find({ isAvailable: 1 })
    // const categoryData = await Category.find()
    // const cartCount = await userData.cart.item.length;
    // res.render('userhome', {
    res.render('user/userhome', {
      isLoggedin,
      banners: banner,
      // id: userSession.userId,
      // id: userSession.userId,
      // products: productData,
      // Category: categoryData,
      // cartcount: cartCount
    })
  }
  catch (error) {
    // console.log(error.message)
    next(error);
  }
}

const userLogout = async (req, res, next) => {
  try {
    userSession = req.session;
    userSession.userId = null
    isLoggedin = false
    console.log('logged out')
    res.redirect('/')
  }
  catch (error) {
    // console.log(error.message)
    next(error);
  }
}

const loadProducts = async (req, res, next) => {
  try {
    const userData = await User.findById({ _id: userSession.userId });
    const productData = await Product.find({ isAvailable: 1 })
    const categoryData = await Category.find()
    const cartCount = userData.cart.item.length;
    const wishlist = userData.wishlist.item.length;
    res.render('user/userproducts', {
      isLoggedin,
      id: userSession.userId,
      products: productData,
      Category: categoryData,
      cartcount: cartCount,
      wishCount: wishlist,
    })
  }
  catch (error) {

    next(error);
  }
}

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
    // console.log(error.message)
    next(error);
  }
}


const singleProduct = async (req, res, next) => {
  try {
    const id = req.query.id
    console.log(id);
    const products = await Product.find()
    const productData = await Product.findById({ _id: id })
    if (productData) {
      res.render('user/singleProduct', { product: productData, products: products, isLoggedin })
    } else {
      res.redirect('/home')
    }
    // res.render('singleProduct')
  } catch (error) {
    // console.log(error.message);
    next(error);
  }
}

const loadCart = async (req, res, next) => {
  try {
    // res.render('usercart', { isLoggedin, id: userSession.userId });
    userSession = req.session
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId })
      const completeUser = await userData.populate('cart.item.productId')
      const cartCount = userData.cart.item.length;
      // console.log(cartCount);
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
    // console.log(error.message);
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
    // console.log(error.message);
    next(error);
  }
}


//edit cart

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
    // res.redirect("/cart");
    res.json({ totalPrice, price })
  } catch (error) {
    // console.log(error.message);
    next(error);
  }
};


// const editCart = async (req, res, next) => {
//   try {
//     const id = req.query.id;
//     userSession = req.session;
//     const userData = await User.findById({ _id: userSession.userId });
//     const foundProduct = userData.cart.item.findIndex(
//       (objInItems) => objInItems.productId == id
//     );
//       console.log(userData.cart.item);
//     console.log("Found Product: ", foundProduct);

//     if (foundProduct === -1) {
//       throw new Error("Product not found in cart");
//     }

//     const qty = { a: parseInt(req.body.qty) };
//     userData.cart.item[foundProduct].qty = qty.a;
//     userData.cart.totalPrice = 0;
//     const price = userData.cart.item[foundProduct].price;
//     const totalPrice = userData.cart.item.reduce((acc, curr) => {
//       return acc + curr.price * curr.qty;
//     }, 0);
//     userData.cart.totalPrice = totalPrice;
//     await userData.save();
//     // res.redirect("/cart");
//     res.json({ totalPrice, price });
//   } catch (error) {
//     // console.log(error.message);
//     next(error);
//   }
// };

// const editCart = async (req, res, next) => {
//   try {
//     const id = req.query.id;
//     userSession = req.session;
//     const userData = await User.findById({ _id: userSession.userId });
//     const foundProduct = userData.cart.item.findIndex(
//       (objInItems) => objInItems.productId == id
//     );
//     if (foundProduct === -1) {
//       throw new Error('Product not found in cart');
//     }
//     if (!req.body.qty || isNaN(parseInt(req.body.qty))) {
//       throw new Error('Invalid quantity value');
//     }
//     console.log(req.body.qty);
//     const qty = parseInt(req.body.qty);
//     userData.cart.item[foundProduct].qty = qty;
//     userData.cart.totalPrice = 0;
//     const totalPrice = userData.cart.item.reduce((acc, curr) => {
//       return acc + curr.price * curr.qty;
//     }, 0);
//     userData.cart.totalPrice = totalPrice;
//     await userData.save();
//     res.json({ totalPrice, price: userData.cart.item[foundProduct].price });
//   } catch (error) {
//     next(error);
//   }
// };



const deleteCart = async (req, res, next) => {
  try {
    userSession = req.session
    const productId = req.query.id
    const userData = await User.findById({ _id: userSession.userId })
    userData.removefromCart(productId)
    res.redirect('/cart');
  } catch (error) {
    // console.log(error.message);
    next(error);
  }
}


const loadWishlist = async (req, res, next) => {
  try {
    const userData = await User.findById({ _id: userSession.userId });
    const completeUser = await userData.populate("wishlist.item.productId");
    // console.log(completeUser);
    res.render("user/wishlist", {
      isLoggedin,
      id: userSession.userId,
      wishlistProducts: completeUser.wishlist,
    });
  } catch (error) {
    // console.log(error.message);
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
    // console.log(productData);
    res.redirect("/products");
  } catch (error) {
    // console.log(error.messsage);
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
    // console.log(error.message);
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
    // console.log(error.message);
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
    // console.log(error.message);
    next(error);
  }
};

// const dashboard = async (req, res) => {
//     try {
//         res.render('userDashboard')
//     } catch (error) {
//         console.log(error.message);
//     }
// }

const dashboard = async (req, res, next) => {
  try {
    userSession = req.session;
    const userData = await User.findById({ _id: userSession.userId });
    const orderData = await Order.find({ userId: userSession.userId }).sort({ createdAt: -1 })
    const addressData = await Address.find({ userId: userSession.userId });
    // console.log(orderData);
    // console.log(addressData);
    res.render("user/userDashboard", {
      isLoggedin,
      user: userData,
      userAddress: addressData,
      userOrders: orderData,
      id: userSession.userId,
    });
  } catch (error) {
    // console.log(error.message);
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
    // console.log(error.message);
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
    // console.log(error.message);
    next(error);
  }
}

const addCoupon = async (req, res, next) => {
  try {
    console.log('a');
    userSession = req.session;
    if (userSession.userId) {
      console.log('b');
      const userData = await User.findById({ _id: userSession.userId });
      // console.log(userData);
      const offerData = await Offer.findOne({ name: req.body.offer, expireAt: { $gt: Date.now() } }); // check if offer is not expired
      console.log(offerData);
      if (offerData) {
        console.log('c');
        if (offerData.usedBy.includes(userSession.userId)) {
          nocoupon = true;
          res.redirect("/checkout");
        } else {
          console.log('d');
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
            console.log('e');
          } else if (userSession.offer.type === "flat") {
            console.log('f');
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
          console.log('g');
        }
      } else {
        res.redirect("/checkout");
      }
    } else {
      res.redirect("/cart");
    }
  } catch (error) {
    // console.log(error.message);
    next(error);
  }
};

// const addCoupon = async (req, res,next) => {
//   try {
//     userSession = req.session;
//     if (userSession.userId) {
//       const userData = await User.findById({ _id: userSession.userId });
//       const offerData = await Offer.findOne({ name: req.body.name, expireAt: {$gt: Date.now()} }); // check if offer is not expired
//       if (offerData) {
//         if (offerData.usedBy.includes(userSession.userId)) {
//           nocoupon = true;
//           res.redirect("/checkout");
//         } else {
//           console.log('a');
//           userSession.offer.name = offerData.name;
//           userSession.offer.type = offerData.type;
//           userSession.offer.discount = offerData.discount;
//           let updatedTotal = userData.cart.totalPrice;
//           if (userSession.offer.type === "percentage") {
//             updatedTotal =
//               updatedTotal -
//               (updatedTotal * userSession.offer.discount) / 100;
//               console.log('b');
//           } else if (userSession.offer.type === "flat") {
//             console.log('c');
//             updatedTotal = updatedTotal - userSession.offer.discount;
//           }
//           console.log('d');
//           userSession.couponTotal = updatedTotal;
//           offerData.usedBy.push(userSession.userId); // mark offer as used by current user
//           await offerData.save();
//           res.redirect("/checkout");
//         }
//       } else {
//         res.redirect("/checkout");
//       }
//     } else {
//       res.redirect("/cart");
//     }
//   } catch (error) {
//     // console.log(error.message);
//     next(error);
//   }
// };

const storeOrder = async (req, res, next) => {
  try {

    userSession = req.session;
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId });
      const completeUser = await userData.populate("cart.item.productId");
      // console.log('CompleteUser: ', completeUser)
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
          offer: userSession.offer,
          discount: userSession.offer.discount,
        });
        // let offer = req.body.offer
        const orderProductStatus = [];
        for (const key of order.products.item) {
          orderProductStatus.push(0);
        }
        order.productReturned = orderProductStatus;

        const orderData = await order.save();
        // console.log(orderData)
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
    // console.log(error.message);
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
        console.log(key.productId, " + ", key.qty);
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
    // console.log(error.message);
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
      // console.log(offer.usedBy);
      // for(i=0;i<1;i++){
      // if(userData._id===offer.usedBy[i].){

      // }}
//       let availableCoupons = []; // Assuming this is an array of available coupons
// let usedCoupons = [];
// // Loop through all available coupons
// for (let i = 0; i < offer.length; i++) {
//   // Loop through the usedBy array of the coupon
//   for (let j = 0; j < offer[i].usedBy.length; j++) {
//     // Check if the user ID is present in the usedBy array
//     if (offer[i].usedBy[j].toString() === userData._id.toString()) {
//       // Store the coupon name and discount in the order model
//       couponName = offer[i].name;
//       couponDiscount = offer[i].discount;
//       Order.findOneAndUpdate(
//         { _id: id },
//         { couponName: couponName, couponDiscount: couponDiscount },
//         { new: true },
//         (err, updatedOrder) => {
//           if (err) {
//             console.log(err);
//           } else {
//             console.log(updatedOrder);
//           }
//         }
//       );
//       usedCoupons.push(offer[i].name);
//       break; // Exit the loop if the user ID is found in the usedBy array
//     }
//   }
// }
      
      // console.log(offer[0].usedBy[0]);
      
      // console.log(userData);
      await orderData.populate("products.item.productId")
      res.render("user/viewOrder", {
        isLoggedin,
        order: orderData,
        user: userData,
        id: userSession.userId,
        offername:couponName,
        offerdiscount:couponDiscount,
        offer:offer
      });
    } else {
      res.redirect("/login")
    }
  } catch (error) {
    // console.log(error.message);
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
    // console.log(error.message);
    next(error);
  }
}


const returnProduct = async (req, res, next) => {
  try {
    userSession = req.session;
    if ((userSession = req.session)) {
      const id = req.query.id;
      const productOrderData = await Order.findById({
        _id: ObjectID(userSession.currentOrder),
      });
      const productData = await Product.findById({ _id: id });
      if (productOrderData) {
        for (let i = 0; i < productOrderData.products.item.length; i++) {
          if (
            new String(productOrderData.products.item[i].productId).trim() ===
            new String(id).trim()
          ) {
            productData.quantity += productOrderData.products.item[i].qty;
            productOrderData.productReturned[i] = 1;
            await productData.save().then(() => {
              console.log("productData saved");
            });
            await Order.updateOne(
              { userId: userSession.userId, _id: userSession.currentOrder },
              { $set: { status: "Returned" } }
            );
            await productOrderData.save().then(() => {
              console.log("productOrderData saved");
              // console.log(productOrderData);
            });
          } else {
          }
        }
        res.redirect("/dashboard");
      }
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    // console.log(error.message);
    next(error);
  }
};

const loadProfile = (req, res, next) => {
  try {
    res.render('profile')
  } catch (error) {
    // console.log(error.message);
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
    // console.log(error.message);
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
  // console.log(req.body);
  // console.log(completeUser.cart.totalPrice);
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

const forgetPassword = (req,res)=>{
  try {
    res.render('user/forgetPassword')
  } catch (error) {
    console.log(error.message);
  }
}



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
}
