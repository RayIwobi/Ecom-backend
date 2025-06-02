const mongoose = require('mongoose')



const commentsSchema = new mongoose.Schema({
    comment:{
        type:String,
        required:true
    },
    user:{
        id:{type: mongoose.Schema.Types.ObjectId, ref: 'User'},
        username: String
    },
    createdAt:{type:Date, default:Date.now}
})

const commentsModel = mongoose.model('comment', commentsSchema)
module.exports = commentsModel