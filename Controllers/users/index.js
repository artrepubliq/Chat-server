const userRouter = require('express').Router();
const { getUsers } = require('./user.controller');

userRouter.get('/', getUsers);

module.exports = { userRouter };