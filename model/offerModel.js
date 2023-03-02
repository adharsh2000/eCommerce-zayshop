const mongoose = require('mongoose')

const offerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
      },
      type: {
        type: String,
        required: true, 
        enum: ["percentage", "flat"],
      },
      discount: {
        type: Number,
        required: true,
        min: 0,
        max: 2000,
      },
      expireAt: {
        type: Date,
        required: true,
      },
    usedBy:[{
        type:mongoose.Types.ObjectId,
        ref:'User'
    }]
})

module.exports = mongoose.model('Offer',offerSchema)