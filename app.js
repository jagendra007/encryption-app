//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const port  = 3000;   
const mongoose  = require("mongoose");
const encrypt = require("mongoose-encryption");
const app = express();



app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

//connecting to Database
mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true})
     .then(async ()=>{
      console.log('Connected to MongoDB Atlas')
     })
    .catch(error=>{
      console.log('Error in Connecting to MongoDB Atlas', error)
    })

// create schema 

const Schema = mongoose.Schema;
const userSchema = new Schema({
    email: String,
    password: String
})

//encrpting the password

userSchema.plugin(encrypt, { secret: process.env.SECRET , encryptedFields: ['password']});

//create model

const User = new mongoose.model('User', userSchema);





app.get('/', (req,res)=>{
    res.render("home");
})

app.get('/login', (req,res)=>{
    res.render("login");
})

app.get('/register', (req,res)=>{


    res.render("register");
})





app.post("/register", (req, res)=>{
    const newUser = new User({
        email:req.body.username,
        password:req.body.password
    })

    newUser.save()
     .then(()=>{
        console.log(`User ${newUser.email} is saved`);
        res.render('secrets');
     })
     .catch((error)=>{
        console.log(`User not saved :`, error);
     })

    // res.redirect('/');
})


app.post("/login",async (req, res)=>{

    const username = req.body.username;
    const password = req.body.password;
    
    const foundUser = await User.findOne({email:username}).exec();
   
    if(foundUser.password === password){
        console.log("User Matched!!!");
        res.render('secrets');
    }

});





app.listen(port, ()=>{
    console.log(` Server is running on port ${port} Successfully !!!`);
})