var dbPool = require('./../common/dbPool');

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

//params.updateParams는 입력된 정보가 존재하고 select 쿼리를 지나면서 업데이트할 모든 정보를 포함하게 된다.
function updateQueryFunction(query, params, callback) {
   //Create function to use for async.waterfall.
   let updateParams = [];
   dbPool.getConnection(function (err, conn) {
      function selectQueryForUpdate(nextCallback) {
         conn.query(query.selectQuery, params.selectParams, function (err, rows, fields) {
            if (err)
               return callback(err);
            if (rows.length !== 1){
               err = new Error();
               err.status = 400;
               return callback(err);
            } else {
               params.prevParams = rows[0];
               async.eachOf(params.updateParams, function (value, prop, next) {
                  if (value) {
                     updateParams.push(value)
                  } else {
                     updateParams.push(rows[0][prop]);
                     params.updateParams[prop] = rows[0][prop];
                  }
                  next();
               }, function (err) {
                  if (err)
                     return nextCallback(err);
                  nextCallback(null, updateParams);
               });
            }
         });
      }
      //Create update function for async.waterfall.
      function updateQueryAfterSelect(updateParams, nextCallback) {
         conn.query(query.updateQuery, updateParams, function (err, rows, fields) {
            if (err || rows.affectedRows !== 1)
               return nextCallback(err);
            nextCallback(null, updateParams);
         });
      }
      if (err)
         return callback(err);
      async.waterfall([selectQueryForUpdate, updateQueryAfterSelect], function (err, updateParams) {
         conn.release();
         if (err)
            return callback(err);
         callback(null, updateParams);
      });
   });
}

function deleteQueryFunction(query, params, callback) {
   // get db connection
   dbPool.getConnection(function (err, conn) {
      // select and save pre info before delete
      conn.query(query.selectQuery, params.selectParams, function (err, rows, fields) {
         if (err)
            return callback(err);
         if (rows.length !== 1) {
            err = new Error();
            err.status = 400;
            return callback(err);
         } else {
            params.prevParams = rows[0];
         }
      });
      // delete info from table
      conn.query(query.deleteQuery, params.deleteParams, function (err, rows, fileds) {
         conn.release();
         if (err)
            return callback(err);
         callback(null)
      });
   });

}

module.exports.insertQueryFunction = insertQueryFunction;
module.exports.selectQueryFunction = selectQueryFunction;
module.exports.updateQueryFunction = updateQueryFunction;
module.exports.deleteQueryFunction = deleteQueryFunction;