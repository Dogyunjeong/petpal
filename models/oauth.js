var dbPool = require('../common/dbPool');
var async = require('async');

function authorizeKakao(kakao_id, kakao_token, callback) {
   var user = {};
   user.kakao_id = kakao_id;
   user.kakao_token = kakao_token;
   callback(null, user);
}

function findKakaoUserAndCreate(reqUser, callback) {
   // 1. create select_user query, update_user query and insert_user query
   var select_user_for_check = 'select user_id ' +
                                'from users ' +
                                'where kakao_id = ?';
   var update_user_kakao_info = 'update users ' +
                                 'set kakao_token = ?, profile_img_url = ? ' +
                                 'where user_id = ?';
   var insert_user_kakao_info = 'insert into users (kakao_id, kakao_token, profile_img_url) ' +
                                 'values (?, ?, ?)';
   var queryData = {};


   // 2. create findUserAndCheck function, insertKakaoUser and updateKakaoUser function

   // 3. get db connection and use async.waterfall for functions of 2
   dbPool.getConnection(function (err, conn) {
      if (err)
         return next(err);

      function findUserAndCheck(nextCallback) {
         conn.query(select_user_for_check, [reqUser.kakao_id ], function (err, rows, fields) {
            if (err) {
               return nextCallback(err);
            }
            if(rows.length === 1){
               queryData.query = update_user_kakao_info;
               queryData.parameters = [reqUser.kakao_token, reqUser.kakao_img_url, rows[0].user_id];
               return nextCallback(null, queryData);
            } else {
               // if user is not exist, set user.reqJoinFlag = 1 or null
               reqUser.reqJoinFlag = 1;
               queryData.query = insert_user_kakao_info;
               queryData.parameters = [reqUser.kakao_id, reqUser.kakao_token, reqUser.kakao_img_url];
               return nextCallback(null, queryData);
            }
         });
      }

      function insertOrUpdateUser(queryData, nextCallback) {
         conn.query(queryData.query, queryData.parameters, function (err, rows) {
            if (err || rows.affectedRows == 0)
               return nextCallback(err);
            nextCallback(null, reqUser);
         });
      }

      async.waterfall([findUserAndCheck, insertOrUpdateUser], function (err) {
         conn.release();

         // 4. handle the error
         if (err) {
            err = new Error('KAKAO 정보를 최신화 하는데 실패했습니다.');
            return callback(err);
         } else {
            // 5. call the callback(null, user)
            callback(null, reqUser);
         }
      });
   });




}

module.exports.authorizeKakao = authorizeKakao;
module.exports.findKakaoUserAndCreate = findKakaoUserAndCreate;