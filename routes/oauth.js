var express = require ('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var KakaoStrategy = require('passport-kakao').Strategy;
var KakaoTokenStrategy = require('passport-kakao-token').Strategy


var logger = require('../common/logger');
var dummy = require('../models/dummy');
var kakaoConfig = require('../config/kakao_oauth');
var Oauth = require('../models/oauth');

let reqJoinFlag = 0;

passport.serializeUser(function(user, done) {
   done(null, user.user_id);
});
passport.deserializeUser(function(user_id, done) {
   Oauth.findKakaoUser(user_id, function (err, user) {
      if (err)
         return done(err);
      done(null, user);
   });vi
});

passport.use( new KakaoStrategy({
      clientID: kakaoConfig.clientID,
      callbackURL: kakaoConfig.callbackUrl
   },
   function(accessToken, refreshToken, params, profile, done){
      // authorization 에 성공했을때의 액션
      profile.accessToken = accessToken;
      Oauth.authorizeKakao(profile, function (err, user, joinFlag) {
         if (err)
            return done(err, null);
         if (joinFlag)
            reqJoinFlag = joinFlag;
         return done(null, user);
      });

   })
);

passport.use( new KakaoTokenStrategy({
      clientID: kakaoConfig.clientID
   },
   function(accessToken, refreshToken, profile, done){
      // authorization 에 성공했을때의 액션
      profile.accessToken = accessToken;
      Oauth.authorizeKakao(profile, function (err, user, joinFlag) {
         if (err)
            return done(err, null);
         if (joinFlag)
            reqJoinFlag = joinFlag;
         return done(null, user);
      });
   })
);

router.get("/login", passport.authenticate('kakao',{state: "myStateValue"}));

// need to access this way https://localhost/oauth/kakaotalk/token?access_token=JNVDeylwsvfOHpHEf-LrXaCs4HmiW9CAjzqsago8BRIAAAFabn0kcg
//  https://localhost/oauth/kakaotalk/token?access_token=375028451
router.get("/kakaotalk/callback", passport.authenticate('kakao'), function(req, res){
   if (reqJoinFlag > 0) {
      reqJoinFlag = 0;
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

router.get('/kakaotalk/token', passport.authenticate('kakao-token'), function(req, res) {
   if (req.user) {
      if (reqJoinFlag > 0) {
         reqJoinFlag = 0;
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
   } else {
      res.json({
         error: '회원가입 및 로그인에 실패하였습니다.'
      });
   }
});




router.post('/local', function (req, res, next) {
   if (!req.body.kakao_id || !req.body.kakao_token || !req.body.kakao_img_url ){
      var  err = new Error('필수 데이터가 오지 않았습니다.');
      err.status = 400;
      return next(err);
   }
   var reqUser = {
      kakao_id: req.body.kakao_id,
      kakao_token: req.body.kakao_token,
      kakao_img_url: req.body.kakao_img_url
   };

   Oauth.findKakaoUserAndCreate(reqUser, function (err, user) {
      if (err)
         next(err);
      if (user.reqJoinFlag) {
         req.body.reqJoinFlag = user.reqJoinFlag;
         req.body.user_id = user.user_id;
      }
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
   });

}, function (req, res, next) {
   var resultMsg = "회원 가입이 필요한 사용자입니다.";
   var errMsg = "회원가입 및 로그인에 실패하였습니다.";

   if (req.body.reqJoinFlag) {
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


router.get('/logout', function (req,res,next) {
   req.logout();
   res.json({
      result: "로그아웃에 성공하였습니다."
   });
});


module.exports = router;