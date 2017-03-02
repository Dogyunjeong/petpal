var dbPool = require('./../common/dbPool');
var async = require('async');

function eachOfQueryFunction(queries, params, callback) {
   dbPool.getConnection(function (err, conn) {
      if (err)
         return callback(err);
      else if (Object.keys(queries).length = 1) {
         conn.query(queries, params, function (err, result) {
            conn.release();
            if (err || !result) {
               return callback(err);
            }
            callback(null, result)
         });
      } else {
         conn.beginTransaction(function (err) {
            if (err)
               return callback(err);
            function iterateQuery(value, key, cb) {
               conn.query(value, params[key], function (err, rows) {
                  if (err)
                     cb
               });
            }
            async.eachOf(query, iterateQuery,  )

         });
      }

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

//check the ./dog.js deleteQueryFunction
function deleteQueryFunction(deleteQuery, deleteParams, callback) {
   // get db connection
   dbPool.getConnection(function (err, conn) {
      // delete info from table
      conn.query(deleteQuery, deleteParams, function (err, rows, fileds) {
         conn.release();
         if (err)
            return callback(err);
         if (rows.affectedRows === 0) {
            err = new Error();
            err.status = 400;
            return callback(err)
         } else {
            callback(null)
         }
      });
   });

}

function insertWithCheckNotExist(query, params, callback) {
   // 1. DB 커넥션 획득
   dbPool.getConnection(function (err, conn) {
      if (err)
         return callback(err);
      // 2. Begin Transaction to rollback if there is result of selectQuery
       function checkFunction(cb) {
         selectQueryFunction(query.selectQuery, params.selectParams, function (err, rows) {
            if (err)
               return cb(err);
            if(rows.length) {
               err = new Error();
               err.status = 400;
               cb(err, rows);
            } else {
               cb(null, null);
            }
         });
      }

      function insertFunction(cb) {
         eachOfQueryFunction(query.insertQuery, params.insertParams, function (err, result) {
            if (err)
               return cb(err);
            cb(null, result);
         });
      }

      function seriesCallback(err, result) {
         // 4. If selectQueryFunction returns result and there is an error, rollback. and send err
         if (err) {
            conn.rollback(function () {
               conn.release();
               return callback(err, result.one);
            });
         } else {
            // 5. Otherwise commit then release and send result of insert
            conn.commit(function () {
               conn.release();
               callback(null, result.two);
            });
         }
      }
      // 3. Use async.parallel to select and insert.
      async.series({ one: checkFunction, two: insertFunction }, seriesCallback);

   });
}

function insertIfNotExistOrUpdate(query, params, processFn, callback) {
   // 1. DB 커넥션 획득
   dbPool.getConnection(function (err, conn) {
      if (err)
         return callback(err);
      // 2. Begin Transaction to rollback if there is result of selectQuery
      function checkExistingWithSelect(cb) {
         conn.query(query.selectQuery, params.selectParams, function (err, rows) {
            if (err)
               return cb(err);
            else if(rows.length) {
               processFn(rows, function () {
                  cb(null, 'update');
               });
            } else {
               cb(null, 'insert');
            }
         });
      }

      function insertOrUpdate(checkResult, cb) {
         if (checkResult === 'insert'){
            conn.query(query.insertQuery, params.insertParams, function (err, result) {
               if (err)
                  return cb(err);
               cb(null, result);
            });
         } else {
            conn.query(query.updateQuery, params.updateParams, function (err, rows) {
               if (err)
                  return cb(err);
               else if (rows.affectedRows !== 1) {
                  err = new Error();
                  return cb(err);
               } else {
                  cb(null, 0);
               }
            });
         }
      }

      function waterfallCallback(err, result) {
         if (err) {
            return callback(err);
         } else {
            callback(null, result);
         }
      }
      // 3. Use async.parallel to select and insert.
      async.waterfall([checkExistingWithSelect, insertOrUpdate], waterfallCallback);

   });
}


function updateWithCheckNotExist(query, params, callback) {
   dbPool.getConnection(function (err, conn) {
      if (err)
         return callback(err);

      //Check there is overlap the stroll except the requested one
      function check(cb) {
         conn.query(query.selectForCheckQuery, params.selectForCheckParams, function (err, rows) {
            if (err)
               return cb(err);
            if (rows.length) {
               err = new Error();
               err.status = 400;
               return cb(err, rows);
            } else {
               cb(null, null);
            }
         });
      }

      function updateAfterMerge(cb) {
         //Create function to use for async.waterfall.
         let updateParams = [];
         function selectQueryForUpdate(nextCallback) {
            conn.query(query.selectQuery, params.selectParams, function (err, rows) {
               if (err)
                  return cb(err);
               if (rows.length !== 1){
                  err = new Error();
                  err.status = 400;
                  return cb(err);
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
            conn.query(query.updateQuery, updateParams, function (err, rows) {
               if (err || rows.affectedRows !== 1)
                  return nextCallback(err);
               nextCallback(null, updateParams);
            });
         }
         if (err)
            return cb(err);
         async.waterfall([selectQueryForUpdate, updateQueryAfterSelect], function (err, updateParams) {
            conn.release();
            if (err)
               return cb(err);
            cb(null, updateParams);
         });

      }

      function lastCallback(err, result) {
         if (err) {
            if (err.status = 400) {
               return callback(err, result.one);
            } else {
               return callback(err);
            }
         } else {
            callback(null, result.two);
         }
      }
      async.parallel({one: check , two: updateAfterMerge }, lastCallback);
   });
}

function makeQueryThenDo(queryParts, paramParts, callback) {
   let query = queryParts.start;
   let params = paramParts.start;

   function iterateFn(value, key, cb) {
      if (value) {
         query += queryParts.partsForCombine[key] || queryParts.partsForCombine.repeated;
         params.push(value);
         cb()
      } else {
         cb()
      }
   }
   function lastCb(err) {
      if (err)
         return callback(err);
      query += queryParts.end;
      params = params.concat(paramParts.end);
      dbPool.getConnection(function (err, conn) {
         if (err)
            return callback(err);
         conn.query(query, params, function (err, rows, fields) {
            conn.release();
            if (err)
               return callback(err);
            callback(null, rows, fields);
         });
      });
   }
   async.eachOf(paramParts.partsForCombine, iterateFn, lastCb )
}

function updateWithCheck(query, params, checkFn, callback) {
   dbPool.getConnection(function (err, conn) {
      if (err)
         return callback(err);

      //Create function to use for async.waterfall.
      let updateParams = [];
      function selectQueryForUpdate(nextCallback) {
         conn.query(query.selectQuery, params.selectParams, function (err, rows) {
            if (err)
               return nextCallback(err);
            if (rows.length !== 1){
               err = new Error();
               err.status = 400;
               return nextCallback(err);
            } else {
               //use check function and the do the task in the call back of check function
               checkFn(err, rows, function (err) {
                  if (err)
                     return nextCallback(err);
                  params.prevParams = rows[0];
                  // set the parameters which is not exist in request params
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
               });

            }
         });
      }
      //Create update function for async.waterfall.
      function updateQueryAfterSelect(updateParams, nextCallback) {
         conn.query(query.updateQuery, updateParams, function (err, rows) {
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



module.exports.eachOfQueryFunction = eachOfQueryFunction;
module.exports.selectQueryFunction = selectQueryFunction;
module.exports.updateQueryFunction = updateQueryFunction;
module.exports.deleteQueryFunction = deleteQueryFunction;
module.exports.insertIfNotExistOrUpdate=insertIfNotExistOrUpdate;
module.exports.insertWithCheckNotExist = insertWithCheckNotExist;
module.exports.updateWithCheckNotExist = updateWithCheckNotExist;
module.exports.updateWithCheck = updateWithCheck;
module.exports.makeQueryThenDo = makeQueryThenDo;