var express = require ('express');
var router = express.Router();
var logger = require('../common/logger');

var dummy = require('../models/dummy');



router.post('/kakaotalk/token', function (req, res, next) {
   var resultMsg = "회원 가입이 필요한 사용자입니다.";
   var errMsg = "회원가입 및 로그인에 실패하였습니다.";

   var reqData = [];
   reqData[0] = ["kakao_token", req.body.kakao_token, "string", 1];
   reqData[1] = ["kakao_id", req.body.kakao_id, "string", 1];
   reqData[2] = ["kakao_img_url", req.body.kakao_img_url, "string", 1];

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

router.get('/logout', function(req,res,next) {
   res.json({
      result: "로그아웃 되었습니다."
   });
});


module.exports = router;