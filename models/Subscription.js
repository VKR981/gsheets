const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SubscriptionSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "users",
  },
  token: {
    type: Object,
  },
  email: {
    type: String,
  },
});

module.exports = Profile = mongoose.model("subscriptions", SubscriptionSchema);
