var express = require('express');
var router = express.Router();
var dummy = require('../models/dummy');


router.post('/:stroll_id/request', function(req, res, next) {
   var resultMsg = "“매칭 요청에 성공하였습니다.";
   var errMsg = "“매칭 요청에 실패하였습니다.";

   var reqData = [];
   reqData[0] = [":stroll_id ", req.params.stroll_id, "number", 1];
   reqData[1] = ["from_time ", req.body.from_time, "string", 1];
   reqData[2] = ["to_time ", req.body.to_time , "string", 1];


   dummy(reqData, function (err, result) {
      if (err)
         next(err);
      if (result.errFlag > 0) {
         res.json({
            err: errMsg,
            sentData: result.data
         });
      } else {
         res.json({
            result: resultMsg,
            sentData: result.data
         });
      }
   });
});

router.get('/seaters/:page', function(req, res, next) {
   var resultMsg = {
      data: [
         {
            reserve_id : 123,
            reserve_user_id :  2143,
            reserve_user_name : "정도균",
            reserve_dog_name : "말라",
            stroll_id : 4567,
            from_time: "2017-01-01 18:00:00",
            to_time : "2017-01-01 19:00:00"
         }, {
            reserve_id : 123,
            reserve_user_id :  2143,
            reserve_user_name : "정도균",
            reserve_dog_name : "말라",
            stroll_id : 4567,
            from_time: "2017-01-01 18:00:00",
            to_time : "2017-01-01 19:00:00"
         }, {
            reserve_id : 123,
            reserve_user_id :  2143,
            reserve_user_name : "정도균",
            reserve_dog_name : "말라",
            stroll_id : 4567,
            from_time: "2017-01-01 18:00:00",
            to_time : "2017-01-01 19:00:00"
         }
      ]
   };
   var errMsg = "예약 리스트 요청에 실패했습니다.";

   var reqData = [];
   reqData[0] = [":page ", req.params.page, "number", 1];


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

router.get('/users/:page', function(req, res, next) {
   var resultMsg = {
      data: [
         {
            reserve_id : 123,
            reserve_user_id :  2143,
            reserve_user_name : "정도균",
            reserve_dog_name : "말라",
            stroll_id : 4567,
            from_time: "2017-01-01 18:00:00",
            to_time : "2017-01-01 19:00:00"
         }, {
            reserve_id : 123,
            reserve_user_id :  2143,
            reserve_user_name : "정도균",
            reserve_dog_name : "말라",
            stroll_id : 4567,
            from_time: "2017-01-01 18:00:00",
            to_time : "2017-01-01 19:00:00"
         }, {
            reserve_id : 123,
            reserve_user_id :  2143,
            reserve_user_name : "정도균",
            reserve_dog_name : "말라",
            stroll_id : 4567,
            from_time: "2017-01-01 18:00:00",
            to_time : "2017-01-01 19:00:00"
         }
      ]
   };
   var errMsg = "예약 리스트 요청에 실패했습니다.";

   var reqData = [];
   reqData[0] = [":page ", req.params.page, "number", 1];

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

router.get('/:reserve_id/response/:status', function(req, res, next) {
   var resultMsg = "시터 매칭에 성공하였습니다.";
   var errMsg = "매칭 요청에 실패했습니다.";

   var reqData = [];
   reqData[0] = [":reserve_id ", req.params.reserve_id, "number", 1];
   reqData[1] = [":status ", req.params.reserve_id, "string", 1];


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

router.delete('/:reserve_id', function(req, res, next) {
   var resultMsg = "예약된 산책 취소에 성공하였습니다.";
   var errMsg = "예약된 산책 취소에 실패했습니다.";

   var reqData = [];
   reqData[0] = [":reserve_id ", req.params.reserve_id, "number", 1];

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