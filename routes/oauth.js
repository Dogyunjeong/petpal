var express = require ('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var KakaoStrategy = require('passport-kakao').Strategy;



var logger = require('../common/logger');
var dummy = require('../models/dummy');
var kakaoConfig = require('../config/kakao_oauth');
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

// passport.use(new LocalStrategy({usernameField: 'kakao_id', passwordField: 'kakao_token'}, function(kakao_id, kakao_token, done) {
//       Oauth.authorizeKakao(kakao_id, kakao_token, function(err, user) {
//          if (err) {
//             return done(err);
//          }
//          return done(null, user);
//       });
//    }));

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

passport.use(new KakaoStrategy({
      clientID : '48904c39ecdf2c8eb1641c8d97d615bf',
      callbackURL : '카카오에 등록 한 주소'
   }, function (accessToken, refreshToken, profile, done) {
      var profile = profile._json;
      Member.findOnCreate(profile, accessToken, function (err, member) { // 파라미터로 객체를 넘겨주는걸 파라미터 오브젝트라고함.

         if (err)
            return done(err);
         done(null, member);
      })
   }
));

router.get("/kakao", passport.authenticate('kakao',{state: "myStateValue"}));

router.get("/kakao/oauth", passport.authenticate('kakao'), function(req, res){
   // 로그인 시작시 state 값을 받을 수 있음

   res.send("callback state :" + req.query.state);
});

router.get('/kakaotalk/token', passport.authenticate('kakao-token'), function (req, res) {
   res.send(req.user? '성공' : '실패');
});



// router.post('/kakaotalk/token', function (req, res, next) {
//    if (!req.body.kakao_id || !req.body.kakao_token || !req.body.kakao_img_url ){
//       var  err = new Error('필수 데이터가 오지 않았습니다.');
//       err.status = 400;
//       return next(err);
//    }
//    var reqUser = {
//       kakao_id: req.body.kakao_id,
//       kakao_token: req.body.kakao_token,
//       kakao_img_url: req.body.kakao_img_url
//    };
//
//    Oauth.findKakaoUserAndCreate(reqUser, function (err, user) {
//       if (err)
//          next(err);
//       if (user.reqJoinFlag) {
//          req.body.reqJoinFlag = user.reqJoinFlag;
//          req.body.user_id = user.user_id;
//       }
//       passport.authenticate('local', function (err, user) {
//          if (err || !user) {
//             return next(err);
//          }
//          req.login(user, function (err) {
//             if (err) {
//                return next(err);
//             }
//             next();
//          });
//       })(req, res, next);
//    });
//
// }, function (req, res, next) {
//    var resultMsg = "회원 가입이 필요한 사용자입니다.";
//    var errMsg = "회원가입 및 로그인에 실패하였습니다.";
//
//    if (req.body.reqJoinFlag) {
//       res.status(201).json({
//          result : {
//             message: "회원 가입이 필요한 사용자입니다."
//          }
//       });
//    } else {
//       res.json({
//          result : {
//             message: "등록된 사용자입니다."
//          }
//       });
//    }
// });


router.get('/logout', function (req,res,next) {
   req.logout();
   res.json({
      result: "로그아웃에 성공하였습니다."
   });
});


module.exports = router;