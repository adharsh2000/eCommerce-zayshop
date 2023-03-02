const User = require('../model/userModel')
const Admin = require('../model/adminModel')
const Product = require('../model/productModel')
const Order = require('../model/ordersModel')
const Category = require('../model/categoryModel')
const Offer = require('../model/offerModel')
const Banner = require('../model/bannerModel')
const bcrypt = require('bcrypt')
const { name } = require('ejs')
const sharp = require('sharp')
const Jimp = require('jimp')
const paginate = require('express-paginate');


let isAdminLoggedin
isAdminLoggedin = false
let adminSession = false || {}
let orderType = 'all'


const loadAdminLogin = async (req, res,next) => {
    try {
      res.render('Admin/adminLogin');
    } catch (error) {
      // console.log(error.message);
      next(error)
    }
  };


  const verifyAdminLogin = async(req,res,next)=>{
    try{
        const name = req.body.name;
        const password = req.body.password;

        const adminData = await Admin.findOne({name:name})
        
       
        if(adminData){
            const passwordMatch = await bcrypt.compare(password, adminData.password)
            // console.log(passwordMatch)
            if(passwordMatch){
                if(adminData){
                    adminSession = req.session
                    isAdminLoggedin = true 
                    adminSession.adminId = adminData._id
                    res.redirect('/admin/dashboard')
                    console.log('Admin logged in');
                }else{
                  
                    res.render('Admin/adminLogin',{message:"Please redirect to user page"})
                    
                   
                }
        }else{
            res.render('Admin/adminLogin',{message:"Email and password is incorrect."})
        }
    } else {
        res.render('Admin/adminLogin', { message: 'Email and password is incorrect.' })
      }
    }   catch(error){
        // console.log(error.message)
        next(error)
    }
}


const loadAddProduct = async (req,res,next)=>{
  const productData = await Product.find()
    const categoryData = await Category.find({isAvailable:1})
   try{ res.render('Admin/addProduct',{category:categoryData,products:productData})
  }
  catch(error){
    // console.log(error.message);
    next(error)
  }

}

const addProduct = async (req,res,next)=>{

    try{

        const images = req.files;
        
        const product = Product({
            name: req.body.sName,
            category: req.body.sCategory,
            price: req.body.sPrice,
            description: req.body.sDescription,
            quantity: req.body.sQuantity,
            rating: req.body.sRating,
            image: images.map((x)=>x.filename)
        })
        const productData = await product.save()
        const categoryData = await Category.find()
        if(productData){
            res.render('Admin/addProduct', {category:categoryData,message: "Product added successfully"})
        }else{
            res.render('Admin/addProduct',{category:categoryData,message:"Product add failed"})
        }
    }catch(error){
        next(error)
    }
}

// const addProduct = async (req, res, next) => {
//   try {
//     const images = req.files;
//     const product = Product({
//       name: req.body.sName,
//       category: req.body.sCategory,
//       price: req.body.sPrice,
//       description: req.body.sDescription,
//       quantity: req.body.sQuantity,
//       rating: req.body.sRating,
//       image: [],
//     });

//     for (let i = 0; i < images.length; i++) {
//       const image = images[i];
//       const filename = image.filename;

//       // Resize the image to a specific width and height
//       const jimpImage = await Jimp.read(image.path);
//       jimpImage.resize(400, 400); // Example resize of 500x500 pixels
//       await jimpImage.writeAsync(image.path);

//       product.image.push(filename);
//     }

//     const productData = await product.save();
//     const categoryData = await Category.find();
//     if (productData) {
//       res.render("Admin/addProduct", {
//         category: categoryData,
//         message: "Product added successfully",
//       });
//     } else {
//       res.render("Admin/addProduct", {
//         category: categoryData,
//         message: "Product add failed",
//       });
//     }
//   } catch (error) {
//     next(error);
//   }
// };


const loadEditProduct = async(req,res,next)=>{
    try {
        const id = req.query.id
        
        const productData = await Product.findById({ _id:id })
        const categoryData = await Category.find({isAvailable:1}) 

        if(productData){
            res.render('Admin/editProduct',{ products:productData , category:categoryData})
        }
        else{
            res.redirect('/admin/adminProduct',{message:"Product doesn'nt exist"})
        }

    } catch (error) {
        // console.log(error.message);
        next(error)
    }
}




// const editProduct = async (req, res,next) => {
//   try {
//     const id = req.params.id;
//     const name = req.body.sName
//     const category = req.body.sCategory
//     const price = req.body.sPrice
//     const quantity = req.body.sQuantity
//     const rating = req.body.sRating
//     const description = req.body.sDescription
//     const files=req.files
//     const image = files.map((x)=>x.filename)

