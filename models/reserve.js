let QueryFn = require('./queryFunction');
const aes_key = process.env.AES_KEY;
const defaultUserImgUrl = process.env.DEFAULT_USER_PROFILE_IMG_URL;

function reserveStroll(reserveData, callback) {
   //prepare query and params to check and then update and insert
   let query = {
      independent: {
         check: 'select case when points >= 10 then us.user_id else null end as pointCheck, st.user_id as strollCheck, rs.user_id as reservationCheck, stroll_user_id ' +
                'from users as us ' +
                'left join (select ? as user_id, stroll_user_id ' +
                '     from strolls ' +
                '     where stroll_id = ? and ? >= from_time and ? <= to_time) as st on (us.user_id = st.user_id) ' +
                'left join (select case when exists(select * ' +
                '     from reservations ' +
                '     where stroll_id = ? and ? < to_time and ? > from_time) ' +
                '     then null ' +
                '     else ? ' +
                '     end as user_id) as rs on (st.user_id = rs.user_id) ' +
                'where us.user_id = ?'
      },
      transaction: {
         update: 'update users ' +
                 'set points = points - 10 ' +
                 'where user_id = ?',
         insert: 'insert reservations (stroll_id, stroll_user_id, reserve_user_id, reserve_dog_name, from_time, to_time) ' +
                 'value (?, ?, ?, aes_encrypt(?, unhex(sha2(?, 512))), ?, ?)'
      }
   };
   let params = {
      independent: {
         check: [reserveData.reserve_user_id, reserveData.stroll_id, reserveData.from_time, reserveData.to_time,
            reserveData.stroll_id, reserveData.from_time, reserveData.to_time, reserveData.reserve_user_id, reserveData.reserve_user_id]
      },
      transaction: {
         update: [reserveData.reserve_user_id],
         insert: [reserveData.stroll_id, reserveData.stroll_user_id, reserveData.reserve_user_id,
                  reserveData.reserve_dog_name, aes_key, reserveData.from_time, reserveData.to_time]
      }
   };
   let processFn = {
      independent: {
         check: function(rows, fields, cb) {
            if (rows[0].pointCheck) {
               if (rows[0].strollCheck) {
                  if (rows[0].reservationCheck) {
                     if (rows[0].stroll_user_id === + reserveData.stroll_user_id) {
                        return cb();
                     } else {
                        let err = new Error();
                        err.status = 406;
                        err.errno = 1001;
                        return cb(err);
                     }
                  } else {
                     let err = new Error();
                     err.status = 406;
                     err.errno = 1002;
                     return cb(err);
                  }
               } else {
                  let err = new Error();
                  err.status = 406;
                  err.errno = 1003;
                  return cb(err);
               }
            } else {
               let err = new Error();
               err.status = 402;
               return cb(err);
            }
         }
      }
   };

   QueryFn.doIndependentQueriesThenDoTransactions(query, params, processFn, function (err, result) {
      if (err) {
         //if there is overlapped reservation return err with status code 400
         if (err.errno === 1452) {
            err.message = '매칭 요청한 반려견이 존재하지 않습니다.';
            err.status = 404;
            return callback(err);
         } else {
            switch (err.status) {
               case 402:
                  err.message = '산책 요청을 위한 포인트가 부족합니다.';
                  return callback(err);
               case 406:
                  switch  (err.errno) {
                     case 1001:
                        err.message = '시터 번호가 일치 하지 않습니다.';
                        return callback(err);
                     case 1002:
                        err.message = '중복된 예약 정보가 존재합니다.';
                        return callback(err);
                     case 1003:
                        err.message = '요청한 산책이 존재하지 않습니다.';
                        return callback(err);
                  }
               default:
                  err.message = '매칭 요청에 실패했습니다.';
                  return callback(err);
            }
         }
      } else {
         callback(null, result);
      }
   })
}

function selectSeaterReservList(reqSeater, callback) {
   // create query and params to serach list for searter's reservation list
   let selectQuery = 'select reserve_id, stroll_id, stroll_user_id, reserve_user_id, cast(aes_decrypt(reserve_dog_name, unhex(sha2(?, 512))) as char) as reserve_dog_name, ' +
                      'status,date_format(from_time, "%Y-%m-%d %H:%i:%S") as from_time, date_format(to_time, "%Y-%m-%d %H:%i:%S") as to_time, ' +
                      'cast(aes_decrypt(user_name, unhex(sha2(?, 512))) as char) as reserve_user_name, ifnull(profile_img_url, ?) as reserve_user_profile_img_url ' +
                      'from reservations as r left join users u on (r.reserve_user_id = u.user_id) ' +
                      'where stroll_user_id = ? ' +
                      'order by from_time desc ' +
                      'limit ?, ?';
   let selectParams = [aes_key, aes_key, defaultUserImgUrl, reqSeater.stroll_user_id, reqSeater.limit.former, reqSeater.limit.latter];

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
                     '        status, date_format(from_time, "%Y-%m-%d %H:%i:%S") as from_time, date_format(to_time, "%Y-%m-%d %H:%i:%S") as to_time, ' +
                     '        cast(aes_decrypt(user_name, unhex(sha2(?, 512))) as char) as stroll_user_name, profile_img_url as stroll_user_profile_img_url ' +
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
      independent: {
         check: 'select stroll_id, reserve_user_id, status, cast(aes_decrypt(reserve_dog_name, unhex(sha2(?, 512))) as char) as reserve_dog_name ' +
                'from reservations ' +
                 'where reserve_id = ? and (stroll_user_id = ? or reserve_user_id = ?)'
      },
      transaction: {
         updateReservations: 'update reservations ' +
                             'set status = 3 ' +
                             'where reserve_id = ? and (stroll_user_id = ? or reserve_user_id = ?)',
         updateUser: 'update users ' +
                     'set points = points + 10 ' +
                     'where user_id = ? '
      }
   };
   let params = {
      independent: {
         check: [aes_key, reqObj.reserve_id, reqObj.reqUser_id, reqObj.reqUser_id]
      },
      transaction: {
         updateReservations: [reqObj.reserve_id, reqObj.reqUser_id, reqObj.reqUser_id],
         updateUser: []
      }
   };
   let processFn = {
      independent: {
         check:   function (rows, fields, cb) {
            if (!rows[0]) {
               let err = new Error();
               err.status = 404;
            }
            if (rows[0].status === 'Done' || rows[0].status === 'Canceled') {
               let err = new Error();
               return cb(err);
            } else {
               params.transaction.updateUser = [rows[0].reserve_user_id];
               cb(null);
            }
         }
      }
   };

   QueryFn.doIndependentQueriesThenDoTransactions(query, params, processFn, function (err) {
      if (err) {
         switch (err.status) {
            case 404:
               err.message = '요청한 산책 정보가 존재 하지 않습니다.';
               return callback(err);
            default:
               err.message = '예약된 산책 취소에 실패했습니다.';
               return callback(err);
         }
      }
      callback(null);
   });

}

module.exports.reserveStroll = reserveStroll;
module.exports.selectSeaterReservList = selectSeaterReservList;
module.exports.selectUserReservList = selectUserReservList;
module.exports.updateReserveStatus = updateReserveStatus;
module.exports.cancelReserveStatus = cancelReserveStatus;