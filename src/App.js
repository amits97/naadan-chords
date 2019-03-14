import React, { Component } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "react-bootstrap";
import Routes from "./Routes";
import "./App.css";

class App extends Component {
  render() {
    return (
      <div className="App container">
        <Navbar fluid="true" collapseOnSelect>
          <Navbar.Brand>
            <Link to="/">HEADER</Link>
          </Navbar.Brand>
          <Navbar.Toggle />
        </Navbar>
        <Routes />
      </div>
    );
  }  
}

export default App;
