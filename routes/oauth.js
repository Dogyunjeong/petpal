var express = require ('express');
var router = express.Router();
var passport = require('passport');
var BearerStrategy = require('passport-http-bearer').Strategy;




var logger = require('../common/logger');
var dummy = require('../models/dummy');
var kakaoConfig = require('../config/kakao_REST');
var Oauth = require('../models/oauth');

passport.use(new BearerStrategy(
   function(access, done) {
      User.findOne({ token: token }, function (err, user) {
         if (err) { return done(err); }
         if (!user) { return done(null, false); }
         return done(null, user, { scope: 'all' });
      });
   }
));

passport.serializeUser(function (user, done){
   done(null, user.id);
});

passport.deserializeUser(function (id, done){
      var user = {};
      user.id =123;
      done(null, user);

});


router.get('/kakaotalk', passport.authenticate('kakao', {failureRedirect: '#!users/123'}, function(req, res, next) {
   next();
}));

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
         err = new Error(errMsg);
         err.stack = result;
         next(err);
      } else {
         res.json({
            result: resultMsg,
            sentData: result.data
         });
      }
   });
});

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
         err = new Error(errMsg);
         err.stack = result;
         next(err);
      } else {
         res.json({
            result: resultMsg,
            sentData: result.data
         });
      }
   });
});

router.get('/logout', function (req,res,next) {
   res.json({
      result: "로그아웃 되었습니다."
   });
});


module.exports = router;