var mongoose = require("mongoose");
var db = mongoose.createConnection('localhost', 'cybe');

const AddressLogSchema = mongoose.Schema(
  {
    address: { type: String, index: true },
    type: String,
    hash: String
  },
  {
    usePushEach: true
  }
);

module.exports = db.model("AddressLogSchema", AddressLogSchema);
