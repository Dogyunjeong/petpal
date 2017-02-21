var express = require('express');
var router = express.Router();
var dummy = require('../models/dummy');
var multer = require('multer');
var multerS3 = require('multer-s3');
var AWS = require('aws-sdk');

var s3Config = require('../config/aws_s3');
var logger = require('../common/logger');
var incomingCheck = require('../models/incomingCheck');
var Article = require('../models/article');

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


router.post('/', upload.single('image'), function(req, res, next) {
   if (!req.file || !req.body.content || !req.body.lat || !req.body.long) {
      var  err = new Error("필수 데이터가 오지 않았습니다.");
      err.status = 400;
      return next(err);
   }
   let reqArticle = {
      user_id: req.user.user_id,
      image_url: req.file.location,
      content: req.body.content,
      position: {
         lat:  req.body.lat * 1,
         long: req.body.long * 1
      }
   };
   Article.insertArticle(reqArticle, function (err, result) {
      if (err)
         return next(err);
      res.json({
         result: "게시글 작성에 성공하였습니다."
      })
   });
});

router.get('/lat/:lat/long/:long', function(req, res, next) {

   if (!req.params.lat || !req.params.long) {
      var err = new Error('필수 정보가 입력되지 않았습니다.');
      err.status = 400;
      return next(err);
   }

   let reqData = {
      lat: req.params.lat,
      long: req.params.long,
      distance: null,
      p: req.query.p || 1,
      limit: {
         former: (req.query.p- 1) * 40 || 0,
         latter: 40
      }
   };

   reqData.distance = 5;

   Article.selectArticles(reqData, function (err, result) {
      if (err)
         return next(err);
      res.json({
         result: {
            page: reqData.p,
            data: result
         }
      })

   });
});

router.get('/users/:user_id', function(req, res, next) {

   Article.selectArticlesById(req.params.user_id, function (err, rows) {
      if (err)
         return next(err);
      res.json({

      });
   });
});

router.get('/:art_id/details', function(req, res, next) {

   var resultMsg =  {
      data :
         {
            art_id : 123,
            user_id : 1,
            user_name : "홍길동",
            create_date : "2016-08-10 15:30:00",
            image_url : "https://goo.gl/pkEex0",
            content : "말라와의 산책~~~",
            num_like : 11
         }
   };
   var errMsg = "게시글 상세 정보를 가져오는데 실패하였습니다.";

   var reqData = [];
   reqData[0] = [":art_id", req.params.art_id, "number", 1];

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