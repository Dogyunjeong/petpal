var dbPool = require('../common/dbPool');
var async = require('async');
var QueryFn = require('./queryFunction');

var logging =require('../common/logging');
const aes_key = process.env.AES_KEY;

function findUserAndCreateByKakao(profile, callback) {
   let reqJoinFlag = null;
   let query = {
      selectQuery: 'select user_id, age ' +
                   'from users ' +
                   'where kakao_id = ?',
      insertQuery: 'insert users (kakao_id, kakao_token) ' +
                   'values (?, ?)',
      updateQuery: 'update users ' +
                   'set kakao_token = ? ' +
                   'where user_id = ?'
   };
   let params = {
      selectParams: [profile.id],
      insertParams: [profile.id, profile.accessToken],
      updateParams: [profile.accessToken]
   };
   function process(rows, cb) {
      params.updateParams.push(rows[0].user_id);
      rows[0].age ? reqJoinFlag = null : reqJoinFlag = rows[0].user_id;
      cb();
   }

   QueryFn.insertIfNotExistOrUpdate(query, params, process, function (err, result) {
      var user = {};
      if (err) {
         return callback(err);

         //check it is updated or not. if result === 0, it is updated.
      } else if (result === 0) {
         user = {
            user_id: params.updateParams[1],
            kakao_id: profile.id
         };
         return callback(null, user, reqJoinFlag ? reqJoinFlag : null);
      } else {
         user = {
            user_id: result.insertId,
            kakao_id: profile.id
         };
         return callback(null, user, result.insertId);
      }
   });
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
               reqUser.user_id = rows[0].user_id;
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
         conn.query(queryData.query, queryData.parameters, logging.logSql, function (err, rows) {
            if (err || rows.affectedRows == 0)
               return nextCallback(err);
            if (rows.insultId)
               reqUser.user_id = rows.insultId;
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

function findUser(user_id, callback) {
   var select_user_for_check = 'select user_id, kakao_id ' +
                               'from users ' +
                               'where user_id = ?';
   dbPool.getConnection(function (err, conn) {
      conn.query(select_user_for_check, user_id, function (err, rows) {
         conn.release();
         if (rows.length === 0) {
            err = new Error('로그인 실패');
            return callback(err);
         }
         callback(null, rows[0]);
      });
   });
}



module.exports.findUserAndCreateByKakao = findUserAndCreateByKakao;
module.exports.findKakaoUserAndCreate = findKakaoUserAndCreate;
module.exports.findUser = findUser;