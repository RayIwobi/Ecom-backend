const express = require('express')
const bcrypt = require('bcrypt')
const commentsModel = require('../models/comments/Comments.js'); 
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
const User = require('../models/User.js')

dotenv.config()

const router = express.Router()


///
const verifyUser = async (req, res, next) => {
    try{
        const token = req.cookies.token;
        if(!token){
            return res.json({status: false, message: "no token"})
        }
        const decoded = jwt.verify(token, process.env.KEY);
        req.user = decoded;
        next()
    }
    catch (error){
        return res.json(err)
    }
}

//COMMENTS BACKENND-----------------------------------------------
router.get('/read', async(req, res) => {
  const userReview = await commentsModel.find().sort({ createdAt: -1 }); // .sort({ createdAt: -1 }); makes it appear in descending order
  return res.status(200).json(userReview)
})

router.post('/sendcomment', verifyUser, async(req, res) => {
  const {comment} = req.body
  const user = await User.findById(req.user.id)
  const userinput = new commentsModel({
    comment,
    user: {id: user._id, username: user.username }
  })
  await userinput.save()
  res.status(200).json(userinput)
})

router.delete('/deletecomment/:id', verifyUser, async(req, res) => {
    const userinput = await commentsModel.findById(req.params.id);
    if(!userinput){
        return res.status(404).json({message: 'comment not found'})
    }
    if(userinput.user.id.toString() !== req.user.id){
        return res.status(403).json({message: 'not authorized to delete this content'})
    }
    await userinput.deleteOne()
    res.status(200).json({message:'Deleted successfully'})
})

module.exports = { CommentRouter : router }
