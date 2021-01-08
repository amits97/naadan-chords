import React, { Component } from "react";
import { Link, withRouter } from "react-router-dom";
import { LinkContainer } from "react-router-bootstrap";
import { API, Auth, Hub } from "aws-amplify";
import { Modal, Navbar, Nav, Form, NavDropdown } from "react-bootstrap";
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faSearch, faSyncAlt, faUserCircle, faCog, faShieldAlt, faFeather, faPowerOff } from "@fortawesome/free-solid-svg-icons";
import * as urlLib from "./libs/url-lib";
import { isAbsoluteUrl, slugify } from "./libs/utils";
import Routes from "./Routes";
import logo from './logo.svg';
import Footer from "./containers/Footer";
import 'react-bootstrap-typeahead/css/Typeahead.css';
import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);

    this.searchInput = React.createRef();

    this.state = {
      navExpanded: false,
      isAuthenticated: false,
      isAuthenticating: true,
      search: "",
      searchLoading: false,
      searchOptions: [],
      isSearchOpen: false,
      userName: "",
      preferredUsername: "",
      picture: "",
      name: "",
      email: "",
      isAdmin: false,
      identities: "[]",
      emailVerified: false
    };
  }

  getUserPrevileges = (session) => {
    return new Promise(resolve => {
      if(session && session.getIdToken) {
        let sessionPayload = session.getIdToken().decodePayload();
        if(sessionPayload["cognito:groups"] && sessionPayload["cognito:groups"].includes("admin")) {
          this.setState({
            isAdmin: true
          }, resolve);
        } else {
          this.setState({
            isAdmin: false
          }, resolve);
        }
      }
      resolve();
    });
  }

  getUserAttributes = (session) => {
    return new Promise(resolve => {
      Auth.currentAuthenticatedUser({
        bypassCache: true
      })
      .then(async user => {
        this.setState({
          userName: user.username,
          name: user.attributes.name,
          email: user.attributes.email,
          identities: user.attributes.identities,
          emailVerified: user.attributes.email_verified,
          preferredUsername: user.attributes.preferred_username,
          picture: user.attributes.picture
        });
        await this.getUserPrevileges(session);
        resolve();
      })
      .catch(err => {
        console.log(err);
        resolve();
      });
    });
  }

  getUserDetails = async (session) => {
    Auth.currentAuthenticatedUser({
      bypassCache: true
    })
    .then(async user => {
      this.setState({
        userName: user.username,
        preferredUsername: user.attributes.preferred_username,
        picture: user.attributes.picture,
        name: user.attributes.name,
        email: user.attributes.email
      });

      await this.getUserPrevileges(session);
    })
    .catch(err => console.log(err));
  }

  async componentDidMount() {
    const loginError = urlLib.getUrlParameter("error_description");
    if (loginError.indexOf('Already found an entry for username') !== -1) {
      // TODO: Known issue with Cognito merging accounts. Ugly! Clean up if possible.
      Auth.federatedSignIn({ provider: 'Facebook' });
    }

    try {
      let session = await Auth.currentSession();
      this.getUserDetails(session);
      this.userHasAuthenticated(true);
    }
    catch(e) {
      if (e !== 'No current user') {
        console.log(e);
      }
    }
  
    this.setState({
      isAuthenticating: false,
      search: urlLib.getUrlParameter("s")
    });

    this.subscribeAuthEvents();
  }

  subscribeAuthEvents = async () => {
    const listener = async (data) => {
      switch (data.payload.event) {
        case 'signIn':
          let session = await Auth.currentSession();
          await this.getUserDetails(session);
          this.userHasAuthenticated(true);
          if(typeof Storage !== "undefined") {
            let redirectUrl = localStorage.getItem("redirectUrl");
            if(redirectUrl && redirectUrl !== "null" && !isAbsoluteUrl(redirectUrl)) {
              localStorage.removeItem("redirectUrl");
              window.location.href = redirectUrl;
            }
          }
          break;
        default:
          break;
      }
    }

    Hub.listen('auth', listener);
  }

  userHasAuthenticated = authenticated => {
    this.setState({ isAuthenticated: authenticated });
  }

  handleLogout = async event => {
    event.preventDefault();
    await Auth.signOut();
  
    this.userHasAuthenticated(false);
    this.closeNav();
  }

  setNavExpanded = (expanded) => {
    this.setState({
      navExpanded: expanded
    });
  }

  closeNav = () => {
    this.setState({
      navExpanded: false
    });
  }

  unauthenticatedOptions = () => {
    if(!this.state.isAuthenticated) {
      return (
        <LinkContainer to={urlLib.getUrlParameter("redirect") ? `/login?redirect=${urlLib.getUrlParameter("redirect")}` : `/login?redirect=${this.props.location.pathname}${this.props.location.search}`}>
          <a href="#/" className="nav-link user-link">
            <FontAwesomeIcon className="user-icon" icon={faUserCircle} /> Login
          </a>
        </LinkContainer>
      );
    }
  }

  authenticatedOptions = () => {
    if(this.state.isAuthenticated) {
      if(this.state.userName === "") {
        this.getUserDetails();
      }
      const dpFragment = this.state.picture ? (
        <React.Fragment>
          <img className="user-dp" src={this.state.picture} alt={this.state.name} />
          <span title={this.state.name} className="user-name">
            { this.state.name.split(' ')[0] }
          </span>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <FontAwesomeIcon className="user-icon" icon={faUserCircle} />
          <span title={this.state.name} className="user-name">
            { this.state.name.split(' ')[0] }
          </span>
        </React.Fragment>
      );

      return(
        <NavDropdown title={dpFragment} alignRight>
          <LinkContainer to="/account">
            <NavDropdown.Item onClick={this.closeNav} role="button">
              <React.Fragment>
                <FontAwesomeIcon className="account-icon" icon={faCog} />
                Account
              </React.Fragment>
            </NavDropdown.Item>
          </LinkContainer>
          <NavDropdown.Divider />
          <LinkContainer to="/admin" className={`${this.state.isAdmin ? '' : 'd-none'}`}>
            <NavDropdown.Item onClick={this.closeNav} role="button">
              <React.Fragment>
                <FontAwesomeIcon className="account-icon" icon={faShieldAlt} />
                Admin
              </React.Fragment>
            </NavDropdown.Item>
          </LinkContainer>
          <LinkContainer to="/contributions">
            <NavDropdown.Item onClick={this.closeNav} role="button">
              <React.Fragment>
                <FontAwesomeIcon className="account-icon" icon={faFeather} />
                Contributions
              </React.Fragment>
            </NavDropdown.Item>
          </LinkContainer>
          <NavDropdown.Item onClick={this.handleLogout}>
            <React.Fragment>
              <FontAwesomeIcon className="account-icon" icon={faPowerOff} />
              Logout
            </React.Fragment>
          </NavDropdown.Item>
        </NavDropdown>
      );
    }
  }

  setSearch = (value) => {
    this.setState({
      search: value
    });
  }

  handleSearchSubmit = (event) => {
    event.preventDefault();
  }

  handleSearchChange = (event) => {
    if (event && event[0]) {
        let postSlug = slugify(event[0]);
        this.searchInput.current.clear();
        this.searchInput.current.blur();
        this.setState({
          isSearchOpen: false
        });
        this.props.history.push(`/${postSlug}`);
      }
  }

  handleSearchClick = () => {
    this.setState({
      isSearchOpen: true
    });

    setTimeout(() => {
      this.searchInput.current.focus();
    }, 0);
  }

  onSearch = async (query) => {
    this.setState({
      searchLoading: true
    });
    let searchOptions = [];
    let posts = await API.get("posts", `/posts?s=${query}`);
    if (posts && posts.Items && posts.Items.length > 0) {
      searchOptions = posts.Items.map((post) => {
          return post.title;
      });
    }

    this.setState({
      searchOptions,
      searchLoading: false
    });
  }

  handleSearchClose = () => {
    this.searchInput.current.clear();
    this.searchInput.current.blur();
    this.setState({
      isSearchOpen: false
    });
  }

  onNavBlur = (e) => {
    if(this.state.navExpanded === true) {
      let clickedElement = e.target;
      let clickedElementClassList = clickedElement ? clickedElement.classList : "";
      if(!clickedElementClassList.contains("navbar-toggler-icon")
        && !clickedElementClassList.contains("dropdown-toggle")) {
        setTimeout(() => {
          this.setState({
            navExpanded: false
          });
        }, 250);
      }
    }
  }

  render() {
    const childProps = {
      isAuthenticated: this.state.isAuthenticated,
      userHasAuthenticated: this.userHasAuthenticated,
      getUserDetails: this.getUserDetails,
      getUserPrevileges: this.getUserPrevileges,
      getUserAttributes: this.getUserAttributes,
      isAdmin: this.state.isAdmin,
      search: this.state.search,
      setSearch: this.setSearch,
      closeNav: this.closeNav,
      username: this.state.userName,
      name: this.state.name,
      email: this.state.email,
      preferredUsername: this.state.preferredUsername,
      picture: this.state.picture,
      identities: this.state.identities,
      emailVerified: this.state.emailVerified
    };

    return (
      <div className="App" onClick={this.onNavBlur}>
        <Navbar fluid="true" expand="lg" sticky="top" variant="dark" onToggle={this.setNavExpanded} expanded={this.state.navExpanded}>
          <div className="container-fluid">
            <Navbar.Brand>
              <Link to="/">
                <img src={logo} alt="logo" />
                <p>NAADAN<span>CHORDS</span></p>
              </Link>
            </Navbar.Brand>
            <button className={`navbar-toggler search-button ${this.state.navExpanded ? "d-none": ""}`} onClick={this.handleSearchClick}>
              <FontAwesomeIcon icon={faSearch} />
            </button>
            <Form inline className={`search-form ${this.state.search || this.state.isSearchOpen ? 'show-search':''}`} onSubmit={this.handleSearchSubmit}>
              <AsyncTypeahead id="search" placeholder="Search" isLoading={this.state.searchLoading} className="search-input mr-sm-2" onChange={this.handleSearchChange} onSearch={this.onSearch} ref={this.searchInput} options={this.state.searchOptions} filterBy={(option) => option} useCache={false} />
              { this.state.searchLoading ? null : <FontAwesomeIcon className="clear-search" onClick={this.handleSearchClose} icon={faTimes} /> }
            </Form>
            <Navbar.Toggle />
            <Navbar.Collapse className="justify-content-end">
              <Nav>
                <LinkContainer exact to="/">
                  <a href="#/" className="nav-link" onClick={this.closeNav}>Home</a>
                </LinkContainer>
                <LinkContainer exact to="/contributions/submit-song">
                  <a href="#/" className="nav-link" onClick={this.closeNav}>Submit Song</a>
                </LinkContainer>
                <LinkContainer exact to="/request">
                  <a href="#/" className="nav-link" onClick={this.closeNav}>Request</a>
                </LinkContainer>
                { this.unauthenticatedOptions() }
                { this.authenticatedOptions() }
              </Nav>
            </Navbar.Collapse>
          </div>
        </Navbar>
        <div className="contents bg-white" onTouchStart={this.onNavBlur}>
          <React.Fragment>
            <Modal
              style={{top: "20px"}}
              show={urlLib.getUrlParameter("code") || false}
            >
              <Modal.Body>
                <span className="loading-modal-contents">
                  <FontAwesomeIcon icon={faSyncAlt} className="spinning" /> Loading...
                </span>
              </Modal.Body>
            </Modal>
            <Routes childProps={childProps} />
          </React.Fragment>
        </div>
        <Footer />
      </div>
    );
  }  
}

export default withRouter(App);