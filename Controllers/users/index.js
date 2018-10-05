const userRouter = require('express').Router();
const { usersController } = require('./user.controller');

userRouter.get('/', usersController.getUsers);
userRouter.post('/getcount', usersController.getCount);

module.exports = { userRouter };