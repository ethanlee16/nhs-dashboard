import { Router, Route, Link, hashHistory } from 'react-router';
import Promise from 'promise-polyfill';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import injectTapEventPlugin from 'react-tap-event-plugin';
import AppBar from 'material-ui/AppBar';
import FlatButton from 'material-ui/FlatButton';
import React from 'react';
import ReactDOM from 'react-dom';
import Dashboard from './Dashboard';
import Login from './Login';

injectTapEventPlugin();

const App = (props) => {
  const button = localStorage.fbToken ?
    (<Link to="/login">
      <FlatButton
        label="Logout"
        onTouchTap={() => localStorage.clear()}
        style={{ color: 'white' }}
      />
    </Link>) : null;

  return (
    <MuiThemeProvider>
      <div>
        <AppBar
          title={<span>NHS Dashboard</span>}
          iconElementRight={button}
        />
        {props.children}
      </div>
    </MuiThemeProvider>
  );
};

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
