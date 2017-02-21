var express = require('express');
var router = express.Router();
var multer = require('multer');
var multerS3 = require('multer-s3');
var AWS = require('aws-sdk');
var s3Config = require('../config/aws_s3');
var logger = require('../common/logger');
var incomingCheck = require('../models/incomingCheck');

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
      metadata: function (req, file, cb) {
         cb(null, {fieldName: file.fieldname});
      },
      key: function (req, file, cb) {
         cb(null, 'dog_profile/' + file.originalname + Date.now().toString())
      }
   })
});

router.post('/', upload.single('dog_profile_img'), incomingCheck, function(req, res, next) {

   var resultMsg = "반려견 정보 등록을 성공했습니다.";
   var errMsg = "반려견 정보 등록을 실패했습니다.";

   if (!req.body.dog_name || !req.body.dog_gender || !req.body.dog_age || !req.body.dog_neutralized) {
      var  err = new Error("필수 데이터가 오지 않았습니다.");
      err.status = 400;
      return next(err);
   }
   if (!req.file)
      req.file = { location: null };
   var reqDog = {
      user_id: req.user.user_id,
      dog_profile_img_url: req.file.location || null,
      dog_name: req.body.dog_name || null,
      dog_gender: req.body.dog_gender ,
      dog_age: req.body.dog_age || null ,
      dog_type: req.body.dog_type || null ,
      dog_weight: req.body.dog_weight || null ,
      dog_neutralized: req.body.dog_neutralized ,
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
         devLevelData: result
         });
   });

});

router.get('/mine', function(req, res, next) {

   Dog.selectUserDogsProfile(req.user.user_id, function (err, result) {
      if (err)
         return callback(err);
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

   if (!req.params.dog_name || !req.user.user_id) {
      var  err = new Error("필수 데이터가 오지 않았습니다.");
      err.status = 400;
      return next(err);
   }
   if (!req.file)
      req.file = { location: null };

   var reqDog = {
      user_id: req.user.user_id,
      prev_dog_name: req.params.dog_name,
      dog_profile_img_url: req.file.location || null,
      dog_name: req.body.dog_name || null,
      dog_gender: req.body.dog_gender || null,
      dog_age: req.body.dog_age || null ,
      dog_type: req.body.dog_type || null ,
      dog_weight: req.body.dog_weight || null ,
      dog_neutralized: req.body.dog_neutralized ,
      dog_characters: req.body.dog_characters || null ,
      dog_significants: req.body.dog_significants || null
   };

   Dog.updateDogProfile(reqDog, function (err, result) {
      if (err)
         return next(err);
      res.json({
         result: {
            message : "반려견 정보 변경에 성공했습니다.",
            data: result
         }

      })
   })

});

router.get('/:user_id/dog/:dog_name', function(req, res, next) {
   let reqDog = {
      user_id: req.params.user_id,
      dog_name: req.params.dog_name
   }
   Dog.selectDogProfile(reqDog, function (err, row) {
      if (err)
         return next(err);
      res.json({
         result: {
            data: row
         }
      })

   });
});

router.delete('/:dog_name', function(req, res, next) {
   let reqDog = {
      user_id: req.user.user_id,
      dog_name: req.params.dog_name
   };
   Dog.deleteDogProfile(reqDog, function (err, result) {
      if (err) {
         return next(err);
      }
      res.json({
         result: "반려견 정보 삭제에 성공했습니다."
      });
   });
});

module.exports = router;

