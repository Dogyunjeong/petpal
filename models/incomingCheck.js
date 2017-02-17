var winstonlogger = require('../common/logger');

function incominbCheck(req, res, next) {
   winstonlogger.log('debug', 'access url :  %s', req.originalUrl);
   if (Object.keys(req.params).length > 0)
      winstonlogger.log('debug', 'params     :  %j', req.params);
   if (Object.keys(req.body).length > 0)
      winstonlogger.log('debug', 'body       :  %j', req.body);
   if (req.file)
      winstonlogger.log('debug', 'file       :  %s', req.file.location);
   next();
}

module.exports = incominbCheck;