//     // console.log(image);


//     if (image.length==0) {
     
//       await Product.updateOne(
//         { _id:id },
//         {
//           $set: {
//             name,
//             category,
//             description,
//             price,
//             quantity,
//             rating,
//           }
//         }
//       )
      
//     } else {
       
//       await Product.updateOne(
//         { _id:req.body.id },
//         { 
//           $set: {
//             name,
//             category,
//             price,
//             description,
//             quantity,
//             rating,
//             image,
//           }
//         }
//       )

//     }
   
//     res.redirect('/admin/adminProduct')
//   } catch (error) {
//     // console.log(error.message)
//     next(error)
//   }
// }

const viewProduct = async (req,res,next) => {
  try {
    const id = req.query.id;
    // console.log(id);
    const product = await Product.find({_id:id});
    console.log(product);
    res.render('Admin/adminSingleproduct',{product:product})
  } catch (error) {
    next(error)
  }
}


const editProduct = async (req, res) => {
  try {
    const id = req.body.id
    // const id = req.params.id;
        console.log(id);
    const name = req.body.sName
    const category = req.body.sCategory
    const price = req.body.sPrice
    const quantity = req.body.sQuantity
    const rating = req.body.sRating
    const description = req.body.sDescription
    const files = req.files
    const image = files.map((x) => x.filename)

    if (image.length == 0) {
      await Product.updateOne(
        { _id: req.body.id },
        {
          $set: {
            name,
            category,
            description,
            price,
            quantity,
            rating,
          },
        }
      )
    } else {
      const promises = image.map((filename) => {
        const imagePath = `public/admin/uploadedimages/${filename}`
        return Jimp.read(imagePath)
          .then((image) => {
            return image.resize(400, 400).writeAsync(imagePath)
          })
      })

      await Promise.all(promises)

      await Product.updateOne(
        { _id: req.body.id },
        {
          $set: {
            name,
            category,
            price,
            description,
            quantity,
            rating,
            image,
          },
        }
      )
    }

    res.redirect('/admin/adminProduct')
  } catch (error) {
    console.log(error.message)
  }
}


const unlistProduct = async(req,res,next)=>{
    try {
        
        const id = req.query.id
        await Product.updateOne({ _id:id },{$set:{isAvailable:0}})
        res.redirect('/admin/adminProduct')

    } catch (error) {
        // console.log(error.message);
        next(error)
    }
}

const listProduct = async(req,res,next)=>{
    try {
        
        const id = req.query.id
        await Product.updateOne({ _id:id },{$set:{isAvailable:1}})
        res.redirect('/admin/adminProduct')

    } catch (error) {
        // console.log(error.message);
        next(error)
    }
}





const loadDashboard = async (req, res,next) => {
    try {
      adminSession = req.session
      if (isAdminLoggedin) {
        const productData = await Product.find()
        const userData = await User.find()
        const adminData = await Admin.findOne()
        const categoryData = await Category.find()
        const orders = await Order.find();
  
        const categoryArray = [];
        const orderCount = [];
        for(let key of categoryData){
          categoryArray.push(key.name)
          orderCount.push(0)
      }
      const completeorder = []
      const orderDate =[];
      const orderData =await Order.find()
      for(let key of orderData){
        const uppend = await key.populate('products.item.productId')
        orderDate.push(key.createdAt);
        completeorder.push(uppend)
    }
    // console.log(orderDate);
    const orderCountsByDate = {};
    orders.forEach(order => {
      const date = order.createdAt.toDateString();
      if (orderCountsByDate[date]) {
        orderCountsByDate[date]++;
      } else {
        orderCountsByDate[date] = 1;
      }
    });

  const dates = Object.keys(orderCountsByDate);
  const orderCounts = Object.values(orderCountsByDate);
  
    const productName =[];
    const salesCount = [];
    const productNames = await Product.find();
    for(let key of productNames){
      productName.push(key.name);
      salesCount.push(key.sales)
    }
    for(let i=0;i<completeorder.length;i++){
      for(let j = 0;j<completeorder[i].products.item.length;j++){
         const cataData = completeorder[i].products.item[j].productId.category
         const isExisting = categoryArray.findIndex(category => {
          return category === cataData
         })
         orderCount[isExisting]++
  }}
  
    const showCount = await Order.find().count()
    const productCount = await Product.count()
    const usersCount = await User.count()
    const totalCategory = await Category.count({isAvailable:1})
  
  // console.log(categoryArray);
  // console.log(orderCount);

  
  
      res.render('Admin/adminHome', {
        users: userData,
        admin: adminData,
        product: productData,
        category: categoryArray,
        count: orderCounts,
        pname:productName,
        pdate:dates,
        pcount:salesCount,
        showCount,
        productCount,
        usersCount,
        totalCategory
        
      });
        
      } else {
        res.redirect('/admin/adminLogin')
      }
    } catch (error) {
      // console.log(error.message)
      next(error)
    }
  }

