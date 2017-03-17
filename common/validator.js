/**
 * Created by T on 2017-03-13.
 */

//If there is no properties, It will call next();
function reserveTimeValidator(req, res, next) {
   if (req.body.from_time && req.body.to_time) {
      let currTime = new Date();
      if (currTime < new Date(req.body.from_time) < new Date(req.body.to_time)) {
         return next();
      } else {
         return res.status(400).json({
            error: "현재 시간은 시작 시간 보다, 시작 시간은 종료 시간보다 빨라야합니다."
         });
      }
   } else {
      return next();
   }
}

module.exports.reserveTimeValidator = reserveTimeValidator;