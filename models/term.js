var dbPool = require('../common/dbPool');
var async = require('async');

// the function to get notices
function getNotices(callback) {
   // 1. create select_query
   let select_terms = "select * " +
                       "from notices";
   var resultData = {};
   // 2. get db connection and send query
   dbPool.getConnection(function (err, conn) {
      conn.query(select_terms, [], function (err, rows, fields) {
         conn.release();
         if (err) {
            err = new Error('공지상항을 불러오는데 실패했습니다.');
            err.status = 500;
            return callback(err);
         }

         return callback(null, resultData);
      });
   });
}

module.exports.getNotices = getNotices;



