import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { Auth, Hub } from "aws-amplify";
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
      scrollDirection: "",
      loginError: "",
    };
  }

  getUserPrevileges = (session) => {
    return new Promise((resolve) => {
      if (session && session.getIdToken) {
        let sessionPayload = session.getIdToken().decodePayload();
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

  getUserAttributes = (session) => {
    return new Promise((resolve) => {
      Auth.currentAuthenticatedUser({
        bypassCache: true,
      })
        .then(async (user) => {
          const currentUserInfo = await Auth.currentUserInfo();
          this.setState(
            {
              userName: user.username,
              name: user.attributes.name,
              email: user.attributes.email,
              identities: user.attributes.identities,
              emailVerified: user.attributes.email_verified,
              preferredUsername: user.attributes.preferred_username,
              picture: user.attributes.picture,
              userTheme: currentUserInfo.attributes["custom:theme"] ?? "auto",
            },
            () => {
              this.setWebsiteTheme();
            }
          );
          await this.getUserPrevileges(session);
          resolve();
        })
        .catch((err) => {
          console.log(err);
          resolve();
        });
    });
  };

  getUserDetails = async (session) => {
    Auth.currentAuthenticatedUser({
      bypassCache: true,
    })
      .then(async (user) => {
        const currentUserInfo = await Auth.currentUserInfo();
        this.setState(
          {
            userName: user.username,
            preferredUsername: user.attributes.preferred_username,
            picture: user.attributes.picture,
            name: user.attributes.name,
            email: user.attributes.email,
            userTheme: currentUserInfo.attributes["custom:theme"] ?? "auto",
          },
          () => {
            this.setWebsiteTheme();
          }
        );

        await this.getUserPrevileges(session);
      })
      .catch((err) => console.log(err));
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
      Auth.federatedSignIn({ provider: "Facebook" });
    }

    if (loginError.indexOf("attributes required: [email]") !== -1) {
      this.setState({
        loginError:
          "The email field was not returned. This may be because the email was missing, invalid or hasn't been confirmed with Facebook.",
      });
    }

    try {
      this.setWebsiteTheme();
      let session = await Auth.currentSession();
      this.getUserDetails(session);
      this.userHasAuthenticated(true);
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
          let session = await Auth.currentSession();
          await this.getUserDetails(session);
          this.userHasAuthenticated(true);
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
    await Auth.signOut();

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

  setScrollDirection = (value) => {
    this.setState({
      scrollDirection: value,
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
      scrollDirection: this.state.scrollDirection,
      setScrollDirection: this.setScrollDirection,
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
