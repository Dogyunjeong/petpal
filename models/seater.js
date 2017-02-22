var QueryFn = require('./queryFunction');
var dbPool = require('../common/dbPool');

function insertSeater(reqSeater, callback) {
   let insertQuery =
      'insert strolls (stroll_user_id, stroll_pos, from_time, to_time, dog_weight, dog_gender, dog_neutralized) ' +
      'values (?, point(?, ?), ?, ?, ?, ?, ?)';
   let insertParams = [reqSeater.user_id, reqSeater.stroll_pos_long, reqSeater.stroll_pos_lat, reqSeater.from_time, reqSeater.to_time, reqSeater.dog_weight, reqSeater.dog_gender, reqSeater.dog_neutralized];
   QueryFn.insertQueryFunction(insertQuery, insertParams, function (err, result) {
      if (err)
         return callback(err);
      callback(null, result);
   });
}

module.exports.insertSeater = insertSeater;