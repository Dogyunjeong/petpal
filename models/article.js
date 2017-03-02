// const AWS = require('aws-sdk');

// const s3Config = require('../config/aws_s3');
var dbPool = require('../common/dbPool');
var logger = require('../common/logger');
var QueryFn = require('./queryFunction');

// const S3 = new AWS.S3(s3Config);

const aes_key = process.env.AES_KEY;

function insertArticle(reqArticle, callback) {
   let query = {
      insertArticle: 'insert into articles(user_id, image_url, content, art_pos) ' +
                     'values(?, ?, ?, POINT(?, ?))',
      updatePoint: 'update users ' +
                   'set points = points + 1 '+
                   'where user_id= ? '
   };
   let param = {
      insertArticle: [reqArticle.user_id, reqArticle.image_url, reqArticle.content, reqArticle.position.long, reqArticle.position.lat],
      updatePoint: [reqArticle.user_id]
   };

   QueryFn.eachOfQueryFunction(query, param, function (err, result) {
      if (err)
         return callback(err);
      if (result.length === 0) {
         err = new Error('게시글 작성에 실패하였습니다.');
         return callback(err);
      } else {
         reqArticle.art_id = result[0].insertId;
         callback(null);
      }
   });
}

function selectArticles(reqData, callback) {
   let selectQuery =
      'select art.art_id, art.user_id, create_time, image_url, content, lat, longitude as "long", num_likes, cast(aes_decrypt(user_name, unhex(sha2(?, 512))) as char) as user_name, profile_img_url ' +
      'from (select art_id, user_id, create_time, image_url, content, st_y(art_pos) as "lat", st_x(art_pos) as "longitude", num_likes ' +
      '      from articles ' +
      '      where mbrcontains(envelope(linestring(' +
      '            point(round((? + (? / abs(cos(radians(?)) * 111.2))), 6), round((?+(?/111.2)), 6)), ' +
      '            point(round((? - (? / abs(cos(radians(?)) * 111.2))), 6), round((?-(?/111.2)), 6)))), art_pos) ' +
      '      limit ?, ?) as art ' +
      '      left outer join users as u on (art.user_id = u.user_id) ' +
      'order by art_id desc';
   let selectParams = [aes_key, reqData.long, reqData.distance, reqData.lat, reqData.lat, reqData.distance, reqData.long, reqData.distance, reqData.lat, reqData.lat, reqData.distance, reqData.limit.former, reqData.limit.latter];

   QueryFn.selectQueryFunction(selectQuery, selectParams, function (err, rows) {
      if (err)
         return callback(err);
      callback(null, rows);
   })
}

function selectArticlesByUserId(reqData, callback) {
   let selectQuery = 'select art_id, image_url, create_time ' +
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

function selectArticlesById(reqArt_id, callback) {
   let select_query = 'select art.art_id, art.user_id, create_time, image_url, content, lat, longitude as "long", num_likes, ' +
                       'cast(aes_decrypt(user_name, unhex(sha2(@aes_key, 512))) as char) as user_name, profile_img_url ' +
                       'from (select art_id, user_id, create_time, image_url, content, st_y(art_pos) as "lat", st_x(art_pos) as "longitude", num_likes ' +
                       'from articles ' +
                       'where art_id = ?) as art left outer join users as u on (art.user_id = u.user_id)';
   let select_params = [reqArt_id];

   QueryFn.selectQueryFunction(select_query, select_params, function (err, row) {
      if (err)
         return callback(err);
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

module.exports.insertArticle = insertArticle;
module.exports.selectArticles = selectArticles;
module.exports.selectArticlesByUserId = selectArticlesByUserId;
module.exports.selectArticlesById = selectArticlesById;
module.exports.likeArticleById = likeArticleById;
module.exports.unlikeArticleById = unlikeArticleById;