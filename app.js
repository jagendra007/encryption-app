//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const mongoose = require("mongoose");

const port = 3000;
const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret: "Jagendra Srivastava",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Connecting to Database
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(async () => {
        console.log('Connected to MongoDB Atlas')
    })
    .catch(error => {
        console.log('Error in Connecting to MongoDB Atlas', error)
    })

// Create schema
const Schema = mongoose.Schema;
const userSchema = new Schema({
    email: String, // Keep the 'email' field
    password: String
});

userSchema.plugin(passportLocalMongoose);

// Create model
const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




app.get('/', (req, res) => {
    res.render("home");
})

app.get('/login', (req, res) => {
    res.render("login");
})

app.get('/register', (req, res) => {


    res.render("register");
})

app.get('/secrets', (req,res)=>{
     if(req.isAuthenticated()){
        res.render("secrets.ejs");
     }else{
        res.redirect("/login");
     }
   
})

app.get("/logout", function(req, res){
    req.logout(function(err) {
        if (err) {
            console.error(err);
        }
        res.redirect("/");
    });
});


app.post("/register", async (req, res) => {
    const newUser = new User({
        username: req.body.username // Use 'username' from your form for the 'email' field
    });

    try {
        await User.register(newUser, req.body.password);
        // res.redirect("/login");
        res.redirect("/secrets")
    } catch (error) {
        console.error(error);
        res.redirect("/register"); // Redirect back to the registration page on error
    }
});



app.post("/login", async (req, res) => {

     const user = new User({
        username: req.body.username,
        password: req.body.password
     })
  
     req.login(user, function(err) {
        if (err) {
             console.log(err) 
        }else{
            passport.authenticate("local")(req,res, function(){
                res.redirect("/secrets")
            } )
        }
       
      });
     

});





app.listen(port, () => {
    console.log(` Server is running on port ${port} Successfully !!!`);
})