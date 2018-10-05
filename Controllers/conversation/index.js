const conversationsRouter = require('express').Router();
const { conversationApiController } = require('./conversation.controller.api');

conversationsRouter.post('/', conversationApiController.readMessageThreads);
conversationsRouter.post('/testupdatemany', conversationApiController.testUpdateMessageReceipt);

module.exports = { conversationsRouter };