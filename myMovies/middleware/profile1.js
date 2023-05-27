const jwt = require('jsonwebtoken');
module.exports = function (req, res, next) {

   
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader)
     {
        res.status(401).json({ error: true, message: "Authorization header ('Bearer token') not found" });
        return;
      }
   if (!authorizationHeader.startsWith('Bearer ') && authorizationHeader) {
     // if didn't provide Authorization header，return 401 Unauthorized error
     return res.status(401).json({ error: true, message: 'Authorization header is malformed' });
   }
    
    const token = req.headers.authorization.replace(/^Bearer /, "");
    try {
        jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
        if (e.name === "TokenExpiredError") {
            res.status(401).json({ error: true, message: "JWT token has expired" });
        } else {
            res.status(401).json({ error: true, message: "Invalid JWT token" });
        }
        return;
    }

    next();

};