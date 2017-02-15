var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var isSecure = require('./common/security').isSecure;
var winstonlogger = require('./common/logger');

var index = require('./routes/index');
var users = require('./routes/users');
var auth = require('./routes/auth');
var terms = require('./routes/terms');
var dogs = require('./routes/dogs');
var posts = require('./routes/posts');
var seaters = require('./routes/seaters');
var reserves = require('./routes/reserves');
var reviews = require('./routes/reviews');
var reports = require('./routes/reports');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
  winstonlogger.log('debug', 'access url :  %s', req.originalUrl);
  if (Object.keys(req.params).length > 0)
      winstonlogger.log('debug', 'params     :  %j', req.params);
  if (Object.keys(req.body).length > 0)
      winstonlogger.log('debug', 'body       :  %j', req.body);
  next();
});

app.use(isSecure);

app.use('/', index);

app.use('/terms', terms);
app.use('/auth', auth);

app.use('/users', users);
app.use('/dogs', dogs);
app.use('/posts', posts);
app.use('/seaters', seaters);
app.use('/reserves', reserves);
app.use('/reviews', reviews);
app.use('/reports', reports);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({
     error: {
        message: err.message,
        status: err.status || 500
     }
  });
});

module.exports = app;
