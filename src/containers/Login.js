import React from "react";
import {
  Alert,
  FormGroup,
  FormControl,
  FormLabel,
  FormText,
  Button,
} from "react-bootstrap";
import { Helmet } from "react-helmet";
import {
  confirmSignIn,
  fetchAuthSession,
  signIn,
  signInWithRedirect,
} from "aws-amplify/auth";
import { LinkContainer } from "react-router-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook } from "@fortawesome/free-brands-svg-icons";
import LoaderButton from "../components/LoaderButton";
import SearchComponent from "../components/SearchComponent";
import { insertUrlParam } from "../libs/url-lib";
import * as Styles from "./Styles";
import "./Login.css";

export default class Login extends SearchComponent {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      email: "",
      password: "",
      code: "",
      isErrorState: false,
      errorMessage: "",
      errorType: "",
      isOTPFlow: false,
      OTPSent: false,
      cognitoUser: null,
    };
  }

  componentDidMount() {
    if (!this.props.isDialog) {
      window.scrollTo(0, 0);
    } else if (this.props.setRedirect) {
      insertUrlParam("redirect", this.props.setRedirect);
    }
  }

  validateForm() {
    return this.state.email.length > 0 && this.state.password.length > 0;
  }

  validateOTPForm() {
    const { isOTPFlow, OTPSent } = this.state;
    if (isOTPFlow) {
      if (OTPSent) {
        return this.state.email.length > 0 && this.state.code.length > 0;
      }
      return this.state.email.length > 0;
    }
    return true;
  }

  handleChange = (event) => {
    this.setState({
      [event.target.id]: event.target.value,
    });
  };

  handleSubmit = async (event) => {
    event.preventDefault();

    this.setState({ isLoading: true });

    try {
      await signIn({
        username: this.state.email,
        password: this.state.password,
      });
      let session = await fetchAuthSession();
      await this.props.getUserPrevileges(session);
      await this.props.getUserAttributes(session);
      this.props.userHasAuthenticated(true);

      if (this.props.isDialog) {
        this.props.closeLoginModal(true);
      }
    } catch (e) {
      this.setState({
        isLoading: false,
        isErrorState: true,
        errorMessage: e.message,
        errorType: e.code,
      });
    }
  };

  handleSocialLogin = (provider) => {
    signInWithRedirect({ provider });
  };

  renderError = () => {
    if (this.state.isErrorState || this.props.loginError) {
      return (
        <Alert variant="danger">
          {this.state.errorMessage || this.props.loginError}
          {this.state.errorType === "UserNotConfirmedException" ? (
            <React.Fragment>
              &nbsp;<a href="/signup/verify">Click here</a> to verify.
            </React.Fragment>
          ) : null}
        </Alert>
      );
    }
  };

  renderSEOTags() {
    if (!this.props.isDialog) {
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

  handleLoginWithOTP = async (event) => {
    event?.preventDefault();
    const { isOTPFlow, OTPSent, code } = this.state;
    if (isOTPFlow) {
      // Already in OTP mode, handle submit
      this.setState({ isLoading: true });

      if (OTPSent) {
        await confirmSignIn({ challengeResponse: code });
        try {
          // This will throw an error if the user is not yet authenticated:
          let session = await fetchAuthSession();
          await this.props.getUserPrevileges(session);
          this.props.userHasAuthenticated(true);
          if (this.props.isDialog) {
            this.props.closeLoginModal(true);
          }
        } catch (e) {
          this.setState({
            isErrorState: true,
            errorMessage: e.message || "Please try again",
            errorType: e.code,
          });
        } finally {
          this.setState({
            isLoading: false,
          });
        }
      } else {
        try {
          let cognitoUser;
          cognitoUser = await signIn({
            username: this.state.email,
            options: {
              authFlowType: "CUSTOM_WITHOUT_SRP",
            },
          });
          this.setState({ OTPSent: true, cognitoUser });
        } catch (e) {
          this.setState({
            isErrorState: true,
            errorMessage: e.message,
            errorType: e.code,
          });
        } finally {
          this.setState({
            isLoading: false,
          });
        }
      }
    } else {
      // Enable OTP mode
      this.setState({
        isOTPFlow: true,
      });
    }
  };

  render() {
    let { isDialog } = this.props;
    let { isOTPFlow, OTPSent } = this.state;

    return (
      <div className={`Login ${isDialog ? "isDialog" : ""}`}>
        {this.renderSEOTags()}
        <div className={`border-bottom mb-4 ${isDialog ? "d-none" : ""}`}>
          <h2>Login</h2>
        </div>
        {this.renderError()}
        {!isOTPFlow && (
          <Button
            className="social-login"
            onClick={() => this.handleSocialLogin("Facebook")}
            block
          >
            <span className="social-icon">
              <FontAwesomeIcon icon={faFacebook} />
            </span>
            Login with Facebook
          </Button>
        )}
        <form
          onSubmit={isOTPFlow ? this.handleLoginWithOTP : this.handleSubmit}
        >
          <div className="signup-card bg-light p-2 pl-3 mt-4 mb-4">
            New to Naadan Chords?
            <br />
            {isDialog ? (
              <a
                href="/signup"
                target="_blank"
                className="font-weight-bold text-primary"
              >
                Create an account
              </a>
            ) : (
              <LinkContainer to="/signup">
                <a href="#/" className="font-weight-bold text-primary">
                  Create an account
                </a>
              </LinkContainer>
            )}
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
          </FormGroup>
          {!isOTPFlow && (
            <>
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
                    <a href="#/">Forgot Password?</a>
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
              <div className="login-divider-container my-4">
                <hr className="login-divider" />
                <Styles.LoginDividerText className="text-muted">
                  OR
                </Styles.LoginDividerText>
              </div>
            </>
          )}
          {OTPSent && (
            <FormGroup controlId="code">
              <FormLabel>Verification Code</FormLabel>
              <FormControl
                value={this.state.code}
                tabIndex={2}
                onChange={this.handleChange}
                type="password"
              />
            </FormGroup>
          )}
          <LoaderButton
            block
            type="button"
            text="Login with OTP"
            loadingText="Logging in…"
            isLoading={this.state.isOTPFlow && this.state.isLoading}
            disabled={!this.validateOTPForm()}
            onClick={this.handleLoginWithOTP}
          />
          {isOTPFlow && (
            <>
              <Button
                block
                type="button"
                variant="link"
                className="text-primary"
                onClick={() => this.setState({ isOTPFlow: false })}
              >
                Cancel
              </Button>
            </>
          )}
        </form>
      </div>
    );
  }
}
