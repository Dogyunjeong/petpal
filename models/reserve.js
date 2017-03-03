var QueryFn = require('./queryFunction');
const aes_key = process.env.AES_KEY

function reserveStroll(reservData, callback) {
   //prepare query and params to check and the insert
   let query = {
      selectQuery: 'select reserve_id, stroll_id, stroll_user_id ' +
                   'from reservations ' +
                   'where stroll_user_id = ? and stroll_id = ? and ? > from_time and ? < to_time ',
      insertQuery: 'insert reservations (stroll_id, stroll_user_id, reserve_user_id, reserve_dog_name, from_time, to_time) ' +
                   'value (?, ?, ?, aes_encrypt(?, unhex(sha2(?, 512))), ?, ?)'
   };
   let params = {
      selectParams: [reservData.stroll_user_id, reservData.stroll_id, reservData.to_time, reservData.from_time],
      insertParams: [reservData.stroll_id, reservData.stroll_user_id, reservData.reserve_user_id,
         reservData.reserve_dog_name, aes_key, reservData.from_time, reservData.to_time]
   };
   //call the insertWithCheckNotExist function
   QueryFn.insertWithCheckNotExist(query, params, function (err, result) {
      if (err) {
         //if there is overlapped reservation return err with status code 400
         if (err.status === 405) {
            err.message = '중복된 예약 정보가 존재합니다.';
            err.stack = result;
            return callback(err);
         }
         else {
            return callback(err);
         }
      } else {
         callback(null, result);
      }
   })
}

function selectSeaterReservList(reqSeater, callback) {
   // create query and params to serach list for searter's reservation list
   let selectQuery = 'select reserve_id, stroll_id, stroll_user_id, reserve_user_id, cast(aes_decrypt(reserve_dog_name, unhex(sha2(?, 512))) as char) as reserve_dog_name, ' +
                      'status, from_time, to_time, cast(aes_decrypt(user_name, unhex(sha2(?, 512))) as char) as reserve_user_name, profile_img_url as reserve_user_profile_img_url ' +
                      'from reservations as r left join users u on (r.reserve_user_id = u.user_id) ' +
                      'where stroll_user_id = ? ' +
                      'order by from_time desc ' +
                      'limit ?, ?';
   let selectParams = [aes_key, aes_key, reqSeater.stroll_user_id, reqSeater.limit.former, reqSeater.limit.latter];

   QueryFn.selectQueryFunction(selectQuery, selectParams, function (err, rows) {
      if (err) {
         err.message = '예약 리스트 요청에 실패했습니다.';
         return callback(err);
      } else  {
         callback(null, rows);
      }
   });
}

function selectUserReservList(reqUser, callback) {
   // create query and params to serach list for searter's reservation list
   let selectQuery = 'select reserve_id, stroll_id, stroll_user_id, reserve_user_id, cast(aes_decrypt(reserve_dog_name, unhex(sha2(?, 512))) as char) as reserve_dog_name, ' +
                     '        status, from_time, to_time, cast(aes_decrypt(user_name, unhex(sha2(?, 512))) as char) as stroll_user_name, profile_img_url as stroll_user_profile_img_url ' +
                     'from reservations as r left join users u on (r.stroll_user_id = u.user_id) ' +
                     'where reserve_user_id = ? ' +
                     'order by from_time desc ' +
                     'limit ?, ?';
   let selectParams = [aes_key, aes_key,reqUser.reserve_user_id, reqUser.limit.former, reqUser.limit.latter];

   QueryFn.selectQueryFunction(selectQuery, selectParams, function (err, rows) {
      if (err) {
         err.message = '예약 리스트 요청에 실패했습니다.';
         return callback(err);
      } else  {
         callback(null, rows);
      }
   });
}

function updateReserveStatus(rsvObj, callback) {
   let query = {
      selectQuery: 'select status ' +
                   'from reservations ' +
                   'where reserve_id = ? and stroll_user_id = ?',
      updateQuery: 'update reservations ' +
                   'set status = ? ' +
                   'where reserve_id = ? and stroll_user_id = ?'
   };
   let params = {
      selectParams: [rsvObj.reserve_id, rsvObj.stroll_user_id],
      updateParams: {
         status: rsvObj.res_status,
         reserve_id: rsvObj.reserve_id,
         stroll_user_id: rsvObj.stroll_user_id
      }
   };

   //checkFn : the function to check the result of select query as needed condition
   function checkFn(err, rows, cb) {
      if (rows[0].status !== 'Pending'){
         err = new Error();
         err.status = 406;
         return cb(err);
      }
      else
         cb(null);
   }

   QueryFn.updateWithCheck(query, params, checkFn, function (err, result) {
      if (err) {
         if (err.status === 406){
            err.message = '요청중인 산책이 아닙니다.';
            return callback (err);
         } else {
            err.message = '산책 매칭에 실패했습니다.';
            return callback(err);
         }
      } else {
         callback(null);
      }

   });

}

function cancelReserveStatus(reqObj, callback) {
   let query = {
      selectQuery: 'select stroll_id, status, cast(aes_decrypt(reserve_dog_name, unhex(sha2(?, 512))) as char) as reserve_dog_name ' +
                   'from reservations ' +
                   'where reserve_id = ? and stroll_user_id = ? and reserve_user_id = ?',
      updateQuery: 'update reservations ' +
                   'set status = 3 ' +
                   'where reserve_id = ? and stroll_user_id = ? and reserve_user_id = ?',
   };
   let params = {
      selectParams: [aes_key, reqObj.reserve_id, reqObj.stroll_user_id, reqObj.reserve_user_id],
      updateParams: {
         reserve_id: reqObj.reserve_id,
         stroll_user_id: reqObj.stroll_user_id,
         reserve_user_id: reqObj.reserve_user_id
      }
   };

   function checkFn(err, rows, cb) {
      if(rows[0].status === 'Done' || rows[0].status === 'Canceled' || reqObj.reserve_dog_name !== rows[0].reserve_dog_name || rows[0].stroll_id !== reqObj.stroll_id) {
         err = new Error();
         return cb(err);
      } else {
         cb(null);
      }
   }

   QueryFn.updateWithCheck(query, params, checkFn, function (err) {
      if (err) {
         err.message = '예약된 산책 취소에 실패했습니다.';
         return callback(err);
      }
      callback(null);
   });

}

module.exports.reserveStroll = reserveStroll;
module.exports.selectSeaterReservList = selectSeaterReservList;
module.exports.selectUserReservList = selectUserReservList;
module.exports.updateReserveStatus = updateReserveStatus;
module.exports.cancelReserveStatus = cancelReserveStatus;