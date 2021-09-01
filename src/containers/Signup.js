import React from "react";
import { Alert, FormGroup, FormControl, FormLabel, FormText } from "react-bootstrap";
import { Helmet } from "react-helmet";
import { Auth, API } from "aws-amplify";
import LoaderButton from "../components/LoaderButton";
import { LinkContainer } from "react-router-bootstrap";
import SearchComponent from "../components/SearchComponent";
import "./Signup.css";

export default class Signup extends SearchComponent {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      name: "",
      username: "",
      getUsername: false,
      isValidUsername: true,
      emailExists: false,
      email: "",
      password: "",
      code: "",
      isErrorState: false,
      timeRemaining: 5,
      errorMessage: "",
      signedUp: false,
      verified: false,
      codeResent: false
    };
  }

  validateForm() {
    if(this.state.signedUp) {
      return this.state.code.length > 0;
    } else {
      return this.state.name.length > 0 && this.state.username.length > 0 && this.state.email.length > 0 && this.state.password.length > 0 && this.validatePassword() && this.validateUserName();
    }
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
      [event.target.id]: event.target.value,
      isValidUsername: true,
      emailExists: false,
      isErrorState: false
    });
  }

  componentDidMount() {
    window.scrollTo(0, 0);

    if(this.props.isVerify) {
      if(typeof Storage !== "undefined") {
        let username = localStorage.getItem("username");

        if(username) {
          this.setState({
            username
          });
        } else {
          this.setState({
            getUsername: true
          });
        }
      }
      this.setState({
        signedUp: true
      });
    }
  }

  autoRedirect() {
    let timer = setInterval(() => {
      let {timeRemaining} = this.state;
      if(timeRemaining === 1) {
        clearInterval(timer);
        this.props.history.push("/login");
      } else {
        this.setState({
          timeRemaining: timeRemaining - 1
        });
      }
    }, 1000);
  }

  async confirmUser(username, code) {
    this.setState({ isLoading: true });

    try {
      await Auth.confirmSignUp(username, code);
      this.autoRedirect();
      this.setState({
        isLoading: false,
        verified: true
      });
    } catch(e) {
      this.setState({
        isLoading: false,
        isErrorState: true,
        errorMessage: e.message
      });
    }
  }

  handleSubmit = async event => {
    event.preventDefault();
  
    this.setState({ isLoading: true });

    try {
      if(this.state.signedUp) {
        this.confirmUser(this.state.username, this.state.code);
      } else {
        try {
          await API.post("posts", "/account/signup", {
            body: {
              username: this.state.username,
              password: this.state.password,
              email: this.state.email,
              name: this.state.name
            }
          });
          window.scrollTo(0, 0);
          this.setState({
            isLoading: false,
            signedUp: true
          });

          if(typeof Storage !== "undefined") {
            localStorage.setItem("username", this.state.username);
          }
          this.props.history.push("/signup/verify");
        } catch(e) {
          this.setState({
            isLoading: false,
            isErrorState: true,
            isValidUsername: e.response?.data?.code !== "UsernameExistsException",
            emailExists: e.response?.data?.code === "EmailExistsException",
            errorMessage: e.response?.data?.message || e.message
          });
        }
      }
    } catch(e) {
      this.setState({
        isLoading: false,
        isErrorState: true,
        errorMessage: e.message
      });
    }
  }

  resendAuthCode = (e) => {
    e.preventDefault();
    Auth.resendSignUp(this.state.username).then(() => {
      this.setState({
        codeResent: true
      });
    }).catch(e => {
      this.setState({
        isErrorState: true,
        errorMessage: e.message
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

  renderVerificationForm() {
    if(this.state.signedUp) {
      return(
        <form onSubmit={this.handleSubmit}>
          {this.state.getUsername ?
            <FormGroup controlId="username">
              <FormLabel>Username</FormLabel>
              <FormControl
                type="text"
                value={this.state.username}
                onChange={this.handleChange}
              />
            </FormGroup>
            : null
          }
          <FormGroup controlId="code">
            <FormLabel>Verification Code</FormLabel>
            <FormControl
              type="text"
              value={this.state.code}
              onChange={this.handleChange}
            />
            <small className="text-muted d-block mb-3">
              <a href="#/" onClick={this.resendAuthCode}>
                Click here to resend verification code.
              </a>
            </small>
          </FormGroup>
          <LoaderButton
            block
            disabled={!this.validateForm()}
            type="submit"
            isLoading={this.state.isLoading}
            text="Verify Email"
            loadingText="Verifying Email…"
          />
        </form>
      );
    }
  }

  render() {
    let { signedUp, verified, codeResent, isValidUsername, emailExists } = this.state;

    if(verified) {
      return (
        <div className="Signup">
          <h2>Email Verified!</h2>
          <p>Redirecting to login screen in {this.state.timeRemaining}s...</p>
          <p>Alternatively, <LinkContainer to="/login"><a href="#/">click here</a></LinkContainer> to Login.
          </p>
        </div>
      );
    }

    return (
      <div className="Signup">
        <div className={signedUp ? 'd-none' : 'd-block'}>
          { this.renderSEOTags() }
          <form onSubmit={this.handleSubmit}>
            <div className="header border-bottom">
              <h1>Sign Up</h1>
            </div>
            {this.renderError()}
            <small className="text-muted d-block mb-3">
              <LinkContainer to="/login">
                <a href="#/">
                  Already have an account? Click to Login.
                </a>
              </LinkContainer>
            </small>
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
                isInvalid={!this.validateUserName() || !isValidUsername}
                type="text"
                value={this.state.username}
                onChange={this.handleChange}
              />
              <FormControl.Feedback type="invalid" className={(this.validateUserName() ? 'd-none' : 'd-block')}>
                Please enter valid username with only letters and numbers.
              </FormControl.Feedback>
              <FormControl.Feedback type="invalid" className={(isValidUsername ? 'd-none' : 'd-block')}>
                Username already exists. Please try a different one.
              </FormControl.Feedback>
            </FormGroup>
            <FormGroup controlId="email">
              <FormLabel>Email</FormLabel>
              <FormControl
                isInvalid={emailExists}
                type="email"
                value={this.state.email}
                onChange={this.handleChange}
              />
              <FormControl.Feedback type="invalid" className={(emailExists ? 'd-block' : 'd-none')}>
                An account with that email already exists. <LinkContainer to="/forgot-password"><a href="#/">Reset password</a></LinkContainer>.
              </FormControl.Feedback>
              <FormText className={`text-muted ${emailExists ? "d-none" : "d-block"}`}>
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
          { this.renderError() }
          { codeResent ? <Alert variant="success">
            Code resent successfully.
          </Alert> : null}
          <h2>Verify Account</h2>
          <p>Please check your email for a verification code. If you can't find the email, it could be in the Spam folder.</p>
          {this.renderVerificationForm()}
        </div>
      </div>
    );
  }
}