var express = require('express');
var router = express.Router();
var blockLog = require('../db/blockLog');
var async = require('async');
var Web3 = require('web3');
const pageSize = 50;

router.get('/', function (req, res, next) {

  var config = req.app.get('config');
  var web3 = new Web3();
  web3.setProvider(config.provider);
  const page = req.query.page ? req.query.page : 1;
  const pagesToSkip = page - 1;
  async.waterfall([
    function (callback) {
      blockLog.find({txs: {$gt: 0}}).sort({number: -1}).skip(pagesToSkip * pageSize).limit(pageSize).exec(function (err, blocks) {
        callback(err, blocks)
      });
    },
    function (blocks, callback) {
      blockLog.find({txs: {$gt: 0}}).count().exec(function (err, blocksCount) {
        callback(err, blocks, blocksCount)
      });
    },
    function (blocks, blocksCount, callback) {
      callback(null, blocks, blocksCount)
    }
  ], function (err, blocks, blocksCount) {
    if (err) {
      return next(err);
    }

    res.render('txsblocks', {blocks: blocks, page: page, pages: Math.ceil(blocksCount / pageSize)});
  });

});

module.exports = router;
