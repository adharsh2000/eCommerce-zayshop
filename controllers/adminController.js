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
const excelJS = require('exceljs');
const { ObjectID } = require('bson')


let isAdminLoggedin
isAdminLoggedin = false
let adminSession = false || {}
let orderType = 'all'


const loadAdminLogin = async (req, res, next) => {
  try {
    res.render('Admin/adminLogin');
  } catch (error) {
    next(error)
  }
};


const verifyAdminLogin = async (req, res, next) => {
  try {
    const name = req.body.name;
    const password = req.body.password;

    const adminData = await Admin.findOne({ name: name })


    if (adminData) {
      const passwordMatch = await bcrypt.compare(password, adminData.password)
      
      if (passwordMatch) {
        if (adminData) {
          adminSession = req.session
          isAdminLoggedin = true
          adminSession.adminId = adminData._id
          res.redirect('/admin/dashboard')
          
        } else {

          res.render('Admin/adminLogin', { message: "Please redirect to user page" })


        }
      } else {
        res.render('Admin/adminLogin', { message: "Email and password is incorrect." })
      }
    } else {
      res.render('Admin/adminLogin', { message: 'Email and password is incorrect.' })
    }
  } catch (error) {
  
    next(error)
  }
}


const loadAddProduct = async (req, res, next) => {
  const productData = await Product.find()
  const categoryData = await Category.find({ isAvailable: 1 })
  try {
    res.render('Admin/addProduct', { category: categoryData, products: productData })
  }
  catch (error) {
    
    next(error)
  }

}

const addProduct = async (req, res, next) => {

  try {

    const images = req.files;

    const product = Product({
      name: req.body.sName,
      category: req.body.sCategory,
      price: req.body.sPrice,
      description: req.body.sDescription,
      quantity: req.body.sQuantity,
      rating: req.body.sRating,
      image: images.map((x) => x.filename)
    })
    const productData = await product.save()
    const categoryData = await Category.find()
    if (productData) {
      res.render('Admin/addProduct', { category: categoryData, message: "Product added successfully" })
    } else {
      res.render('Admin/addProduct', { category: categoryData, message: "Product add failed" })
    }
  } catch (error) {
    next(error)
  }
}



const loadEditProduct = async (req, res, next) => {
  try {
    const id = req.query.id

    const productData = await Product.findById({ _id: id })
    const categoryData = await Category.find({ isAvailable: 1 })

    if (productData) {
      res.render('Admin/editProduct', { products: productData, category: categoryData })
    }
    else {
      res.redirect('/admin/adminProduct', { message: "Product doesn'nt exist" })
    }

  } catch (error) {
 
    next(error)
  }
}



const viewProduct = async (req, res, next) => {
  try {
    const id = req.query.id;
    let product;
    try {
      product = await Product.find({ _id: id });
    } catch (error) {
      next(error)
    }
    
    res.render('Admin/adminSingleproduct', { product: product })
  } catch (error) {
    next(error)
  }
}


const editProduct = async (req, res,next) => {
  try {
    const id = req.body.id
    
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
    next(error)
  }
}


const unlistProduct = async (req, res, next) => {
  try {

    const id = req.query.id
    await Product.updateOne({ _id: id }, { $set: { isAvailable: 0 } })
    res.redirect('/admin/adminProduct')

  } catch (error) {

    next(error)
  }
}

const listProduct = async (req, res, next) => {
  try {

    const id = req.query.id
    await Product.updateOne({ _id: id }, { $set: { isAvailable: 1 } })
    res.redirect('/admin/adminProduct')

  } catch (error) {

    next(error)
  }
}





