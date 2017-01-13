import { Router, Route, hashHistory } from 'react-router';
import Promise from 'promise-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import Dashboard from './Dashboard';
import Login from './Login';

const App = props =>
  (
    <div>
      <h1>NHS Tutoring Dashboard</h1>
      {props.children}
    </div>
  );

App.propTypes = {
  children: React.PropTypes.element.isRequired,
};

function checkAuth(nextState, replace) {
  const loggedIn = !!localStorage.fbToken;
  if (nextState.location.pathname.indexOf('login') > -1) return;
  if (nextState.location.pathname.indexOf('dashboard') > -1
      && loggedIn) return;
  replace({
    pathname: loggedIn ? '/dashboard' : '/login',
    state: {
      nextPathname: nextState.location.pathname,
    },
  });
}

const Routes = props =>
  (
    <Router history={hashHistory}>
      <Route path="/" component={App} onEnter={checkAuth}>
        <Route path="login" component={Login} />
        <Route path="dashboard" component={Dashboard} onEnter={checkAuth} />
      </Route>
    </Router>
  );

if (!window.Promise) {
  window.Promise = Promise;
}
ReactDOM.render(<Routes />, document.getElementById('root'));
