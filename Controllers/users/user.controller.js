const { usersModel } = require('../../schema/users/users')

module.exports = {
    /**
     * this is to get the list of users
     */
    getUsers: async (req, res, next) => {
        const userData = await usersModel.find({})
        res.status(200).json({ result: userData, error: false });
    }
}