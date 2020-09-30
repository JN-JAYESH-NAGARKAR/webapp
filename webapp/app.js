const express = require('express');
const bodyParser = require('body-parser');
const cors = require("cors");

const app = express();

require('dotenv').config();

app.use(cors());

// Parse Requests of content-type - application/json
app.use(bodyParser.json());

// Parse Requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Home Page route
app.get("/", (req, res) => {
    res.status(200).send('Welcome to Web Application');
});

//Import Routes
const userRoute = require('./routes/user_routes');
app.use('/v1/user', userRoute);


module.exports = app;