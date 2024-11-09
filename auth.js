module.exports.authMiddleware = function (req, res, next) {
    const key = req.headers['authorization'];
    if (key == '4327a0f2d9cf3094fb43dd456ad24d27') {
        next();
    } else {
        res.sendStatus(403)
    }
}