const loadAdminUser = async (req, res,next) => {
    try {

        const userData = await User.find({is_admin:0})
       // const adminData = await User.findOne({is_admin:1})

        res.render('Admin/adminUser',{users:userData})
        console.log(userData)
    }
    catch (error) {
        // console.log(error.message)
        next(error)
    }
}
// const loadAdminUser = async (req, res, next) => {
//   try {
//     const [results, itemCount] = await Promise.all([
//       User.find()
//         .limit(req.query.limit)
//         .skip(req.skip)
//         .lean()
//         .exec(),
//       User.countDocuments()
//     ]);

//     const pageCount = Math.ceil(itemCount / req.query.limit);

//     res.render('Admin/adminUser', {
//       users: results,
//       pageCount,
//       itemCount,
//       pages: paginate.getArrayPages(req)(3, pageCount, req.query.page),
//     });
//   } catch (error) {
//     next(error);
//   }
// };

const loadAdminProduct = async (req, res,next) => {
    try {
        const productData = await Product.find()
        
        res.render('Admin/adminProducts',{ products: productData })
    }
    catch (error) {
        // console.log(error.message)
        next(error)
    }
}



const blockUser = async(req,res,next)=>{
    console.log('1')
    try{
        console.log('2')
        const id = req.query.id
        const userData = await User.findById({_id:id})
        if(userData.is_verified){
            console.log('3')
            await User.findByIdAndUpdate({_id:id},{ $set:{is_verified:0}})
        }else{
            console.log('4')
            await User.findByIdAndUpdate({_id:id},{ $set:{is_verified:1}})
        }
        res.redirect('/admin/user')
    }catch{
      next(error)
    }
}

const adminProduct = async(req,res,next)=>{
    try{
        const productData = await Product.find().sort({createdAt:-1})
        const categoryData = await Category.find()
    res.render('Admin/adminProducts', {products:productData,category:categoryData})
    }
    catch(error){
        // console.log(error.message)
        next(error)
    }
    }
    

const loadCategory = async(req,res,next)=>{
    try{
        const categoryData = await Category.find().sort({createdAt:-1})
        res.render('Admin/adminCategory',{category:categoryData})
    }
    catch(error){
        // console.log(message.error)
        next(error)
    }
}

const unlistCategory = async (req,res,next)=>{
    try{
        const id = req.query.id
        await Category.updateOne({ _id:id },{$set:{isAvailable:0}})
        res.redirect('adminCategory')

    }
    catch(error){
        // console.log(error.message)
        next(error)
    }
}

const listCategory = async (req,res,next)=>{
    try{
        const id = req.query.id
        await Category.updateOne({ _id:id },{$set:{isAvailable:1}})
        res.redirect('adminCategory')

    }
    catch(error){
        // console.log(error.message)
        next(error)
    }
}



const addCategory = async(req,res,next)=>{
    try{
        const categoryExists = await Category.findOne({ name: req.body.category });
        const categoryData = await Category.find()
        if (categoryExists) {
            return res.render('adminCategory', { message: "category already exists", category: categoryData })
        }
        const category = Category({ name: req.body.category })
        await category.save()
        res.redirect('adminCategory')
    }
    catch(error){
        // console.log(error.message)
        next(error)
    }
}

const adminLogout = async(req,res,next)=>{
    adminSession = req.session
    adminSession.adminId = false
    isAdminLoggedin = false
    console.log('Admin logged out');
    res.redirect('/admin')
}

