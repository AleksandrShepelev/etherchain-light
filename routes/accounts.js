var express = require('express');
var router = express.Router();

var async = require('async');
var Web3 = require('web3');

const abi = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"idGame","type":"string"},{"name":"gamers","type":"address[]"},{"name":"_amount","type":"uint256"}],"name":"createGame","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"INITIAL_SUPPLY","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_amount","type":"uint256"}],"name":"mint","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_value","type":"uint256"}],"name":"burn","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_user","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"idGame","type":"string"},{"name":"refunders","type":"address[]"},{"name":"abusers","type":"address[]"},{"name":"amount","type":"uint256"},{"name":"caseId","type":"string"}],"name":"refundGame","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"idGame","type":"string"},{"name":"winners","type":"address[]"}],"name":"finishGame","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"idGame","type":"string"},{"name":"gamers","type":"address[]"}],"name":"cancellationGame","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"idGame","type":"string"}],"name":"balanceOfDeposit","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"Action","type":"string"},{"indexed":true,"name":"burner","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Action","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"Action","type":"string"},{"indexed":false,"name":"idGame","type":"string"},{"indexed":false,"name":"value","type":"uint256"},{"indexed":false,"name":"countGamers","type":"uint256"}],"name":"GameStatus","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"action","type":"string"},{"indexed":false,"name":"idGame","type":"string"},{"indexed":false,"name":"amount","type":"uint256"},{"indexed":false,"name":"caseId","type":"string"}],"name":"GameRefund","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"transfer","type":"string"},{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}];
const contractAddress = "0x4c8f40588b6069936463825295c18b4e352bb7c3";


router.get('/:offset?', function(req, res, next) {
  var config = req.app.get('config');  
  var web3 = new Web3();
  web3.setProvider(config.provider);
  var ClickCoinContract = web3.eth.contract(abi);
  var contract = ClickCoinContract.at(contractAddress);

  async.waterfall([
    function(callback) {
      web3.parity.listAccounts(20, req.params.offset, function(err, result) {
        callback(err, result);
      });
    }, function(accounts, callback) {
      
      var data = {};
      
      if (!accounts) {
        return callback({name:"FatDBDisabled", message: "Parity FatDB system is not enabled. Please restart Parity with the --fat-db=on parameter."});
      }
      
      if (accounts.length === 0) {
        return callback({name:"NoAccountsFound", message: "Chain contains no accounts."});
      }
      
      var lastAccount = accounts[accounts.length - 1];
      
      async.eachSeries(accounts, function(account, eachCallback) {
        web3.eth.getCode(account, function(err, code) {
          if (err) {
            return eachCallback(err);
          }
          data[account] = {};
          data[account].address = account;
          data[account].type = code.length > 2 ? "Contract" : "Account";
          contract.balanceOf.call(account, function(err, balance) {
            if (err) {
              return eachCallback(err);
            }
            data[account].balance = balance;
            eachCallback();
          });
        });
      }, function(err) {
        callback(err, data, lastAccount);
      });
    }
  ], function(err, accounts, lastAccount) {
    if (err) {
      return next(err);
    }
    
    res.render("accounts", { accounts: accounts, lastAccount: lastAccount });
  });
});

module.exports = router;
