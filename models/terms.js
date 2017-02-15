var dbPool = require('../common/dbpool');
var async = require('async');

// the function to get terms
function getTerms(callback) {
   //TODO 1. create select_query
   let select_terms = "select * " +
                       "from terms";
   let resultData = {};
   //TODO 2. get db connection and send query
   dbPool.getConnection(function (err, conn) {
      conn.query(select_terms, [], function (err, rows, fields) {
         conn.release();
         if (err) {
            let  err = new Error('약관 정보를 불러오는데 실패했습니다.');
            err.statusCode = 500;
            return callback(err);
         }
         if (!rows.length === 5) {
            let  err = new Error('약관 정보를 모두 불러오지 못 했습니다.');
            err.statusCode = 500;
            return callback(err);
         }
         async.each(rows, function (row, eachNext) {
            resultData[row.title] = row.term;
            eachNext();
         }, function (err) {
            if (err) {
               let  err = new Error('약관 정보를 가공하는데 실패했습니다.');
               err.statusCode = 500;
               return callback(err);
            }
            callback(null, resultData);
         });
      });
      //TODO 3. arrange data from db for data for res.send
   })
}

module.exports.getTerms = getTerms;

