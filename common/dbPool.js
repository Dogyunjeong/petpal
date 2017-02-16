var dbPoolConfig = require('../config/aws_rds');
var mysql = require('mysql');

var  dbPool = mysql.createPool(dbPoolConfig);

module.exports = dbPool;