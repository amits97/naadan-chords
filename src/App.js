import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import {
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
  signInWithRedirect,
  signOut,
} from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import { Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSyncAlt } from "@fortawesome/free-solid-svg-icons";
import { ThemeProvider } from "styled-components";
import { GlobalStyles } from "./components/GlobalStyles";
import { lightTheme, darkTheme } from "./components/Themes";
import * as urlLib from "./libs/url-lib";
import Routes from "./Routes";
import Footer from "./containers/Footer";
import Header from "./Header";

import "react-bootstrap-typeahead/css/Typeahead.css";
import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      navExpanded: false,
      isAuthenticated: false,
      isAuthenticating: true,
      search: "",
      userName: "",
      preferredUsername: "",
      picture: "",
      name: "",
      email: "",
      isAdmin: false,
      identities: "[]",
      emailVerified: false,
      userTheme: "auto",
      theme: "light",
      loginError: "",
    };
  }

  getUserPrevileges = (session) => {
    return new Promise((resolve) => {
      if (session && session.tokens && session.tokens.idToken) {
        let sessionPayload = session.tokens.idToken.payload;
        if (
          sessionPayload["cognito:groups"] &&
          sessionPayload["cognito:groups"].includes("admin")
        ) {
          this.setState(
            {
              isAdmin: true,
            },
            resolve
          );
        } else {
          this.setState(
            {
              isAdmin: false,
            },
            resolve
          );
        }
      }
      resolve();
    });
  };

  getUserAttributes = async (session) => {
    try {
      const { username } = await getCurrentUser();
      const userAttributes = await fetchUserAttributes();
      this.setState(
        {
          userName: username,
          name: userAttributes.name,
          email: userAttributes.email,
          identities: userAttributes.identities,
          emailVerified: userAttributes.email_verified === "true",
          preferredUsername: userAttributes.preferred_username,
          picture: userAttributes.picture,
          userTheme: userAttributes["custom:theme"] ?? "auto",
        },
        () => {
          this.setWebsiteTheme();
        }
      );
      await this.getUserPrevileges(session);
    } catch (e) {
      // Non logged in user. Do nothing
    }
  };

  getUserDetails = async (session) => {
    try {
      const { username } = await getCurrentUser();
      const userAttributes = await fetchUserAttributes();
      this.setState(
        {
          userName: username,
          preferredUsername: userAttributes.preferred_username,
          picture: userAttributes.picture,
          name: userAttributes.name,
          email: userAttributes.email,
          userTheme: userAttributes["custom:theme"] ?? "auto",
        },
        () => {
          this.setWebsiteTheme();
        }
      );
      await this.getUserPrevileges(session);
      return true;
    } catch (e) {
      // Non logged in user
      return false;
    }
  };

  setWebsiteTheme = () => {
    let { userTheme } = this.state;
    const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");

    if (userTheme === "auto") {
      userTheme = darkThemeMq.matches ? "dark" : "light";
    }

    this.setState({ theme: userTheme });
  };

  async componentDidMount() {
    const loginError = urlLib.getUrlParameter("error_description");
    const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");

    if (loginError.indexOf("Already found an entry for username") !== -1) {
      // TODO: Known issue with Cognito merging accounts. Ugly! Clean up if possible.
      signInWithRedirect({ provider: "Facebook" });
    }

    if (loginError.indexOf("attributes required: [email]") !== -1) {
      this.setState({
        loginError:
          "The email field was not returned. This may be because the email was missing, invalid or hasn't been confirmed with Facebook.",
      });
    }

    try {
      this.setWebsiteTheme();
      let session = await fetchAuthSession();
      if (session.tokens) {
        this.userHasAuthenticated(true);
      }
      this.getUserDetails(session);
    } catch (e) {
      this.setWebsiteTheme();
      if (e !== "No current user") {
        console.log(e);
      }
    }

    darkThemeMq.addListener((e) => {
      const { userTheme } = this.state;

      if (userTheme === "auto") {
        this.setState({
          theme: e.matches ? "dark" : "light",
        });
      }
    });

    this.setState({
      isAuthenticating: false,
      search: urlLib.getUrlParameter("s"),
    });

    this.subscribeAuthEvents();
  }

  subscribeAuthEvents = async () => {
    const listener = async (data) => {
      switch (data.payload.event) {
        case "signIn":
          let session = await fetchAuthSession();
          if (session.tokens) {
            this.userHasAuthenticated(true);
          }
          this.getUserDetails(session);
          break;
        default:
          break;
      }
    };

    Hub.listen("auth", listener);
  };

  userHasAuthenticated = (authenticated) => {
    this.setState({ isAuthenticated: authenticated });
  };

  handleLogout = async (event) => {
    if (event) {
      event.preventDefault();
    }
    await signOut();

    this.userHasAuthenticated(false);
    this.setState(
      {
        userTheme: "auto",
        loginError: "",
      },
      () => {
        this.setWebsiteTheme();
      }
    );
    this.closeNav();
  };

  setNavExpanded = (expanded) => {
    this.setState({
      navExpanded: expanded,
    });
  };

  closeNav = () => {
    this.setState({
      navExpanded: false,
    });
  };

  setSearch = (value) => {
    this.setState({
      search: value,
    });
  };

  onNavBlur = (e) => {
    if (this.state.navExpanded === true) {
      let clickedElement = e.target;
      let clickedElementClassList = clickedElement
        ? clickedElement.classList
        : "";
      if (
        !clickedElementClassList.contains("navbar-toggler-icon") &&
        !clickedElementClassList.contains("dropdown-toggle")
      ) {
        setTimeout(() => {
          this.setState({
            navExpanded: false,
          });
        }, 250);
      }
    }
  };

  render() {
    const { theme } = this.state;
    const childProps = {
      isAuthenticated: this.state.isAuthenticated,
      userHasAuthenticated: this.userHasAuthenticated,
      handleLogout: this.handleLogout,
      getUserDetails: this.getUserDetails,
      getUserPrevileges: this.getUserPrevileges,
      getUserAttributes: this.getUserAttributes,
      isAdmin: this.state.isAdmin,
      search: this.state.search,
      setSearch: this.setSearch,
      navExpanded: this.state.navExpanded,
      setNavExpanded: this.setNavExpanded,
      closeNav: this.closeNav,
      username: this.state.userName,
      name: this.state.name,
      email: this.state.email,
      preferredUsername: this.state.preferredUsername,
      picture: this.state.picture,
      identities: this.state.identities,
      emailVerified: this.state.emailVerified,
      userTheme: this.state.userTheme,
      theme: theme === "light" ? lightTheme : darkTheme,
      isLocalhost: window.location.hostname === "localhost",
      loginError: this.state.loginError,
    };

    return (
      <ThemeProvider theme={theme === "light" ? lightTheme : darkTheme}>
        <>
          <GlobalStyles />
          <div className="App" onClick={this.onNavBlur}>
            <Header {...this.props} {...childProps} />
            <div className="contents" onTouchStart={this.onNavBlur}>
              <React.Fragment>
                <Modal
                  style={{ top: "20px" }}
                  show={!!urlLib.getUrlParameter("code") || false}
                >
                  <Modal.Body>
                    <span className="loading-modal-contents">
                      <FontAwesomeIcon icon={faSyncAlt} className="spinning" />{" "}
                      Loading...
                    </span>
                  </Modal.Body>
                </Modal>
                <Routes childProps={childProps} />
              </React.Fragment>
            </div>
            <Footer
              pageKey={window.location.href}
              isLocalhost={childProps.isLocalhost}
            />
          </div>
        </>
      </ThemeProvider>
    );
  }
}

export default withRouter(App);
