const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
AWS.config.update({
  
  region: ''
});

const s3 = new AWS.S3({});
console.log("Reached AWS...");

const AWSUpload = multer({
      storage: multerS3({
        s3: s3,
        bucket: 'flujo-chat',
        acl: 'public-read',
        contentDisposition: 'attachment',
        serverSideEncryption: 'AES256',
        
        metadata: function (req, file, cb) {
          cb(null, {fieldName: file.fieldname});
        },
        key: function (req, file, cb) {
          cb(null, Date.now().toString())
        }
      }) 
});
exports.AWSUpload = AWSUpload;
