import React from "react";
import {
  Alert,
  FormGroup,
  FormControl,
  FormLabel,
  FormText,
} from "react-bootstrap";
import { Helmet } from "react-helmet";
import { confirmResetPassword, resetPassword } from "aws-amplify/auth";
import SearchComponent from "../components/SearchComponent";
import LoaderButton from "../components/LoaderButton";
import { LinkContainer } from "react-router-bootstrap";
import "./ResetPassword.css";

export default class ResetPassword extends SearchComponent {
  constructor(props) {
    super(props);

    this.state = {
      username: "",
      code: "",
      password: "",
      complete: false,
      isErrorState: false,
      timeRemaining: 5,
      errorMessage: "",
      isLoading: false,
      collectCode: false,
    };
  }

  componentDidMount() {
    if (this.props.email) {
      this.setState({
        username: this.props.email,
      });
    }
  }

  renderError = () => {
    if (this.state.isErrorState) {
      return <Alert variant="danger">{this.state.errorMessage}</Alert>;
    }
  };

  renderSEOTags() {
    return (
      <Helmet>
        <title>Forgot Password | Naadan Chords</title>
        <meta name="description" content="" />
        <meta name="twitter:card" content="summary" />
        <meta property="og:title" content="Forgot Password | Naadan Chords" />
        <meta property="og:description" content="" />
      </Helmet>
    );
  }

  validateForm() {
    let { username, code, password, collectCode } = this.state;

    return collectCode
      ? code.length > 0 && password.length > 0
      : username.length > 0;
  }

  validatePassword = () => {
    let { password } = this.state;
    return password ? password.length > 7 : true;
  };

  handleChange = (event) => {
    this.setState({
      [event.target.id]: event.target.value,
    });
  };

  handleSubmit = async (event) => {
    event.preventDefault();

    this.setState({ isLoading: true });

    try {
      if (this.state.collectCode) {
        let { username, code, password } = this.state;
        await confirmResetPassword({
          username,
          confirmationCode: code,
          newPassword: password,
        });
        this.autoRedirect();
        this.setState({
          isLoading: false,
          isErrorState: false,
          complete: true,
        });
      } else {
        await resetPassword({
          username: this.state.username,
        });
        this.setState({
          isLoading: false,
          isErrorState: false,
          collectCode: true,
        });
      }
    } catch (e) {
      this.setState({
        isLoading: false,
        isErrorState: true,
        errorMessage: e.message,
      });
    }
  };

  autoRedirect() {
    let timer = setInterval(() => {
      let { timeRemaining } = this.state;
      if (timeRemaining === 1) {
        clearInterval(timer);
        this.props.history.push("/login");
      } else {
        this.setState({
          timeRemaining: timeRemaining - 1,
        });
      }
    }, 1000);
  }

  renderForm() {
    if (this.state.complete) {
      return (
        <div>
          <h2>Password reset done!</h2>
          <p>Redirecting to login screen in {this.state.timeRemaining}s...</p>
          <p>
            Alternatively,{" "}
            <LinkContainer to="/login">
              <a href="#/">click here</a>
            </LinkContainer>{" "}
            to Login.
          </p>
        </div>
      );
    }

    if (this.state.collectCode) {
      return (
        <form onSubmit={this.handleSubmit}>
          <FormGroup controlId="code">
            <FormLabel>Verification Code</FormLabel>
            <FormControl
              autoFocus
              type="text"
              value={this.state.code}
              onChange={this.handleChange}
            />
            <FormText className="text-muted">
              Please check your registered Email for the code.
            </FormText>
          </FormGroup>
          <FormGroup controlId="password">
            <FormLabel>New Password</FormLabel>
            <FormControl
              isInvalid={!this.validatePassword()}
              value={this.state.password}
              onChange={this.handleChange}
              type="password"
            />
            <FormControl.Feedback
              type="invalid"
              className={this.validatePassword() ? "d-none" : "d-block"}
            >
              Please enter a password with minimum of 8 characters.
            </FormControl.Feedback>
          </FormGroup>
          <LoaderButton
            block
            disabled={!this.validateForm()}
            type="submit"
            isLoading={this.state.isLoading}
            text="Reset Password"
            loadingText="Resetting Password…"
          />
        </form>
      );
    } else {
      return (
        <form onSubmit={this.handleSubmit}>
          <FormGroup controlId="username">
            <FormLabel>Username or Email</FormLabel>
            <FormControl
              autoFocus
              type="text"
              value={this.state.username}
              onChange={this.handleChange}
            />
          </FormGroup>
          <LoaderButton
            block
            disabled={!this.validateForm()}
            type="submit"
            isLoading={this.state.isLoading}
            text="Send Code"
            loadingText="Sending Code…"
          />
        </form>
      );
    }
  }

  render() {
    return (
      <div className="ForgotPassword">
        {this.renderSEOTags()}
        <div
          className={`border-bottom mb-4 ${
            this.state.complete ? "d-none" : "d-block"
          }`}
        >
          <h2>
            <LinkContainer exact to="/login">
              <a href="#/" className="text-primary">
                Login
              </a>
            </LinkContainer>
            <span>
              {" "}
              <small>&raquo;</small> Forgot Password
            </span>
          </h2>
        </div>
        {this.renderError()}
        {this.renderForm()}
      </div>
    );
  }
}
