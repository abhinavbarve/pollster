const express = require('express');
const path = require('path');
const app = express();
const body_parser = require('body-parser')



// view engine setup
app.set('view engine', 'ejs');


// body_parser
app.use(body_parser.urlencoded({extended : true}))

// declare public files
app.use(express.static(path.join(__dirname, 'public')));



app.get("/" , (req,res)=>{
    res.render("home", {})
}) 









// Listen on Port 3000
app.listen(3000, (req,res)=>{
  console.log("Server is running on port 3000.")
})