const loadDashboard = async (req, res, next) => {
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
      for (let key of categoryData) {
        categoryArray.push(key.name)
        orderCount.push(0)
      }
      const completeorder = []
      const orderDate = [];
      const orderData = await Order.find()
      for (let key of orderData) {
        const uppend = await key.populate('products.item.productId')
        orderDate.push(key.createdAt);
        completeorder.push(uppend)
      }
      
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

      const productName = [];
      const salesCount = [];
      const productNames = await Product.find();
      for (let key of productNames) {
        productName.push(key.name);
        salesCount.push(key.sales)
      }
      for (let i = 0; i < completeorder.length; i++) {
        for (let j = 0; j < completeorder[i].products.item.length; j++) {
          const cataData = completeorder[i].products.item[j].productId.category;
          const isExisting = categoryArray.findIndex(category => {
            return category === cataData
          })
          orderCount[isExisting]++
        }
      }

      const showCount = await Order.find().count()
      const productCount = await Product.count()
      const usersCount = await User.count()
      const totalCategory = await Category.count({ isAvailable: 1 })


      res.render('Admin/adminHome', {
        users: userData,
        admin: adminData,
        product: productData,
        category: categoryArray,
        count: orderCounts,
        pname: productName,
        pdate: dates,
        pcount: salesCount,
        showCount,
        productCount,
        usersCount,
        totalCategory

      });

    } else {
      res.redirect('/admin/adminLogin')
    }
  } catch (error) {
  
    next(error)
  }
}


const loadAdminUser = async (req, res, next) => {
  try {
    let page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    const limit = 2;
    const startIndex = (page - 1) * limit; // start index for current page
    const userData = await User.find().limit(limit * 1).skip(startIndex).exec();
    const count = await User.find().countDocuments();

    res.render('Admin/adminUser', {
      users: userData,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      previous: new Number(page) - 1,
      next: new Number(page) + 1,
      startIndex: startIndex // added startIndex to the render object
    })
  }
  catch (error) {
    next(error)
  }
}


const loadAdminProduct = async (req, res, next) => {
  try {
    const productData = await Product.find()

    res.render('Admin/adminProducts', { products: productData })
  }
  catch (error) {
  
    next(error)
  }
}



const blockUser = async (req, res, next) => {
  
  try {
   
    const id = req.query.id
    const userData = await User.findById({ _id: id })
    if (userData.is_verified) {
      
      await User.findByIdAndUpdate({ _id: id }, { $set: { is_verified: 0 } })
    } else {
      
      await User.findByIdAndUpdate({ _id: id }, { $set: { is_verified: 1 } })
    }
    res.redirect('/admin/user')
  } catch {
    next(error)
  }
}

const adminProduct = async (req, res, next) => {
  try {
    const productData = await Product.find().sort({ createdAt: -1 })
    const categoryData = await Category.find()
    res.render('Admin/adminProducts', { products: productData, category: categoryData })
  }
  catch (error) {
  
    next(error)
  }
}


const loadCategory = async (req, res, next) => {
  try {
    const categoryData = await Category.find().sort({ createdAt: -1 })
    res.render('Admin/adminCategory', { category: categoryData })
  }
  catch (error) {
 
    next(error)
  }
}

const unlistCategory = async (req, res, next) => {
  try {
    const id = req.query.id
    await Category.updateOne({ _id: id }, { $set: { isAvailable: 0 } })
    res.redirect('adminCategory')

  }
  catch (error) {
  
    next(error)
  }
}

const listCategory = async (req, res, next) => {
  try {
    const id = req.query.id
    await Category.updateOne({ _id: id }, { $set: { isAvailable: 1 } })
    res.redirect('adminCategory')

  }
  catch (error) {
   
    next(error)
  }
}

// gahsasj

const addCategory = async (req, res, next) => {
  try {
    const categoryExists = await Category.findOne({ name: req.body.category });
    const categoryData = await Category.find()
    if (categoryExists) {
      return res.render('adminCategory', { message: "category already exists", category: categoryData })
    }
    const category = Category({ name: req.body.category })
    await category.save()
    res.redirect('adminCategory')
  }
  catch (error) {
   
    next(error)
  }
}

const adminLogout = async (req, res, next) => {
  adminSession = req.session
  adminSession.adminId = false
  isAdminLoggedin = false
  res.redirect('/admin')
}

const loadOffer = async (req, res, next) => {
  try {
    const offerData = await Offer.find()
    res.render('Admin/offer', { offer: offerData })
  } catch (error) {
  
    next(error)
  }
}


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


