const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  paymentId: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  items: [
    {
      productId: String,
      productname: String,
      productprice: Number,
      productquantity: Number
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
