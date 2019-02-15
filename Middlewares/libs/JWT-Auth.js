const jwt =  require('jsonwebtoken');

const verifyJWTToken = (token) => {
  return new Promise((resolve, reject) => {
    // console.log('tes');
    resolve(token);
    // jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
    //   if (err || !decodedToken) {
    //     return reject(err)
    //   }

    //   resolve(decodedToken)
    // })
  })
}
exports.verifyJWTToken = verifyJWTToken;