import React from 'react';

class VerifyForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.verify = ::this.verify;
    this.inputChange = ::this.inputChange;
  }

  componentDidMount() {
    this.props.message(`Enter the six-digit
      code we texted to the number we have for you.`);
  }
  
  inputChange(e) {
    this.setState({
      [e.target.id]: e.target.value
    });
  }
  
  verify(e) {
    e.preventDefault();
    if (!localStorage.email) {
      return this.props.err(`There was an application error. 
        Please try logging in again.`)
    }
    fetch('/api/users/verify', {
      method: 'POST',
      body: JSON.stringify({
        code: this.state.code,
        email: localStorage.email
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(response => {
      if (response.success) {
        localStorage.fbToken = response.token;
        this.props.success();
      } else {
        this.props.err(response.message);
      }
    })
  }

  render() {
    return (
    <form onSubmit={this.verify}>
      <input
        type="text" 
        id="code"
        onChange={this.inputChange}
        className="form-control" />
      <input
        type="submit"
        className="btn btn-primary" />
    </form>
    );
  }
}

export default VerifyForm;