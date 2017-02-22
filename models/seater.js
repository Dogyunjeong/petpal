var QueryFn = require('./queryFunction');
var dbPool = require('../common/dbPool');

function insertSeater(reqSeater, callback) {
   let query = {
      selectQuery: 'select stroll_id, stroll_user_id, st_y(stroll_pos), st_y(stroll_pos), from_time, to_time, dog_weight, dog_gender, dog_neutralized ' +
                   'from strolls ' +
                   'where stroll_user_id = ? and ? > from_time and ? < to_time ',
      insertQuery: 'insert strolls (stroll_user_id, stroll_pos, from_time, to_time, dog_weight, dog_gender, dog_neutralized) ' +
                   'values (?, point(?, ?), ?, ?, ?, ?, ?)'
   };
   let params = {
      selectParams: [reqSeater.stroll_user_id, reqSeater.to_time, reqSeater.from_time],
      insertParams: [reqSeater.stroll_user_id, reqSeater.stroll_pos_long, reqSeater.stroll_pos_lat, reqSeater.from_time,
                     reqSeater.to_time, reqSeater.dog_weight, reqSeater.dog_gender, reqSeater.dog_neutralized]
   };
   QueryFn.insertWithCheck(query, params, function (err, result) {
      if (err) {
         if (err.status === 400) {
            err.message = '중복된 산책 정보가 존재합니다.';
            err.stack = result;
            return callback(err);
         }
         else {
            return callback(err);
         }
      } else {
         callback(null, result);
      }
   });
}

function updateSeater(reqSeater, callback) {
   // create the queries and params to update after checking and merging data
   let query = {
      selectForCheckQuery: 'select stroll_id, stroll_user_id, st_y(stroll_pos), st_y(stroll_pos), from_time, to_time, dog_weight, dog_gender, dog_neutralized ' +
                           'from strolls ' +
                           'where stroll_user_id = ? and ? > from_time and ? < to_time and stroll_id != ?',
      selectQuery: 'select st_y(stroll_pos) as stroll_pos_lat , st_x(stroll_pos) as stroll_pos_long, from_time, to_time, dog_weight, dog_gender, dog_neutralized ' +
                   'from strolls ' +
                   'where stroll_id = ? and stroll_user_id = ?',
      updateQuery: 'update strolls ' +
                   'set stroll_pos = point(?, ?), from_time = ?, to_time = ?, dog_weight = ?, dog_gender = ?, dog_neutralized = ? ' +
                   'where stroll_id = ? and stroll_user_id = ?'

};
   let params = {
      selectForCheckParams: [reqSeater.stroll_user_id, reqSeater.to_time, reqSeater.from_time, reqSeater.stroll_id],
      selectParams: [reqSeater.stroll_id, reqSeater.stroll_user_id],
      updateParams: {
         stroll_pos_long: reqSeater.stroll_pos_long, stroll_pos_lat: reqSeater.stroll_pos_lat, from_time: reqSeater.from_time, to_time: reqSeater.to_time, dog_weight: reqSeater.dog_weight,
         dog_gender: reqSeater.dog_gender, dog_neutralized: reqSeater.dog_neutralized, stroll_id: reqSeater.stroll_id, stroll_user_id: reqSeater.stroll_user_id
      },
      prevParams: null
   };
   QueryFn.updateWithCheck(query, params, function (err, result) {
      if (err) {
         if (err.status = 400) {
            err.message = '시터 정보 변경에 실패했습니다.';
            err.stack = result;
            return callback(err);
         } else {
            err.message = '시터 정보 변경에 실패했습니다.';
            return callback(err);
         }
      } else {
         callback(null, result);
      }
   });
}

function deleteSeater(reqSeater, callback) {
   let deleteQuery = 'delete ' +
                      'from strolls ' +
                      'where stroll_id = ? and stroll_user_id = ?';
   let deleteParams = [reqSeater.stroll_id, reqSeater.stroll_user_id];

   QueryFn.deleteQueryFunction(deleteQuery, deleteParams, function (err, result) {
      if (err) {
         if (err.status = 400) {
            err.message = '요청한 시터 정보가 존재하지 않습니다.'
            return callback(err);
         } else {
            return callback(err);
         }
      }

      else
         callback(null, result);
   });
}

function selectSeater(reqSeater, callback) {
   let selectQuery = 'select stroll_id, st_y(stroll_pos) as stroll_pos_lat , st_x(stroll_pos) as stroll_pos_long, from_time, to_time,' +
                      '       dog_weight, dog_gender, dog_neutralized ' +
                      'from strolls ' +
                      'where stroll_user_id = ? ' +
                      'order by from_time ' +
                      'limit ?, ?';
   let selectParams = [reqSeater.stroll_user_id, reqSeater.limit.former, reqSeater.limit.latter];

   QueryFn.selectQueryFunction(selectQuery, selectParams, function (err, rows) {
      if (err)
         return callback(err);
      callback(null, rows);
   });
}

module.exports.insertSeater = insertSeater;
module.exports.updateSeater = updateSeater;
module.exports.deleteSeater = deleteSeater;
module.exports.selectSeater = selectSeater;