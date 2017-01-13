import React from 'react';
import { Router, withRouter } from 'react-router';
import LoginForm from './LoginForm';
import VerifyForm from './VerifyForm';
import RegisterForm from './RegisterForm';

class Login extends React.Component {
  constructor(props) {
    super(props);

    this.loginSuccess = ::this.loginSuccess;
    this.registerSuccess = ::this.registerSuccess;
    this.dashboardRedirect = ::this.dashboardRedirect;
    this.error = ::this.error;
    this.message = ::this.message;

    this.state = {
      loggingIn: true,
    };
  }

  message(text) {
    this.setState({
      message: text,
    });
  }

  error(message) {
    this.setState({
      error: message,
    });
  }

  registerSuccess() {
    this.setState({
      error: '',
      registered: true,
    });
  }

  loginSuccess(toVerify) {
    this.setState({
      error: '',
      loggingIn: false,
      registered: toVerify,
    });
  }

  dashboardRedirect() {
    this.props.router.push('/dashboard');
  }

  render() {
    const utils = {
      err: this.error,
      message: this.message,
    };

    const innerForm = this.state.registered ?
      <VerifyForm success={this.dashboardRedirect} {...utils} /> :
      <RegisterForm success={this.registerSuccess} {...utils} />;

    return (
      <div className="form-control">
        <p>{this.state.message}</p>
        <p>{this.state.error}</p>
        {
          this.state.loggingIn ?
            <LoginForm success={this.loginSuccess} {...utils} /> : innerForm
        }
      </div>
    );
  }
}

Login.propTypes = {
  router: React.PropTypes.instanceOf(Router).isRequired,
};

export default withRouter(Login);
