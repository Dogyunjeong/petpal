var logger = require('../common/logger');

function incomingCheck(req, res, next) {
   logger.log('debug', 'access url :  %s %s', req.method, req.originalUrl);
   if (req.headers['Authentication'])
      logger.log(level, 'req.headers["content-length"]: %s', req.headers['Authentication']);
   if (Object.keys(req.params).length > 0)
      logger.log('debug', 'params     :  %j', req.params);
   if (Object.keys(req.body).length > 0)
      logger.log('debug', 'body       :  %j', req.body);
   if (Object.keys(req.query).length > 0)
      logger.log('debug', 'query     :  %j', req.query);
   if (req.file)
      logger.log('debug', 'file       :  %s', req.file.location);
   next();
}

function logSql(query) {
   logger.log('debug', '\t\t--------------------------------->>');
   logger.log('debug', '\t\tquery.value: %s', query.values);
   logger.log('debug', '\t\tquery.sql: %s', query.sql);
   if (query.results[0]) {  // sql 실행 시 에러가 없을 경우
      logger.log('debug', '\t\tquery._results[0].length: %d', query._results[0].length);
      logger.log('debug', '\t\tquery._results[0].affectedRows: %d', query._results[0].affectedRows);
      logger.log('debug', '\t\tquery._results[0].changedRows: %d', query._results[0].changedRows);
      logger.log('debug', '\t\tquery._results[0].insertId: %d', query._results[0].insertId);
      logger.log('debug', '\t\tquery._results[0].message: %d', query._results[0].message);
   } else {  // sql 실행시 에러가 발생할 경우
      let err = query._callback.arguments[0];
      logger.log('error', '\t\terr.errno: %d, err.message: %s', err.errno, err.message);
   }
}



module.exports.incomingCheck = incomingCheck;
module.exports.logSql = logSql;