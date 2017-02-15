var express = require('express');
var router = express.Router();
var terms = require('../models/terms');

router.get('/', function(req, res, next) {
   terms.getTerms(function (err, resultData) {
      if (err)
         next(err);
      res.json({
         result: {
            data: resultData
         }
      })
   });
});

module.exports = router;

