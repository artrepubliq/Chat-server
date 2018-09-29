const conversationsRouter = require('express').Router();
const { conversationApiController } = require('./conversation.controller.api');

conversationsRouter.post('/', conversationApiController.readMessageThreads);

module.exports = { conversationsRouter };