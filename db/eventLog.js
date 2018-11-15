var mongoose = require("mongoose");
var db = mongoose.connect('mongodb://localhost:27017/cybe');

const EventLogSchema = mongoose.Schema(
  {
    addressFrom: {type: String, index: true},
    addressTo: {type: String, index: true},
    value: Number,
    fee: Number,
    hash: {type: String, index: true},
    height: Number,
    timestamp: Date
  },
  {
    usePushEach: true
  }
);
module.exports = mongoose.model("EventLog", EventLogSchema);

