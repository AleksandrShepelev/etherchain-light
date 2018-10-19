var express = require('express');
var router = express.Router();

var async = require('async');
var Web3 = require('web3');


router.get('/', function(req, res, next) {

  var config = req.app.get('config');
  var web3 = new Web3();
  web3.setProvider(config.provider);

  async.waterfall([
    function(callback) {
      web3.eth.getBlock("latest", false, function(err, result) {
        callback(err, result);
      });
    }, function(lastBlock, callback) {
      var blocks = [];

      var blockCount = 10;

      if (lastBlock.number - blockCount < 0) {
        blockCount = lastBlock.number + 1;
      }

      var counter = 0;

      var numOfBlocksWithTxs = 0;

      var blocks = [];
      async.whilst(
        function () {
          console.log("counter: " +counter);
          console.log("num of blocks with txs: " + numOfBlocksWithTxs);
          console.log("lastblocknum: " + lastBlock.number);
          console.log("blockCount: " + blockCount);
          console.log((lastBlock.number - counter < 0));
          console.log((numOfBlocksWithTxs > blockCount));

          console.log((lastBlock.number - counter < 0) || (numOfBlocksWithTxs >= blockCount));
          return (!((lastBlock.number - counter < 0) || (numOfBlocksWithTxs >= blockCount)))
        },
        function(next) {
          web3.eth.getBlock(lastBlock.number - counter, true, function(err, block) {
            counter++;
            if (block.transactions.length > 0) {
            numOfBlocksWithTxs++;
            blocks.push(block)
          }
          next(err, block);
        });
      },
        function(err) {
        callback(err, blocks);
      });
    }
  ], function(err, blocks) {
    if (err) {
      return next(err);
    }

    var txs = [];
    blocks.forEach(function(block) {
      block.transactions.forEach(function(tx) {
        if (txs.length === 10) {
          return;
        }
        txs.push(tx);
      });
    });
    res.render('index', { blocks: blocks, txs: txs });
  });

});

module.exports = router;
