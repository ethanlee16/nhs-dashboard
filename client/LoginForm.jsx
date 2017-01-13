import React from 'react';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';

class LoginForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.action = ::this.action;
    this.inputChange = ::this.inputChange;
  }

  inputChange(e) {
    this.setState({
      input: e.target.value,
    });
  }

  action(e) {
    e.preventDefault();
    const input = this.state.input.trim().toLowerCase();
    if (!this.props.validator(input)) {
      return this.setState({
        error: this.props.error,
      });
    }

    const body = { [this.props.input]: input };
    if (this.props.requiresEmail) {
      body.email = localStorage.email;
    }

    return fetch(`/api/users/${this.props.type}`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(response => response.json())
    .then((response) => {
      if (response.success) {
        this.setState({
          input: '',
          error: '',
        });
        this.props.success(response, input);
      } else {
        this.setState({
          error: response.message,
        });
      }
    });
  }

  render() {
    return (
      <form onSubmit={this.action}>
        <TextField
          onChange={this.inputChange}
          value={this.state.input}
          floatingLabelText={this.props.fields[0]}
          hintText={this.props.fields[1]}
          errorText={this.state.error}
        />
        <br />
        <RaisedButton
          label={this.props.type}
          type="submit"
          primary
        />
      </form>
    );
  }
}

LoginForm.propTypes = {
  success: React.PropTypes.func.isRequired,
  type: React.PropTypes.string.isRequired,
  input: React.PropTypes.string.isRequired,
  fields: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
  validator: React.PropTypes.func.isRequired,
  error: React.PropTypes.string.isRequired,
  requiresEmail: React.PropTypes.bool,
};

LoginForm.defaultProps = {
  requiresEmail: false,
};

export default LoginForm;
