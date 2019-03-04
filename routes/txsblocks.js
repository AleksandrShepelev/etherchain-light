var express = require('express');
var router = express.Router();
var blockLog = require('../db/blockLog');
var async = require('async');
var Web3 = require('web3');
const pageSize = 50;

router.get('/:page?', function (req, res, next) {

  var config = req.app.get('config');
  var web3 = new Web3();
  web3.setProvider(config.provider);
  console.log(req.params.page);
  const page = req.params.page ? req.params.page : 1;
  const pagesToSkip = page - 1;
  console.log(page);
  console.log(pagesToSkip);
  async.waterfall([
    function (callback) {
      blockLog.find({txs: {$gt: 0}}).sort({number: -1}).skip(pagesToSkip * pageSize).limit(pageSize).exec(function (err, blocks) {
        callback(err, blocks)
      });
    },
    function (blocks, callback) {
      callback(null, blocks);
    }
  ], function (err, blocks) {
    if (err) {
      return next(err);
    }

    res.render('txsblocks', {blocks: blocks, page: page});
  });

});

module.exports = router;
