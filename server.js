// -------------
let acc_name
let acc_pic
let googleId
// -------------
require("dotenv").config();
const { v4: uuidv4 } = require('uuid');
const express = require('express')
const app = express()
const path = require('path');
const body_parser = require('body-parser');
const mongoose = require("mongoose")
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate")
const randomcolor = require("randomcolor");
console.log(randomcolor())

// view engine setup
app.set('view engine', 'ejs');


// body_parser
app.use(body_parser.urlencoded({extended : true}))

// declare public files
app.use(express.static('public'));

app.use(session({                                    // comes from express-session [starts a session]                     
	secret: process.env.SECRET,
	saveUninitialized: false,
	resave: false
}));


app.use(passport.initialize())                       // initialize passport
app.use(passport.session())                          // use passport for dealing with the sessions

  

mongoose.connect(process.env.DATABASE_KEY,{useNewUrlParser : true,useUnifiedTopology: true }) // connect to the database.
mongoose.set("useCreateIndex", true);                // remove deprecation warning.


const userSchema = new mongoose.Schema({             // mongoose schema [compulsarily]
	username: {
		type: String,
		required: true
	},
	googleId: String
});

const pollSchema = new mongoose.Schema({
	user_googleId: {
		type: String,
		required: true
	},
	pollId: {
		type: String,
		required: true
	},
	ques: {
		type: String, 
		required: true
	},
	options: {
		type: String, 
		required: true
	}
})

userSchema.plugin(passportLocalMongoose)             // use the passport-local-mongoose package
userSchema.plugin(findOrCreate)                      // use the mongoose-findorcreate package


const User = new mongoose.model("User", userSchema); // user model
const Poll = new mongoose.model("Poll", pollSchema); // poll question model

passport.use(User.createStrategy());                 // comes from passport-local-mongoose


// passport.serializeUser(function (user, done) {
// 	done(null, user.id);
// });

// passport.deserializeUser(function (id, done) {
// 	User.findById(id, function (err, user) {
// 		done(err, user);
// 	});
// });

// the following way of serializing and de-serializing is used for testing purposes.

passport.serializeUser(User.serializeUser());        // (comes from passport-local-mongoose)
passport.deserializeUser(User.deserializeUser());    // (comes from passport-local-mongoose)


passport.use(new GoogleStrategy({                    // comes from passport-google-oauth20 strategy (this code has to be put after "starting of the session and other setup" and before the "routes". )
	clientID: process.env.GOOGLE_CLIENT_ID,
	clientSecret: process.env.GOOGLE_CLIENT_SECRET,
	callbackURL: "http://localhost:8080/auth/google/pollster",
	userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
	(accessToken, refreshToken, profile, cb) => {
		acc_name = profile.displayName
		acc_pic = profile.photos[0].value
		googleId = profile.id
		User.findOrCreate({ googleId: googleId, username: acc_name }, function (err, user) {
			return cb(err, user);
		});
	}
));


app.get("/", (req, res) => {
	(req.isAuthenticated()) ? (res.redirect("/pollster")) : (res.render("home", { title: "Home" }))
});


app.get("/auth/google",                              // this will use the new GoogleStrategy to authenticate the user declared above. 
	passport.authenticate("google", { scope: ["profile"] }));


app.get("/pollster", (req, res) => {                 // pollster main page 
	Poll.find({}, (err, foundPolls) => {
		if (!err) {
			if (foundPolls) {
				(req.isAuthenticated()) ? (res.render("pollster", { title: "Poll", acc_name: acc_name, acc_pic: acc_pic, polls: foundPolls })) : (res.redirect("/"))
			} else {
				(req.isAuthenticated()) ? (res.render("pollster", { title: "Poll", acc_name: acc_name, acc_pic: acc_pic, polls: [] })) : (res.redirect("/"))
			}
		} else {
			console.log(err)
		}
	});
})

app.get("/auth/google/pollster",                     // google redirect link upon authentication.
	passport.authenticate("google", { failureRedirect: "/" }),
	function (req, res) {
		// Successful authentication, redirect to pollster.
		res.redirect("/pollster");
	}
);

app.get("/login", (req, res) => {
	(req.isAuthenticated()) ? res.redirect("/pollster") : (res.render("login", { title: "Login" }));
})

app.get("/newpoll", (req, res) => {
	// (req.isAuthenticated()) ? res.render("newpoll",{title: "New Poll", acc_name : acc_name, acc_pic : acc_pic}) : (res.redirect("/login"));
	res.render("newpoll", { title: "New Poll", acc_name: acc_name, acc_pic: acc_pic });
})

app.post("/newpoll", (req, res) => {
	
	const newPoll = new Poll({
		user_googleId: googleId, 
		pollId: uuidv4(),
		ques: req.body.ques,
		options: req.body.options
	})

	newPoll.save((err) => {
		if (!err) {
			res.send("A new Poll was made.")
		} else {
			console.log(err)
			res.send("There was some error in making a new poll. Please try again.")
		}
	})

})

app.get("/mypolls", (req, res) => {
	Poll.find({user_googleId: googleId}, (err, foundPolls) => {
		if (!err) {
			if (foundPolls) {
				res.render("mypolls", { title: "My Poll", acc_Id: googleId , acc_name: acc_name, acc_pic: acc_pic, acc_polls: foundPolls });
			} else {
				res.render("mypolls", { title: "My Poll", acc_Id: googleId , acc_name: acc_name, acc_pic: acc_pic, acc_polls: [] });
			}
		} else {
			console.log(err);
			res.send("Oops! There was an error in making this poll, try again.")
		}
	})
})

app.get("/logout", (req, res) => {
	req.logout();
	res.redirect("/");
})

app.get("/polls/:pollId", (req, res) => {
	Poll.find({ pollId: req.params.pollId }, (err, foundPoll) => {
		if (!err) {
			if (foundPoll) {
				res.render('poll-page', {title: "Poll", acc_Id: googleId , acc_name: acc_name, acc_pic: acc_pic, poll: foundPoll[0]});
			} else {
				res.send("No poll matches with given Id.")
			}
		} else {
			console.log(err);
			res.send("Oops! There was an error in making this poll, try again.")
		}
	})
	
})

// Listen on Port 8080
app.listen(8080, (req,res)=>{
  console.log("Server is running on port 8080.")
})
