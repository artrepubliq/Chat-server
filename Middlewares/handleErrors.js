/**
 * 
 * @param {*} err is any error that arised in the server
 * @param {*} req http request object
 * @param {*} res http response object
 * @param {*} next http next function that needs to be executed 
 */
exports.handleError = (err, req, res, next) => {
    res.status(500).json({ status: false, error: err });
}

exports.responeseTime = (req, res, next) => {
    const localTime = new Date().getTime();
    next();
    res.on('finish', () => {
        console.log(`${req.method} ${req.originalUrl} ${(new Date().getTime() - localTime) / 1000} --sec`);
    });
}