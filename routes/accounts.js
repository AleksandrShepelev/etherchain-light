var express = require('express');
var router = express.Router();
var async = require('async');
const pageSize = 50;
var address = require('../db/address');


router.get('/', function(req, res, next) {
  const page = req.query.page ? req.query.page : 1;
  const pagesToSkip = page - 1;
  async.waterfall([
    function (callback) {
      address.find().sort({balance: -1}).skip(pagesToSkip * pageSize).limit(pageSize).exec(function (err, addresses) {
        callback(err, addresses)
      });
    },
    function (addresses, callback) {
      address.find().count().exec(function (err, addressCount) {
        callback(err, addresses, addressCount)
      });
    },
    function (addresses, addressCount, callback) {
      callback(null, addresses, addressCount)
    }
  ], function (err, addresses, addressCount) {
    if (err) {
      return next(err);
    }

    res.render('accounts', { accounts: addresses, page: page, pages: Math.ceil(addressCount / pageSize)});
  });
});

module.exports = router;
