var express = require('express');
var router = express.Router();

var async = require('async');
var Web3 = require('web3');

router.get('/txblocks', function(req, res, next) {

  var config = req.app.get('config');
  var web3 = new Web3();
  web3.setProvider(config.provider);

  async.waterfall([
    function(callback) {
      web3.eth.getBlock("latest", false, function(err, result) {
        callback(err, result);
      });
    }, function(lastBlock, callback) {
      var blockCount = 100;

      if (lastBlock.number - blockCount < 0) {
        blockCount = lastBlock.number + 1;
      }

      var counter = 0;

      var numOfBlocksWithTxs = 0;

      var blocks = [];
      async.whilst(
        function () {
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

    res.render('txblocks', { blocks: blocks });
  });

});

module.exports = router;
