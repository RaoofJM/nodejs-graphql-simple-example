const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const Schema = mongoose.Schema;

const User = Schema({
  fname: { type: String, required: true },
  lname: { type: String, required: true },
  gender: { type: String, default: "Male" },
  age: { type: Number, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
});

User.plugin(mongoosePaginate);

User.virtual("articles", {
  ref: "Article",
  localField: "_id",
  foreignField: "user",
});

module.exports = mongoose.model("User", User);
