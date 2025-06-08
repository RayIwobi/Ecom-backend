const Order = require('../models/Order'); // Adjust path as needed
const nodemailer = require('nodemailer');
const express = require('express');
const router = express.Router();
const dotenv = require('dotenv').config();

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const PendingCart = require('../models/PendingCart');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  logger: true,
  debug: true
});

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter config error:", error);
  } else {
    console.log("✅ Email transporter is ready to send messages");
  }
});

const sendOrderToAdmin = async (order) => {
  const itemsHtml = order.items.map(item => `
    <li>${item.productname} - Qty: ${item.productquantity} - £${item.productprice}</li>
  `).join('');

  const mailOptions = {
    from: '"Nedifoods" <support@nedifoods.co.uk>',
    to: "orders@nedifoods.co.uk",
    subject: `New Order from ${order.userEmail}`,
    html: `
      <h2>New Order Received</h2>
      <p><strong>User:</strong> ${order.userEmail}</p>
      <p><strong>Phone:</strong> ${order.phone || 'Not provided'}</p>
      <p><strong>Address:</strong> ${order.address || 'Not provided'}</p>
      <p><strong>Payment ID:</strong> ${order.paymentId}</p>
      <p><strong>Total:</strong> £${order.totalAmount}</p>
      <ul>${itemsHtml}</ul>
    `
  };

  await transporter.sendMail(mailOptions)
    .then(info => console.log("✅ Admin email sent:", info.response))
    .catch(error => console.error("❌ Failed to send admin email:", error));
};

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      const cartId = session.metadata?.cartId;
      if (!cartId) throw new Error('Missing cartId in metadata');

      const pendingCart = await PendingCart.findById(cartId);
      console.log("📦 Pending cart found:", pendingCart);

      if (!pendingCart) throw new Error('Cart not found in DB');

      // ✅ Use the sendOrderToAdmin function
      await sendOrderToAdmin({
        userEmail: pendingCart.email,
        phone: pendingCart.userphone,
        address: pendingCart.useraddress,
        paymentId: session.payment_intent,
        totalAmount: session.amount_total / 100,
        items: pendingCart.cart
      });

      // ✅ Send thank-you email to customer
      await transporter.sendMail({
        from: '"Nedi foods" <support@nedifoods.co.uk>',
        to: pendingCart.email,
        subject: '🎉 Thank you for your order!',
        html: `
          <h2>Thank you, ${pendingCart.username}!</h2>
          <p>We’ve received your order and will begin processing it shortly.</p>
          <p><strong>Delivery Address:</strong> ${pendingCart.useraddress}</p>
          <h3>Your Order:</h3>
          <ul>
            ${pendingCart.cart.map(item => `
              <li>
                ${item.productquantity} × ${item.productname} (£${item.productprice} each)
              </li>`).join('')}
          </ul>
          <p>If you have any questions, just reply to this email.</p>
          <p>– The NediFoods Team</p>
        `,
      });

      console.log('✅ Emails sent to admin and customer');
      res.status(200).send('Webhook processed');
    } catch (error) {
      console.error('❌ Webhook processing failed:', error.message);
      res.status(500).send('Webhook failed');
    }
  } else {
    res.status(200).send('Event ignored');
  }
});

module.exports = router
