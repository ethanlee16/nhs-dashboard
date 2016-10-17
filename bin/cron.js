var firebase = require('firebase');
var twilio = require('twilio');
var path = require('path');
var request = require('request-promise');

if (process.env.NODE_ENV !== 'development') {
  var fs = require('fs');
  fs.writeFileSync('private.json', process.env.FIREBASE);
}

firebase.initializeApp({
  databaseURL: "https://nhs-signup.firebaseio.com/",
  serviceAccount: path.join(__dirname, '../private.json')
});

var db = firebase.database();
var users = db.ref('users');
var info = db.ref('info');
var client = new twilio.RestClient(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);

request(`https://login.microsoftonline.com
  /common/oauth2/v2.0/token`, {
  method: 'POST',
  form: {
    'grant_type': 'refresh_token',
    'client_id': process.env.OUTLOOK_CLIENT_ID,
    'client_secret': process.env.OUTLOOK_CLIENT_SECRET,
    'refresh_token': process.env.OUTLOOK_TOKEN
  },
  headers: {
    'Content-Type': 'x-www-form-urlencoded'
  },
  json: true
}).then(response => {
  return info.child('outlook').set({
    accessToken: response.access_token
  });
}).then(snapshot => {
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});