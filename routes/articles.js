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

const searchDistance = process.env.SEARCH_DISTANCE;

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
         cb(null, 'article_img/' + file.originalname + Date.now().toString())
      }
   })
});

const articleSerachLimit = process.env.ARTICLE_SERACH_LIMIT;
const feedImgListLimt = process.env.FEED_IMG_LIST_LIMIT;

router.post('/', upload.single('image'), incomingCheck, function(req, res, next) {
   if (!req.file || !req.body.content || !req.body.pos_lat || !req.body.pos_long) {
      var  err = new Error("필수 데이터가 오지 않았습니다.");
      err.status = 400;
      return next(err);
   }
   let reqArticle = {
      user_id: req.user.user_id,
      image_url: req.file.location,
      content: req.body.content,
      position: {
         pos_lat:  + req.body.pos_lat,
         pos_long: + req.body.pos_long
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

router.get('/pos_lat/:pos_lat/pos_long/:pos_long', function(req, res, next) {

   if (!req.params.pos_lat || !req.params.pos_long) {
      var err = new Error('필수 정보가 입력되지 않았습니다.');
      err.status = 400;
      return next(err);
   }

   let reqData = {
      user_id: req.user.user_id,
      pos_lat: req.params.pos_lat,
      pos_long: req.params.pos_long,
      distance: req.query.distance || searchDistance,
      p: req.query.p || 1,
      limit: {
         former: (req.query.p - 1) * articleSerachLimit || 0,
         latter: + articleSerachLimit
      }
   };

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

router.get('/map/pos_lat/:pos_lat/pos_long/:pos_long', function(req, res, next) {

   if (!req.params.pos_lat || !req.params.pos_long) {
      var err = new Error('필수 정보가 입력되지 않았습니다.');
      err.status = 400;
      return next(err);
   }

   let reqData = {
      user_id: req.user.user_id,
      pos_lat: req.params.pos_lat,
      pos_long: req.params.pos_long,
      distance: req.query.distance || searchDistance,
      p: req.query.p || 1,
      limit: {
         former: (req.query.p - 1) * articleSerachLimit || 0,
         latter: + articleSerachLimit
      }
   };

   Article.selectArticlesForMap(reqData, function (err, result) {
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
   let reqData = {
      user_id: req.params.user_id,
      page: req.query.p || 1,
      limit: {
         former: (req.query.p - 1) * feedImgListLimt || 0,
         latter: + feedImgListLimt
      }
   };

   Article.selectArticlesByUserId(reqData, function (err, rows) {
      if (err)
         return next(err);
      res.json({
         result: {
            page: reqData.p,
            data: rows
         }
   });
   });
});

router.get('/:art_id/details', function(req, res, next) {
   let reqData = {
      art_id: req.params.art_id,
      user_id: req.user.user_id
   };
   Article.selectArticlesById(reqData, function (err, rows) {
      if (err)
         return next(err);
      res.json({
         result: {
            data: rows[0]
         }
      });
   });
});

router.get('/:art_id/like', function(req, res, next) {
   let reqData = {
      art_id: req.params.art_id,
      user_id: req.user.user_id
   };
   Article.likeArticleById(reqData, function (err, rows) {
      if (err)
         return next(err);
      res.json({
         result: "좋아요에 성공했습니다."
      });
   });
});

router.get('/:art_id/unlike', function(req, res, next) {
   let reqData = {
      art_id: req.params.art_id,
      user_id: req.user.user_id
   };
   Article.unlikeArticleById(reqData, function (err, rows) {
      if (err)
         return next(err);
      res.json({
         result: "좋아요 취소에 성공했습니다."
      });
   });
});




module.exports = router;