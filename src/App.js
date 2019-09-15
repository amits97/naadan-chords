import React, { Component } from "react";
import { Link, withRouter } from "react-router-dom";
import { LinkContainer } from "react-router-bootstrap";
import { Auth, Hub } from "aws-amplify";
import { Navbar, Nav, Form, FormControl, NavDropdown } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faSearch } from "@fortawesome/free-solid-svg-icons";
import * as urlLib from "./libs/url-lib";
import Routes from "./Routes";
import logo from './logo.svg';
import Footer from "./containers/Footer";
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
      isSearchOpen: false,
      userName: "",
      preferredUsername: "",
      name: "",
      email: "",
      isAdmin: false
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
          email: user.attributes.email
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
        name: user.attributes.name,
        email: user.attributes.email
      });

      await this.getUserPrevileges(session);
    })
    .catch(err => console.log(err));
  }

  async componentDidMount() {
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
          await this.getUserPrevileges(session);
          this.userHasAuthenticated(true);
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
        <NavDropdown title="Account" alignRight>
          <LinkContainer to={`/login?redirect=${this.props.location.pathname}${this.props.location.search}`}>
            <NavDropdown.Item onClick={this.closeNav} role="button">
              Login
            </NavDropdown.Item>
          </LinkContainer>
          <NavDropdown.Divider />
          <LinkContainer to="/signup">
            <NavDropdown.Item onClick={this.closeNav} role="button">
              Signup
            </NavDropdown.Item>
          </LinkContainer>
        </NavDropdown>
      );
    }
  }

  authenticatedOptions = () => {
    if(this.state.isAuthenticated) {
      if(this.state.userName === "") {
        this.getUserDetails();
      }
      return(
        <NavDropdown title="Account" alignRight>
          <LinkContainer to="/account">
            <NavDropdown.Item onClick={this.closeNav} role="button">
              <b>{ this.state.name }</b>
            </NavDropdown.Item>
          </LinkContainer>
          <NavDropdown.Divider />
          <LinkContainer to="/admin" className={`${this.state.isAdmin ? '' : 'd-none'}`}>
            <NavDropdown.Item onClick={this.closeNav} role="button">
              Admin
            </NavDropdown.Item>
          </LinkContainer>
          <NavDropdown.Item onClick={this.handleLogout}>
            Logout
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
    this.setState({
      search: event.target.value
    });
  }

  handleSearchClick = () => {
    this.setState({
      isSearchOpen: true
    });

    setTimeout(() => {
      this.searchInput.current.focus();
    }, 0);
  }

  onSearchBlur = () => {
    this.setState({
      isSearchOpen: false
    });
  }

  handleSearchClose = () => {
    this.setSearch("");
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
      preferredUsername: this.state.preferredUsername
    };

    return (
      <div className="App bg-light" onClick={this.onNavBlur}>
        <Navbar fluid="true" expand="lg" sticky="top" variant="dark" onToggle={this.setNavExpanded} expanded={this.state.navExpanded}>
          <div className="container">
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
              <FormControl type="text" placeholder="Search" className="mr-sm-2" onChange={this.handleSearchChange} value={this.state.search} onBlur={this.onSearchBlur} ref={this.searchInput} />
              <FontAwesomeIcon className="clear-search" onClick={this.handleSearchClose} icon={faTimes} />
            </Form>
            <Navbar.Toggle />
            <Navbar.Collapse className="justify-content-end">
              <Nav>
                <LinkContainer exact to="/">
                  <a href="#/" className="nav-link" onClick={this.closeNav}>Home</a>
                </LinkContainer>
                <LinkContainer exact to="/about">
                  <a href="#/" className="nav-link" onClick={this.closeNav}>About</a>
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
        <div className="container contents bg-white" onTouchStart={this.onNavBlur}>
          <Routes childProps={childProps} />
        </div>
        <Footer />
      </div>
    );
  }  
}

export default withRouter(App);