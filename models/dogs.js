var dbPool = require('../common/dbPool');
var async = require('async');
var aes_key = process.env.AES_KEY;
var logger = require('../common/logger');


function insert(insertQuery, insertParams, callback) {
   dbPool.getConnection(function (err, conn) {
      if (err)
         return callback(err);
      conn.query(insertQuery, insertParams, function (err, result) {
         conn.release();
         if (err || !result) {
            return callback(err);
         }
         callback(null, result)
      });
   });
}



function insertDogProfile (reqDog, callback) {
   var insert_dog_profile_query =
      'insert into pet_dogs (user_id, dog_name, dog_gender, dog_age, dog_type, dog_weight, dog_profile_img_url, dog_neutralized, dog_characters, dog_significants) ' +
      'values (?, aes_encrypt(?, unhex(sha2(?, 512))), ?, ?, ?, ?, ?, ?, ?, ?)';
   var insert_dog_profile_params = [
      reqDog.user_id, reqDog.dog_name, aes_key, reqDog.dog_gender, reqDog.dog_age, reqDog.dog_type,
      reqDog.dog_weight, reqDog.dog_profile_img_url, reqDog.dog_neutralized, reqDog.dog_characters, reqDog.dog_significants
   ];
   insert(insert_dog_profile_query, insert_dog_profile_params, function (err, result) {
      if (err) {
         // 중복된 반려견 이름이 존재할 경우에 대한 err 처리
         if (err.code === "ER_DUP_ENTRY") {
            err = new Error("중복된 이름의 반려견이 존재합니다.");
            err.status = 400;
            return callback(err);
         } else {
            err.message = "반려견 정보 등록에 실패했습니다.";
            return callback(err);
         }
      } else if (result.affectedRows !==1) {
            logger.log('info', 'Unexpected insert DogProfile error :  %j', reqDog);
            return callback(err);
      } else {
         //err 가 없을경우 reqDog 과 result를 반환
         reqDog.result = result;
         callback(null, reqDog);
      }
   });
}

function getDogProfile(reqUser_id, callback) {
   //TODO create select_dog_profile query and select_dog_params
}


module.exports.insertDogProfile = insertDogProfile;
module.exports.getDogProfile = getDogProfile;