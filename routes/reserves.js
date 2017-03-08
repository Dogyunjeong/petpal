var express = require('express');
var router = express.Router();
var dummy = require('../models/dummy');
var Reserve = require('../models/reserve');

const reservationListLimt = process.env.TEXT_WITH_PROFILE_LIST_LIMIT;

//Create reservations after check there is no overlapped reservation and request period is in stroll period
router.post('/:stroll_id/request', function(req, res, next) {
   if(!req.body.stroll_user_id || !req.body.dog_name  || !req.body.from_time ||!req.body.to_time ) {
      var err = new Error('필수 정보가 오지 않았습니다.');
      err.status = 400;
      return next(err);
   }
   let reserveData = {
      reserve_user_id: req.user.user_id,
      reserve_dog_name: req.body.dog_name,
      stroll_id: req.params.stroll_id,
      stroll_user_id: req.body.stroll_user_id,
      from_time: req.body.from_time,
      to_time: req.body.to_time
   };
   Reserve.reserveStroll(reserveData, function (err, result) {
      if (err)
         return next(err);
      res.json({
         result: "매칭 요청에 성공하였습니다."
      })
   });


});

//Select the list of reservations by stroll_user_id = user_id
router.get('/seaters', function(req, res, next) {
   let reqSeater = {
      stroll_user_id: req.user.user_id,
      p: +req.query.p || 1,
      limit: {
         former: (req.query.p - 1) * reservationListLimt || 0,
         latter: + reservationListLimt
      }
   };
   Reserve.selectSeaterReservList(reqSeater, function (err, rows) {
      if (err)
         return next(err);
      res.json({
         result: {
            page: reqSeater.p,
            data: rows
         }
      })
   });
});

//Select the list of reservations by reserve_user_id = user_id
router.get('/users', function(req, res, next) {
   let reqUser = {
      reserve_user_id: req.user.user_id,
      p: +req.query.p || 1,
      limit: {
         former: (req.query.p - 1) * reservationListLimt || 0,
         latter: + reservationListLimt
      }
   };
   Reserve.selectUserReservList(reqUser, function (err, rows) {
      if (err)
         return next(err);
      res.json({
         result: {
            page: reqUser.p,
            data: rows
         }
      })
   });
});

//Check the reservation's status then if it is pending, update status with value of :status
router.get('/:reserve_id/response/:status', function(req, res, next) {
   // make object with data related with reservations to use for parameter
   let rsvObj = {
      reserve_id: req.params.reserve_id,
      res_status: (req.params.status === 'accept') ? 2 : (req.params.status === 'deny') ? 3 : null,
      stroll_user_id: req.user.user_id
   };
   if (rsvObj.status === null)
      return next(err);
   Reserve.updateReserveStatus(rsvObj, function (err) {
      if (err)
         return next(err);
      res.json({
         result: '산책 매칭에 성공하였습니다.'
      })
   });
});

router.delete('/:reserve_id', function(req, res, next) {

   if (!req.body.stroll_user_id || !req.body.reserve_user_id || !req.body.stroll_id || !req.body.reserve_dog_name) {
      var err = new Error('필요 정보가 누락 되었습니다.');
      err.status = 400;
      return next(err);
   }

   if (req.user.user_id === +req.body.stroll_user_id || req.user.user_id === +req.body.reserve_user_id) {
      //reqObj own the data which is sent from user
      let reqObj = {
         reserve_id: + req.params.reserve_id,
         stroll_id: + req.body.stroll_id,
         stroll_user_id: + req.body.stroll_user_id,
         reserve_user_id: + req.body.reserve_user_id,
         reserve_dog_name: req.body.reserve_dog_name
      };
      Reserve.cancelReserveStatus(reqObj,function (err) {
         if (err)
            return next(err);
         else
            res.json({result:'예약된 산책 취소에 성공하였습니다.'});
      });
   } else {
      var err = new Error('산책을 취소할 권한이 없습니다.');
      err.status = 403;
      return next(err);
   }
});



module.exports = router;