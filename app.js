var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var app = express();
var IS_DEV = app.get('env') === 'development';

if (!IS_DEV) {
  var fs = require('fs');
  fs.writeFileSync('private.json', process.env.FIREBASE);
}

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/users', require('./routes/users'))
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({
  message: err.message,
  error: IS_DEV ? err : {}
  });
});

module.exports = app;
