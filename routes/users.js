const express = require('express');
const path = require('path');
const firebase = require('firebase');
const twilio = require('twilio');
const e164 = require('phone');
const request = require('request-promise');

const api = express.Router();

firebase.initializeApp({
  databaseURL: "https://nhs-signup.firebaseio.com/",
  serviceAccount: path.join(__dirname, '../private.json'),
});

const db = firebase.database();
const users = db.ref('users');
const dates = db.ref('bookings');
const outlook = db.ref('info/outlook');
const client = new twilio.RestClient(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);

function encodeEmail(email) {
  return email.replace(/\./g, '*');
}

function decodeEmail(encoded) {
  return encoded.replace(/\*/g, '.');
}

function validEmail(email) {
  return email.match(/\S+\.\S+.@smhsstudents\.org/);
}

function sendCode(phone, code, cb) {
  client.messages.create({
    body: `Your NHS verification code is ${code}`,
    to: phone,
    from: process.env.PHONE,
  }, cb);
}

api.use((req, res, next) => {
  // TODO: decode JWT to find user instead
  console.log(req.body);
  const originalRequest = req;
  if (!req.body.email || !validEmail(req.body.email)) {
    return next(new Error("Invalid email provided."));
  }
  originalRequest.body.name = req.body.email.substring(0, req.body.email.indexOf('@'))
  .split('.').map(w => w[0].toUpperCase() + w.substring(1)).join(' ');

  originalRequest.body.encodedEmail = encodeEmail(req.body.email);
  return users.child(req.body.encodedEmail).once('value').then((snapshot) => {
    originalRequest.user = snapshot.val();
    next();
  }).catch(err => next(err));
});

api.post('/login', (req, res, next) => {
  const registered = req.user !== null;
  const user = users.child(req.body.encodedEmail);

  if (registered) {
    const code = Math.floor(Math.random() * 900000) + 100000;
    user.update({ code });
    return sendCode(req.user.phone, code, (err, message) => {
      if (err) return next(err);
      return res.json({ success: true, registered });
    });
  }
  return res.json({ success: true, registered });
});

api.post('/register', (req, res, next) => {
  const user = users.child(req.body.encodedEmail);
  const code = Math.floor(Math.random() * 900000) + 100000;
  let phone = e164(req.body.phone);
  const email = decodeEmail(req.body.encodedEmail);

  if (phone.length === 0) {
    return next(new Error("Invalid phone number."));
  }
  phone = phone[0];

  if (req.user !== null) {
    return next(new Error("User already registered."));
  }
  user.set({ phone, code, email });
  return sendCode(phone, code, (err, message) => {
    if (err) return next(err);
    return res.json({ success: true });
  });
});

api.post('/verify', (req, res, next) => {
  const attempt = parseInt(req.body.code, 10);
  if (req.user.code !== attempt) {
    return next(new Error("Incorrect verification code."));
  }
  // change this to read from db
  const token = firebase.auth().createCustomToken(req.user.phone);
  return res.json({ success: true, token });
});

api.post('/schedule', (req, res, next) =>
  outlook.child('accessToken').once('value').then(token =>
    request('https://outlook.office.com/api/v2.0/me/events', {
      method: 'POST',
      body: {
        Subject: `${req.body.name} - NHS Tutoring`,
        IsReminderOn: false,
        Body: {
          ContentType: 'HTML',
          Content: 'You have successfully scheduled your NHS tutoring session.',
        },
        Start: {
          DateTime: `${req.body.date} T14:10:00`,
          TimeZone: 'Pacific Standard Time',
        },
        End: {
          DateTime: `${req.body.date} T15:00:00`,
          TimeZone: 'Pacific Standard Time',
        },
        Attendees: [{
          EmailAddress: {
            Address: req.body.email,
            Name: req.body.name,
          },
          Type: 'Required',
        }],
      },
      headers: {
        Authorization: `Bearer ${token.val()}`,
        'Content-Type': 'application/json',
      },
      json: true,
    })
  ).then((response) => {
    console.log(response);
    return dates.child(req.body.date).transaction((bookings) => {
      const newDates = Object.assign({}, bookings);
      const tutors = Object.keys(newDates);

      tutors.forEach((tutor) => {
        if (newDates[tutor] === req.body.email) {
          newDates[tutor] += `;${response.Id}`;
        }
      });

      return newDates;
    });
  })
  .then(() => res.json({ success: true }))
  .catch(err => next(err))
);

module.exports = api;
