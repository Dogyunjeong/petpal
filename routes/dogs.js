var express = require('express');
var router = express.Router();
var multer = require('multer');
var multerS3 = require('multer-s3');
var AWS = require('aws-sdk');
var s3Config = require('../config/aws_s3');
var logger = require('../common/logger');
var incomingCheck = require('../models/logging').incomingCheck;

var Dog = require('../models/dog');

var S3 = new AWS.S3({
   region : s3Config.region,
   accessKeyId: s3Config.accessKeyId,
   secretAccessKey: s3Config.secretAccessKey
});
var upload = multer({
   storage: multerS3({
      s3: S3,
      bucket: 'petpaldidimdol',
      acl: 'public-read',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      metadata: function (req, file, cb) {
         cb(null, {fieldName: file.fieldname});
      },
      key: function (req, file, cb) {
         cb(null, 'dog_profile_img/' + file.originalname + Date.now().toString())
      }
   })
});

router.post('/', upload.single('dog_profile_img'), incomingCheck, function(req, res, next) {
   if (!req.body.dog_name || !req.body.dog_gender || !req.body.dog_age || !req.body.dog_neutralized) {
      var  err = new Error("필수 데이터가 오지 않았습니다.");
      err.status = 400;
      return next(err);
   }
   var reqDog = {
      user_id: req.user.user_id,
      dog_profile_img_url:  (req.file && req.file.location) || null,
      dog_name: req.body.dog_name,
      dog_age: req.body.dog_age,
      dog_type: req.body.dog_type || null ,
      dog_weight: isNaN(req.body.dog_weight) ? (req.body.dog_weight === '무관' ? null : req.body.dog_weight ) : + req.body.dog_weight || null,
      dog_gender: isNaN(req.body.dog_gender) ? (req.body.dog_gender === '무관' ? null : req.body.dog_gender ) : + req.body.dog_gender,
      dog_neutralized: isNaN(req.body.dog_neutralized) ?  (req.body.dog_neutralized === '무관' ? null : req.body.dog_neutralized ) : + req.body.dog_neutralized,
      dog_characters: req.body.dog_characters || null ,
      dog_significants: req.body.dog_significants || null
   };
   //DB data를 입력하기 위한 함수
   Dog.insertDogProfile(reqDog, function (err, result) {
      if (err) {
         return next(err);
      }
      res.json({
         result : "반려견 정보 등록에 성공했습니다",
      });
   });

});

router.get('/mine', function(req, res, next) {

   Dog.selectUserDogsProfile(req.user.user_id, function (err, result) {
      if (err) {
         err.message = "자신의 반려견 프로필을 불러오는데 실패했습니다.";
         return next(err);
      }
      res.json({
         result: {
            data: result
         }
      })
   });
});

router.get('/:user_id', function(req, res, next) {

   Dog.selectUserDogsProfile(req.params.user_id, function (err, rows) {
      if (err)
         return next(err);
      res.json({
         result: {
            data: rows
         }
      });
   });
});

router.put('/:dog_name', upload.single('dog_profile_img'), incomingCheck, function(req, res, next) {

   if (!req.params.dog_name) {
      var  err = new Error("필수 데이터가 오지 않았습니다.");
      err.status = 400;
      return next(err);
   }

   var reqDog = {
      user_id: req.user.user_id,
      prev_dog_name: req.params.dog_name,
      dog_profile_img_url: (req.file && req.file.location) || null,
      dog_name: req.body.dog_name || null,
      dog_gender: req.body.dog_gender || null,
      dog_age: req.body.dog_age || null ,
      dog_type: req.body.dog_type || null ,
      dog_weight: isNaN(req.query.dog_weight) ? (req.query.dog_weight === '무관' ? null : req.query.dog_weight ) : + req.query.dog_weight || null,
      dog_gender: isNaN(req.query.dog_gender) ? (req.query.dog_gender === '무관' ? null : req.query.dog_gender ) : + req.query.dog_gender || null,
      dog_neutralized: isNaN(req.query.dog_neutralized) ?  (req.query.dog_neutralized === '무관' ? null : req.query.dog_neutralized ) : + req.query.dog_neutralized || null,
      dog_significants: req.body.dog_significants || null
   };

   Dog.updateDogProfile(reqDog, function (err, result) {
      if (err)
         return next(err);
      res.json({
         result:  "반려견 정보 변경에 성공했습니다."
      });
   });

});

router.get('/:user_id/dog/:dog_name', function(req, res, next) {
   let reqDog = {
      user_id: req.params.user_id,
      dog_name: req.params.dog_name
   };
   Dog.selectDogProfile(reqDog, function (err, rows) {
      if (err)
         return next(err);
      res.json({
         result: {
            data: rows[0]
         }
      })

   });
});

router.delete('/:dog_name', function(req, res, next) {
   let reqDog = {
      user_id: req.user.user_id,
      dog_name: req.params.dog_name
   };
   Dog.deleteDogProfile(reqDog, function (err) {
      if (err) {
         return next(err);
      }
      res.json({
         result: "반려견 정보 삭제에 성공했습니다."
      });
   });
});

module.exports = router;

