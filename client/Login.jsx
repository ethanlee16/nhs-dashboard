import React from 'react';
import { withRouter, routerShape } from 'react-router';
import Paper from 'material-ui/Paper';
import LoginForm from './LoginForm';

const style = {
  maxWidth: '400px',
  marginLeft: 'auto',
  marginRight: 'auto',
  textAlign: 'center',
  padding: '30px 10px 30px 10px',
  marginTop: '5%',
};

const messages = {
  login: 'Please sign in with your school email (@smhsstudents.org).',
  verify: 'Enter the six-digit code we texted to the number we have for you.',
  register: 'Please enter your phone number. It will be used for NHS communications only.',
};

const inputs = {
  login: 'email',
  verify: 'code',
  register: 'phone',
};

const fields = {
  login: ['Email Address', 'your.name@smhsstudents.org'],
  verify: ['Verification Code', ''],
  register: ['Phone Number', ''],
};

const errors = {
  login: 'Invalid email provided. Use your school email!',
  verify: 'There was an application error. Please try logging in again.',
  register: 'There was an application error. Please try logging in again.',
};

const validators = {
  login: email => email.match(/\S+\.\S+.@smhsstudents\.org/),
  verify: () => !!localStorage.email,
  register: () => !!localStorage.email,
};

class Login extends React.Component {
  constructor(props) {
    super(props);

    this.loginSuccess = ::this.loginSuccess;
    this.registerSuccess = ::this.registerSuccess;
    this.verifySuccess = ::this.verifySuccess;

    this.state = {
      loggingIn: true,
    };
  }

  message(text) {
    this.setState({
      message: text,
    });
  }

  registerSuccess() {
    this.setState({
      error: '',
      registered: true,
    });
  }

  loginSuccess(response, input) {
    localStorage.email = input;
    this.setState({
      error: '',
      loggingIn: false,
      registered: response.registered,
    });
  }

  verifySuccess(response, input) {
    localStorage.fbToken = response.token;
    this.props.router.push('/dashboard');
  }

  render() {
    let type;
    if (this.state.loggingIn) {
      type = 'login';
    } else if (this.state.registered) {
      type = 'verify';
    } else {
      type = 'register';
    }

    return (
      <Paper zDepth={3} style={style}>
        <h1>Welcome</h1>
        <p>{messages[type]}</p>
        <LoginForm
          type={type}
          success={this[`${type}Success`]}
          validator={validators[type]}
          error={errors[type]}
          input={inputs[type]}
          fields={fields[type]}
          requiresEmail={type === 'verify' || type === 'register'}
        />
      </Paper>
    );
  }
}

Login.propTypes = {
  router: React.PropTypes.shape({
    push: React.PropTypes.func.isRequired,
    ...routerShape,
  }).isRequired,
};

export default withRouter(Login);
