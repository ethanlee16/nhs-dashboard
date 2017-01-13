const firebase = require('firebase');
const twilio = require('twilio');
const path = require('path');
const request = require('request-promise');
const fs = require('fs');

if (process.env.NODE_ENV !== 'development') {
  fs.writeFileSync(path.join(__dirname, '../private.json'), process.env.FIREBASE);
}

firebase.initializeApp({
  databaseURL: "https://nhs-signup.firebaseio.com/",
  serviceAccount: path.join(__dirname, '../private.json'),
});

const db = firebase.database();
const info = db.ref('info');
const client = new twilio.RestClient(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);

request(`https://login.microsoftonline.com/common/oauth2/v2.0/token`, {
  method: 'POST',
  form: {
    grant_type: 'refresh_token',
    client_id: process.env.OUTLOOK_CLIENT_ID,
    client_secret: process.env.OUTLOOK_CLIENT_SECRET,
    refresh_token: process.env.OUTLOOK_TOKEN,
  },
  headers: {
    'Content-Type': 'x-www-form-urlencoded',
  },
  json: true,
}).then(response =>
  info.child('outlook').set({
    accessToken: response.access_token,
  }),
).then((snapshot) => {
  process.exit(0);
}).catch((err) => {
  console.error(err);
  client.messages.create({
    body: `An error occurred. ${err}`,
    to: process.env.ONCALL,
    from: process.env.PHONE,
  }, (error, msg) => {
    process.exit(1);
  });
});
