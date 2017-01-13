import React from 'react';

class LoginForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.login = ::this.login;
    this.inputChange = ::this.inputChange;
  }

  componentDidMount() {
    this.props.message(`Please sign in with 
      your school email (@smhsstudents.org).`);
  }

  inputChange(e) {
    this.setState({
      [e.target.id]: e.target.value,
    });
  }

  login(e) {
    e.preventDefault();
    const email = this.state.email.trim().toLowerCase();
    if (!this.state.email.toLowerCase().match(/\S+\.\S+.@smhsstudents\.org/)) {
      return this.props.err('Invalid email provided. Use your school email!');
    }
    return fetch('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(response => response.json())
    .then((response) => {
      if (response.success) {
        this.props.success(response.registered);
        localStorage.email = email;
      } else {
        this.props.err(response.message);
      }
    });
  }

  render() {
    return (
      <form onSubmit={this.login}>
        <input
          type="text"
          id="email"
          onChange={this.inputChange}
          className="form-control"
        />
        <input
          type="submit"
          className="btn btn-primary"
        />
      </form>
    );
  }
}

LoginForm.propTypes = {
  message: React.PropTypes.func.isRequired,
  success: React.PropTypes.func.isRequired,
  err: React.PropTypes.func.isRequired,
};

export default LoginForm;
