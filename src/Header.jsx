import React from "react";
import { Link } from "react-router-dom";
import { LinkContainer } from "react-router-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Navbar, Nav, Form, NavDropdown } from "react-bootstrap";
import {
  faTimes,
  faSearch,
  faUserCircle,
  faCog,
  faShieldAlt,
  faFeather,
  faPowerOff,
} from "@fortawesome/free-solid-svg-icons";
import { AsyncTypeahead } from "react-bootstrap-typeahead";
import { API, slugify } from "./libs/utils";
import * as urlLib from "./libs/url-lib";
import logo from "./logo.svg";

import "./Header.css";

export default function Header({
  history,
  location,
  isAuthenticated,
  username,
  getUserDetails,
  picture,
  name,
  isAdmin,
  handleLogout,
  navExpanded,
  setNavExpanded,
  setSearch,
}) {
  const searchInput = React.useRef();
  const activeSearchIndex = React.useRef(-1);
  const searchText = React.useRef("");

  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [searchOptions, setSearchOptions] = React.useState([]);

  const handleSearchClick = () => {
    setIsSearchOpen(true);

    setTimeout(() => {
      searchInput.current.focus();
    }, 0);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
  };

  const handleSearchChange = (event) => {
    if (event && event[0]) {
      const postSlug = slugify(event[0]);
      searchInput.current.clear();
      searchInput.current.blur();
      setIsSearchOpen(false);
      history.push(`/${postSlug}`);
    }
  };

  const onSearch = async (query) => {
    setSearchLoading(true);
    let searchOptions = [];
    let posts = await API.get("posts", `/posts?s=${query}`);
    if (posts && posts.Items && posts.Items.length > 0) {
      searchOptions = posts.Items.map((post) => {
        return post.title;
      });
    }

    setSearchOptions(searchOptions);
    setSearchLoading(false);
  };

  const handleSearchClose = () => {
    searchInput.current.clear();
    searchInput.current.blur();
    setIsSearchOpen(false);
  };

  const closeNav = () => {
    setNavExpanded(false);
  };

  const updateFromTypeaheadState = (state) => {
    const { activeIndex } = state;
    if (activeSearchIndex.current !== activeIndex) {
      activeSearchIndex.current = activeIndex;
    }
  };

  const unauthenticatedOptions = () => {
    if (!isAuthenticated) {
      return (
        <LinkContainer
          to={
            urlLib.getUrlParameter("redirect")
              ? `/login?redirect=${urlLib.getUrlParameter("redirect")}`
              : `/login?redirect=${location.pathname}${location.search}`
          }
        >
          <a href="#/" className="nav-link user-link">
            <FontAwesomeIcon className="user-icon" icon={faUserCircle} /> Login
          </a>
        </LinkContainer>
      );
    }
  };

  const authenticatedOptions = () => {
    if (isAuthenticated) {
      if (username === "") {
        getUserDetails();
      }
      const dpFragment = picture ? (
        <React.Fragment>
          <img className="user-dp" src={picture} alt={name} />
          <span title={name} className="user-name">
            {name.split(" ")[0]}
          </span>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <FontAwesomeIcon className="user-icon" icon={faUserCircle} />
          <span title={name} className="user-name">
            {name.split(" ")[0]}
          </span>
        </React.Fragment>
      );

      return (
        <NavDropdown title={dpFragment} alignRight>
          <LinkContainer to="/account">
            <NavDropdown.Item onClick={closeNav} role="button">
              <React.Fragment>
                <FontAwesomeIcon className="account-icon" icon={faCog} />
                Account
              </React.Fragment>
            </NavDropdown.Item>
          </LinkContainer>
          <NavDropdown.Divider />
          <LinkContainer to="/admin" className={`${isAdmin ? "" : "d-none"}`}>
            <NavDropdown.Item onClick={closeNav} role="button">
              <React.Fragment>
                <FontAwesomeIcon className="account-icon" icon={faShieldAlt} />
                Admin
              </React.Fragment>
            </NavDropdown.Item>
          </LinkContainer>
          <LinkContainer to="/contributions">
            <NavDropdown.Item onClick={closeNav} role="button">
              <React.Fragment>
                <FontAwesomeIcon className="account-icon" icon={faFeather} />
                Contributions
              </React.Fragment>
            </NavDropdown.Item>
          </LinkContainer>
          <NavDropdown.Item onClick={handleLogout}>
            <React.Fragment>
              <FontAwesomeIcon className="account-icon" icon={faPowerOff} />
              Logout
            </React.Fragment>
          </NavDropdown.Item>
        </NavDropdown>
      );
    }
  };

  return (
    <span className="Header">
      <Navbar
        sticky="top"
        fluid="true"
        expand="lg"
        variant="dark"
        onToggle={setNavExpanded}
        expanded={navExpanded}
      >
        <div className="container">
          <Navbar.Brand>
            <Link to="/">
              <img src={logo} alt="logo" width="50" height="50" />
              <h1>Naadan Chords</h1>
            </Link>
          </Navbar.Brand>
          <button
            className={`navbar-toggler search-button ${
              navExpanded ? "d-none" : ""
            }`}
            onClick={handleSearchClick}
          >
            <FontAwesomeIcon icon={faSearch} />
          </button>
          <Form
            inline
            className={`search-form ${isSearchOpen ? "show-search" : ""}`}
            onSubmit={handleSearchSubmit}
          >
            <AsyncTypeahead
              id="search"
              placeholder="Search"
              isLoading={searchLoading}
              className="search-input mr-sm-2"
              onChange={handleSearchChange}
              onInputChange={(text) => (searchText.current = text)}
              onSearch={onSearch}
              ref={searchInput}
              options={searchOptions}
              filterBy={(option) => option}
              useCache={false}
              onKeyDown={(e) => {
                // Check whether the 'enter' key was pressed, and also make sure that
                // no menu items are highlighted.
                if (e.keyCode === 13 && activeSearchIndex.current === -1) {
                  setSearch(searchText.current);
                  handleSearchClose();
                }
              }}
            >
              {(state) => updateFromTypeaheadState(state)}
            </AsyncTypeahead>
            {searchLoading ? null : (
              <FontAwesomeIcon
                className="clear-search"
                onClick={handleSearchClose}
                icon={faTimes}
              />
            )}
          </Form>
          <Navbar.Toggle />
          <Navbar.Collapse className="navbar-holder justify-content-end">
            <Nav>
              <LinkContainer exact to="/">
                <a href="#/" className="nav-link" onClick={closeNav}>
                  Home
                </a>
              </LinkContainer>
              <LinkContainer exact to="/contributions/submit-song">
                <a href="#/" className="nav-link" onClick={closeNav}>
                  Submit Song
                </a>
              </LinkContainer>
              <LinkContainer exact to="/request">
                <a href="#/" className="nav-link" onClick={closeNav}>
                  Request
                </a>
              </LinkContainer>
              {unauthenticatedOptions()}
              {authenticatedOptions()}
            </Nav>
          </Navbar.Collapse>
        </div>
      </Navbar>
    </span>
  );
}
