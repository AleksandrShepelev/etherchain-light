var express = require('express');
var router = express.Router();

var async = require('async');
var Web3 = require('web3');
var addressLog = require('../db/addressLog');
const abi = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"idGame","type":"string"},{"name":"gamers","type":"address[]"},{"name":"_amount","type":"uint256"}],"name":"createGame","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"INITIAL_SUPPLY","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_amount","type":"uint256"}],"name":"mint","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_value","type":"uint256"}],"name":"burn","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_user","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"idGame","type":"string"},{"name":"refunders","type":"address[]"},{"name":"abusers","type":"address[]"},{"name":"amount","type":"uint256"},{"name":"caseId","type":"string"}],"name":"refundGame","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"idGame","type":"string"},{"name":"winners","type":"address[]"}],"name":"finishGame","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"idGame","type":"string"},{"name":"gamers","type":"address[]"}],"name":"cancellationGame","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"idGame","type":"string"}],"name":"balanceOfDeposit","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"Action","type":"string"},{"indexed":true,"name":"burner","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Action","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"Action","type":"string"},{"indexed":false,"name":"idGame","type":"string"},{"indexed":false,"name":"value","type":"uint256"},{"indexed":false,"name":"countGamers","type":"uint256"}],"name":"GameStatus","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"action","type":"string"},{"indexed":false,"name":"idGame","type":"string"},{"indexed":false,"name":"amount","type":"uint256"},{"indexed":false,"name":"caseId","type":"string"}],"name":"GameRefund","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"transfer","type":"string"},{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}];
const contractAddress = "0x4c8f40588b6069936463825295c18b4e352bb7c3";


router.get('/:account', function(req, res, next) {

  var config = req.app.get('config');
  var web3 = new Web3();
  web3.setProvider(config.provider);

  var ClickCoinContract = web3.eth.contract(abi);
  var contract = ClickCoinContract.at(contractAddress);

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

      addressLog.find({address: req.params.account}).sort({$natural:-1}).exec(function (err, transactions) {
        callback(err, transactions)
      });

    }, function(txs, callback) {
        data.txs = txs;
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
