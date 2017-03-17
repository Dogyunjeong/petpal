var dbPoolConfig = require('../config/aws_rds');
var mysql = require('mysql');
var logger = require('./logger');

var  dbPool = mysql.createPool(dbPoolConfig);

dbPool.on('release', function (conn) {
   logger.log('debug', 'Connection ' + conn.threadId +' is released');
   logger.log('debug', 'pool._allConnections.length:' + dbPool._allConnections.length);
   logger.log('debug', 'pool._acquiringConnections.length:' + dbPool._acquiringConnections.length);
   logger.log('debug', 'pool._freeConnections.length:' + dbPool._freeConnections.length);
});

module.exports = dbPool;