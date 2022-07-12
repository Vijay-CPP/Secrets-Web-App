//jshint esversion:6

// Required Modules 
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
// const md5 = require("md5"); // Hashing
// Salting with bcrypt
// const bcrypt = require("bcrypt");
// const saltRounds = 10;

// Setup for EJS, BodyParser, Static Pages
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


// session should be placed just after starting and before database
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Mongoose Database Setup
mongoose.pluralize(null);
const dbName = "userDB";
// const localURI = 'mongodb://localhost:27017/';

const dbIntigration = process.env.DB_USERNAME + ":" + process.env.DB_PASSWORD;

const uri = "mongodb+srv://" + dbIntigration + "@cluster0.w4izs.mongodb.net/";
mongoose.connect(uri + dbName);

// Collection Structure
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const secretsSchema = new mongoose.Schema({
    data: String
});

userSchema.plugin(passportLocalMongoose);
const user = new mongoose.model("users", userSchema);
const secret = new mongoose.model("secrets", secretsSchema);

passport.use(user.createStrategy());
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/secrets", (req, res) => {
    if (req.isAuthenticated()) {
        secret.find((err, foundArray) => {
            if (!err)
                res.render("secrets", { secretArray: foundArray });
        });
    }
    else
        res.redirect("/login");
});

app.get("/submit", (req, res) => {
    if (req.isAuthenticated())
        res.render("submit");
    else
        res.redirect("/login");
});

app.post("/submit", (req, res) => {
    const submittedSecret = req.body.secret;
    const secretObj = new secret({
        data: submittedSecret
    });
    secretObj.save();
    res.redirect("/secrets");
});

// When user registers
app.post("/register", (req, res) => {
    const usrNm = req.body.username;
    const password = req.body.password;

    const usernameObj = { username: usrNm };

    user.register(usernameObj, password, (err, registeredUser) => {
        if (err) {
            console.log(err);
            res.redirect("/register");
        }
        else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets");
            });
        }
    });
});

// When user logins
app.post("/login", (req, res) => {
    const usrNm = req.body.username;
    const pswrd = req.body.password;

    const userObj = new user({
        username: usrNm,
        password: pswrd
    });

    req.login(userObj, (err) => {
        if (err) {
            console.log(err);
            res.redirect("/login");
        }
        else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets");
            });
        }
    });
});

// Logout

app.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err)
            console.log(err);
        else
            res.redirect("/");
    });
});


// Starting server
const port = process.env.PORT || 3000;
app.listen(port, (req, res) => {
    console.log("Listening to port 3000");
});


// var https = require("https");
// setInterval(function() {
//     https.get("https://secrets-vijay-cpp.herokuapp.com");
// }, 300000); // every 5 minutes (300000)