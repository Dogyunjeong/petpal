var express = require('express');
var router = express.Router();
var dummy = require('../models/dummy');
var multer = require('multer');
var multerS3 = require('multer-s3');
var AWS = require('aws-sdk');
var s3Config = require('../config/aws_s3');

var S3 = new AWS.S3(s3Config);

var upload = multer({
   storage: multerS3({
      s3: S3,
      bucket: 'petpaldidimdol',
      metadata: function (req, file, cb) {
         cb(null, {fieldName: file.fieldname});
      },
      key: function (req, file, cb) {
         cb(null, 'profile/' + file.originaname+ Date.now().toString())
      }
   })
});

/* GET users listing. */
router.post('/', upload.single('image'), function(req, res, next) {
   var resultMsg = "회원 정보 등록을 성공했습니다.";
   var errMsg = "회원 정보 등록을 실패했습니다.";

   if (!req.body.age || !req.body.gender) {
      var  err = new Error('필수 데이터가 오지 않았습니다.');
      err.status = 400;
      return next(err);
   }
   var postData = {
      mobile: req.body.mobile || null,
      age: req.body.age,
      gender: req.body.gender,
      address: req.body.address || null,
      url: req.file.location || null
   };



   var reqData = [];
   reqData[0] = ['image', req.file, 'file', 0];
   reqData[1] = ["mobile ", req.body.mobile, "string", 0];
   reqData[2] = ["age", req.body.age, "number", 1];
   reqData[3] = ["gender ", req.body.gender, "number", 1];
   reqData[4] = ["address ", req.body.address , "string", 0];

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

router.put('/', upload.single('image'), function(req, res, next) {
   var resultMsg = "회원 정보 변경을 성공했습니다.";
   var errMsg = "회원 정보 변경을 실패했습니다.";


   var reqData = [];
   reqData[0] = ["image", req.file, 'file', 0];
   reqData[1] = ["mobile ", req.body.mobile, "string", 0];
   reqData[2] = ["age", req.body.age, "number", 0];
   reqData[3] = ["gender ", req.body.gender, "number", 0];
   reqData[4] = ["address ", req.body.address , "string", 0];

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
})

router.get('/me', function(req, res, next) {
   res.json({
      result: {
         data: {
            kakao_id : 1,
            profile_img_url : "http://abac.ad/add // 프로필 이미지 url",
            name : "홍길동",
            age: 29,
            gender : 2,
            address : "서울특별시 중랑구 면목동",
            lat:"41.~~~~",
            long : "60.~~~~",
            mobile : "010-1234-5678",
            points: 1234
         }
      }
   });
});


router.get('/:user_id', function(req, res, next) {
   res.json({
      result: {
         data: {
            kakao_id : 222,
            profile_img_url : "http://dogyunjeong…  // 프로필 이미지 url",
            name : "이순신",
            age: 29,
            gender : 2,
            address : "서울특별시 중랑구 면목동",
            lat:"41.~~~~",
            long : "60.~~~~",
            mobile : "010-1234-5678"
         }
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
