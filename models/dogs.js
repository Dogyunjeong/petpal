var dbPool = require('../common/dbPool');
var async = require('async');
var logger = require('../common/logger');

const aes_key = process.env.AES_KEY;


function insertQueryFunction(insertQuery, insertParams, callback) {
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

// create selectQueryFunction
function selectQueryFunction(selectQuery, selectParams, callback) {
   // get db connection
   dbPool.getConnection(function (err, conn) {
      // handle error from get db connection
      if (err)
         return callback(err);\
      //send query through conncetion
      conn.query(selectQuery, selectParams, function (err, rows, fields) {
         // release connection
         conn.release();
         // hand err from seding query
         if (err)
            return callback(err);
         // call the callback
         callback(null, rows);
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
   insertQueryFunction(insert_dog_profile_query, insert_dog_profile_params, function (err, result) {
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
   //TODO 1. create select_dog_profile query and select_dog_params
   let
   //TODO 2. Use selectQueryFunction with query and params of 1
   //TODO 3. handle error and call the callback
}


module.exports.insertDogProfile = insertDogProfile;
module.exports.getDogProfile = getDogProfile;