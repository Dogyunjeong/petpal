let dbPool = require('../common/dbPool');
let logger = require('../common/logger');
let QueryFn = require('./queryFunction');


const aes_key = process.env.AES_KEY;
const defaultUserImgUrl = process.env.DEFAULT_USER_PROFILE_IMG_URL;

function insertArticle(reqArticle, callback) {
   let query = {
      insertArticle: 'insert into articles(user_id, image_url, content, art_pos) ' +
                     'values(?, ?, ?, POINT(?, ?))',
      updatePoint: 'update users ' +
                   'set points = points + 1 '+
                   'where user_id= ? '
   };
   let param = {
      insertArticle: [reqArticle.user_id, reqArticle.image_url, reqArticle.content, reqArticle.position.pos_long, reqArticle.position.pos_lat],
      updatePoint: [reqArticle.user_id]
   };

   QueryFn.eachOfQueryFunction(query, param, function (err, result) {
      if (err){
         err.message = '게시글 작성에 실패하였습니다.';
         return callback(err);
      }
      if (result.length === 0) {
         err = new Error('게시글 작성에 실패하였습니다.');
         return callback(err);
      } else {
         reqArticle.art_id = result[0].insertId;
         callback(null);
      }
   });
}

function deleteArticle(reqData, callback) {
   let deleteQuery = 'delete from articles where art_id = ? and user_id = ?';
   let deleteParam = [reqData.art_id, reqData.user_id];

   QueryFn.deleteQueryFunction(deleteQuery, deleteParam, callback);
}

function selectArticles(reqData, callback) {
   let selectQuery =
      'select art.art_id, art.user_id, date_format(create_time, "%Y-%m-%d %H:%i:%S") as create_time, image_url, content, pos_lat, ' +
      '       pos_long, num_likes, ifnull(liked, 0) as liked, cast(aes_decrypt(user_name, unhex(sha2(?, 512))) as char) as user_name, ' +
      '       ifnull(profile_img_url, ?) as user_profile_img_url, num_stroll ' +
      'from (select art_id, user_id, create_time, image_url, content, st_y(art_pos) as "pos_lat", st_x(art_pos) as "pos_long", num_likes ' +
      '      from articles ' +
      '      where mbrcontains(envelope(linestring(' +
      '            point(round((? + (? / abs(cos(radians(?)) * 111.2))), 6), round((?+(?/111.2)), 6)), ' +
      '            point(round((? - (? / abs(cos(radians(?)) * 111.2))), 6), round((?-(?/111.2)), 6)))), art_pos)' +
      '      order by art_id desc ' +
      '      limit ?, ?) as art ' +
      'left outer join users as u on (art.user_id = u.user_id) ' +
      'left outer join (select 1 as liked, art_id ' +
      '                from likes  ' +
      '                where user_id = ?) as li on (art.art_id = li.art_id) ' ;
   let selectParams = [aes_key, defaultUserImgUrl, reqData.pos_long, reqData.distance, reqData.pos_lat, reqData.pos_lat, reqData.distance, reqData.pos_long,
      reqData.distance, reqData.pos_lat, reqData.pos_lat, reqData.distance, reqData.limit.former, reqData.limit.latter, reqData.user_id];

   QueryFn.selectQueryFunction(selectQuery, selectParams, function (err, rows) {
      if (err)
         return callback(err);
      callback(null, rows);
   })
}

function selectArticlesForMap(reqData, callback) {
   let selectQuery =
      'select art.art_id, art.user_id, pos_lat, pos_long, cast(aes_decrypt(user_name, unhex(sha2(?, 512))) as char) as user_name, ' +
      '       ifnull(profile_img_url, ?) as user_profile_img_url, age, gender, num_stroll ' +
      'from (select art_id, user_id, st_y(art_pos) as "pos_lat", st_x(art_pos) as "pos_long" ' +
      '      from articles ' +
      '      where mbrcontains(envelope(linestring(' +
      '            point(round((? + (? / abs(cos(radians(?)) * 111.2))), 6), round((?+(?/111.2)), 6)), ' +
      '            point(round((? - (? / abs(cos(radians(?)) * 111.2))), 6), round((?-(?/111.2)), 6)))), art_pos) ' +
      '      order by art_id desc ' +
      '      limit ?, ?) as art ' +
      'left outer join users as u on (art.user_id = u.user_id) ';
   let selectParams = [aes_key, defaultUserImgUrl, reqData.pos_long, reqData.distance, reqData.pos_lat, reqData.pos_lat, reqData.distance, reqData.pos_long, reqData.distance,
      reqData.pos_lat, reqData.pos_lat, reqData.distance, reqData.limit.former, reqData.limit.latter, reqData.user_id];

   QueryFn.selectQueryFunction(selectQuery, selectParams, function (err, rows) {
      if (err)
         return callback(err);
      callback(null, rows);
   })
}

