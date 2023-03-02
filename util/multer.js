const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
    destination: function (req,file, cb) {
        // cb(null, 'public/admin/uploadedimages')
        if (file.fieldname !== 'sImage') {
            cb(null, 'public/admin/multer/img')
          } else {
            cb(null, 'public/admin/uploadedimages')
          }
},
filename: function (req,file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
}
})

exports.upload = multer({ storage })