var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');



//const identification = require("../middleware/identification");

const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many requests, please try again later."
});
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/login', limiter, function(req, res, next) {

  
  const expires_in = 60*10 ; //10 minutes for bearer token
  const refresh_expires_in = 60 * 60 * 24; //24 hour for refresh token
  const exp = Math.floor(Date.now() / 1000) + expires_in;
  const refresh_exp = Math.floor(Date.now() / 1000) + refresh_expires_in;
  const bearerToken = jwt.sign({ exp }, process.env.JWT_SECRET);
  const refreshToken = jwt.sign({ exp: refresh_exp }, process.env.JWT_SECRET);

  // Retrieve email and password from req.body
  const email = req.body.email;
  const password = req.body.password;

  // Verify body
  if (!email || !password) {
    res.status(400).json({
      error: true,
      message: "Request body incomplete, both email and password are required"
    });
    return;
  }

  
  
  res.status(200).json({
    bearerToken:{
    token: bearerToken,
    token_type: "Bearer",
    expires_in
    },
    refreshToken:{
      token: refreshToken,
      token_type: "Refresh",
      refresh_expires_in
    }
  });
  

}, function(err, req, res, next) {
  if (err instanceof Error && err.name === "RateLimitExceededError") {
    // 返回429错误响应
    res.status(429).send("Too many requests, please try again later.");
  }
});

router.post('/register', function(req, res, next) { 
  // Retrieve email and password from req.body
  const email = req.body.email;
  const password = req.body.password;

  // Verify body
  if (!email || !password) {
    res.status(400).json({
      error: true,
      message: "Request body incomplete, both email and password are required"
    });
    return;
  }

  // Determine if user already exists in table
  const queryUsers = req.db.from("users").select("*").where("email", "=", email);
  queryUsers.then(users => {
    if (users.length > 0) {
      res.status(409).json({
        error: true,
        message: "User already exists"
      });
      return;
    }

    // Insert user into DB
    const saltRounds = 10;
    const hash = bcrypt.hashSync(password, saltRounds);
    return req.db.from("users").insert({ email, hash });
  })
  .then(() => {
    res.status(201).json({ success: true, message: "User created" });
  })
  .catch(e => {
    if (e instanceof Error && e.name === "RateLimitExceededError") {
      res.status(429).json({
        error: true,
        message: "Too many requests, please try again later."
      });
    } 
    else{
    res.status(500).json({ success: false, message: e.message });
    }
  });
    
});

router.post('/refresh', limiter, function(req, res, next) {
  const expires_in = 60*10 ; //10 minutes for bearer token
  const refresh_expires_in = 60 * 60 * 24; //24 hour for refresh token
  const exp = Math.floor(Date.now() / 1000) + expires_in;
  const refresh_exp = Math.floor(Date.now() / 1000) + refresh_expires_in;
  const bearerToken = req.body.refreshToken;
  const refreshToken = req.body.refreshToken;

// Verify body
if (!refreshToken) {
  res.status(400).json({
    error: true,
    message: "Request body incomplete, refresh token required"
  });
  return;
}
  
  res.status(200).json({
    bearerToken:{
    token: bearerToken,
    token_type: "Bearer",
    expires_in
    },
    refreshToken:{
      token: refreshToken,
      token_type: "Refresh",
      refresh_expires_in
    }
  });
},function(err, req, res, next) {
  if (err instanceof Error && err.name === "RateLimitExceededError") {
    // 返回429错误响应
    res.status(429).send("Too many requests, please try again later.");
  }else {
    // 返回401未授权错误响应
    res.status(401).json({
      error: true,
      message: "JWT token has expired"
    });
  }

});


router.post('/logout', limiter, function(req, res) {
  const refreshToken = req.body.refreshToken;

  // 检查 refreshToken 是否存在
  if (!refreshToken) {
    res.status(400).json({
      error: true,
      message: 'Request body incomplete, refresh token required'
    });
    return;
  }

  // 将 refreshToken 添加到黑名单（或执行其他逻辑）
  // ...

  // 返回成功响应
  res.status(200).json({
    error: false,
    message: 'Token successfully invalidated'
  });

}, function(err, req, res, next) {
  if (err instanceof Error && err.name === "RateLimitExceededError") {
    // 返回429错误响应
    res.status(429).send("Too many requests, please try again later.");
  }else{
    // 默认的 401 Unauthorized 错误处理
    res.status(401).json({
      error: true,
      message: 'JWT token has expired'
    });
  }

});


module.exports = router;
