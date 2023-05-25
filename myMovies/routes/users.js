var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
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

router.post('/register', function(req, res, next) { 
  // Retrieve email and password from req.body
  const email = req.body.email;
  const password = req.body.password;

  // Verify body
  if (!email || !password) {
    res.status(400).json({
      error: true,
      message: "Request body incomplete - email and password needed"
    });
    return;
  }

  // Determine if user already exists in table
  const queryUsers = req.db.from("users").select("*").where("email", "=", email);
  queryUsers.then(users => {
    if (users.length > 0) {
      throw new Error("User already exists");
    }

    // Insert user into DB
    const saltRounds = 10;
    const password = bcrypt.hashSync(password, saltRounds);
    return req.db.from("users").insert({ email, password });
  })
  .then(() => {
    res.status(201).json({ success: true, message: "User created" });
  })
  .catch(e => {
    res.status(500).json({ success: false, message: e.message });
  });
    
});

module.exports = router;
