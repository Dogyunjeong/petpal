var AWS = require('aws-sdk');

var s3Config = require('../config/aws_s3');
var dbPool = require('../common/dbPool');
var logger = require('../common/logger');
var QueryFn = require('../common/queryFunction');

var S3 = new AWS.S3(s3Config);

const aes_key = process.env.AES_KEY;

function insertArticle(reqArticle, callback) {
   let insertQuery = 'insert into articles(user_id, image_url, content, art_pos) ' +
                      'values(?, ?, ?, POINT(?, ?))';
   let insertParams = [reqArticle.user_id, reqArticle.image_url, reqArticle.content, reqArticle.position.long, reqArticle.position.lat];

   QueryFn.insertQueryFunction(insertQuery, insertParams, function (err, result) {
      if (err)
         return callback(err);
      if (result.affectedRows !== 1) {
         err = new Error('게시글 작성에 실패하였습니다.');
         return callback(err);
      } else {
         reqArticle.art_id = result.insertId;
         callback(null);
      }
   });
}

function selectArticles(reqData, callback) {
   let selectQuery =
      'select art.art_id, art.user_id, create_time, image_url, content, lat, longitude as "long", count(l.user_id) as likes, cast(aes_decrypt(user_name, unhex(sha2(?, 512))) as char) as user_name, profile_img_url ' +
      'from (select art_id, user_id, create_time, image_url, content, st_y(art_pos) as "lat", st_x(art_pos) as "longitude" ' +
      '      from articles ' +
      '      where mbrcontains(envelope(linestring(' +
      '            point(round((? + (? / abs(cos(radians(?)) * 111.2))), 6), round((?+(?/111)), 6)), ' +
      '            point(round((? - (? / abs(cos(radians(?)) * 111.2))), 6), round((?-(?/111)), 6)))), art_pos) ' +
      '      order by create_time ' +
      '      limit ?, ?) as art ' +
      '      left outer join users as u on (art.user_id = u.user_id) ' +
      '      left outer join likes as l on (art.art_id = l.art_id) ' +
      'where l.art_id = art.art_id';
   let selectParams = [aes_key, reqData.long, reqData.distance, reqData.lat, reqData.lat, reqData.distance, reqData.long, reqData.distance, reqData.lat, reqData.lat, reqData.distance, reqData.limit.former, reqData.limit.latter];

   QueryFn.selectQueryFunction(selectQuery, selectParams, function (err, rows, fields) {
      if (err)
         return callback(err);
      callback(null, rows);
   })
}

function selectArticlesById(reqData, callback) {

}

module.exports.insertArticle = insertArticle;
module.exports.selectArticles = selectArticles;
module.exports.selectArticlesById = selectArticlesById;