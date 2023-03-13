// require('dotenv').config();
const mongoose = require('mongoose');

// const dbpath = process.env.DB_URL;

const connect = () => {
    mongoose.connect(process.env.DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
        .then(() => {
            console.log("DATABASE CONNECTED SUCCESSFULLY");
        })
        .catch((e) => {
            console.log("DB CONNECTION FAILED");
            console.log(e);
        });
}


module.exports = { connect }