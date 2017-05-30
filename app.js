//TODO 주석을 주석답게 반드시 달 것 2017-03-15 09:00:00 전까지
let express = require('express');
let path = require('path');
let logger = require('morgan');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let session = require('express-session');
let passport = require('passport');
let redis = require('redis');
let redisClient = redis.createClient();
let RedisStore = require('connect-redis')(session);

//application middleware
let index = require('./routes/index');
let oauth = require('./routes/oauth');
let notices = require('./routes/notices');
let users = require('./routes/users');
let dogs = require('./routes/dogs');
let articles = require('./routes/articles');
let seaters = require('./routes/seaters');
let reserves = require('./routes/reserves');
let reviews = require('./routes/reviews');
let reports = require('./routes/reports');

//to check https and  logged in or not
let mySecurity = require('./common/security');
//winston logger to get error stack and message before respond
let winstonlogger = require('./common/logger');
let logging = require('./models/logging');

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// session configuration
app.use(session({
   secret: process.env.SECRET_KEY,
   store: new RedisStore({
      host: process.env.REDIS_HOST,
      port: + process.env.REDIS_PORT || 6379,
      client: redisClient
   }),
   resave: true,
   saveUninitialized: false,
   cookie: {
      path: '/',     // path별 쿠키를 남길때
      httpOnly: true,      // Http 통신만으로 쿠키를 변경 할 수 있음
      secure: true,        // HTTPS일때만 쿠키를 전달
      maxAge: 1000 * 60 * 60 * 24 * 30 }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, 'public')));

//collect incoming data METHOD, base url, bodies, params and queries when req doesn't include file or files
app.use(logging.incomingCheck);
app.use(mySecurity.isSecure);

app.use('/', index);
// app.use('/notices', notices);

app.use('/oauth', oauth);
//below stacks need logged in request
app.use(mySecurity.isLoggedIn);

app.use('/users',  users);
app.use('/dogs', dogs);
app.use('/articles', articles);
app.use('/seaters', seaters);
app.use('/reserves', reserves);
app.use('/reviews', reviews);
app.use('/reports', reports);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  //when error is occurred, leave log with whole of err object.
  winstonlogger.log('debug', '-------ERROR----------ERROR----------ERROR----------ERROR---');
  winstonlogger.log('debug', '------Error is occurred :  %j', err);
  // render the error page
  res.status(err.status || 500);
  res.json({
     error: err.message
  });
});

module.exports = app;
