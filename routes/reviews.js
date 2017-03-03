var express = require('express');
var router = express.Router();
var Review = require('../models/review');

const reviewListLimit = process.env.TEXT_WITH_PROFILE_LIST_LIMIT;

router.post('/:reserve_id', function(req, res, next) {
   if (!req.body.stars || !req.body.content) {
      var err = new Error('필수 정보가 입력되지 않았습니다.');
      err.status = 400;
      return next(err);
   }
   let reqReview = {
      reserve_id: req.params.reserve_id,
      reserve_user_id: req.user.user_id,
      stars: + req.body.stars,
      content: req.body.content
   };
   Review.postReview(reqReview, function (err, result) {
      if (err)
         return next(err);
      res.json({
         result: '리뷰 등록에 성공했습니다.'
      });
   });
});


router.get('/:stroll_user_id', function(req, res, next) {
   let reqData = {
      stroll_user_id: req.params.stroll_user_id,
      p: req.query.p || 1,
      limit: {
         former: (req.query.p - 1) * reviewListLimit || 0,
         latter: + reviewListLimit
      }
   };

   Review.getReview(reqData, function (err, rows) {
      if (err) {
         err.message = '리뷰 조회에 실패했습니다.';
         return next(err);
      } else {
         res.json({
            result: {
               page: reqData.p,
               data: rows
            }
         });
      }
   });
});


module.exports = router;