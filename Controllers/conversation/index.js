
// const verifyJWT_MW = require('../../Middlewares/JWT-Middleware');
// conversationsRouter.all('*', verifyJWT_MW.verifyJWT_MW)
const conversationsRouter = require('express').Router();
const { conversationApiController } = require('./conversation.controller.api');

conversationsRouter.post('/', conversationApiController.readMessageThreads);
// conversationsRouter.post('/testupdatemany', conversationApiController.testUpdateMessageReceipt);
conversationsRouter.post('/getunreadmessagesbyuserid', conversationApiController.getUnReadMessagesByUserId);
// conversationsRouter.get('/test', function(req, res) {
//     // pass the csrfToken to the view
//     res.render('send', { test:'test'})
//   })
module.exports = { conversationsRouter };