function selectArticlesByUserId(reqData, callback) {
   let selectQuery = 'select art_id, image_url ' +
                      'from articles ' +
                      'where user_id = ? ' +
                      'order by art_id desc ' +
                      'limit ?, ?';
   let selectParams = [reqData.user_id, reqData.limit.former, reqData.limit.latter];

   QueryFn.selectQueryFunction(selectQuery, selectParams, function (err, rows) {
      if (err)
         return callback(err);
      callback(null, rows);
   })
}
//TODO limit setting
function selectArticlesById(reqData, callback) {
   let select_query = 'select art.art_id, art.user_id, date_format(create_time, "%Y-%m-%d %H:%i:%S") as create_time, image_url, content, pos_lat, pos_long, num_likes, ifnull(liked, 0) as liked,' +
                       'cast(aes_decrypt(user_name, unhex(sha2(?, 512))) as char) as user_name, ifnull(profile_img_url, ?) as user_profile_img_url, num_stroll ' +
                       'from (select art_id, user_id, create_time, image_url, content, st_y(art_pos) as "pos_lat", st_x(art_pos) as "pos_long", num_likes ' +
                       '      from articles ' +
                       '      where art_id = ?) as art ' +
                       '     left outer join users as u on (art.user_id = u.user_id) ' +
                       '     left outer join (select 1 as liked, art_id ' +
                       '                       from likes  ' +
                       '                       where user_id = ? and art_id = ? ) as li on (art.art_id = li.art_id) ';
   let select_params = [aes_key, defaultUserImgUrl, reqData.art_id, reqData.user_id, reqData.art_id];

   QueryFn.selectQueryFunction(select_query, select_params, function (err, row) {
      if (err){
         err.message = '개인 타임라인 목록을 가져오는데 실패하였습니다.';
         return callback(err);
      }
      if (row.length !== 1){
         err = new Error();
         return callback(err);
      }
      callback(null, row);

   });
}

function likeArticleById(reqData, callback) {
   let query = {
      insertForLikes: 'insert likes (user_id, art_id) ' +
                      'value (?, ?) ',
      updateForArticles: 'update articles ' +
                         'set num_likes = num_likes + 1 ' +
                         'where art_id = ?'
   };
   let params = {
      insertForLikes: [reqData.user_id, reqData.art_id],
      updateForArticles: [reqData.art_id]
   } ;
   QueryFn.eachOfQueryFunction(query, params, function (err, result) {
      if (err) {
         err.message = '좋아요에 실패했습니다.';
         return callback(err);
      } else if (result.length !== 0) {
         return callback(null);
      } else {
         err = new Error('Unexpected Error');
         return callback(err);
      }

   });
}

function unlikeArticleById(reqData, callback) {
   let query = {
      insertForLikes: 'delete ' +
                      'from likes ' +
                      'where user_id = ? and art_id = ?',
      updateForArticles: 'update articles ' +
                         'set num_likes = num_likes - 1 ' +
                         'where art_id = ?'
   };
   let params = {
      insertForLikes: [reqData.user_id, reqData.art_id],
      updateForArticles: [reqData.art_id]
   } ;
   QueryFn.eachOfQueryFunction(query, params, function (err, result) {
      if (err) {
         err.message = '좋아요 취소에 실패했습니다.';
         return callback(err);
      } else if (result.length !== 0) {
         return callback(null);
      } else {
         err = new Error('Unexpected Error');
         return callback(err);
      }

   });
}

module.exports.insertArticle = insertArticle;
module.exports.deleteArticle = deleteArticle;
module.exports.selectArticles = selectArticles;
module.exports.selectArticlesForMap = selectArticlesForMap;
module.exports.selectArticlesByUserId = selectArticlesByUserId;
module.exports.selectArticlesById = selectArticlesById;
module.exports.likeArticleById = likeArticleById;
module.exports.unlikeArticleById = unlikeArticleById;

