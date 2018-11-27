const verifyJWTToken = require('./libs/JWT-Auth');

const verifyJWT_MW = (req, res, next) => {
    let token = req.header('Authorization');

    verifyJWTToken.verifyJWTToken(token)
        .then((decodedToken) => {
            req.JWT_TOKEN = decodedToken.data
            console.log(decodedToken.data);
            next()
        })
        .catch((err) => {
            res.status(400)
                .json({ message: "Invalid auth token provided." })
        })
}
exports.verifyJWT_MW = verifyJWT_MW;