import React from "react";
import { Alert, FormGroup, FormControl, FormLabel, FormText } from "react-bootstrap";
import { Helmet } from "react-helmet";
import { Auth } from "aws-amplify";
import LoaderButton from "../components/LoaderButton";
import SearchComponent from "../components/SearchComponent";
import "./Signup.css";

export default class Signup extends SearchComponent {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      name: "",
      username: "",
      email: "",
      password: "",
      isErrorState: false,
      errorMessage: "",
      signedUp: false
    };
  }

  validateForm() {
    return this.state.name.length > 0 && this.state.username.length > 0 && this.state.email.length > 0 && this.state.password.length > 0;
  }

  validateUserName = () => {
    let {username} = this.state;
    const regExp = /^[a-zA-Z0-9]+$/;
    return username ? username.match(regExp) !== null : true;
  }

  validatePassword = () => {
    let {password} = this.state;
    return password ? password.length > 7 : true;
  }

  handleChange = event => {
    this.setState({
      [event.target.id]: event.target.value
    });
  }

  handleSubmit = async event => {
    event.preventDefault();
  
    this.setState({ isLoading: true });

    Auth.signUp({
      username: this.state.username,
      password: this.state.password,
      attributes: {
        email: this.state.email,
        name: this.state.name
      }
    }).then(data => {
      this.setState({
        isLoading: false,
        signedUp: true
      });
    }).catch(err => {
      this.setState({
        isLoading: false,
        isErrorState: true,
        errorMessage: err.message
      });
    });
  }

  renderError = () => {
    if(this.state.isErrorState) {
      return(
        <Alert variant="danger">
          {this.state.errorMessage}
        </Alert>
      );
    }
  }

  renderSEOTags() {
    return (
      <Helmet>
        <title>Signup | Naadan Chords</title>
        <meta name="description" content="" />
        <meta name="twitter:card" content="summary" />
        <meta property="og:title" content="Signup | Naadan Chords" />
        <meta property="og:description" content="" />
      </Helmet>
    );
  }

  render() {
    let {signedUp} = this.state;

    return (
      <div className="Signup">
        <div className={signedUp ? 'd-none' : 'd-block'}>
          { this.renderSEOTags() }
          <form onSubmit={this.handleSubmit}>
            <div className="header border-bottom">
              <h1>Sign Up</h1>
            </div>
            {this.renderError()}
            <FormGroup controlId="name">
              <FormLabel>Name</FormLabel>
              <FormControl
                autoFocus
                type="text"
                value={this.state.name}
                onChange={this.handleChange}
              />
              <FormText className="text-muted">
                Full name as you want to be shown in your profile.
              </FormText>
            </FormGroup>
            <FormGroup controlId="username">
              <FormLabel>Username</FormLabel>
              <FormControl
                isInvalid={!this.validateUserName()}
                type="text"
                value={this.state.username}
                onChange={this.handleChange}
              />
              <FormControl.Feedback type="invalid" className={(this.validateUserName() ? 'd-none' : 'd-block')}>
                Please enter valid username with only letters and numbers.
              </FormControl.Feedback>
            </FormGroup>
            <FormGroup controlId="email">
              <FormLabel>Email</FormLabel>
              <FormControl
                type="email"
                value={this.state.email}
                onChange={this.handleChange}
              />
              <FormText className="text-muted">
                We'll never share your email with anyone else.
              </FormText>
            </FormGroup>
            <FormGroup controlId="password">
              <FormLabel>Password</FormLabel>
              <FormControl
                value={this.state.password}
                isInvalid={!this.validatePassword()}
                onChange={this.handleChange}
                type="password"
              />
              <FormControl.Feedback type="invalid" className={(this.validatePassword() ? 'd-none' : 'd-block')}>
                Please enter a password with minimum of 8 characters.
              </FormControl.Feedback>
            </FormGroup>
            <LoaderButton
              block
              disabled={!this.validateForm()}
              type="submit"
              isLoading={this.state.isLoading}
              text="Sign Up"
              loadingText="Signing Up…"
            />
          </form>
        </div>

        <div className={signedUp ? 'd-block' : 'd-none'}>
          <h2>Thank you for Signing up!</h2>
          <p>Please check your email for a verification link.<br />Once verified, you may <a href="/login">Login</a></p>
        </div>
      </div>
    );
  }
}