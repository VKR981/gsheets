const mongoose = require("mongoose");
const User = require("../../models/User.js");

console.log("sdf");
User.findOne({ email: "adsads@gmail.com" }).then((o, p) => console.log(o, p));
console.log("2");
