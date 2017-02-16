var express = require ('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;



var logger = require('../common/logger');
var dummy = require('../models/dummy');
var kakaoConfig = require('../config/kakao_REST');
var Oauth = require('../models/oauth');

// passport.use(new BearerStrategy(
//    function(access, done) {
//       User.findOne({ token: token }, function (err, user) {
//          if (err) { return done(err); }
//          if (!user) { return done(null, false); }
//          return done(null, user, { scope: 'all' });
//       });
//    }
// ));

passport.use(new LocalStrategy({usernameField: 'kakao_id', passwordField: 'kakao_token'}, function(kakao_id, kakao_token, done) {
      Oauth.authorizeKakao(kakao_id, kakao_token, function(err, user) {
         if (err) {
            return done(err);
         }
         return done(null, user);
      });
   }));

passport.serializeUser(function (user, done){
   done(null, user.kakao_id);
});

passport.deserializeUser(function (kakao_id, done){
   Oauth.findKakaoUser(kakao_id, function (err, user) {
      if (err)
         return done(err);
      done(null, user);
   });
});





router.post('/kakaotalk/token', function (req, res, next) {
   passport.authenticate('local', function (err, user) {
      if (err || !user) {
         return next(err);
      }
      req.login(user, function (err) {
         if (err) {
            return next(err);
         }
         next();
      });
   })(req, res, next);
}, function (req, res, next) {
   var resultMsg = "회원 가입이 필요한 사용자입니다.";
   var errMsg = "회원가입 및 로그인에 실패하였습니다.";

   if (!req.user.kakao_id || !req.user.kakao_token || !req.body.kakao_img_url ){
      var  err = new Error('필수 데이터가 오지 않았습니다.');
      err.status = 400;
      return next(err);
   }
   var reqUser = {
      kakao_id: req.user.kakao_id,
      kakao_token: req.user.kakao_token,
      kakao_img_url: req.body.kakao_img_url
   };

   Oauth.findKakaoUserAndCreate(reqUser, function (err, user) {
      if (err)
         next(err);
      if (user.reqJoinFlag) {
         res.status(201).json({
            result : {
               message: "회원 가입이 필요한 사용자입니다."
            }
         });
      } else {
         res.json({
            result : {
               message: "등록된 사용자입니다."
            }
         });
      }
   });
});


router.get('/logout', function (req,res,next) {
   req.logout();
   res.json({
      result: "로그아웃에 성공하였습니다."
   });
});


module.exports = router;