var express = require('express');
var router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
let User = require('../models/user')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/register', function (req,res,next) {
  res.render('register');
})

router.post('/register', function(req,res){
  const name = req.body.name;
  const email = req.body.email;
  const username = req.body.username;
  const password = req.body.password;
  //const confirm = req.body.confirm;

  let newUser = new User({
    name:name,
    email:email,
    username:username,
    password:password
  });

  bcrypt.genSalt(10, function (err,salt) {
    bcrypt.hash(newUser.password,salt,function (err,hash){
      if(err)
      {
        console.log(err);
      }
      else
      {
        newUser.password=hash;
        newUser.save(function (err) {
          if(err)
          {
            console.log(err);
          }
          else
          {
            req.flash('success','Successfully registered!');
            res.redirect('/');
          }
        });
      }
    });
  });
});

router.get('/login', function (req,res,next) {
  res.render('login');
})

router.post('/login', function (req,res,next) {
  passport.authenticate('local',{
    successRedirect:'/main',
    failureRedirect:'/login',
     failureFlash: true

  })(req,res,next);
})

router.get('/logout', function (req,res,next) {
  req.logout();
  req.flash('success', 'Logged out!')
  res.redirect('/');
})

module.exports = router;
