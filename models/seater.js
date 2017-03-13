var QueryFn = require('./queryFunction');
var dbPool = require('../common/dbPool');

const aes_key = process.env.AES_KEY;
const defaultUserImgUrl = process.env.DEFAULT_USER_PROFILE_IMG_URL;

function insertSeater(reqSeater, callback) {
   let query = {
      selectQuery: 'select stroll_id, stroll_user_id, st_y(stroll_pos), st_x(stroll_pos), from_time, to_time, dog_weight, dog_gender, dog_neutralized ' +
                   'from strolls ' +
                   'where stroll_user_id = ? and ? > from_time and ? < to_time ',
      insertQuery: 'insert into strolls (stroll_user_id, stroll_pos, from_time, to_time, dog_weight, dog_gender, dog_neutralized) ' +
                   'values (?, point(?, ?), ?, ?, ?, ?, ?)'
   };
   let params = {
      selectParams: [reqSeater.stroll_user_id, reqSeater.to_time, reqSeater.from_time],
      insertParams: [reqSeater.stroll_user_id, reqSeater.stroll_pos_long, reqSeater.stroll_pos_lat, reqSeater.from_time,
                     reqSeater.to_time, reqSeater.dog_weight, reqSeater.dog_gender, reqSeater.dog_neutralized]
   };
   QueryFn.insertWithCheckNotExist(query, params, function (err, result) {
      if (err) {
         if (err.status === 406) {
            err.message = '중복된 산책 정보가 존재합니다.';
            err.stack = result;
            return callback(err);
         }
         else {
            err.message = '시터 등록에 실패했습니다.';
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
   QueryFn.updateWithCheckNotExist(query, params, function (err, result) {
      if (err) {
         if (err.status === 405) {
            err.message = '중복된 산책 정보가 존재합니다.';
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
         if (err.status = 406) {
            err.message = '요청한 시터 정보가 존재하지 않습니다.';
            return callback(err);
         } else {
            err.message = '시터 정보 삭제에 실패했습니다.';
            return callback(err);
         }
      }
      else
         callback(null, result);
   });
}

function selectSeater(reqSeater, callback) {
   let selectQuery = 'select stroll_id, stroll_user_id, st_y(stroll_pos) as stroll_pos_lat , st_x(stroll_pos) as stroll_pos_long,  date_format(from_time, "%Y-%m-%d %H:%i:%S") as from_time, date_format(to_time, "%Y-%m-%d %H:%i:%S") as to_time, ' +
                      '       ifnull(dog_weight, \'무관\') as dog_weight, ifnull(dog_gender, \'무관\') as dog_gender, ifnull(dog_neutralized, \'무관\') as dog_neutralized ' +
                      'from strolls ' +
                      'where stroll_user_id = ? ' +
                      'order by from_time desc ' +
                      'limit ?, ?';
   let selectParams = [reqSeater.stroll_user_id, reqSeater.limit.former, reqSeater.limit.latter];

   QueryFn.selectQueryFunction(selectQuery, selectParams, function (err, rows) {
      if (err)
         return callback(err);
      if (!rows[0] || !rows.length ){
         err = new Error("Not Found");
         err.status = 404;
         return callback(err);
      }
      callback(null, rows);
   });
}

function findSeaters(searchData, callback) {
   let queryParts = {
      start :'select stroll_id, stroll_user_id, stroll_pos_lat , stroll_pos_long , date_format(from_time, "%Y-%m-%d %H:%i:%S") as from_time, date_format(to_time, "%Y-%m-%d %H:%i:%S") as to_time, ifnull(dog_weight, \'무관\') as dog_weight, ifnull(dog_gender, \'무관\') as dog_gender, ifnull(dog_neutralized, \'무관\') as dog_neutralized,' +
             '       distance, cast(aes_decrypt(user_name, unhex(sha2(?, 512))) as char) as stroll_user_name, ifnull(profile_img_url, ?) as stroll_user_profile_img_url, gender as stroll_user_gender, age as stroll_user_age ' +
             'from (select stroll_id, stroll_user_id, st_y(stroll_pos) as stroll_pos_lat , st_x(stroll_pos) as stroll_pos_long, from_time, to_time, dog_weight, dog_gender, dog_neutralized, ' +
                   '6371 * acos(cos(radians(?)) * cos(radians(st_y(stroll_pos))) * cos(radians(st_x(stroll_pos)) - radians(?)) + sin(radians(?)) * sin(radians(st_y(stroll_pos)))) as distance ' +
                   'from strolls ' +
                   'where mbrcontains(envelope(linestring(point((? + (? / abs(cos(radians(?)) * 111.2))), (? + (? /111.2))), ' +
                   'point(( ? - (? / abs(cos(radians(?)) * 111.2))), (? - (? /111.2))))), stroll_pos) ' +
                   'and to_time > ? ',

   partsForCombine : {
         to_time: 'and from_time < ? ',
         dog_weight: 'and dog_weight = ? ',
         dog_gender: 'and dog_gender = ? ',
         dog_neutralized: ' and dog_neutralized =  ? '
      },
      end : ' order by distance    limit ?, ? ) as s left join users as u on (s.stroll_user_id = u.user_id)'
   };
   let paramParts = {
      start : [
         aes_key, defaultUserImgUrl,
         searchData.stroll_pos_lat, searchData.stroll_pos_long, searchData.stroll_pos_lat,
         searchData.stroll_pos_long,  searchData.distance, searchData.stroll_pos_lat, searchData.stroll_pos_lat, searchData.distance,
         searchData.stroll_pos_long, searchData.distance, searchData.stroll_pos_lat, searchData.stroll_pos_lat, searchData.distance,
         searchData.from_time
      ],
      partsForCombine : {
         to_time: searchData.to_time,
         dog_weight: searchData.dog_weight,
         dog_gender: searchData.dog_gender,
         dog_neutralized: searchData.dog_neutralized
      },
      end: [searchData.limit.former, searchData.limit.latter]
   };
   QueryFn.makeQueryThenDo(queryParts, paramParts, function (err, rows) {
      if (err) {
         err.message = "시터 정보 조회에 실패했습니다.";
         return callback(err);
      } else {
         callback(null, rows);
      }


   });
}

module.exports.insertSeater = insertSeater;
module.exports.updateSeater = updateSeater;
module.exports.deleteSeater = deleteSeater;
module.exports.selectSeater = selectSeater;
module.exports.findSeaters = findSeaters;