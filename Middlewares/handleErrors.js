/**
 * 
 * @param {*} err is any error that arised in the server
 * @param {*} req http request object
 * @param {*} res http response object
 * @param {*} next http next function that needs to be executed 
 * handles internal server errors
 */
exports.handleError = (err, req, res, next) => {
    // console.log(err, 10)
    res.status(500).send({ status: false, error: err });
}
/**
 * 
 * @param {*} req http request object
 * @param {*} res http response object
 * Handles 404 page not found error
 */
exports.handle404Error = (req, res) => {
    res.status(404).send({ status: 404, data: 'URL not found' });
}
/**
 * 
 * @param {*} req http request object
 * @param {*} res http response object
 * @param {*} next 
 * this logs the http request methods and the response time in console
 */
exports.responeseTime = (req, res, next) => {
    const localTime = new Date().getTime();
    next();
    res.on('finish', () => {
        // console.log(`${req.method} ${req.originalUrl} ${(new Date().getTime() - localTime) / 1000} --sec`);
        // console.log('----------------------------------------------------------')
    });
}