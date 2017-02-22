var express = require('express');
var router = express.Router();
var dummy = require('../models/dummy');
var Seater = require('../models/seater');

router.post('/', function (req, res, next) {
   // check required data is coming then make object to send
   if (!req.body.stroll_pos_lat || !req.body.stroll_pos_lat || !req.body.from_time || ! req.body.to_time) {
      var err = new Error('필수 정보가 입력되지 않았습니다.');
      err.status = 400;
      return next(err);
   }
   let reqSeater = {
      stroll_user_id: req.user.user_id,
      stroll_pos_lat: req.body.stroll_pos_lat,
      stroll_pos_long: req.body.stroll_pos_long,
      from_time: req.body.from_time,
      to_time: req.body.to_time,
      dog_weight: req.body.dog_weight || null,
      dog_gender: req.body.dog_gender || null,
      dog_neutralized: req.body.dog_neutralized || null
   };

   Seater.insertSeater(reqSeater, function (err, rows) {
      if (err){
         if (err.status = 400){
            return next(err);
         } else {
            err.message ='시터 등록에 실패했습니다.';
            return next(err);
         }
      } else {
         res.json({
            result: '시터 등록에 성공하였습니다.'
         });
      }
   });

});

router.get('/me', function (req, res, next) {
   let reqSeater = {
      stroll_user_id: req.user.user_id,
      p: req.query.p || 0,
      limit: {
         former: (req.query.p - 1) * 20 || 0,
         latter: 20
      }
   }

   Seater.selectSeater(reqSeater, function (err, rows) {
      if (err)
         return next(err);
      res.json({
         result: {
            data: rows
         }
      });
   });

});

router.put('/:stroll_id', function (req, res, next) {

   let reqSeater = {
      stroll_user_id: req.user.user_id || null,
      stroll_id: req.params.stroll_id,
      stroll_pos_lat: req.body.stroll_pos_lat || null,
      stroll_pos_long: req.body.stroll_pos_long || null,
      from_time: req.body.from_time || null,
      to_time: req.body.to_time || null,
      dog_weight: req.body.dog_weight || null,
      dog_gender: req.body.dog_gender || null,
      dog_neutralized: req.body.dog_neutralized || null
   };

   Seater.updateSeater(reqSeater, function (err, row) {
      if (err)
         return next(err);
      res.json({
           result: '시터 정보 변경에 성공하였습니다.'
      });
   });

});

router.delete('/:stroll_id', function (req, res, next) {
   let reqSeater = {
      stroll_user_id: req.user.user_id,
      stroll_id: req.params.stroll_id
   };

   Seater.deleteSeater(reqSeater, function (err, result) {
      if (err)
         return next(err);
      res.json({
         result: '시터 정보 삭제에성공하였습니다.'
      });
   });


});

router.get('/lat/:lat/long/:long', function (req, res, next) {
   var resultMsg = {
      data: [
         {
            stroll_id: 1234, stroll_user_name: "정도균",
            stroll_user_image_url: "https://goo.gl/pkEex0",
            stroll_user_gender: 1,
            stroll_user_age: 17,
            pos_lat: 42.121234,
            from_time: "2017-01-01 19:00:00",
            to_time: "2017-01-01 20:00:00"
         }, {
            stroll_id: 1234, stroll_user_name: "정도균",
            stroll_user_image_url: "https://goo.gl/pkEex0",
            stroll_user_gender: 1,
            stroll_user_age: 17,
            pos_lat: 42.121234,
            from_time: "2017-01-01 19:00:00",
            to_time: "2017-01-01 20:00:00"
         }, {
            stroll_id: 1234, stroll_user_name: "정도균",
            stroll_user_image_url: "https://goo.gl/pkEex0",
            stroll_user_gender: 1,
            stroll_user_age: 17,
            pos_lat: 42.121234,
            from_time: "2017-01-01 19:00:00",
            to_time: "2017-01-01 20:00:00"
         }
      ]
   };
   var errMsg = "시터 정보 조회에 실패했습니다.";

   var reqData = [];
   reqData[0] = [":lat ", req.params.lat, "number", 1];
   reqData[1] = [":long ", req.params.long, "number", 1];
   reqData[2] = [":p ", req.params.p, "number", 1];
   reqData[3] = ["?from_time ", req.query.from_time, "string", 0];
   reqData[4] = ["?to_time ", req.query.to_time , "string", 0];
   reqData[5] = ["?dog_weight  ", req.query.dog_weight , "number", 0];
   reqData[6] = ["?dog_gender  ", req.query.dog_gender  , "number", 0];
   reqData[7] = ["?dog_neutralized  ", req.query.dog_neutralized , "number", 0];

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