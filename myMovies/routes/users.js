var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/login', function(req, res, next) {
  const expires_in = 60 * 60 * 24;
  const exp = Math.floor(Date.now() / 1000) + expires_in;
  const token = jwt.sign({ exp }, process.env.JWT_SECRET);
  res.status(200).json({
    token,
    token_type: "Bearer",
    expires_in
  });
});

module.exports = router;
