//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const mongoose = require("mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
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
    password: String,
    googleId:String,
    secret: String
});

// PlugIns
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate)

// Create model
const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());


// serialize and deserialize the user


passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
  


//adding google authentication 
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/', (req, res) => {
    res.render("home");
})

app.get('/auth/google',
    passport.authenticate("google",{ scope:["profile"]})
)

app.get("/auth/google/secrets",
       passport.authenticate("google", {failureRedirect: "/login"}),
       function(req, res){
        res.redirect("/secrets");
       });



app.get("/login", (req, res) => {
    res.render("login");
})

app.get('/register', (req, res) => {


    res.render("register");
})

app.get('/secrets', async (req,res)=>{
 try{

 const foundUsers =  await  User.find({"secret": {$ne:null}});
   if(foundUsers){
    res.render("secrets", {userWithSecrets: foundUsers});
   }
 }catch(error){
    console.log(error)
 }

   
})


app.get("/submit", (req,res)=>{

    if(req.isAuthenticated()){
        res.render("submit");
     }else{
        res.redirect("/login");
     }

})

try{



app.post("/submit", async (req,res)=>{

    const submittedSecret = req.body.secret;

    const foundUser = await User.findById(req.user.id);

    if(foundUser){
       foundUser.secret = submittedSecret;
       foundUser.save()
       .then(()=>{
        res.redirect("/secrets")
       })
    }
})

}catch(error){
    console.log(error)
}

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