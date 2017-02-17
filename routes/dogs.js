var express = require('express');
var router = express.Router();
var multer = require('multer');
var multerS3 = require('multer-s3');
var AWS = require('aws-sdk');
var s3Config = require('../config/aws_s3');
var logger = require('../common/logger');
var incomingCheck = require('../models/incomingCheck');

var Dog = require('../models/dogs');

var dummy = require('../models/dummy');

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

router.post('/', upload.single('dog_profile_img'), incomingCheck, function(req, res, next) {

   var resultMsg = "반려견 정보 등록을 성공했습니다.";
   var errMsg = "반려견 정보 등록을 실패했습니다.";

   if (!req.body.dog_name || !req.body.dog_gender || !req.body.dog_age || !req.body.dog_neutralized) {
      var  err = new Error("필수 데이터가 오지 않았습니다.");
      err.status = 400;
      return next(err);
   }
   // Insert query에 맞게 세팅된 값.
   // var reqDog = [
   //    req.user.user_id,
   //    req.body.dog_name || null,
   //    req.body.dog_gender,
   //    req.body.dog_age || null,
   //    req.body.dog_type || null,
   //    req.body.dog_weight || null,
   //    req.file.location || null,
   //    req.body.dog_neutralized,
   //    req.body.dog_characters || null,
   //    req.body.dog_significants || null
   // ];

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

   Dog.getDogProfile(req.user.id, function (err, result) {
      if (err)
         return callback(err);
   });
   res.json({
      result: {
         user_id: 1,
         dog_profile_img_url: "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcRZT-cF-FD1em9qpd-DcMYDIJmjs53H2BFHBLFok5H9duAazkj594z1rS8",
         dog_name: "말라",
         dog_age: 9,
         dog_type: "믹스 대형견",
         dog_weight: 2,
         dog_neutralized: 1,
         dog_characters: "사람을 잘따릅니다.",
         dog_significants: "건강하나 힘이 너무 좋습니다."

      }
   })
});

router.get('/:user_id', function(req, res, next) {
   var resultMsg = {
      data:[{
         user_id: 1,
         dog_profile_img_url: "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcRZT-cF-FD1em9qpd-DcMYDIJmjs53H2BFHBLFok5H9duAazkj594z1rS8",
         dog_name: "말라",
         dog_age: 9,
         dog_type: "믹스 대형견",
         dog_weight: 2,
         dog_neutralized: 1,
         dog_characters: "사람을 잘따릅니다.",
         dog_significants: "건강하나 힘이 너무 좋습니다."

      }, {second: "...."}]
   };
   var errMsg = "반려견의 프로필을 볼러오는데 실패했습니다.";


   var reqData = [];
   reqData[0] = [":user_id ", req.params.user_id, "number", 1];


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

router.put('/:dog_name', upload.single('dog_profile_img'), function(req, res, next) {

   var reqDog = {
      user_id: req.user.user_id || null,
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

   Dog.updatedDogProfile(reqDog, function (err, result) {
      if (err)
         return next(err);
      res.json({
         result: "반려견 정보 변경에 성공했습니다."
      })
   })

});

router.get('/:user_id/dog/:dog_name', function(req, res, next) {
   var resultMsg = {
      data:[{
         user_id: 1,
         dog_profile_img_url: "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcRZT-cF-FD1em9qpd-DcMYDIJmjs53H2BFHBLFok5H9duAazkj594z1rS8",
         dog_name: "말라",
         dog_age: 9,
         dog_type: "믹스 대형견",
         dog_weight: 2,
         dog_neutralized: 1,
         dog_characters: "사람을 잘따릅니다.",
         dog_significants: "건강하나 힘이 너무 좋습니다."

      }, {second: "...."}]
   };
   var errMsg = "반려견의 프로필을 볼러오는데 실패했습니다.";


   var reqData = [];
   reqData[0] = [":user_id ", req.params.user_id, "number", 1];
   reqData[1] = [":dog_name ", req.params.dog_name, "string", 1];


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

router.delete('/:dog_name', function(req, res, next) {
   var resultMsg = "회원 정보 삭제에 성공했습니다.";
   var errMsg = "회원 정보 삭제에 실패했습니다.";


   var reqData = [];
   reqData[0] = [":dog_name ", req.params.dog_name, "string", 0];


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

