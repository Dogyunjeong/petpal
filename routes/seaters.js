let express = require('express');
let router = express.Router();
let Validator = require('../common/validator');
let Seater = require('../models/seater');

const searchDistance = process.env.SEARCH_DISTANCE;
const seaterSearchLimit = process.env.TEXT_WITH_PROFILE_LIST_LIMIT;

router.post('/', function (req, res, next) {
   // check required data is coming then make object to send
   if (!req.body.stroll_pos_lat || !req.body.stroll_pos_long || !req.body.from_time || ! req.body.to_time) {
      let err = new Error('필수 정보가 입력되지 않았습니다.');
      err.status = 400;
      return next(err);
   }
   Validator.reserveTimeValidator(req.body.from_time, req.body.to_time, function (err) {
      if (err) return next(err);
   });
   Validator.positionValidator(req.body.stroll_pos_lat, req.body.stroll_pos_long, function (err) {
      if (err) return next(err);
   });
   let reqSeater = {
      stroll_user_id: req.user.user_id,
      stroll_pos_lat: +req.body.stroll_pos_lat,
      stroll_pos_long: +req.body.stroll_pos_long,
      from_time: req.body.from_time,
      to_time: req.body.to_time,
      dog_weight: isNaN(req.body.dog_weight) ? (req.body.dog_weight === '무관' ? null : req.body.dog_weight ) : + req.body.dog_weight || null,
      dog_gender: isNaN(req.body.dog_gender) ? (req.body.dog_gender === '무관' ? null : req.body.dog_gender ) : + req.body.dog_gender || null,
      dog_neutralized: isNaN(req.body.dog_neutralized) ?  (req.body.dog_neutralized === '무관' ? null : req.body.dog_neutralized ) : + req.body.dog_neutralized || null,
   };

   Seater.insertSeater(reqSeater, function (err) {
      if (err){
         return next(err);
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
      p: + req.query.p || 0,
      limit: {
         former: (req.query.p - 1) * 20 || 0,
         latter: 20
      }
   };

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

router.get('/:user_id', function (req, res, next) {
   let reqSeater = {
      stroll_user_id: req.params.user_id,
      p: + req.query.p || 0,
      limit: {
         former: (req.query.p - 1) * 20 || 0,
         latter: 20
      }
   };

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
      dog_weight: isNaN(req.body.dog_weight) ? (req.body.dog_weight === '무관' ? null : req.body.dog_weight ) : + req.body.dog_weight || null,
      dog_gender: isNaN(req.body.dog_gender) ? (req.body.dog_gender === '무관' ? null : req.body.dog_gender ) : + req.body.dog_gender || null,
      dog_neutralized: isNaN(req.body.dog_neutralized) ?  (req.body.dog_neutralized === '무관' ? null : req.body.dog_neutralized ) : + req.body.dog_neutralized || null,
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
         result: '시터 정보 삭제에 성공하였습니다.'
      });
   });
});

//Search filter conditions coming as query string.
router.get('/pos_lat/:pos_lat/pos_long/:pos_long', function (req, res, next) {
   Validator.positionValidator(req.body.stroll_pos_lat, req.body.stroll_pos_long, function (err) {
      if (err) return next(err);
   });
   let searchData = {
      req_user_id: req.user.user_id,
      stroll_pos_lat: req.params.pos_lat,
      stroll_pos_long: req.params.pos_long,
      from_time: req.query.from_time || new Date(),
      distance: + req.query.distance || + searchDistance,
      to_time: req.query.to_time || null,
      dog_weight: isNaN(req.query.dog_weight) ? (req.query.dog_weight === '무관' ? null : req.query.dog_weight ) : + req.query.dog_weight || null,
      dog_gender: isNaN(req.query.dog_gender) ? (req.query.dog_gender === '무관' ? null : req.query.dog_gender ) : + req.query.dog_gender || null,
      dog_neutralized: isNaN(req.query.dog_neutralized) ?  (req.query.dog_neutralized === '무관' ? null : req.query.dog_neutralized ) : + req.query.dog_neutralized || null,
      p: req.query.p || 1,
      limit: {
         former: (req.query.p - 1) * seaterSearchLimit || 0,
         latter: + seaterSearchLimit
      }
   };
   Seater.findSeaters(searchData, function (err, rows) {
      if (err)
         return next(err);
      res.json({
         result: {
            p: searchData.p,
            data : rows
         }
      });

   });
});

module.exports = router;