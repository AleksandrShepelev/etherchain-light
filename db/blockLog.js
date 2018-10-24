var mongoose = require("mongoose");
var db = mongoose.connect('mongodb://localhost:27017/cybe');

const BlockLogSchema = mongoose.Schema(
  {
    number: {type: Number, index: true, unique: true},
    txs: Number,
    timestamp: Date
  },
  {
    usePushEach: true
  }
);

module.exports = mongoose.model("BlockLog", BlockLogSchema);
