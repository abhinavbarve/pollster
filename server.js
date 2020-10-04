//jshint esversion:6
// global variables
let acc_name
let acc_pic
let googleId
let cur_pollId = ""
// -------------
require("dotenv").config();
const express = require("express")
const app = express()
const body_parser = require("body-parser");
const mongoose = require("mongoose")
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate")
const { v4: uuidv4 } = require("uuid");
const randomcolor = require("randomcolor");
const alert = require("alert");

// view engine setup
app.set("view engine", "ejs");

// body_parser
app.use(body_parser.urlencoded({ extended: true }))

// declare public files
app.use(express.static("public"));

app.use(session({                                                    // comes from express-session [starts a session]                     
	secret: process.env.SECRET,
	saveUninitialized: false,
	resave: false
}));

app.use(passport.initialize())                                       // initialize passport
app.use(passport.session())                                          // use passport for dealing with the sessions


mongoose.connect(process.env.DATABASE_KEY, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }) // connect to the database.

const userSchema = new mongoose.Schema({                             // mongoose schema [compulsarily]
	username: {
		type: String,
		required: true
	},
	googleId: String
});

const pollSchema = new mongoose.Schema({
	maker_googleId: {
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
		type: Array,
		required: true
	},
	voted_by: {
		type: Array,
		required: true
	}
})


userSchema.plugin(passportLocalMongoose)                             // use the passport-local-mongoose package
userSchema.plugin(findOrCreate)                                      // use the mongoose-findorcreate package


const User = new mongoose.model("User", userSchema);                 // user model
const Poll = new mongoose.model("Poll", pollSchema);                 // poll question model


passport.use(User.createStrategy());                                 // comes from passport-local-mongoose

passport.serializeUser(function (user, done) {
	done(null, user.id);
});

passport.deserializeUser(function (id, done) {
	User.findById(id, function (err, user) {
		done(err, user);
	});
});

// the following way of serializing and de-serializing is used for testing purposes.

// passport.serializeUser(User.serializeUser());                        // (comes from passport-local-mongoose)
// passport.deserializeUser(User.deserializeUser());                    // (comes from passport-local-mongoose)


passport.use(new GoogleStrategy({                                    // comes from passport-google-oauth20 strategy (this code has to be put after "starting of the session and other setup" and before the "routes". )
	clientID: process.env.GOOGLE_CLIENT_ID,
	clientSecret: process.env.GOOGLE_CLIENT_SECRET,
	callbackURL: "https://pollster-org.herokuapp.com/auth/google/polls",
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

// pollster landing page
app.get("/", (req, res) => {
	(req.isAuthenticated()) ? (res.redirect("/polls")) : (res.render("home", { title: "Home", login: req.isAuthenticated()}))
});

// google auth
app.get("/auth/google",                                               
	passport.authenticate("google", { scope: ["profile"] }));


// pollster home/main page
app.get("/polls", (req, res) => {                 				
	Poll.find({}, (err, foundPolls) => {
		if (!err) {
			res.render("polls", { title: "Poll", acc_name: acc_name, acc_pic: acc_pic, polls: (foundPolls ? foundPolls : []), login: req.isAuthenticated() })
		} else {
			console.log(err)
		}
	});
})

// google auth redirect
app.get("/auth/google/polls",                    				// google redirect link upon authentication.

	passport.authenticate("google", { failureRedirect: "/" }),
	function (req, res) { res.redirect("/polls") } 				// Successful authentication, redirect to polls.

);


// login page
app.get("/login", (req, res) => {
	(req.isAuthenticated()) ? res.redirect("/polls") : (res.render("login", {
		title: "Login"
	}));
})


// get newpoll form
app.get("/newpoll", (req, res) => {
	(req.isAuthenticated()) ? res.render("newpoll", { title: "New Poll", acc_name: acc_name, acc_pic: acc_pic, login: req.isAuthenticated() }) : (res.redirect("/login"));
})


// make a new poll
app.post("/newpoll", (req, res) => {
	let options = [];
	function refine(req) {                                               // removes extra lines and spaces

		let res = []
		req.trim().split("\r\n").map((each) => { if (each !== "") { res.push(each.trim()) } });
		return res

	}
	let option_names = refine(req.body.options);
	for (let i = 0; i < option_names.length; i++) {
		options.push({
			color: randomcolor(),
			name: option_names[i],
			score: 0
		})
	}

	const newPoll = new Poll({ maker_googleId: googleId, pollId: uuidv4(), ques: req.body.ques, options: options, voted_by: [] });

	newPoll.save((err) => {
		if (!err) {
			res.redirect("/polls/"+newPoll.pollId)
		} else {
			console.log(err)
			res.send("There was some error in making a new poll. Please <a href='http://pollster-org.herokuapp.com/login'>login</a> again.")
		}
	})

})


// My Polls
app.get("/mypolls", (req, res) => {

	Poll.find({ user_googleId: googleId }, (err, foundPolls) => {
		if (!err) {
			res.render("mypolls", { title: "My Poll", acc_Id: googleId, acc_name: acc_name, acc_pic: acc_pic, acc_polls: (foundPolls ? foundPolls : []), login: req.isAuthenticated()});
		} else {
			console.log(err);
			res.send("Oops! There was an error in making this poll, try again.")
		}
	})

})


// vote for a poll
app.get("/polls/:pollId", (req, res) => {
	Poll.findOne({ pollId: req.params.pollId }, (err, foundPoll) => {
		if (!err) {
			if (foundPoll) {
				cur_pollId = foundPoll.pollId
				res.render("poll-page", { title: "Poll", acc_Id: googleId, acc_name: acc_name, acc_pic: acc_pic, poll: foundPoll, login: req.isAuthenticated()});
			} else {
				res.send("No poll matches with given Id.")
			}
		} else {
			console.log(err);
			res.send("Oops! There was an error in making this poll, try again.")
		}
	})
})


// database fetch call
app.get("/database/" + process.env.DATABASE_URL + "/pollData", (req, res) => {
	Poll.find({ pollId: cur_pollId }, (err, foundPoll) => {
		if (!err) {

			if (foundPoll) { res.send(foundPoll) } else { res.send([]) };

		} else {
			console.log(err)
		}
	})
})

app.post("/polls/submitpoll", (req, res) => {
	let opt_sel = req.body.poll_option
	Poll.findOne({ pollId: cur_pollId }, (err, foundPoll) => {
		if (!err) {
			if (foundPoll) {
				if (foundPoll.voted_by.includes(googleId) === false) {
					foundPoll.options.forEach((each) => {           // add 1 to score // add user to voted list.
						if (each.name === opt_sel) {
							each.score += 1;
							foundPoll.voted_by.push(googleId)
						}
					});	
					new Poll(foundPoll).save((err) => {             // save the current poll
						if (!err) {
							res.redirect("/polls/" + cur_pollId)
						} else {
							res.send(err)
						}
					})
				} else {
					alert("You can vote only once")
				}
			} else {
				res.write("No such poll found.");
				res.redirect("/polls");
			}
		} else {
			console.log(err);
		}
	})
})

// pollster logout
app.get("/logout", (req, res) => {
	req.logout();
	res.redirect("/");
})

// Listen on Port 3000
app.listen(process.env.PORT || 3000, (req, res) => {
	console.log("Server is running on port 3000.")
})