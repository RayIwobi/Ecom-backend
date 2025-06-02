const express = require('express')
const dotenv = require('dotenv').config()
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
const multer = require('multer')
const PORT = process.env.PORT || 1000
const app = express()
const axios = require('axios');

const {stripeWebhook} = require('./routes/webhook.js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
app.use('/webhook', stripeWebhook);


app.use(cors({
    origin: 'https://nedifoods.co.uk',
    //origin:['http://localhost:3000','https://nedifoods-api.vercel.app', 'https://nedifoods.co.uk'],
    credentials:true,
}))

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://nedifoods.co.uk');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200); // CORS preflight success
  }

  next();
});



const  {UserRouter } = require('./routes/user.js') 
const  {CommentRouter } = require('./routes/comment.js')  
// Mount webhook before express.json for raw body


const User = require('./models/User.js')

const cookieParser = require('cookie-parser');//requirement for authentication


const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary')

const Products = require('./models/newArrivals/Products.js')
// const commentsModel = require('./models/comments/Comments.js')
const Category = require('./models/Category.js')




app.use(cookieParser())

app.use(express.static('public'))
app.use(express.json())

app.use('/auth', UserRouter)
app.use('/comments', CommentRouter)
app.use('/orders', require('./routes/orderRoute'));



mongoose.connect(process.env.MONGO_URI)


cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary:cloudinary,
  params:{
    folder: 'nedifoods',
    allowed_formats: ['jpg', 'png', 'jpeg']
  }
})

const uploadfile = multer({
  storage:storage
})

//routes
app.post('/sendinfo', uploadfile.single('file'), async(req, res) => {
  try{
    const {productname, productweight, productquantity,  productprice, productoldprice,category, description} = req.body
    const image = req.file?.filename || ""

    const newentry = await Products.create({
      productname,
      productweight,
      productquantity,
      productprice,
      productoldprice,
      category,
      description,
      image
    })

    if (!image) {
      return res.status(404).send({ message: 'Image not found' });
    }

    res.json(newentry)
    console.log("req.body:", req.body); // 👈 Add this
    console.log("req.file:", req.file);

  }
  catch (error){
    console.error(error)
    res.status(500).json({message: 'Server Error'})
  }
})



app.get('/getitems', async(req, res) => {
  try{
    const items = await Products.find().sort({ createdAt: -1 })
    res.status(200).json(items)
  
  } 
  catch (error){
    console.error(error)
    res.status(500).json({message:'it could not display items'})
  } 
})

app.get('/product/:id', async(req, res) => {
  try{
    const {id} = req.params.id
    const items = await Products.findById(req.params.id)
    res.status(200).json(items)
  
  } 
  catch (error){
    console.error(error)
    res.status(500).json({message:'it could not display items'})
  } 
})

app.put('/updateitems/:id', uploadfile.single('file'), async (req, res) => {
  try {
    const { id } = req.params;

    // Get form fields from body
    const {
      productname,
      productweight,
      productquantity,
      productprice,
      productoldprice,
      category,
      description,
    } = req.body;

    // Check for missing required fields
    // if (!productname || !productquantity || !productprice || !category) {
    //   return res.status(400).json({ message: 'Missing required fields' });
    // }

    // Cast string to number where needed (especially from form-data)
    const updateData = {
      productname,
      productweight: Number(productweight),
      productquantity: Number(productquantity),
      productprice: Number(productprice),
      productoldprice: Number(productoldprice),
      category,
      description,
    };

    // Include image if file was uploaded
    if (req.file?.filename) {
      updateData.image = req.file.filename;
    }

    const updatedItem = await Products.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json(updatedItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'The item did not update', error });
  }
});


app.delete('/deleteitems/:id', async(req, res) => {
  try{
    const id = req.params.id
    const newdelete = await Products.findByIdAndDelete(id)

    if(!newdelete){
      res.status(500).json({message:'item not found'})
    }

    res.status(200).json({newdelete, message:'Successfully deleted items'})
  }
  catch (error){
    console.error(error)
  }
})