const deleteOffer = async (req, res, next) => {
  try {
    const id = req.query.id
    await Offer.deleteOne({ _id: id })
    res.redirect('/admin/offer')
  } catch (error) {
 
    next(error)
  }
}


const addBanner = async (req, res, next) => {
  try {
    const newBanner = req.body.banner
 
    const a = req.files
  
    const banner = new Banner({
      banner: newBanner,
      bannerImage: a.map((x) => x.filename)
    })
    const bannerData = await banner.save()
    if (bannerData) {
      res.redirect('/admin/loadBanner')
    }

  } catch (error) {
   
    next(error)
  }
}





const loadBanner = async (req, res, next) => {
  try {
    const bannerData = await Banner.find()
    res.render('Admin/banner', {
      banners: bannerData
    })

  } catch (error) {
  
    next(error)
  }
}

const activeBanner = async (req, res, next) => {
  try {
    const id = req.query.id
    await Banner.findOneAndUpdate({ is_active: 1 }, { $set: { is_active: 0 } })
    await Banner.findByIdAndUpdate({ _id: id }, { $set: { is_active: 1 } })
    res.redirect('/admin/loadBanner')
  } catch (error) {
 
    next(error)
  }
}

const adminSalesReport = async (req, res, next) => {
  try {
    const productData = await Product.find()
    res.render('Admin/salesReport', {
      product: productData,
      admin: true
    })
  } catch (error) {

    next(error)
  }
}

const adminViewOrder = async (req, res, next) => {
  try {
    const productData = await Product.find()
    const userData = await User.find()
    const orderData = await Order.find().sort({ createdAt: -1 })
    
    for (let key of orderData) {
      await key.populate('products.item.productId');
      await key.populate('userId');
    }
    if (orderType == undefined) {
      res.render('Admin/orderReport', {
        users: userData,
        product: productData,
        order: orderData,

      });
    } else {
      id = req.query.id;
      res.render('Admin/orderReport', {
        users: userData,
        product: productData,
        order: orderData,
        id: id,
      });
    }
  } catch (error) {

    next(error)
  }
}

const cancelOrder = async (req, res, next) => {
  try {
    const id = req.query.id;
    await Order.deleteOne({ _id: id });
    res.redirect('/admin/orderReport');
  } catch (error) {
   
    next(error)
  }
}

const adminDeliveredOrder = async (req, res, next) => {
  try {
    const id = req.query.id;
    await Order.updateOne({ _id: id }, { $set: { status: 'Delivered' } });
    res.redirect('/admin/orderReport');
  } catch (error) {
   
    next(error)
  }
}

const confirmOrder = async (req, res, next) => {
  try {
    const id = req.query.id;
    await Order.updateOne({ _id: id }, { $set: { status: 'confirmed' } });
    res.redirect('/admin/orderReport');
  } catch (error) {
 
    next(error)
  }
}

const loadAdminReturn = async(req,res,next)=>{
  try {
      adminSession = req.session
      id = req.query.id
      adminSession.currentorder = id
      const orderdata = await Order.findById({_id:id})
      await orderdata.populate("products.item.productId");
      res.render('Admin/returnproducts',{order:orderdata})
  } catch (error) {
      next(error)
  }
}


const AdminReturnProduct = async(req,res,next)=>{
  try {
      adminSession = req.session
      const id = req.query.id;
     const gid = adminSession.currentorder

      const productorderdata = await Order.findById({_id:ObjectID(adminSession.currentorder)})
      
      const productdata = await Product.findById({_id:id})
     
      if(productorderdata){
          for( let i = 0;i<productorderdata.products.item.length;i++){
              if(new String(productorderdata.products.item[i].productId).trim() === new String(id).trim()){
                  productdata.quantity += productorderdata.products.item[i].qty;
                  
                  productorderdata.productReturned[i]=1;
                  await productdata.save().then(()=>{
                      console.log('productdata saved');
                  })
                  await Order.updateOne({_id:gid},{$set:{status:"Returned"}})
                  await productorderdata.save().then(()=>{
                      console.log('productorderdata saved');
                      res.redirect('/admin/orderReport')
                  })
              }else{
                  res.redirect('/admin/orderReport')
              }
          }
      }else{
          res.redirect('/admin/orderReport')
      }
  } catch (error) {
      next(error)
  }
}


