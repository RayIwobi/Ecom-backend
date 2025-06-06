const Order = require('../models/Order'); // Adjust the path as needed
const nodemailer = require('nodemailer');
const express = require('express')
const router = express.Router()
const dotenv = require('dotenv').config()

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);



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

const sendOrderToAdmin = async (order) => {
  const itemsHtml = order.items.map(item => `
    <li>${item.productname} - Qty: ${item.productquantity} - $${item.productprice}</li>
  `).join('');

  const mailOptions = {
    from: '"Nedifoods" <support@nedifoods.co.uk>',
    to: "orders@nedifoods.co.uk", // Replace with actual admin email
    subject: `New Order from ${order.userEmail}`,
    html: `
      <p><strong>Phone:</strong> ${order.phone || 'Not provided'}</p>
      <h2>New Order Received</h2>
      <p><strong>Payment ID:</strong> ${order.paymentId}</p>
      <p><strong>User:</strong> ${order.userEmail}</p>
      <p><strong>Total:</strong> $${order.totalAmount}</p>
      <ul>${itemsHtml}</ul>
    `
  };

await transporter.sendMail(mailOptions).then(info => {
  
  console.log("✅ Email sent:", info.response);
})
.catch(error => {
  console.error("❌ Error sending email:", error);
});

};

// router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
//   console.log("🔥 Webhook route HIT!");
//   const sig = req.headers['stripe-signature'];

//   let event;
//   try {
//     event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
//   } catch (err) {
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   if (event.type === 'checkout.session.completed') {
//     console.log("✅ Stripe webhook received checkout.session.completed");
//     const session = event.data.object;

//     try {
//       const metadata = session.metadata;

//       if (!metadata || !metadata.cart) {
//       console.error("❌ Metadata or cart missing in session");
//       return res.status(400).send("Missing cart data in metadata.");
//     }
    
//       const cart = JSON.parse(metadata.cart); // cart passed from Stripe checkout session
//       const order = new Order({
//         userEmail: session.customer_email,
//         paymentId: session.payment_intent,
//         totalAmount: session.amount_total / 100,
//         items: cart.map(p => ({
//           productId: p._id,
//           productname: p.productname,
//           productprice: p.productprice,
//           productquantity: p.productquantity,
//           image: p.image
//         }))
//       });

//       await order.save();
//       await sendOrderToAdmin(order);

//       return res.status(200).send('Order saved and email sent.');
//     } catch (error) {
//       console.error('Error saving order or sending email:', error);
//       return res.status(500).send('Internal Server Error');
//     }
//   }

//   res.status(200).end();
// });


app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
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
      if (!pendingCart) throw new Error('Cart not found in DB');

      // ✅ Send order email to admin
      await transporter.sendMail({
        from: '"NediFoods Orders" <enquiries@nedifoods.co.uk>',
        to: 'orders@nedifoods.co.uk',
        subject: `🛒 New Order from ${pendingCart.username}`,
        html: `
          <h2>New Order Received</h2>
          <p><strong>Name:</strong> ${pendingCart.username}</p>
          <p><strong>Email:</strong> ${pendingCart.email}</p>
          <p><strong>Phone:</strong> ${pendingCart.userphone}</p>
          <p><strong>Address:</strong> ${pendingCart.useraddress}</p>
          <h3>Cart Items:</h3>
          <ul>
            ${pendingCart.cart.map(item => `
              <li>
                ${item.productquantity} × ${item.productname} (£${item.productprice} each)
              </li>`).join('')}
          </ul>
        `,
      });

      // ✅ Send thank-you email to customer
      await transporter.sendMail({
        from: '"NediFoods" <orders@nedifoods.co.uk>',
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




//using the metadata in the webhook
// const PendingCart = require('../models/PendingCart');

// router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
//   const sig = req.headers['stripe-signature'];

//   let event;
//   try {
//     event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
//   } catch (err) {
//     console.error('Webhook signature verification failed:', err);
//     return res.sendStatus(400);
//   }

//   if (event.type === 'checkout.session.completed') {
//     const session = event.data.object;

//     try {
//       const pendingCartId = session.metadata.pendingCartId;
//       const userId = session.metadata.userId;
//       const paymentIntentId = session.payment_intent; // ✅ Extract payment intent ID

//       const pendingCart = await PendingCart.findById(pendingCartId);
//       if (!pendingCart) throw new Error('Pending cart not found');

//       const newOrder = new Order({
//         userId,
//         userEmail: session.customer_email,
//         cart: pendingCart.cart,
//         totalAmount: session.amount_total / 100,
//         paymentId: paymentIntentId, // ✅ Now this is correctly passed
//       });

//       await newOrder.save();
//       await sendOrderToAdmin(newOrder);

//       await PendingCart.findByIdAndDelete(pendingCartId);

//       res.status(200).json({ received: true });
//     } catch (err) {
//       console.error('Error in webhook handler:', err);
//       res.status(500).json({ error: 'Internal webhook error' });
//     }
//   } else {
//     res.sendStatus(200);
//   }
// });



module.exports = {stripeWebhook:router};
