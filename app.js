require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");



mongoose.connect('mongodb://127.0.0.1:27017/mygit');
const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: 'Our little secret.',
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());


const pracSchema = new mongoose.Schema({
    email: String,
    password: String
});
const itemsSchema = new mongoose.Schema({
    name: String,
    user : {
        type:mongoose.Schema.Types.ObjectId,
        ref:"pracSchema"
    }
});
const Item = mongoose.model("Item", itemsSchema);



// pracSchema.plugin(encrypt,{secret:process.env.SECRET , encryptedFields:["password"]});
pracSchema.plugin(passportLocalMongoose);

const Prac = mongoose.model("Prac", pracSchema);

passport.use(Prac.createStrategy());
passport.serializeUser(Prac.serializeUser());
passport.deserializeUser(Prac.deserializeUser());




const item1 = new Item({
    name: "Item1 trial"
});
const item2 = new Item({
    name: "Item2 trial"
});
const item3 = new Item({
    name: "Item3 trial"
});

const defaultItems = [item1, item2, item3];




app.get("/", function (req, res) {
    res.render("home");
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.get("/list", function (req, res) {
    if (req.isAuthenticated()) {
        main().catch((err) => console.log(err));

        async function main() {
            const userId = req.user._id;
            console.log(userId);
            const myquery = await Item.find({user : userId});
            // if (myquery.length === 0) {
            //     Item.insertMany(defaultItems);
            //     res.redirect("/");
            // }
            // else {

                res.render("list1", { listTitle: "Today", newListItems: myquery });
            // }
        }
    }
    else {
        res.render("login");
    }
});
app.post("/list", async function (req, res) {
    try {
        const itemName = req.body.newItem;

        const item = new Item({
            name: itemName,
            user: req.user._id
        });

        await item.save();
        res.redirect("/list");
    } catch (err) {
        console.log(err);
        res.redirect("/list"); // Handle errors appropriately
    }
});
  
app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    // console.log(checkedItemId);
    const listName = req.body.listName;
    // console.log(listName);
    main().catch((err) => console.log(err));
  
    async function main() {
      
        await Item.findByIdAndDelete(checkedItemId);
        res.redirect("/list"); 
    }
    
  })


app.get('/logout', function (req, res, next) {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

app.post("/register", function (req, res) {
    Prac.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        }
        else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/list");
            })
        }
    })


});

app.post("/login", function (req, res) {
    const prac = new Prac({
        username: req.body.username,
        password: req.body.password
    });

    req.login(prac, function (err) {
        if (err) {
            console.log(err);
            res.redirect("/login");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/list");
            });
        }
    });
});

app.listen(3000, function (req, res) {
    console.log("3000 port in use");
});