var winstonlogger = require('../common/logger');

function incomingCheck(req, res, next) {
   winstonlogger.log('debug', 'access url :  %s %s', req.method, req.originalUrl);
   if (Object.keys(req.params).length > 0)
      winstonlogger.log('debug', 'params     :  %j', req.params);
   if (Object.keys(req.body).length > 0)
      winstonlogger.log('debug', 'body       :  %j', req.body);
   if (Object.keys(req.query).length > 0)
      winstonlogger.log('debug', 'query     :  %j', req.query);
   if (req.file)
      winstonlogger.log('debug', 'file       :  %s', req.file.location);
   next();
}

module.exports = incomingCheck;