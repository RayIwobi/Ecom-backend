const mongoose = require('mongoose');

const pendingCartSchema = new mongoose.Schema({
  userId: { type: String },
  email: { type: String },
  username: { type: String },
  userphone: { type: String },
  useraddress: { type: String },
  cart: [
    {
      _id: String,
      productname: String,
      productprice: Number,
      productquantity: Number,
    },
  ],
  deliveryMethod:{type:String}
}, { timestamps: true });

module.exports = mongoose.model('PendingCart', pendingCartSchema);
