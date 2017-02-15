var dbPool = require('../common/dbPool');
var async = require('async');

function findUserAndCreate(profile, callback) {
   var user = {};
   user.id =123;
   callback(null, user);
}

module.exports.findUserAndCreate = findUserAndCreate;