const loadOffer = async(req, res,next)=>{
    try {
      const offerData = await Offer.find()
      res.render('Admin/offer',{offer:offerData})
    }catch(error){
      // console.log(error.message)
      next(error)
    }
  }

  // const addOffer = async (req, res,next) => {
  //   try {
  //     const offer = Offer({
  //       name: req.body.name,
  //       type: req.body.type,
  //       discount: req.body.discount
  //     })
  //     await offer.save()
  //     res.redirect('/admin/offer')
  //   } catch (error) {
  //     // console.log(error.message)
  //     next(error)
  //   }
  // }  

  const addOffer = async (req, res, next) => {
    try {
      const { name, type, discount, expireAt } = req.body;
      
      const coupon = Offer({
        name,
        type,
        discount,
        expireAt
      });
      await coupon.save();
      res.redirect('/admin/offer');
    } catch (error) {
      next(error);
    }
  };
  

  const deleteOffer = async(req,res,next)=>{
    try {
      const id = req.query.id
      await Offer.deleteOne({_id:id})
      res.redirect('/admin/offer')
    } catch (error) {
      // console.log(error.message)
      next(error)
    }
  }


  const addBanner = async(req,res,next)=>{
    try {
      const newBanner = req.body.banner
      // console.log(newBanner);
      const a = req.files
      // console.log(req.files)
      const banner = new Banner({
        banner:newBanner,
        bannerImage:a.map((x)=>x.filename)
      })
      const bannerData = await banner.save()
      if(bannerData){
        res.redirect('/admin/loadBanner')
      }
  
    } catch (error) {
      // console.log(error.message)
      next(error)
    }
  }





  const loadBanner = async(req,res,next)=>{
    try {
      const bannerData = await Banner.find()
      res.render('Admin/banner', {
        banners: bannerData
      })
  
    } catch (error) {
      // console.log(error.message)
      next(error)
    }
  }

  const activeBanner = async(req,res,next)=>{
    try {
      const id = req.query.id
      await Banner.findOneAndUpdate({is_active:1},{$set:{is_active:0}})
      await Banner.findByIdAndUpdate({ _id: id },{$set:{is_active:1}})
      res.redirect('/admin/loadBanner')
    } catch (error) {
      // console.log(error.message)
      next(error)
    }
  }

  const adminSalesReport = async(req,res,next)=>{
    try {
      const productData = await Product.find()
      res.render('Admin/salesReport',{
        product:productData,
        admin:true})
    } catch (error) {
      // console.log(error.message);
      next(error)
    } 
  }

  const adminViewOrder = async(req,res,next)=>{
    try {
      const productData = await Product.find()
      const userData = await User.find()
      const orderData = await Order.find().sort({createdAt :-1})
      console.log(orderData)
      for(let key of orderData){
        await key.populate('products.item.productId');
        await key.populate('userId');
      }
      if (orderType == undefined) {
        res.render('orderReport', {
          users: userData,
          product: productData,
          order: orderData,
          
        });
      }else{
          id = req.query.id;
          res.render('Admin/orderReport', {
            users: userData,
            product: productData,
            order: orderData,
            id: id,
          });
      }
    } catch (error) {
      // console.log(error.message)
      next(error)
    }
  }

  const cancelOrder = async(req,res,next)=>{
    try {
      const id = req.query.id;
      await Order.deleteOne({ _id: id });
      res.redirect('/admin/orderReport');
    } catch (error) {
      // console.log(error.message)
      next(error)
    }
  }

  const adminDeliveredOrder = async(req,res,next)=>{
    try {
      const id = req.query.id;
      await Order.updateOne({ _id: id }, { $set: { status: 'Delivered' } });
      res.redirect('/admin/orderReport');
    } catch (error) {
      // console.log(error.message)
      next(error)
    }
  }

  const confirmOrder = async(req,res,next)=>{
    try {
      const id = req.query.id;
      await Order.updateOne({ _id: id }, { $set: { status: 'confirmed' } });
      res.redirect('/admin/orderReport');
    } catch (error) {
      // console.log(error.message)
      next(error)
    }
  }

  const stockReport = async(req,res,next)=>{
    try {
      const productData = await Product.find()
      res.render('Admin/stockReport',{
        product:productData,
        admin:true})
    } catch (error) {
      // console.log(error.message);
      next(error)
    } 
  }

  const adminOrderDetails = async(req,res,next)=>{
    try {
        const id = req.query.id
        const userData = await User.find()
        const orderData = await Order.findById({_id:id});
        await orderData.populate('products.item.productId');
        await orderData.populate('userId')
   res.render('Admin/adminViewOrder',{
    order:orderData,users:userData
   
   })
    } catch (error) {
      // console.log(error.message);
      next(error)
    }
  }



module.exports = {
    loadDashboard,
    loadAdminUser,
    loadAdminProduct,
    loadAdminLogin,
    verifyAdminLogin,
    blockUser,
    loadAddProduct,
    addProduct,
    adminProduct,
    editProduct,
    loadEditProduct,
    unlistProduct,
    listProduct,
    loadCategory,
    unlistCategory,
    listCategory,
    addCategory,
    adminLogout,
    loadOffer,
    deleteOffer,
    addOffer,
    addBanner,
    loadBanner,
    activeBanner,
    adminViewOrder,
    cancelOrder,
    confirmOrder,
    adminSalesReport,
    adminDeliveredOrder,
    stockReport,
    adminOrderDetails,
    viewProduct,
   
    
    
}