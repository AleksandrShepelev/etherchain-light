var mongoose = require("mongoose");
var db = mongoose.connect('mongodb://localhost:27017/cybe');

const AddressSchema = mongoose.Schema(
  {
    address: { type: String, index: true, unique: true },
    balance: Number
  },
  {
    usePushEach: true
  }
);

module.exports = mongoose.model("Address", AddressSchema);
