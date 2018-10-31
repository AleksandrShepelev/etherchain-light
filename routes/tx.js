var express = require('express');
var router = express.Router();
var clickcoin = require('../utils/clickcoin');
var async = require('async');
var Web3 = require('web3');
var abi = require('ethereumjs-abi');
var abiDecoder = require('abi-decoder');
const InputDataDecoder = require('ethereum-input-data-decoder');

const decoder = new InputDataDecoder(clickcoin.abi);

function formatAddr(addr) {
  while (addr.length < 40) addr = "0" + addr;
  addr = "0x" + addr;
  return addr
}

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
        tx.gamers = [];
        for (var i=0; i<decoded.inputs[1].length; i++) {
          tx.gamers.push(formatAddr(decoded.inputs[1][i].toString(16)));
        }
        tx.internalGameId = decoded.inputs[0];
        tx.bet = decoded.inputs[2].toString(10);
        break;
      case "finishGame":
        tx.operation = "Finish game";
        tx.gamers = [];
        for (var i=0; i<decoded.inputs[1].length; i++) {
          tx.gamers.push(formatAddr(decoded.inputs[1][i].toString(16)));
        }
        tx.internalGameId = decoded.inputs[0];
        break;
      case "transfer":
        tx.operation = "Transfer coins";
        tx.sender = tx.from;
        tx.recipient = formatAddr(decoded.inputs[0].toString(16));
        tx.coinsTransferred = decoded.inputs[1].toString(10);
        break;
    case "cancellationGame":
      tx.operation = "Cancel game";
      tx.gamers = [];
      for (var i=0; i<decoded.inputs[1].length; i++) {
        tx.gamers.push(formatAddr(decoded.inputs[1][i].toString(16)));
      }
      tx.internalGameId = decoded.inputs[0];
      break;

    case "refundGame":
      tx.operation = "Refund game";

      tx.internalGameId = decoded.inputs[0];

      tx.refunders = [];
       for (var i=0; i<decoded.inputs[1].length; i++) {
         tx.refunders.push(formatAddr(decoded.inputs[1][i].toString(16)));

      }
      tx.abusers = [];

      for (var i=0; i<decoded.inputs[2].length; i++) {
        tx.abusers.push(formatAddr(decoded.inputs[2][i].toString(16)));

      }

      tx.refundAmount = decoded.inputs[3].toString(10);
      tx.internalCaseId = decoded.inputs[4].toString();

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
