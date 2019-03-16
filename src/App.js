import React, { Component } from "react";
import { Link, withRouter } from "react-router-dom";
import { LinkContainer } from "react-router-bootstrap";
import { Auth } from "aws-amplify";
import { Navbar, Nav } from "react-bootstrap";
import Routes from "./Routes";
import logo from './logo.svg';
import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      navExpanded: false,
      isAuthenticated: false,
      isAuthenticating: true
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
  
    this.setState({ isAuthenticating: false });
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

  render() {
    const childProps = {
      isAuthenticated: this.state.isAuthenticated,
      userHasAuthenticated: this.userHasAuthenticated
    };

    return (
      <div className="App">
        <Navbar fluid="true" expand="lg" sticky="top" variant="dark" onToggle={this.setNavExpanded} expanded={this.state.navExpanded}>
          <div className="container">
            <Navbar.Brand>
              <Link to="/">
                <img src={logo} alt="logo" />
                <p>NAADAN<span>CHORDS</span></p>
              </Link>
            </Navbar.Brand>
            <Navbar.Toggle />
            <Navbar.Collapse className="justify-content-end">
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
      </div>
    );
  }  
}

export default withRouter(App);