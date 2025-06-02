const mongoose = require('mongoose')

const newArrivalsSchema = new mongoose.Schema({
    image:{
        type:String,
        required:true
    },
    productname:{
        type:String,
        required:true
    },
    productweight:{
        type: Number,
        required:false
    },
    productquantity:{
        type: Number,
        required:false
    },
    productprice:{
        type: Number,
        required: true
    },
    productoldprice:{
        type: Number,
        required:true
    },
    category:{
        type:String,
        required:true,
        index:true
    },
    description:{
        type:String,
        required:true
    }
},{timestamps:true})

const newArrivalsModel = mongoose.model('newArrival', newArrivalsSchema)
module.exports = newArrivalsModel