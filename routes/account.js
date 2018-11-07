var express = require('express');
var router = express.Router();
var clickcoin = require('../utils/clickcoin');
var async = require('async');
var Web3 = require('web3');
var addressLog = require('../db/addressLog');
var eventLog = require('../db/eventLog');


router.get('/:account', function(req, res, next) {

  var config = req.app.get('config');
  var web3 = new Web3();
  web3.setProvider(config.provider);

  var ClickCoinContract = web3.eth.contract(clickcoin.abi);
  var contract = ClickCoinContract.at(clickcoin.address);

  var db = req.app.get('db');

  var data = {};

  async.waterfall([
    function(callback) {
      contract.balanceOf.call(req.params.account, function (err, result) {
        callback(null, result);
      });
    },
    function(result, callback) {
      data.clickCoins = result;
      callback(null);
    },
    function(callback) {
      web3.eth.getBlock("latest", false, function(err, result) {
        callback(err, result);
      });
    }, function(lastBlock, callback) {
      data.lastBlock = lastBlock.number;
      //limits the from block to -1000 blocks ago if block count is greater than 1000
      if (data.lastBlock > 0x3E8) {
        data.fromBlock = data.lastBlock - 0x3e8;
      } else {
        data.fromBlock = 0x00;
      }
      web3.eth.getBalance(req.params.account, function(err, balance) {
        callback(err, balance);
      });
    }, function(balance, callback) {
      data.balance = balance;
      web3.eth.getCode(req.params.account, function(err, code) {
        callback(err, code);
      });
    }, function(code, callback) {
      data.code = code;
      if (code !== "0x") {
        data.isContract = true;
      }
      addressLog.find({address: req.params.account}).sort({block:-1}).exec(function (err, transactions) {
        callback(err, transactions)
      });
    }, function(txs, callback) {
        data.txs = txs;
        callback();
    },
    function (callback) {
      eventLog.find({$or: [{addressFrom: req.params.account}, {addressTo: req.params.account}]}).sort({height: -1}).exec(function (err, events) {
        callback(err, events)
      })
    }, function(events, callback) {
      data.events = events;
      console.log(events);
      callback();
    }
  ], function(err) {
    if (err) {
      return next(err);
    }
    data.address = req.params.account;
    res.render('account', { account: data });
  });

});

module.exports = router;
