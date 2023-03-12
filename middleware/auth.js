
const User = require('../model/userModel');

let userSession = false || {};
let isLoggedin;

const isLogin = async (req, res, next) => {
  try {
    userSession = req.session;
    
    if (userSession.userId) {
      
      userData = await User.findById({ _id : userSession.userId})
      if(userData.is_verified){
        
      
      next();
    }else{
      
      userSession.userId = null;
      res.redirect("/login")
      
    }
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};




const isLogout = async (req, res, next) => {
  try {
    userSession = req.session;
    if (userSession.userId) {
      isLoggedin = false;
      res.redirect("/home");
    } else {
      next();
    }
  } catch (error) {
    console.log(error.message);
  }
};



module.exports = {
  isLogin,
  isLogout,
  isLoggedin,
  userSession
};

