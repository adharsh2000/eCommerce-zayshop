const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    isAvailable: {
        type: Number,
        default: 1
    }
},{timestamps:true})

module.exports = mongoose.model('Category',categorySchema)