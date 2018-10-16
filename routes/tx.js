var express = require('express');
var router = express.Router();

var async = require('async');
var Web3 = require('web3');
var abi = require('ethereumjs-abi');
var abiDecoder = require('abi-decoder');
const InputDataDecoder = require('ethereum-input-data-decoder');

const contractAbi = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"idGame","type":"string"},{"name":"gamers","type":"address[]"},{"name":"_amount","type":"uint256"}],"name":"createGame","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"INITIAL_SUPPLY","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_amount","type":"uint256"}],"name":"mint","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_value","type":"uint256"}],"name":"burn","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_user","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"idGame","type":"string"},{"name":"refunders","type":"address[]"},{"name":"abusers","type":"address[]"},{"name":"amount","type":"uint256"},{"name":"caseId","type":"string"}],"name":"refundGame","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"idGame","type":"string"},{"name":"winners","type":"address[]"}],"name":"finishGame","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"idGame","type":"string"},{"name":"gamers","type":"address[]"}],"name":"cancellationGame","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"idGame","type":"string"}],"name":"balanceOfDeposit","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"Action","type":"string"},{"indexed":true,"name":"burner","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Action","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"Action","type":"string"},{"indexed":false,"name":"idGame","type":"string"},{"indexed":false,"name":"value","type":"uint256"},{"indexed":false,"name":"countGamers","type":"uint256"}],"name":"GameStatus","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"action","type":"string"},{"indexed":false,"name":"idGame","type":"string"},{"indexed":false,"name":"amount","type":"uint256"},{"indexed":false,"name":"caseId","type":"string"}],"name":"GameRefund","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"transfer","type":"string"},{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}];
const decoder = new InputDataDecoder(contractAbi);


router.get('/pending', function(req, res, next) {

  var config = req.app.get('config');
  var web3 = new Web3();
  web3.setProvider(config.provider);

  async.waterfall([
    function(callback) {
      web3.parity.pendingTransactions(function(err, result) {
        callback(err, result);
      });
    }
  ], function(err, txs) {
    if (err) {
      return next(err);
    }

    res.render('tx_pending', { txs: txs });
  });
});


router.get('/submit', function(req, res, next) {
  res.render('tx_submit', { });
});

router.post('/submit', function(req, res, next) {
  if (!req.body.txHex) {
    return res.render('tx_submit', { message: "No transaction data specified"});
  }

  var config = req.app.get('config');
  var web3 = new Web3();
  web3.setProvider(config.provider);

  async.waterfall([
    function(callback) {
      web3.eth.sendRawTransaction(req.body.txHex, function(err, result) {
        callback(err, result);
      });
    }
  ], function(err, hash) {
    if (err) {
      res.render('tx_submit', { message: "Error submitting transaction: " + err });
    } else {
      res.render('tx_submit', { message: "Transaction submitted. Hash: " + hash });
    }
  });
});

router.get('/:tx', function(req, res, next) {

  var config = req.app.get('config');
  var web3 = new Web3();
  web3.setProvider(config.provider);

  var db = req.app.get('db');

  async.waterfall([
    function(callback) {
      web3.eth.getTransaction(req.params.tx, function(err, result) {
        callback(err, result);
      });
    }, function(result, callback) {

      if (!result || !result.hash) {
        return callback({ message: "Transaction hash not found" }, null);
      }

      web3.eth.getTransactionReceipt(result.hash, function(err, receipt) {
        callback(err, result, receipt);
      });
    }, function(tx, receipt, callback) {
      web3.trace.transaction(tx.hash, function(err, traces) {
        callback(err, tx, receipt, traces);
      });
    }, function(tx, receipt, traces, callback) {
      db.get(tx.to, function(err, value) {
        callback(null, tx, receipt, traces, value);
      });
    }
  ], function(err, tx, receipt, traces, source) {
    if (err) {
      return next(err);
    }
    // Try to match the tx to a solidity function call if the contract source is available
    if (source) {
      tx.source = JSON.parse(source);
      try {
        var jsonAbi = JSON.parse(tx.source.abi);
        abiDecoder.addABI(jsonAbi);
        tx.logs = abiDecoder.decodeLogs(receipt.logs);
        tx.callInfo = abiDecoder.decodeMethod(tx.input);
      } catch (e) {
        console.log("Error parsing ABI:", tx.source.abi, e);
      }
    }
    tx.traces = [];
    tx.failed = false;
    tx.gasUsed = 0;
    if (traces != null) {
    traces.forEach(function(trace) {
        tx.traces.push(trace);
        if (trace.error) {
          tx.failed = true;
          tx.error = trace.error;
        }
        if (trace.result && trace.result.gasUsed) {
          tx.gasUsed += parseInt(trace.result.gasUsed, 16);
        }
      });
    }
    var decoded = decoder.decodeData(tx.input);

    switch (decoded.name) {
      case "createGame":
        tx.operation= "Create game";
        tx.gamers = ""
        for (var i=0; i<decoded.inputs[1].length; i++) {
          tx.gamers += decoded.inputs[1][i].toString(16);
          if (i !== decoded.inputs[1].length - 1) {
            tx.gamers += ", "
          }
        }
        tx.internalGameId = decoded.inputs[0];
        tx.bet = decoded.inputs[2].toString(10);
        break;
      case "finishGame":
        tx.operation = "Finish game";
        tx.gamers = ""
        for (var i=0; i<decoded.inputs[1].length; i++) {
          tx.gamers += decoded.inputs[1][i].toString(16);
          if (i !== decoded.inputs[1].length - 1) {
            tx.gamers += ", "
          }
        }
        tx.internalGameId = decoded.inputs[0];
        break;
      case "transfer":
        tx.operation = "Transfer coins";
        tx.recipient = decoded.inputs[0].toString(16);
        tx.coinsTransferred = decoded.inputs[1].toString(10);
        break;
    }

    tx.decoded = JSON.stringify(decoded, null, 2);
    // console.log(tx.traces);    
    res.render('tx', { tx: tx });
  });

});

router.get('/raw/:tx', function(req, res, next) {

  var config = req.app.get('config');
  var web3 = new Web3();
  web3.setProvider(config.provider);

  async.waterfall([
    function(callback) {
      web3.eth.getTransaction(req.params.tx, function(err, result) {
        callback(err, result);
      });
    }, function(result, callback) {
      web3.trace.replayTransaction(result.hash, ["trace", "stateDiff", "vmTrace"], function(err, traces) {
        callback(err, result, traces);
      });
    }
  ], function(err, tx, traces) {
    if (err) {
      return next(err);
    }

    tx.traces = traces;

    res.render('tx_raw', { tx: tx });
  });
});

module.exports = router;
