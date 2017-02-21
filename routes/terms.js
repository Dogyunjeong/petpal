var express = require('express');
var router = express.Router();
var terms = require('../models/term');

router.get('/', function(req, res, next) {
   terms.getTerms(function (err, resultData) {
      if (err) {
         return next(err);
      } else {
         res.json({
            result: {
               data: resultData
            }
         });
      }
   });
});

module.exports = router;

