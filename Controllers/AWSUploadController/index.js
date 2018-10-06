const uploadFileRouter = require('express').Router();
const { conversationApiController } = require('./uploadController');
const { uploadFileController } = require('./uploadController');
const awsUplaod = require('../../Middlewares/AWSUpload');

uploadFileRouter.post('/', awsUplaod.AWSUpload.any(), uploadFileController);

module.exports = { uploadFileRouter };