const AdminNoReturn = async(req,res,next)=>{
  try {
      adminSession = req.session;
      if(userSession = req.session){
      const id = req.query.id;

      await Order.updateOne({_id:id},{$set:{status:'Delivered'}})
      res.redirect('/admin/orderReport')
      }
  } catch (error) {
      next(error)
    }
}

const stockReport = async (req, res, next) => {
  try {
    const productData = await Product.find()
    res.render('Admin/stockReport', {
      product: productData,
      admin: true
    })
  } catch (error) {
  
    next(error)
  }
}

const adminOrderDetails = async (req, res, next) => {
  try {
    const id = req.query.id
    const userData = await User.find()
    const orderData = await Order.findById({ _id: id });
    await orderData.populate('products.item.productId');
    await orderData.populate('userId')
    res.render('Admin/adminViewOrder', {
      order: orderData, users: userData
    })
  } catch (error) {
  
    next(error)
  }
}

const adminDownload = async (req, res,next) => {
  try {
    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Stock Report")
    worksheet.columns = [
      { header: "Sl No.", key: "s_no" },
      { header: "Product", key: "name" },
      { header: "Category", key: "category" },
      { header: "Price", key: "price" },
      { header: "Quantity", key: "quantity" },
      { header: "Rating", key: "rating" },
      { header: "Sales", key: "sales" },
      { header: "isAvailable", key: "isAvailable" },
    ]
    let counter = 1
    const productData = await Product.find()
    productData.forEach((product) => {
      product.s_no = counter;
      worksheet.addRow(product)
      counter++;
    })
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true }
    })
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheatml.sheet"
    )
    res.setHeader("Content-Disposition", "attachment; filename=products.xlsx")
    return workbook.xlsx.write(res).then(() => {
      res.status(200);
    })
  } catch (error) {
   next(error)
  }
}


const salesReport = async(req,res,next)=>{
    try {
        const productdata = await Product.find()
        res.render('Admin/salesReport',{product:productdata})
    } catch (error) {
      next(error)
    }
}


const datewiseReport = async(req,res,next)=>{
  try {
    const startdate = new Date(req.body.Startingdate)
        const enddate = new Date(req.body.Endingdate)
        adminSession.startdate = startdate;
        adminSession.enddate = enddate;

    const orderData = await Order.find({
      createdAt: {
        $gte: startdate,
        $lte: enddate
      }
    });
    res.render('Admin/datewiseReport', {
      product: orderData,
      // admin: true,
    });
  } catch (error) {
    next(error);
  }
}

const adminDateDownload = async (req, res,next) => {
  try {
    const startdate = adminSession.startdate;
    const enddate = adminSession.enddate;
    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report")

    worksheet.columns = [
      { header: "Sl No.", key: "counter",width: 15 },
      { header: "Order Id", key: "_id" ,width: 15},
      { header: "User", key: "user",width: 15 },
      { header: "Total Price", key: "totalPrice" ,width: 15},
      { header: "Date", key: "createdAt",width: 15 },
      { header: "Payment method", key: "payment" ,width: 15},
    ]
    
    let counter = 1;
    const orderData = await Order.find({
      createdAt: {
        $gte: startdate,
        $lte: enddate
      },
      status: "Delivered"
    });
    
    orderData.forEach((order) => {
      worksheet.addRow({
        _id: order._id.toString(),
        user: order.firstname + ' ' + order.lastname,
        totalPrice: order.products.totalPrice,
        createdAt:order.createdAt.toDateString(),
        payment:order.payment,
        counter:counter++
      });
    });

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true }
    })
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheatml.sheet"
    )
    res.setHeader("Content-Disposition", "attachment; filename=products.xlsx")
    return workbook.xlsx.write(res).then(() => {
      res.status(200);
    })
  } catch (error) {
    next(error);
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
  adminDownload,
  datewiseReport,
  salesReport,
  adminDateDownload,
  loadAdminReturn,
  AdminNoReturn,
  AdminReturnProduct

}