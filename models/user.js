var dbPool = require('../common/dbPool');
var async = require('async');
var aes_key = process.env.AES_KEY;

function updateUserProfile(reqUser, callback) {
   // 1. create select_user and update_user
   var select_user_profile = 'select user_id, cast(aes_decrypt(user_name, unhex(sha2(?, 512))) as char) as user_name, mobile, age, gender, address, profile_img_url ' +
                             'from users ' +
                             'where kakao_id = ?';
   var update_user_profile = 'update users ' +
                              'set user_name=aes_encrypt(?, unhex(sha2(?, 512))), mobile= ?, age = ?, gender = ?, address = ?, profile_img_url = ? ' +
                              'where user_id = ?';
   var resUser

   // 2. get db conncetion
   dbPool.getConnection(function (err, conn) {
      // 3. create selectUser function(prepare update User data) and updateUser function
      function selectUserProfile(nextCallback) {
         conn.query(select_user_profile, [aes_key, reqUser.kakao_id], function (err, rows) {
            if (err || rows.length === 0)
               return nextCallback(err);
            reqUser.user_id = rows[0].user_id;
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
         conn.query(update_user_profile, [reqUser.user_name, aes_key, reqUser.mobile, reqUser.age, reqUser.gender, reqUser.address, reqUser.profile_img_url, reqUser.user_id], function (err, rows, fields) {
            if (err || rows.affectedRows === 0)
               return nextCallback(err);
            nextCallback(null, rows[0]);
         });
      }
      // 4. use async.waterfall with functions of 3
      async.waterfall([selectUserProfile, updateUserProfile], function (err, result) {
         // 5. release db connection
         conn.release();
         // 6. hnadle error
         if (err){
            return callback(err);
         }
         // 7. call the callback(err, user)
         callback(null, reqUser);
      });
   });



}

module.exports.updateUserProfile = updateUserProfile;