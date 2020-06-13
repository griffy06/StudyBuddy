var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var reload = require('reload')
const passport = require('passport');
const config = require('./config/database');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const crypto = require('crypto');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');


mongoose.connect(config.database,{ useNewUrlParser: true , useUnifiedTopology: true });
db = mongoose.connection;

//check connection
db.once('open',function(){
  console.log('connected to mongodb');
});


//check for db errors
db.on('error',function(err){
  console.log(err);
});



var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var mainRouter = require('./routes/main');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));

//express session middleware
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}))

//express-messages middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

//express-validator middleware
app.use(expressValidator({
  errorFormatter: function (param,msg,value) {
    var namespace = param.split('.')
    , root = namespace.shift()
    , formParam = root;

    while (namespace.length){
      formParam += '[' + namespace.shift() + ']';
    }

    return {
      param: formParam,
      msg: msg,
      value: value
    }
  }
}))

app.use(methodOverride('_method'));

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended : true }));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//passport config
require('./config/passport')(passport);
// passport middleware
app.use(passport.initialize());
app.use(passport.session());


global.gfs;

db.once('open',()=>{
  //init stream
  global.gfs = Grid(db.db, mongoose.mongo);
  global.gfs.collection('uploads');
})

//create storage engine

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
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});
global.upload = multer({ storage });




app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/main', mainRouter);
app.use('/main/:id',mainRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  console.log(err);
  res.render('error');
});

module.exports = app;
//module.exports = db;
