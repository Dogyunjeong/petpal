/**
 * Created by T on 2017-03-13.
 */

//If there is no properties, It will call next();
function reserveTimeValidator(from_time, to_time, cb) {
   let currTime = new Date();
   if (currTime < new Date(from_time) < new Date(to_time)) {
      return cb();
   } else {
      let err = new Error('입력된 시간정보가 잘못 되었습니다.');
      err.status = 400;
      return cb(err);
   }
}
//Check the position values are correct or not
function positionValidator(pos_lat, pos_long, cb) {
   if (!pos_lat || !pos_long || ((pos_lat + "").split(".")[1].length !== (pos_long + "").split(".")[1].length)) {
      let err = new Error('위치정보 값이 잘 못 되었습니다.');
      err.status = 400;
      return cb(err);
   }
   cb();
}

// function validateId(req, res, next) {
//    if (req.params.user_id || req.params.art_id || req.params.) {
//
//    }
// }

module.exports.reserveTimeValidator = reserveTimeValidator;
module.exports.positionValidator = positionValidator;