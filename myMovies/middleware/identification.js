

module.exports=function authenticateLogin(req, res, next) {
  
  // 执行登录验证
  knex('users')
    .where('email', req.body.email)
    .first()
    .then(user => {
      if (!user) {
        res.status(401).json({ error: true, message: "Incorrect email or password" });
        return;
      }

      // 使用bcrypt比较密码
      bcrypt.compare(req.body.password, user.password, (err, isMatch) => {
        if (err) {
          res.status(500).json({ error: true, message: "An error occurred while processing the request" });
          return;
        }

        if (!isMatch) {
          res.status(401).json({ error: true, message: "Incorrect email or password" });
          return;
        }

        next();
      });
    })
    .catch(err => {
      res.status(500).json({ error: true, message: "An error occurred while processing the request" });
    });
}


