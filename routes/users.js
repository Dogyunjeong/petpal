let express = require('express');

let router = express.Router();

let User = require('../models/user');
let Logging = require('../models/logging');
let upload = require('../common/uploadS3')('user_profile_img/');

const listLimit = process.env.TEXT_LIMIT;

router.post('/', upload.single('profile_img'), Logging.incomingCheck, function(req, res, next) {
   let resultMsg = "회원 정보 등록을 성공했습니다.";
   let errMsg = "회원 정보 등록을 실패했습니다.";

   if (!req.body.age || !req.body.gender || !req.body.user_name) {
      let  err = new Error("필수 데이터가 오지 않았습니다.");
      err.status = 400;
      return next(err);
   }
   if (!req.file)
      req.file = {location: null};
   let reqUser = {
      user_id: req.user.user_id,
      mobile: req.body.mobile || null,
      age: req.body.age,
      gender: req.body.gender,
      address: req.body.address || null,
      profile_img_url:  (req.file && req.file.location) || req.file.location || null,
      user_name: req.body.user_name || null
   };
   User.updateUserProfile(reqUser, function (err, user) {
      if (err) {
         err.message = errMsg;
         return next(err);
      } else {
         res.json({
            result: resultMsg
         })
      }
   });
});

router.put('/', upload.single('profile_img'), function(req, res, next) {
   if (!req.file)
      req.file ={location: null};

   let reqUser = {
      user_id: req.user.user_id,
      mobile: req.body.mobile || null,
      age: req.body.age || null,
      gender: req.body.gender || null,
      address: req.body.address || null,
      profile_img_url:  (req.file && req.file.location) || req.file.location || null,
      user_name: req.body.user_name || null
   };
   User.updateUserProfile(reqUser, function (err, user) {
      if (err) {
         err.message = "회원 정보 변경을 실패했습니다.";
         return next(err);
      } else {
         res.json({
            result: "회원 정보 변경을 성공했습니다."
         })
      }
   });
});

router.get('/me', function(req, res, next) {

   User.selectUserbyUserId(req.user.user_id, function (err, user) {
      if (err) {
         return next(err);
      } else {
         res.json({
            result: {
               data:user
            }
         });
      }
   });

});

router.get('/:user_id', function(req, res, next) {

   User.selectUserbyUserId(req.params.user_id, function (err, user) {
      if (err) {
         return next(err);
      } else {
         res.json({
            result: {
               data: user
            }
         });
      }
   });
});

router.get('/points/received', function(req, res, next) {
   let reqData = {
      user_id: req.user.user_id,
      reqPage: + req.query.p || 1,
      limit: {
         former: (req.query.p - 1) * listLimit || 0,
         latter: +listLimit
      }
   };
   User.selectRecievedPoints(reqData, function (err, rows) {
      if (err)
         return next(err);
      res.json({
         result: {
            page: reqData.reqPage,
            data: rows
         }
      });
   });
});

router.get('/points/used', function(req, res, next) {
   let reqData = {
      user_id: req.user.user_id,
      reqPage: + req.query.p || 1,
      limit: {
         former: (req.query.p - 1) * listLimit || 0,
         latter: +listLimit
      }
   };
   User.selectUsedPoints(reqData, function (err, rows) {
      if (err)
         return next(err);
      res.json({
         result: {
            page: reqData.reqPage,
            data: rows
         }
      });
   });
});

router.post('/img_list', function (req, res, next) {
   if (!req.body.img_list || !req.body.img_list[0]) {
      let  err = new Error('필수 정보가 잘 못 되었습니다.');
      err.status = 400;
      return next(400);
   }
   let userList = req.body.user_list;

   User.selectUserImgList(userList, function (err, rows) {
      if (err) {
         return next(err);
      } else {
         res.json({
            result: {
               data: rows
            }
         })
      }
   });
});


module.exports = router;
