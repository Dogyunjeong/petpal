var async = require('async');
var AWS = require('aws-sdk');

var dbPool = require('../common/dbPool');
var logger = require('../common/logger');
var s3Config = require('../config/aws_s3');

var S3 = new AWS.S3(s3Config);

const s3Bucket = process.env.S3_BUCKET;
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

// create queryFunction
function queryFunction(selectQuery, selectParams, callback) {
   // get db connection
   dbPool.getConnection(function (err, conn) {
      // handle error from get db connection
      if (err)
         return callback(err);
      //send query through connection
      conn.query(selectQuery, selectParams, function (err, rows, fields) {
         // release connection
         conn.release();
         // hand err from sent query
         if (err)
            return callback(err);
         // call the callback
         callback(null, rows, fields);
      });
   });
}

function updateQueryFunction(query, params, callback ) {
   //Create function to use for async.waterfall.

}



function insertDogProfile (reqDog, callback) {
   var insert_dog_profile_query =
      'insert into pet_dogs (user_id, dog_name, dog_gender, dog_age, dog_type, dog_weight, dog_profile_img_url, dog_neutralized, dog_characters, dog_significants) ' +
      'values (?, aes_encrypt(?, unhex(sha2(?, 512))), ?, ?, ?, ?, ?, ?, ?, ?)';
   var params_for_insert_dog_profile = [
      reqDog.user_id, reqDog.dog_name, aes_key, reqDog.dog_gender, reqDog.dog_age, reqDog.dog_type,
      reqDog.dog_weight, reqDog.dog_profile_img_url, reqDog.dog_neutralized, reqDog.dog_characters, reqDog.dog_significants
   ];
   insertQueryFunction(insert_dog_profile_query, params_for_insert_dog_profile, function (err, result) {
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

function selectUserDogsProfile(reqUserId, callback) {
   // 1. create select_dog_profile query and select_dog_params
   let select_dog_profile = 'select user_id, cast(aes_decrypt(dog_name, unhex(sha2(?, 512))) as char) as dog_name, ' +
                            'dog_gender, dog_age, dog_type, dog_weight, dog_profile_img_url, ' +
                            'dog_neutralized, dog_characters, dog_significants ' +
                            'from pet_dogs ' +
                            'where user_id = ?';
   let params_for_select_dog_profile = [aes_key, reqUserId];
   //TODO 2. Use queryFunction with query and params of 1
   queryFunction(select_dog_profile, params_for_select_dog_profile, function (err, rows) {
      if (err)
         return callback(err);
      callback(null, rows);
   });
   //TODO 3. handle error and call the callback

}

function selectDogProfile(reqDog, callback) {
   let selectQuery = 'select cast(aes_decrypt(dog_name, unhex(sha2(?, 512))) as char) as dog_name, ' +
                     'dog_gender, dog_age, dog_type, dog_weight, dog_profile_img_url, ' +
                     'dog_neutralized, dog_characters, dog_significants ' +
                     'from pet_dogs ' +
                    'where user_id = ? and dog_name = aes_encrypt(?, unhex(sha2(?, 512)))';
   let  selectParams = [aes_key, reqDog.user_id, reqDog.dog_name, aes_key];

   queryFunction(selectQuery, selectParams, function (err, row) {
      if (err)
         return next(err);
      callback(null, row);
   })

}

function updateDogProfile(reqDog, callback) {
   //TODO 1. create update query and params for update
   let query = {
      selectQuery: 'select cast(aes_decrypt(dog_name, unhex(sha2(?, 512))) as char) as dog_name, ' +
                   'dog_gender, dog_age, dog_type, dog_weight, dog_profile_img_url, ' +
                   'dog_neutralized, dog_characters, dog_significants ' +
                   'from pet_dogs ' +
                   'where user_id = ? and dog_name = aes_encrypt(?, unhex(sha2(?, 512)))',
      updateQuery: 'update pet_dogs ' +
                   'set dog_name = aes_encrypt(?, unhex(sha2(?, 512))), ' +
                   'dog_gender = ?, dog_age = ?, dog_type = ?, dog_weight = ?, dog_profile_img_url = ?, dog_neutralized = ?, ' +                   'dog_characters =  ?, dog_significants = ? ' +
                   'where user_id = ? and dog_name = aes_encrypt(?, unhex(sha2(?, 512)))'
   };
   let params = {
      selectParams: [aes_key, reqDog.user_id, reqDog.prev_dog_name, aes_key],
      updateParams: null,
      prevPhotos: null
   };
   var updateDog = {};

   //TODO 2. updateQuery

   dbPool.getConnection(function (err, conn) {
      function selectQueryForUpdate(nextCallback) {
         conn.query(query.selectQuery, params.selectParams, function (err, rows, fields) {
            if (err)
               return callback(err);
            if (rows.length !== 1){
               err = new Error("해당 반려견이 존재 하지 않습니다.");
               err.status = 400;

               return callback(err);
            } else {
               async.eachOf(reqDog, function (value, prop, next) {
                  value ? updateDog[prop] = value : updateDog[prop] = rows[0][prop];
                  next();
               }, function (err) {
                  if (err)
                     return nextCallback(err);
                  params.updateParams = [updateDog.dog_name, aes_key, updateDog.dog_gender, updateDog.dog_age, updateDog.dog_type, updateDog.dog_weight,
                                        updateDog.dog_profile_img_url, updateDog.dog_neutralized, updateDog.dog_characters, updateDog.dog_significants,
                                        updateDog.user_id, updateDog.prev_dog_name, aes_key];
                  nextCallback(null, updateDog);
               });
            }
         });
      }
      //Create update function for async.waterfall.
      function updateQueryAfterSelect(updateDog, nextCallback) {
         conn.query(query.updateQuery,  params.updateParams, function (err, rows, fields) {
            if (err || rows.affectedRows !== 1)
               return nextCallback(err);
            nextCallback(null, updateDog);
         });
      }
      if (err)
         return callback(err);
      async.waterfall([selectQueryForUpdate, updateQueryAfterSelect], function (err, updateDog) {
         conn.release();
         if (err)
            return callback(err);
         updateDog.prev_dog_name = null;
         callback(null, updateDog);
      });
   });
   //TODO 3. handle the err and callback(null, result)
}

function deleteDogProfile(reqDog, callback) {
   let deleteQuery = 'delete ' +
      'from pet_dogs ' +
      'where user_id = ? and dog_name = aes_encrypt(?, unhex(sha2(?, 512)))';
   let deleteParams = [reqDog.user_id, reqDog.dog_name, aes_key];

   queryFunction(deleteQuery, deleteParams, function (err, row) {
      if (err || row.affectedRows !== 1) {
         err = new Error("반려견 정보 삭제에 실패했습니다.");
         return callback(err);
      }

      callback(null, row);
   });

}


module.exports.insertDogProfile = insertDogProfile;
module.exports.selectUserDogsProfile = selectUserDogsProfile;
module.exports.updateDogProfile = updateDogProfile;
module.exports.selectDogProfile = selectDogProfile;
module.exports.deleteDogProfile = deleteDogProfile;