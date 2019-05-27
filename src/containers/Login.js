import React from "react";
import { Alert, FormGroup, FormControl, FormLabel } from "react-bootstrap";
import { Helmet } from "react-helmet";
import { Auth } from "aws-amplify";
import LoaderButton from "../components/LoaderButton";
import SearchComponent from "../components/SearchComponent";
import "./Login.css";

export default class Login extends SearchComponent {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      email: "",
      password: "",
      isErrorState: false,
      errorMessage: ""
    };
  }

  validateForm() {
    return this.state.email.length > 0 && this.state.password.length > 0;
  }

  handleChange = event => {
    this.setState({
      [event.target.id]: event.target.value
    });
  }

  handleSubmit = async event => {
    event.preventDefault();
  
    this.setState({ isLoading: true });

    try {
      await Auth.signIn(this.state.email, this.state.password);
      this.props.userHasAuthenticated(true);
    } catch (e) {
      this.setState({
        isLoading: false,
        isErrorState: true,
        errorMessage: e.message
      });
    }
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
        <title>Login | Naadan Chords</title>
        <meta name="description" content="" />
        <meta name="twitter:card" content="summary" />
        <meta property="og:title" content="Login | Naadan Chords" />
        <meta property="og:description" content="" />
      </Helmet>
    );
  }

  render() {
    return (
      <div className="Login">
        { this.renderSEOTags() }
        <form onSubmit={this.handleSubmit}>
          {this.renderError()}
          <FormGroup controlId="email">
            <FormLabel>Username / Email</FormLabel>
            <FormControl
              autoFocus
              type="text"
              value={this.state.email}
              onChange={this.handleChange}
            />
          </FormGroup>
          <FormGroup controlId="password">
            <FormLabel>Password</FormLabel>
            <FormControl
              value={this.state.password}
              onChange={this.handleChange}
              type="password"
            />
          </FormGroup>
          <LoaderButton
            block
            disabled={!this.validateForm()}
            type="submit"
            isLoading={this.state.isLoading}
            text="Login"
            loadingText="Logging in…"
          />
        </form>
      </div>
    );
  }
}