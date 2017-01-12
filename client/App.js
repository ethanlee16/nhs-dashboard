import React from 'react';
import ReactDOM from 'react-dom';
import Dashboard from './Dashboard';
import Login from './Login';
import { Router, Route, Link, hashHistory } from 'react-router';
import Promise from 'promise-polyfill';

class App extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <h1>NHS Tutoring Dashboard</h1>
        {this.props.children}
      </div>
    );
  }
}

function checkAuth(nextState, replace) {
  console.info("Checking auth!");
  var loggedIn = !!localStorage.fbToken; 
  if (nextState.location.pathname.indexOf('login') > -1) return;
  if (nextState.location.pathname.indexOf('dashboard') > -1
      && loggedIn) return;
  replace({
    pathname: loggedIn ? '/dashboard' : '/login',
    state: {
      nextPathname: nextState.location.pathname
    }
  })
}

const Routes = React.createClass({
  render: function() {
    return (
      <Router history={hashHistory}>
        <Route path="/" component={App} onEnter={checkAuth}>
          <Route path="login" component={Login} />
          <Route path="dashboard" component={Dashboard} onEnter={checkAuth} />
        </Route>
      </Router>
    );
  }
});

if (!window.Promise) {
  window.Promise = Promise;
}
ReactDOM.render(<Routes />, document.getElementById('root'));

