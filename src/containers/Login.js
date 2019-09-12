import React from "react";
import { Alert, FormGroup, FormControl, FormLabel, FormText } from "react-bootstrap";
import { Helmet } from "react-helmet";
import { Auth } from "aws-amplify";
import { LinkContainer } from "react-router-bootstrap";
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

  componentDidMount() {
    if(!this.props.isDialog) {
      window.scrollTo(0, 0);
    }
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
      let session = await Auth.currentSession();
      await this.props.getUserPrevileges(session);
      this.props.userHasAuthenticated(true);

      if(this.props.isDialog) {
        this.props.closeLoginModal(true);
      }
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
    if(!this.props.isDialog) {
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
  }

  render() {
    let {isDialog} = this.props;

    return (
      <div className={`Login ${isDialog ? 'isDialog' : ''}`}>
        { this.renderSEOTags() }
        <div className={`border-bottom mb-4 ${isDialog ? 'd-none' : ''}`}>
          <h2>Login</h2>
        </div>
        {this.renderError()}
        <form onSubmit={this.handleSubmit}>
          <div className={`${isDialog ? '' : 'd-none'} p-3 bg-light border rounded mb-4`}>
            Don't have an account yet?<br />
            <a href="/signup" target="_blank">
              Click here to Signup
            </a>
          </div>
          <FormGroup controlId="email">
            <FormLabel>Username or Email</FormLabel>
            <FormControl
              autoFocus
              type="text"
              tabIndex={1}
              value={this.state.email}
              onChange={this.handleChange}
            />
            <FormText className={`text-muted ${isDialog ? 'd-none' : ''}`}>
              <LinkContainer to="/signup">
                <a href="#/">
                  Don't have an account?
                </a>
              </LinkContainer>
            </FormText>
          </FormGroup>
          <FormGroup controlId="password">
            <FormLabel>Password</FormLabel>
            <FormControl
              value={this.state.password}
              tabIndex={2}
              onChange={this.handleChange}
              type="password"
            />
            <FormText className="text-muted">
              <LinkContainer to="/forgot-password">
                <a href="#/">
                  Forgot Password?
                </a>
              </LinkContainer>
            </FormText>
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