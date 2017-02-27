var QueryFn = require('./queryFunction');
const aes_key = process.env.AES_KEY;

function postReview(reqReview, callback) {
   let inserQuery = 'insert reviews (reserve_id, stroll_id, stroll_user_id, reserve_user_id, reserve_dog_name, stars, content) ' +
                     'select reserve_id, stroll_id, stroll_user_id, reserve_user_id, reserve_dog_name, ?, ? from reservations where reserve_id = ? and reserve_user_id = ?';
   let insertParams = [reqReview.stars, reqReview.content, reqReview.reserve_id, reqReview.reserve_user_id];

   QueryFn.insertQueryFunction(inserQuery, insertParams, function (err, result) {
      if (err) {
         err.message = '리뷰 등록에 실패했습니다.';
         return callback(err);
      } else if (!result.affectedRows) {
         err = new Error('리뷰 등록에 실패했습니다.');
         return callback(err);
      } else {
         callback(null);
      }

   });
}

function getReview(reqData, callback) {
   let selectQuery = 'select reserve_user_id, cast(aes_decrypt(user_name, unhex(sha2(?, 512))) as char) as reserve_user_name, profile_img_url as reserve_user_profile_img_url, stars, content, assess_time ' +
                      'from reviews as r join users as u on (r.reserve_user_id = u.user_id) ' +
                      'where stroll_user_id = ?  order by assess_time desc limit ?, ?';

   let selectParams = [aes_key, reqData.stroll_user_id, reqData.limit.former, reqData.limit.latter];

   QueryFn.selectQueryFunction(selectQuery, selectParams, function (err, rows) {
      if (err)
         return callback(err);
      else
         callback(null, rows);
   });
}


module.exports.postReview = postReview;
module.exports.getReview = getReview;