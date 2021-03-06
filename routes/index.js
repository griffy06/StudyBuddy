var express = require('express');
var router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
let User = require('../models/user')
const crypto = require('crypto');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');
const config = require('../config/database');
var path = require('path');
let metadata;

const storage = new GridFsStorage({
  url: config.database,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads',
          //  metadata: metadata?metadata:null
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
      //req.flash('danger', 'Only images are allowed as file types!');
      return callback(new Error('Only images are allowed'))
    }
    callback(null, true);
  }
}).single('pic');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/register', function (req,res,next) {
  res.render('register');
})

router.post('/register', function(req,res) {
  upload(req,res, function (err) {
    if (err) {
      req.flash('danger', 'Only images are allowed as file types!');
      return res.redirect('/register');
    } else {
      const name = req.body.name;
      const email = req.body.email;
      const username = req.body.username;
      const password = req.body.password;
      const confirm = req.body.confirm;
      req.checkBody('confirm', 'Passwords do not match').equals(req.body.password);
      let errors = req.validationErrors();
      if(errors){
        req.flash('danger', 'Passwords do not match');
        if (req.file!==undefined){
        gfs.remove({_id: req.file.id, root: 'uploads'}, function (err, gridStore) {
          if (err) console.log(err);
        })}
        return res.render('register');
      }
      var pic;
      if(req.file!==undefined) {
        pic = req.file.id;
      }
      else
      {
        pic=null;
      }
      console.log(pic);
      let newUser = new User({
        name: name,
        email: email,
        username: username,
        password: password,
        pic: pic
      });
        bcrypt.genSalt(10, function (err, salt) {
          bcrypt.hash(newUser.password, salt, function (err, hash) {
            if (err) {
              console.log(err);
            } else {
              newUser.password = hash;
              User.find({username:newUser.username},{},function(err,user){
                if(err){
                  console.log(err);
                }
                else if(user.length>=1){
                  req.flash('danger', 'User Already Exists!');
                  if (req.file!==undefined){
                    gfs.remove({_id: req.file.id, root: 'uploads'}, function (err, gridStore) {
                      if (err) console.log(err);
                    })}
                  return res.redirect('/register');
                }
                else if(password.length<8){
                  req.flash('danger', 'Password must be minimum 8 characters.');
                  if (req.file!==undefined){
                    gfs.remove({_id: req.file.id, root: 'uploads'}, function (err, gridStore) {
                      if (err) console.log(err);
                    })}
                  return res.redirect('/register');
                }
                else{
                  newUser.save(function (err) {
                    if (err) {
                      console.log(err);
                    } else {
                      req.flash('success', 'Successfully registered... Kindly Login!');
                      res.redirect('/login');
                    }
                  });
                }
              })
            }
          });
        });
    }
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
