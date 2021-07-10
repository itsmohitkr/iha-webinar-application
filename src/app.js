require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const hbs = require('hbs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require("cookie-parser");
const auth = require("./middleware/auth");

const nodemailer  = require('nodemailer');
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
    res.render("index", {
        msg: '',
        msg_drop:'',
    });
})

app.get("/Publications",auth, (req, res) => {
    res.render("Publications");
})

app.get("/about",(req, res) => {
    res.render("about");
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
            // res.status(201).render("login");
            res.status(201).redirect("/login");
        } else {
            res.send("passwords are not matching");
        }

    } catch (error) {
        // res.status(400).send(error);
        console.log(error);
    }
})


// login post 


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
        const registered_spot = await reserve_spot_form_data.save();
        res.status(201).render("index", {
            msg:"Submitted Successfully.",
        });
    } catch (error) {
        // res.status(400).send(error);
        console.log(error);
    }
})

// post request for query and feedback submission

app.post("/drop_query_feedback", async (req, res) => {
    try {
        const feedback_form_data = new Drop_query({
            fullname: req.body.fullname,
            email: req.body.email,
            questions: req.body.questions,
            feedback: req.body.feedback
        })
        const registered_spot = await feedback_form_data.save();
         res.status(201).render("index", {
             msg_drop: "Submitted Successfully.",
         });
    } catch (error) {
        // res.status(400).send(error);
        console.log(error);
    }
})

app.get('/cms', (req, res) => {
    res.render('cms');
})

app.get('/show_email', async (req, res) => {
    try {
        const spot_data = await Register_Webinar.find();
        res.render('cms', {
            datas: spot_data,
        });

    } catch (error) {
        res.send(error);
    }
})

app.get('/show_feedback_queries', async (req, res) => {
    try {
        const feedback_data = await Drop_query.find();
        res.render('cms', {
            feedback: feedback_data,
        });

    } catch (error) {
        res.send(error);
    }
})

app.post('/send_mail', async(req, res) => {
    const output = `
    <p>you have new message</p>
    <h3>Contact details</h3>
    <ul>
        <li>name: ${req.body.name}</li>
        <li>email: ${req.body.email}</li>
        <li>email: ${req.body.subject}</li>
    </ul>

    <h3>Message</h3>
    <p>${req.body.message}</p>
    `;

     // create reusable transporter object using the default SMTP transport
     let transporter = nodemailer.createTransport({
         service: "gmail",
         auth: {
             user: 'studymaterials.mohit048@gmail.com', // generated ethereal user
             pass: `${process.env.PASSWORD}`, // generated ethereal password
         },
         tls: {
             rejectUnauthorized:true
         }
     });

     // send mail with defined transport object
     let info = transporter.sendMail({
         from: '"Iha Medhas 👻"<mohtkumar3005@gmail.com>', // sender address
         to: "itsmohit3005@gmail.com", // list of receivers
         subject: `${req.body.subject}`, // Subject line
         text: "Hello world?", // plain text body
         html: output, // html body
     });

     console.log("Message sent: %s", info.messageId);
     // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

     // Preview only available when sending through an Ethereal account
     console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
     // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    res.render("index");
})
app.listen(port, () => {
    console.log(`server has started at http://localhost:${port}`);
})

