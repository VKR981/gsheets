const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const sheetSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  subscription: {
    type: Schema.Types.ObjectId,
    ref: "subscriptions",
    required: true,
  },
  sheets: [
    {
      sheetid: {
        type: String,
      },
      tabs: [String],
    },
  ],
});

module.exports = Profile = mongoose.model("sheets", sheetSchema);
