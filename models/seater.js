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
      selectParams: [reqSeater.user_id, reqSeater.to_time, reqSeater.from_time],
      insertParams: [reqSeater.user_id, reqSeater.stroll_pos_long, reqSeater.stroll_pos_lat, reqSeater.from_time,
                     reqSeater.to_time, reqSeater.dog_weight, reqSeater.dog_gender, reqSeater.dog_neutralized]
   };
   QueryFn.checkForInsert(query, params, function (err, result) {
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

function updateSeater(reqData, callback) {
   let query = {
      selectQuery: 'select st_y(stroll_pos) as stroll_pos_lat , st_x(stroll_pos) as stroll_pos_long, from_time, to_time, dog_weight, dog_gender, dog_neutralized ' +
                   'from strolls ' +
                   'where stroll_id = ? and stroll_user_id = ?',
      updateQuery: ''
   };
   let params = {
      selectParams: [reqSeater.stroll_id, reqSeater.stroll_user_id],
      updateParams: {
         dog_name: reqDog.dog_name, aes_key_for_select: aes_key, dog_gender: reqDog.dog_gender,
         dog_age: reqDog.dog_age, dog_type: reqDog.dog_type, dog_weight: reqDog.dog_weight,
         dog_profile_img_url: reqDog.dog_profile_img_url, dog_neutralized: reqDog.dog_neutralized,
         dog_characters: reqDog.dog_characters, dog_significants: reqDog.dog_significants,
         user_id: reqDog.user_id, prev_dog_name: reqDog.prev_dog_name, aes_key_for_where: aes_key
      },
      prevParams: null
   };
}

module.exports.insertSeater = insertSeater;
module.exports.updateSeater = updateSeater;