//CATEGORIES SEARCH FUNCTIONALITY
app.get('/category/:CategoryName', async(req, res) => {
  try{
    const category = req.params.CategoryName.toLowerCase()
      const product = await Products.find({category})
      res.status(200).json(product)
  }
  catch(error){
    console.error({error, message:'Error, couldnt find product'})
    res.status(500).json(error)
  }
})


//Vegetables and spice section
app.get('/category/vegetables-and-greens', async(req, res) => {
  try{
    const category = req.params.CategoryName.toLowerCase()
      const product = await Products.find({category})
      res.status(200).json(product)
  }
  catch(error){
    console.error({error, message:'Error, couldnt find product'})
    res.status(500).json(error)
  }
})

//Spices and Seasoning section
app.get('/category/spices-and-seasonings', async(req, res) => {
  try{
    const category = req.params.CategoryName.toLowerCase()
      const product = await Products.find({category})
      res.status(200).json(product)
  }
  catch(error){
    console.error({error, message:'Error, couldnt find product'})
    res.status(500).json(error)
  }
})

//SEARCH FUNCTIONALITY
app.get('/products', async(req, res) => {
  const search = req.query.search || ''

  try{
    const products = await Products.find({
      name: { $regex: search, $options: 'i'} //case insensitive match
    })

    res.json(products)
  }
  catch(error){
    res.status(500).json({error: 'Server error'})
  }
})


// SEARCH FUNCTIONALITY -- GET /search?q=rice
app.get("/search", async (req, res) => {
  const { q } = req.query;
  try {
    const results = await Products.find({
      productname: { $regex: q, $options: "i" } // case-insensitive match
    });
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


//TRIAL CATGEORIES NAVIGATION ROUTE
app.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/products', async (req, res) => {
  const { category, subcategory } = req.query;

  try {
    let query = {};
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;

    const products = await Product.find(query);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

//this block of code checks for user authentication. call verifyUser whereever you want to use it
// const verifyUser = async (req, res, next) => {
//     try{
//         const token = req.cookies.token;
//         if(!token){
//             return res.json({status: false, message: "no token"})
//         }
//         const decoded = jwt.verify(token, process.env.KEY);
//         req.user = decoded;
//         next()
//     }
//     catch (error){
//         return res.json(error)
//     }
// }

// app.get('/verify', verifyUser, (req, res) => {
//     return res.json({status: true, message: "authorized user"})

// })

//Saving the data before the stripe session
//const PendingCart = require('./models/PendingCart');

//STRIPE PAYMENT CODE
app.post('/create-checkout-session', async (req, res) => {
  const { cart, userId, userEmail } = req.body;

  console.log("🛒 Cart received:", cart);
  console.log("👤 User ID received:", userId);

  if (!cart || !Array.isArray(cart)) {
    return res.status(400).json({ error: 'Invalid cart data' });
  }

  try {
     //const saveCart = await PendingCart.create({ userId, cart });
      
    const line_items = cart.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.productname,
        },
        unit_amount: Math.round(item.productprice * 100), // Stripe expects cents
      },
      quantity: item.productquantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: userEmail,
      line_items,
      success_url: 'https://nedifoods.co.uk/success',
      cancel_url: 'https://nedifoods.co.uk/cancel',

      phone_number_collection: {
      enabled: true,           //Enabled phone collection in Stripe Checkout
      },
      
      //This metadata works but because stripe has a limit of 5oo characters, it will return an error for products more than 500 characters
      metadata: {
      cart: JSON.stringify(cart.map(item => ({
        _id: item._id,
        productname: item.productname,
        productprice: item.productprice,
        productquantity: item.productquantity,
      }))),
      userId: userId ? userId.toString() : 'unknown',
      }

      // metadata:{
      //   pendingCartId: saveCart._id.toString(),
      //   userId: userId
      // }
    });
    console.log("🛒 Cart received:", cart);
    console.log("👤 User ID received:", userId);

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error.message);
    res.status(500).json({ error: 'Failed to create Stripe checkout session' });
  }
});



app.listen(process.env.PORT, () => {
    console.log('SERVER RUNNING ON PORT ' + process.env.PORT)
})

