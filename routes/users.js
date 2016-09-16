var express = require('express');
var path = require('path');
var firebase = require('firebase');
var twilio = require('twilio');
var e164 = require('phone');
var request = require('request-promise');

firebase.initializeApp({
  databaseURL: "https://nhs-signup.firebaseio.com/",
  serviceAccount: path.join(__dirname, '../private.json')
});

var db = firebase.database();
var users = db.ref('users');
var client = new twilio.RestClient(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);
var api = express.Router();

api.use((req, res, next) => {
  if (!req.body.email || !validEmail(req.body.email)) {
    return next(new Error("Invalid email provided."))
  }
  req.body.email = encodeEmail(req.body.email);
  users.child(req.body.email).once('value', snapshot => {
    req.user = snapshot.val();
    next();
  });
});

api.post('/login', (req, res, next) => {
  var registered = req.user !== null;
  var user = users.child(req.body.email);

  if (registered) {
    var code = Math.floor(Math.random() * 900000) + 100000;
    user.update({ code });
    return sendCode(req.user.phone, code, (err, message) => {
      if (err) return next(err);
      res.json({success: true, registered});
    });
  }
  res.json({success: true, registered});
});

api.post('/register', (req, res, next) => {
  var user = users.child(req.body.email);
  var code = Math.floor(Math.random() * 900000) + 100000;
  var phone = e164(req.body.phone);
  var email = decodeEmail(req.body.email);

  if (phone.length === 0) {
    return next(new Error("Invalid phone number."))
  }
  phone = phone[0];

  if (req.user !== null) {
    return next(new Error("User already registered."));
  }
  user.set({phone, code, email});
  sendCode(phone, code, (err, message) => {
    if (err) return next(err);
    res.json({success: true});
  });
});

api.post('/verify', (req, res, next) => {
  var user = users.child(req.body.email);
  var attempt = parseInt(req.body.code);
  if (req.user.code !== attempt) {
    return next(new Error("Incorrect verification code."))
  }
  var token = firebase.auth().createCustomToken(req.user.phone);
  res.json({success: true, token});
});

api.post('/schedule', (req, res, next) => {
  var user = users.child(req.body.email);
  request('', {

  }, (err, response, body) => {

  });
});

function encodeEmail(email) {
  return email.replace(/\./g, '*');
}

function decodeEmail(encoded) {
  return encoded.replace(/\*/g, '.');
}

function validEmail(email) {
  return email.match(/\S+@\S+\.\S+/) && email.includes('@smhsstudents.org');
}

function sendCode(phone, code, cb) {
  client.messages.create({
    body: "Your NHS verification code is " + code,
    to: phone,
    from: process.env.PHONE
  }, cb);
}

module.exports = api;