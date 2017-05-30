let express = require('express');
let logger = require('../common/logger');
let incomingCheck = require('../models/incomingCheck');
let Article = require('../models/article');
let upload = require('../common/uploadS3')('article_img/');

let router = express.Router();

const searchDistance = process.env.SEARCH_DISTANCE;
const articleSearchLimit = process.env.ARTICLE_SERACH_LIMIT;
const feedImgListLimit = process.env.FEED_IMG_LIST_LIMIT;


//insert data into articles table. it can accept only one image.
router.post('/', upload.single('image'), incomingCheck, function (req, res, next) {
   if (!req.file || !req.body.content || !req.body.pos_lat || !req.body.pos_long) {
      let  err = new Error("필수 데이터가 오지 않았습니다.");
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

//delete post from articles table
router.delete('/:art_id', function (req, res, next) {
   let reqData = {
       art_id: parseInt(req.params.art_id, 10) || null,
       user_id: req.user.user_id
   };
   Article.deleteArticle(reqData, function (err, result) {
      if (err) {
         err.message = "게시글 삭제에 실패하였습니다.";
         next(err);
      } else {
         res.json({
            result: "“게시글 삭제에 성공하였습니다."
         });
      }
   })
});

//Search articles near the user position
router.get('/pos_lat/:pos_lat/pos_long/:pos_long', function (req, res, next) {

   if (!req.params.pos_lat || !req.params.pos_long) {
      let err = new Error('필수 정보가 입력되지 않았습니다.');
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
         former: (req.query.p - 1) * articleSearchLimit || 0,
         latter: + articleSearchLimit
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

router.get('/map/pos_lat/:pos_lat/pos_long/:pos_long', function (req, res, next) {

   if (!req.params.pos_lat || !req.params.pos_long) {
      let err = new Error('필수 정보가 입력되지 않았습니다.');
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
         former: (req.query.p - 1) * articleSearchLimit || 0,
         latter: + articleSearchLimit
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

router.get('/users/:user_id', function (req, res, next) {
   let reqData = {
      user_id: req.params.user_id,
      page: req.query.p || 1,
      limit: {
         former: (req.query.p - 1) * feedImgListLimit || 0,
         latter: + feedImgListLimit
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

router.get('/:art_id/details', function (req, res, next) {
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

router.get('/:art_id/like', function (req, res, next) {
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

router.get('/:art_id/unlike', function (req, res, next) {
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
//delete Article what requested user posted



module.exports = router;