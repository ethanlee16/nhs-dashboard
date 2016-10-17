const express = require('express');
const path = require('path');
const firebase = require('firebase');
const twilio = require('twilio');
const e164 = require('phone');
const request = require('request-promise');
const api = express.Router();

firebase.initializeApp({
  databaseURL: "https://nhs-signup.firebaseio.com/",
  serviceAccount: path.join(__dirname, '../private.json')
});

let db = firebase.database();
let users = db.ref('users');
let outlook = db.ref('info/outlook');
let client = new twilio.RestClient(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);

api.use((req, res, next) => {
  // TODO: decode JWT to find user instead 
  if (!req.body.email || !validEmail(req.body.email)) {
    return next(new Error("Invalid email provided."))
  }
  req.body.name = req.body.email.substring(0, req.body.email.indexOf('@'))
  .split('.').map(w => w[0].toUpperCase() + w.substring(1)).join(' ');

  req.body.encodedEmail = encodeEmail(req.body.email);
  users.child(req.body.encodedEmail).once('value', snapshot => {
    req.user = snapshot.val();
    next();
  });
});

api.post('/login', (req, res, next) => {
  let registered = req.user !== null;
  let user = users.child(req.body.encodedEmail);

  if (registered) {
    let code = Math.floor(Math.random() * 900000) + 100000;
    user.update({ code });
    return sendCode(req.user.phone, code, (err, message) => {
      if (err) return next(err);
      res.json({success: true, registered});
    });
  }
  res.json({success: true, registered});
});

api.post('/register', (req, res, next) => {
  let user = users.child(req.body.encodedEmail);
  let code = Math.floor(Math.random() * 900000) + 100000;
  let phone = e164(req.body.phone);
  let email = decodeEmail(req.body.encodedEmail);

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
  let user = users.child(req.body.encodedEmail);
  let attempt = parseInt(req.body.code);
  if (req.user.code !== attempt) {
    return next(new Error("Incorrect verification code."))
  }
  let token = firebase.auth().createCustomToken(req.user.phone);
  res.json({success: true, token});
});

api.post('/schedule', (req, res, next) => {
  outlook.child('accessToken').once('value').then(token => {
    return request('https://outlook.office.com/api/v2.0/me/events', {
      method: 'POST',
      body: {
        'Subject': 'NHS Tutoring',
        'Body': {
          'ContentType': 'HTML',
          'Content': 'You have successfully scheduled your NHS tutoring session.'
        },
        'Start': {
          'DateTime': req.body.start,
          'TimeZone': 'Pacific Standard Time'
        },
        'End': {
          'DateTime': req.body.end,
          'TimeZone': 'Pacific Standard Time'
        },
        'Attendees': [{
          'EmailAddress': {
            'Address': req.body.email,
            'Name': req.body.name
          },
          'Type': 'Required'
        }]
      },
      headers: {
        'Authorization': 'Bearer ' + token.val(),
        'Content-Type': 'application/json'
      },
      json: true
    });
  }).then(response => {
    res.json(response);
  }).catch(err => next(err));
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