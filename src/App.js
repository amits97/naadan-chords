import React, { Component } from "react";
import { Link } from "react-router-dom";
import { LinkContainer } from "react-router-bootstrap";
import { Navbar, Nav } from "react-bootstrap";
import Routes from "./Routes";
import logo from './logo.svg';
import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      navExpanded: false,
    };
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

  render() {
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
              </Nav>
            </Navbar.Collapse>
          </div>
        </Navbar>
        <Routes />
      </div>
    );
  }  
}

export default App;
