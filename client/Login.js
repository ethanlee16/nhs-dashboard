import React from 'react';
import { withRouter } from 'react-router';
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
      loggingIn: true
    };
  }

  message(text) {
    this.setState({
      message: text
    });
  }

  error(message) {
    this.setState({
      error: message
    });
  }

  registerSuccess(){
    this.setState({
      error: '',
      registered: true
    });
  }

  loginSuccess(toVerify) {
    this.setState({
      error: '',
      loggingIn: false,
      registered: toVerify
    });
  }

  dashboardRedirect() {
    this.props.router.push('/dashboard');
  }

  render() {
    var utils = {
      err: this.error,
      message: this.message
    }
    return (
      <div className="form-control">
        <p>{this.state.message}</p>
        <p>{this.state.error}</p>
        {
          this.state.loggingIn ? 
          <LoginForm success={this.loginSuccess} {...utils} /> :
            this.state.registered ? 
              <VerifyForm success={this.dashboardRedirect} {...utils} /> :
              <RegisterForm success={this.registerSuccess} {...utils} />
        }
      </div>
    );
  }
};

export default withRouter(Login);