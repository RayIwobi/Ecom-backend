const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// GET /orders/:email
router.get('/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const orders = await Order.find({ userEmail: email }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    res.status(500).json({ error: "Failed to get orders" });
  }
});

module.exports = router;
