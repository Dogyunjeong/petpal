var express = require('express');
var router = express.Router();
var dummy = require('../models/dummy');

router.post('/:reserve_id', function(req, res, next) {
   var resultMsg = "리뷰 등록에 성공하였습니다.";
   var errMsg = "리뷰 등록에 실패했습니다.";

   var reqData = [];
   reqData[0] = [":reserve_id ", req.params.reserve_id, "number", 1];
   reqData[1] = ["stars", req.body.stars, "number", 1];
   reqData[2] = ["content", req.body.content, "string", 1];

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

router.get('/:user_id/p/:p', function(req, res, next) {
   var resultMsg =  {
      data: [
         {
            assess_user_id: 1234,
            assess_user_name: "정도균",
            assess_user_img_url: "https://amazon…..",
            stars : 1,
            contest : "정말 좋았습니다….",
            assess_time :  "2017-01-01 19:00:00"
         }, {
            assess_user_id: 1234,
            assess_user_name: "정도균",
            assess_user_img_url: "https://amazon…..",
            stars : 1,
            contest : "정말 좋았습니다….",
            assess_time :  "2017-01-01 19:00:00"
         }, {
            nextItem: "page당 개수가 표현"
         }
      ]
   } ;
   var errMsg = "리뷰 조회에 실패했습니다.";

   var reqData = [];
   reqData[0] = [":user_id ", req.params.user_id, "number", 1];
   reqData[1] = [":p", req.params.p, "number", 1];

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