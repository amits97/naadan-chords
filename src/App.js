import React, { Component } from "react";
import { Link, withRouter } from "react-router-dom";
import { LinkContainer } from "react-router-bootstrap";
import { Auth } from "aws-amplify";
import { Navbar, Nav, Form, FormControl } from "react-bootstrap";
import * as urlLib from "./libs/url-lib";
import Routes from "./Routes";
import logo from './logo.svg';
import Footer from "./containers/Footer";
import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      navExpanded: false,
      isAuthenticated: false,
      isAuthenticating: true,
      search: ""
    };
  }

  async componentDidMount() {
    try {
      await Auth.currentSession();
      this.userHasAuthenticated(true);
    }
    catch(e) {
      if (e !== 'No current user') {
        alert(e);
      }
    }
  
    this.setState({
      isAuthenticating: false,
      search: urlLib.getUrlParameter("s")
    });
  }
  
  userHasAuthenticated = authenticated => {
    this.setState({ isAuthenticated: authenticated });
  }

  handleLogout = async event => {
    event.preventDefault();
    await Auth.signOut();
  
    this.userHasAuthenticated(false);
    this.closeNav();
    this.props.history.push("/");
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

  authenticatedOptions = () => {
    if(this.state.isAuthenticated) {
      return(
        <React.Fragment>
          <LinkContainer to="/admin">
            <a href="#/" className="nav-link" onClick={this.closeNav}>Admin</a>
          </LinkContainer>
          <a href="#/" className="nav-link" onClick={this.handleLogout}>Logout</a>
        </React.Fragment>
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

  render() {
    const childProps = {
      isAuthenticated: this.state.isAuthenticated,
      userHasAuthenticated: this.userHasAuthenticated,
      search: this.state.search,
      setSearch: this.setSearch,
      closeNav: this.closeNav
    };

    return (
      <div className="App">
        <Navbar fluid="true" expand="lg" sticky="top" variant="dark" onToggle={this.setNavExpanded} expanded={this.state.navExpanded}>
          <div className="container-fluid">
            <Navbar.Brand>
              <Link to="/">
                <img src={logo} alt="logo" />
                <p>NAADAN<span>CHORDS</span></p>
              </Link>
            </Navbar.Brand>
            <Navbar.Toggle />
            <Navbar.Collapse className={`justify-content-end ${this.state.search ? 'show-search':''}`}>
              <Form inline className={`search-form ${this.state.search ? 'fixed-search':''}`} onSubmit={this.handleSearchSubmit}>
                <FormControl type="text" placeholder="Search" className="mr-sm-2" onChange={this.handleSearchChange} value={this.state.search} />
              </Form>
              <Nav>
                <LinkContainer exact to="/">
                  <a href="#/" className="nav-link" onClick={this.closeNav}>Home</a>
                </LinkContainer>
                <LinkContainer exact to="/about">
                  <a href="#/" className="nav-link" onClick={this.closeNav}>About</a>
                </LinkContainer>
                { this.authenticatedOptions() }
              </Nav>
            </Navbar.Collapse>
          </div>
        </Navbar>
        <div className="container contents">
          <Routes childProps={childProps} />
        </div>
        <Footer />
      </div>
    );
  }  
}

export default withRouter(App);