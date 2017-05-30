/**
 * Created by T on 2017-03-14.
 */
let multer = require('multer');
let multerS3 = require('multer-s3');
let AWS = require('aws-sdk');
let s3Config = require('../config/aws_s3');
const s3Bucket =  process.env.S3_BUCKET;
const s3Acl = process.env.S3_ACL;
let S3 = new AWS.S3({
   region : s3Config.region,
   accessKeyId: s3Config.accessKeyId,
   secretAccessKey: s3Config.secretAccessKey
});

function uploadToS3(path) {
   let upload = multer({
      storage: multerS3({
         s3: S3,
         bucket: s3Bucket,
         acl: s3Acl,
         contentType: multerS3.AUTO_CONTENT_TYPE,
         metadata: function (req, file, cb) {
            cb(null, {fieldName: file.fieldname});
         },
         key: function (req, file, cb) {
            cb(null, path + Date.now().toString() + file.originalname);
         }
      })
   });
   return upload;
}

module.exports = uploadToS3;