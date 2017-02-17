var dbPool = require('../common/dbPool');
var async = require('async');
var AWS = require('aws-sdk');
var s3Config = require('../config/aws_s3');
var logger = require('../common/logger');

var aes_key = process.env.AES_KEY;
var s3Bucket = process.env.S3_BUCKET;

var S3 = new AWS.S3(s3Config);

function updateUserProfile(reqUser, callback) {
   // 1. create select_user and update_user
   var select_user_profile = 'select user_id, cast(aes_decrypt(user_name, unhex(sha2(?, 512))) as char) as user_name,' +
                             'cast(aes_decrypt(mobile, unhex(sha2(?, 512))) as char) as mobile, ' +
                              'age, gender, address, profile_img_url ' +
                             'from users ' +
                             'where user_id = ?';
   var update_user_profile = 'update users ' +
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
            if (err || rows.affectedRows === 0)
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
                     logger.log('info', 'Failed: delete S3 object:', reqUser.prev_profile_img_url);
                  callback(null, reqUser);
               });
            }
         }
      });
   });
}

function selectUserbyKakaoId(kakao_id, callback) {
   var select_user = 'select user_id, cast(aes_decrypt(user_name, unhex(sha2(?, 512))) as char) as user_name,' +
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
   var select_user = 'select user_id, cast(aes_decrypt(user_name, unhex(sha2(?, 512))) as char) as user_name, ' +
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
module.exports.updateUserProfile = updateUserProfile;
module.exports.selectUserbyKakaoId = selectUserbyKakaoId;
module.exports.selectUserbyUserId = selectUserbyUserId;