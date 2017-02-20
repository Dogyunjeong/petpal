var dbPool = require('../common/dbPool');
var async = require('async');

// the function to get terms
function getTerms(callback) {
   // 1. create select_query
   let select_terms = "select * " +
                       "from terms";
   var resultData = {};
   // 2. get db connection and send query
   dbPool.getConnection(function (err, conn) {
      conn.query(select_terms, [], function (err, rows, fields) {
         conn.release();
         if (err) {
            err = new Error('약관 정보를 불러오는데 실패했습니다.');
            err.status = 500;
            return callback(err);
         }
         if (rows.length === 0 || rows.length !== 5) {
            err = new Error('약관 정보를 모두 불러오지 못 했습니다.');
            err.status = 500;
            return callback(err);
         }

         // 3. arrange data from db for data for res.send
         async.each(rows, function (row, eachNext) {
            resultData[row.title] = row.term;
            eachNext();
         }, function (err) {
            if (err) {
               err = new Error('약관 정보를 가공하는데 실패했습니다.');
               err.status = 500;
               return callback(err);
            }
            return callback(null, resultData);
         });
      });
   });
}

module.exports.getTerms = getTerms;



