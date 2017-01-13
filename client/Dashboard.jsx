import React from 'react';
import Calendar from './Calendar';

const firebase = require('firebase');

firebase.initializeApp({
  apiKey: "AIzaSyDmWQYzshjDE7x5SvvpSf4hYrrLD2MiExg",
  authDomain: "nhs-signup.firebaseapp.com",
  databaseURL: "https://nhs-signup.firebaseio.com",
  storageBucket: "nhs-signup.appspot.com",
  messagingSenderId: "570269229870",
});

class Dashboard extends React.Component {
  constructor(props) {
    super(props);

    const email = localStorage.email;
    const name = email.substring(0, email.indexOf('@')).split('.').join(' ');
    this.state = {
      displayName: name,
      db: firebase.database(),
    };
  }

  componentDidMount() {
    firebase.auth().signInWithCustomToken(localStorage.fbToken)
    .catch((err) => {
      console.error(err);
    });
  }

  render() {
    return (
      <div>
        <h2 style={{ textTransform: 'capitalize' }}>
          Welcome {this.state.displayName}!
        </h2>
        <p>Schedule your tutoring sessions now!</p>
        <Calendar db={this.state.db} />
      </div>
    );
  }
}

export default Dashboard;
