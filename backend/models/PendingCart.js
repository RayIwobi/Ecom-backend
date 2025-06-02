const mongoose = require('mongoose');

const PendingCartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  cart: {
    type: Array,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // Optional: auto-delete after 1 hour
  },
});

module.exports = mongoose.model('PendingCart', PendingCartSchema);
