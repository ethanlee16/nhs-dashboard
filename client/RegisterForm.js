import React from 'react';

class RegisterForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.register = ::this.register;
    this.inputChange = ::this.inputChange;
  }

  componentDidMount() {
    this.props.message(`Please enter your phone number.
      It will be used for NHS communications only.`);
  }
  
  inputChange(e) {
    this.setState({
      [e.target.id]: e.target.value
    });
  }
  
  register(e) {
    e.preventDefault();
    if (!localStorage.email) {
      return this.props.err(`There was an application error. 
        Please try logging in again.`)
    }
    fetch('/api/users/register', {
      method: 'POST',
      body: JSON.stringify({
        phone: this.state.phone,
        email: localStorage.email
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(response => {
      if (response.success) {
        this.props.success();
      } else {
        this.props.err(response.message);
      }
    })
  }

  render() {
    return (
    <form onSubmit={this.register}>
      <input
        type="text" 
        id="phone"
        onChange={this.inputChange}
        className="form-control" />
      <input
        type="submit"
        className="btn btn-primary" />
    </form>
    );
  }
}

export default RegisterForm;