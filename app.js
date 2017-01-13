const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const IS_DEV = app.get('env') === 'development';

if (!IS_DEV) {
  fs.writeFileSync('private.json', process.env.FIREBASE);
}

app.use(logger('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/users', require('./routes/users'));

app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: IS_DEV ? err : {},
  });
});

module.exports = app;
