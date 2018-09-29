const { usersModel } = require('../../schema/users/users');
const { handleError } = require('../../Middlewares/handleErrors')

module.exports = {
    /**
     * this is to get the list of users
     */
    getUsers: async (req, res, next) => {
        try {
            const userData = await usersModel.find({});
            res.status(200).send({ result: userData, error: false });
        } catch (error) {
            handleError(error, req, res);
        }
    }
}