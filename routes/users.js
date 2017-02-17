var express = require('express');
var router = express.Router();
var dummy = require('../models/dummy');
var multer = require('multer');
var multerS3 = require('multer-s3');
var AWS = require('aws-sdk');
var s3Config = require('../config/aws_s3');

var User = require('../models/user');

var S3 = new AWS.S3({
   region : s3Config.region,
   accessKeyId: s3Config.accessKeyId,
   secretAccessKey: s3Config.secretAccessKey
});

var upload = multer({
   storage: multerS3({
      s3: S3,
      bucket: 'petpaldidimdol',
      metadata: function (req, file, cb) {
         cb(null, {fieldName: file.fieldname});
      },
      key: function (req, file, cb) {
         cb(null, 'profile/' + file.originalname + Date.now().toString())
      }
   })
});

/* GET users listing. */
router.post('/', upload.single('profile_image'), function(req, res, next) {
   var resultMsg = "회원 정보 등록을 성공했습니다.";
   var errMsg = "회원 정보 등록을 실패했습니다.";

   if (!req.body.age || !req.body.gender) {
      var  err = new Error("필수 데이터가 오지 않았습니다.");
      err.status = 400;
      return next(err);
   }
   var reqUser = {
      user_id: req.user.user_id,
      mobile: req.body.mobile || null,
      age: req.body.age,
      gender: req.body.gender,
      address: req.body.address || null,
      profile_img_url: req.file.location || null,
      user_name: req.body.user_name || null
   };
   User.updateUserProfile(reqUser, function (err, user) {
      if (err) {
         err.message = errMsg;
         return next(err);
      } else {
         res.json({
            result: {
               message: resultMsg,
               data: user
            }
         })
      }
   });
});

router.put('/', upload.single('profile_image'), function(req, res, next) {
   var resultMsg = "회원 정보 변경을 성공했습니다.";
   var errMsg = "회원 정보 변경을 실패했습니다.";

   var reqUser = {
      kakao_id: req.user.kakao_id,
      mobile: req.body.mobile || null,
      age: req.body.age || null,
      gender: req.body.gender || null,
      address: req.body.address || null,
      profile_img_url: req.file.location || null,
      user_name: req.body.user_name || null
   };
   User.updateUserProfile(reqUser, function (err, user) {
      if (err) {
         err.message = errMsg;
         return next(err);
      } else {
         res.json({
            result: {
               message: resultMsg,
               data: user
            }
         })
      }
   });
});

router.get('/me', function(req, res, next) {

   User.selectUserbyKakaoId(req.user.kakao_id, function (err, user) {
      if (err || !user) {
         err.message("자신의 프로필을 불러오는데 실패했습니다.");
         return next(err);
      } else {
         res.json(user);
      }
   });

});


router.get('/:user_id', function(req, res, next) {
   User.selectUserbyUserId(req.params.user_id, function (err, user) {
      if (err || !user) {
         err.message("사용자의 프로필을 불러오는데 실패했습니다.");
         return next(err);
      } else {
         res.json(user);
      }
   });
});

router.get('/points/received/:p', function(req, res, next) {
   var resultMsg =  {
      data:  [
         {
            type: "post",
            create_date : "2017-01-01 19:00:00",
            points : 1
         }, {
            type: "stroll",
            create_date : "2017-01-01 19:00:00",
            points : 10
         }
      ]
   };
   var errMsg = "적립 포인트 이력 조회에 실패했습니다.";

   var reqData = [];
   reqData[0] = [":p", req.params.p, "number", 1];

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

router.get('/points/used/:p', function(req, res, next) {
   var resultMsg =  {
      data:  [
         {
            type: "stroll",
            create_date : "2017-01-01 19:00:00",
            points : -10
         }, {
            type: "stroll",
            create_date : "2017-01-01 19:45:00",
            points : -10
         }
      ]
   };
   var errMsg = "차감 포인트 이력 조회에 실패했습니다.";

   var reqData = [];
   reqData[0] = [":p", req.params.p, "number", 1];

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




module.exports = router;
