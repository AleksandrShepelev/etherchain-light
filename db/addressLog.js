var mongoose = require("mongoose");
var db = mongoose.connect('mongodb://localhost:27017/cybe');

const AddressLogSchema = mongoose.Schema(
  {
    address: { type: String, index: true },
    type: String,
    hash: String,
    block: Number
  },
  {
    usePushEach: true
  }
);

module.exports = mongoose.model("AddressLogSchema", AddressLogSchema);
