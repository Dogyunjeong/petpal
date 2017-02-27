var dbPool = require('../common/dbPool');
var async = require('async');
var AWS = require('aws-sdk');
var s3Config = require('../config/aws_s3');
var logger = require('../common/logger');
var QueryFn = require('../models/queryFunction');

var aes_key = process.env.AES_KEY;
var s3Bucket = process.env.S3_BUCKET;

var S3 = new AWS.S3(s3Config);

function updateUserProfile(reqUser, callback) {
   // 1. create select_user and update_user
   let select_user_profile = 'select user_id, cast(aes_decrypt(user_name, unhex(sha2(?, 512))) as char) as user_name,' +
                             'cast(aes_decrypt(mobile, unhex(sha2(?, 512))) as char) as mobile, ' +
                              'age, gender, address, profile_img_url ' +
                             'from users ' +
                             'where user_id = ?';
   let update_user_profile = 'update users ' +
                              'set user_name=aes_encrypt(?, unhex(sha2(?, 512))), ' +
                              'mobile= aes_encrypt(?, unhex(sha2(?, 512))), age = ?, gender = ?, address = ?, profile_img_url = ? ' +
                              'where user_id = ?';

   // 2. get db conncetion
   dbPool.getConnection(function (err, conn) {
      // 3. create selectUser function(prepare update User data) and updateUser function
      function selectUserProfile(nextCallback) {
         conn.query(select_user_profile, [aes_key, aes_key, reqUser.user_id], function (err, rows) {
            if (err || rows.length === 0)
               return nextCallback(err);
            reqUser.user_id = rows[0].user_id;
            reqUser.prev_profile_img_url = rows[0].profile_img_url || null;
            async.eachOf(reqUser, function (key, prop, eachCallback) {
               if(!reqUser[prop])
                  reqUser[prop] = rows[0][prop];
               eachCallback(null);
            }, function (err) {
               if (err)
                  return nextCallback(err);
               nextCallback(null)
            });
         });
      }
      function updateUserProfile(nextCallback) {
         conn.query(update_user_profile, [reqUser.user_name, aes_key, reqUser.mobile, aes_key, reqUser.age, reqUser.gender, reqUser.address, reqUser.profile_img_url, reqUser.user_id], function (err, rows, fields) {
            if (err || rows.affectedRows !== 0)
               return nextCallback(err);
            nextCallback(null, rows[0]);
         });
      }
      // 4. start beginTransaction and use async.waterfall with functions of 3
      async.waterfall([selectUserProfile, updateUserProfile], function (err, result) {
         // 5. hnadle error
         if (err){
            conn.release();
            return callback(err);
         } else {
            // 7. call the callback(err, user) afterrelease connection
            conn.release();
            if (reqUser.prev_profile_img_url) {
               S3.deleteObject({
                  Bucket: s3Bucket,
                  Key: reqUser.prev_profile_img_url.split('com/')[1]
               }, function (err) {
                  if (err)
                     logger.log('info', 'Failed: delete S3 object in profile:', reqUser.prev_profile_img_url);
                  callback(null, reqUser);
               });
            }
         }
      });
   });
}

function selectUserbyKakaoId(kakao_id, callback) {
   let select_user = 'select user_id, cast(aes_decrypt(user_name, unhex(sha2(?, 512))) as char) as user_name,' +
                     'cast(aes_decrypt(mobile, unhex(sha2(?, 512))) as char) as mobile, ' +
                     'age, gender, address, profile_img_url, points ' +
                     'from users ' +
                     'where kakao_id = ?';

   dbPool.getConnection(function (err, conn) {
      conn.query(select_user, [aes_key, aes_key, kakao_id], function (err, rows) {
         conn.release();
         if (rows.length === 0)
            return callback(err);
         callback(null, rows[0]);
      });
   });
}

function selectUserbyUserId(user_id, callback) {
   let select_user = 'select user_id, cast(aes_decrypt(user_name, unhex(sha2(?, 512))) as char) as user_name, ' +
                     'cast(aes_decrypt(mobile, unhex(sha2(?, 512))) as char) as mobile,' +
                     'age, gender, address, profile_img_url ' +
                     'from users ' +
                     'where user_id = ?';

   dbPool.getConnection(function (err, conn) {
      conn.query(select_user, [aes_key, aes_key, user_id], function (err, rows) {
         conn.release();
         if (rows.length === 0)
            return callback(err);
         callback(null, rows[0]);
      });
   });
}

function selectRecievedPoints(reqData, callback) {
   let selectQuery = 'select type, create_time, points ' +
                      'from (select "stroll" as type, reserve_time as create_time, 10 as points ' +
                      'from reservations ' +
                      'where stroll_user_id = ? and status = "Done" ' +
                      'union all ' +
                      'select "post" as type, create_time, 1 as points ' +
                      'from articles ' +
                      'where user_id = ?) as points_list ' +
                      'order by create_time desc ' +
                      'limit ?, ?';
   let selectParams = [reqData.user_id, reqData.user_id, reqData.limit.former, reqData.limit.latter];

   QueryFn.selectQueryFunction(selectQuery, selectParams, function (err, rows) {
      if (err) {
         err.message = '적립 포인트 이력 조회에 실패했습니다.';
         return callback(err);
      } else {
         callback(null, rows);
      }
   });
}

function selectUsedPoints(reqData, callback) {
   let selectQuery = 'select "stroll" as type, reserve_time as create_time, 10 as points ' +
                     'from reservations ' +
                     'where reserve_user_id = ? and status = "Done" ' +
                     'order by create_time desc ' +
                     'limit ?, ?';
   let selectParams = [reqData.user_id, reqData.limit.former, reqData.limit.latter];

   QueryFn.selectQueryFunction(selectQuery, selectParams, function (err, rows) {
      if (err) {
         err.message = '차감 포인트 이력 조회에 실패했습니다.';
         return callback(err);
      } else {
         callback(null, rows);
      }
   });
}

function selectUserImgList(userList, callback) {
   let queryParts = {
      start: 'select user_id, profile_img_url, cast(aes_decrypt(user_name, unhex(sha2(?, 512))) as char) as user_name ' +
             'from users ',
      partsForCombine: {
         0: 'where user_id = ? ',
         repeated: 'or user_id = ? '
      },
      end:''
   };
   let paramParts = {
      start: [aes_key],
      partsForCombine: userList,
      end: []
   };
   QueryFn.makeQueryThenDo(queryParts, paramParts, function (err, rows) {
      if (err) {
         err.message = '회원들의 이미지, 이름 리스트를 불러오는데 실패했습니다.';
         return callback(err);
      } else {
         callback(null, rows);
      }
   });
}

module.exports.updateUserProfile = updateUserProfile;
module.exports.selectUserbyKakaoId = selectUserbyKakaoId;
module.exports.selectUserbyUserId = selectUserbyUserId;
module.exports.selectRecievedPoints = selectRecievedPoints;
module.exports.selectUsedPoints = selectUsedPoints;
module.exports.selectUserImgList = selectUserImgList;