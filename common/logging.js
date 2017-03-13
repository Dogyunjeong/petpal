let logger = require('./logger');

function logRequest(env) {
   return function(req, res, next) {
      let level = (env === 'development') ? 'debug': 'info';
      logger.log(level, '------------------------------------>>');
      logger.log(level, 'req.protocol: %s', req.protocol);
      logger.log(level, 'req.headers["content-type"]: %s', req.headers['content-type']);
      logger.log(level, 'req.headers["content-length"]: %s', req.headers['content-length']);
      logger.log(level, 'req.headers["cookie"]: %s', req.headers['cookie']);
      logger.log(level, '%s %s', req.method, req.originalUrl);
      next();
   };
}

function logRequestParams() {
   return function(req, res, next) {
      // let level = (req.app.get('env') === 'development') ? 'debug': 'info';
      let level = (process.env.MODE === 'development') ? 'debug': 'info';
      logger.log(level, '\treq.query: %j', req.query, {});
      logger.log(level, '\treq.body: %j', req.body, {});
      logger.log(level, '\treq.file: %j', req.file, {});
      logger.log(level, '\treq.files: %j', req.files, {});
      next();
   };
}

function logSql(query) {
   logger.log('debug', '\t\t------------------------------------>>');
   logger.log('debug', '\t\tquery.values: %s', query.values);
   logger.log('debug', '\t\tquery.sql: %s', query.sql);
   if (query._results[0]) { // sql 실행 시 에러가 없을 경우
      logger.log('debug', '\t\tquery._results[0].length: %d', query._results[0].length);
      logger.log('debug', '\t\tquery._results[0].affectedRows: %d', query._results[0].affectedRows);
      logger.log('debug', '\t\tquery._results[0].changedRows: %d', query._results[0].changedRows);
      logger.log('debug', '\t\tquery._results[0].insertId: %d', query._results[0].insertId);
      logger.log('debug', '\t\tquery._results[0].message: %s', query._results[0].message);
   } else { // sql 실행 시 에러가 발생할 경우
      let err = query._callback.arguments[0];
      // logger.log('error', '\t\tquery._callback.arguments[0]: %j', query._callback.arguments[0], {});
      logger.log('error', '\t\terr.errno: %d, err.message: %s', err.errno, err.message);
   }
   return null;
}

module.exports.logRequest = logRequest;
module.exports.logRequestParams = logRequestParams;
module.exports.logSql = logSql;
