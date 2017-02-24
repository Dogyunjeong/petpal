var QueryFn = require('./queryFunction');

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


module.exports.postReview = postReview;