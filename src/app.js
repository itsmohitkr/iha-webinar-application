require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const hbs = require('hbs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require("cookie-parser");
const auth = require("./middleware/auth");

const port = process.env.PORT || 5000;

require("./db/conn");
const Register = require("./models/registers");
const Register_Webinar = require("./models/reserveSpot");
const Drop_query = require("./models/faq");
const { connection } = require('mongoose');

const static_path = path.join(__dirname, "../public");
const template_path = path.join(__dirname, "../templates/views");
const partials_path = path.join(__dirname, "../templates/partials");

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({
    extended: false
}));


app.use(express.static(static_path));
app.set("view engine", "hbs");
app.set("views", template_path);
hbs.registerPartials(partials_path);

app.get("/",(req, res) => {
    res.render("index");
})

app.get("/Publications",auth, (req, res) => {
    res.render("Publications");
})

app.get("/login", (req, res) => {
    res.render("login");
})

app.get("/register", (req, res) => {
    res.render("register");
})

app.get("/logout", auth, async (req, res) => {
    try {
        // for sinle logout
        req.user.tokens = req.user.tokens.filter((currentElement) => {
            return currentElement.token !== req.token;
        })

        // logout from all devises
        // req.user.tokens = [];


        res.clearCookie("jwt"); // to delete all cookies 
        console.log("logout successfully!!");

        await req.user.save();
        res.render("login");

    } catch (error) {
        res.status(500).send(error);
        console.log(error);
    }
})

app.get("/register", (req, res) => {
    res.render("register");
})

app.get("/login",auth, (req, res) => {
    res.render("login");

})


// create a new user in database 
app.post("/register", async (req, res) => {
    try {
        const password = req.body.password;
        const cpassword = req.body.confirmpassword;

        if (password === cpassword) {
            const form_data = new Register({
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                email: req.body.email,
                phone: req.body.phone,
                password: req.body.password,
                confirmpassword: req.body.confirmpassword
            })

            console.log(`before generating ${form_data}`);

            const token = await form_data.generateAuthToken();
            console.log(`the tokens ${token}`);

            // // cookies
            res.cookie("jwt", token, {
                expires: new Date(Date.now() + 3600000),
                httpOnly: true
            });
            const registered = await form_data.save(() => {
                    console.log("successfully submitted sign up details");
            });
            res.status(201).render("login");
        } else {
            res.send("passwords are not matching");
        }

    } catch (error) {
        // res.status(400).send(error);
        console.log(error);
    }
})


// login post 
var name;

app.post("/login", async (req, res) => {
    try {
        const useremail = req.body.email;
        const password = req.body.password;

        const useremail_from_db = await Register.findOne({
            email: useremail
        });
        const isMatch = await bcrypt.compare(password, useremail_from_db.password);

        const token = await useremail_from_db.generateAuthToken();
        console.log(`the tokens ${token}`);

        // cookies
        res.cookie("jwt", token, {
            expires: new Date(Date.now() + 3600000),
            httpOnly: true
        });

        if (isMatch) {
            res.status(201).render("index", {
                name: useremail_from_db.firstname,
            });
        } else {
            res.send("Invalid email or password");
        }
    } catch (error) {
        // res.status(400).send(error);
        res.render("register");
        // res.status(400).send("invalid email")
    }
})

// post request for webinar registration

app.post("/webinar_registration", async (req, res) => {
    try {
        const reserve_spot_form_data = new Register_Webinar({
            fullname: req.body.fullname,
            email: req.body.email,
            organisation: req.body.organisation
        })
        const registered_spot = await reserve_spot_form_data.save(() => {
            alert("hi");
        });
        res.status(201).render("index");
    } catch (error) {
        // res.status(400).send(error);
        console.log(error);
    }
})

// post request for auery and feedback submission

app.post("/drop_query_feedback", async (req, res) => {
    try {
        const feedback_form_data = new Drop_query({
            fullname: req.body.fullname,
            email: req.body.email,
            questions: req.body.questions,
            feedback: req.body.feedback
        })
        const registered_spot = await feedback_form_data.save();
        res.status(201).render("index");
    } catch (error) {
        // res.status(400).send(error);
        console.log(error);
    }
})
app.listen(port, () => {
    console.log(`server has started at http://localhost:${port}`);
})

