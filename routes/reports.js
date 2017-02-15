var express = require('express');
var router = express.Router();
var dummy = require('../models/dummy');

router.post('/:art_id', function(req, res, next) {

   var resultMsg =  "이 게시물을 신고해주셔서 감사합니다.";
   var errMsg = "게시물 신고에에 실패했습니다.";

   var reqData = [];
   reqData[0] = [":art_id", req.params.art_id, "number", 1];

   dummy(reqData, function (err, result) {
      if (err)
         next(err);
      if (result.errFlag > 0) {
         res.json({
            err: errMsg,
            sentData: result.data
         });
      } else {
         res.json({
            result: resultMsg,
            sentData: result.data
         });
      }
   });
});

module.exports = router;