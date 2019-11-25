import React, { Component } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { LinkContainer } from "react-router-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import logo from '../logo.svg';
import "./Footer.css";

export default class Footer extends Component {
  constructor(props) {
    super(props);
    this.packageDetails = require('../../package.json');
  }

  render() {
    return(
      <footer className="Footer">
        <Container>
          <Row>
            <Col sm={8}>
              <Row>
                <Col>
                  <h1><Link to="/"><img src={logo} alt="logo" /></Link></h1>
                  <small>Guitar chords and tabs</small><br />
                  <small><a href="/sitemap.xml">sitemap</a> | v{this.packageDetails.version}</small>
                </Col>
                <Col>
                  <h6>CATEGORIES</h6>
                  <ul className="list-unstyled">
                    <li>
                      <LinkContainer exact to="/category/malayalam">
                        <a href="#/">
                          Malayalam
                        </a>
                      </LinkContainer>
                    </li>
                    <li>
                      <LinkContainer exact to="/category/tamil">
                        <a href="#/">
                          Tamil
                        </a>
                      </LinkContainer>
                    </li>
                    <li>
                      <LinkContainer exact to="/category/hindi">
                        <a href="#/">
                          Hindi
                        </a>
                      </LinkContainer>
                    </li>
                 </ul>
                 <h6>PAGES</h6>
                  <ul className="list-unstyled">
                    <li>
                      <LinkContainer exact to="/about">
                        <a href="#/">
                          About
                        </a>
                      </LinkContainer>
                    </li>
                    <li>
                      <LinkContainer exact to="/request">
                        <a href="#/">
                          Request
                        </a>
                      </LinkContainer>
                    </li>
                    <li>
                      <LinkContainer exact to="/privacy-policy">
                        <a href="#/">
                          Privacy<span className="trim"> Policy</span>
                        </a>
                      </LinkContainer>
                    </li>
                  </ul>
                  <h6>MOBILE APPS</h6>
                  <ul className="list-unstyled">
                    <li><a target="_blank" rel="noopener noreferrer" href="https://play.google.com/store/apps/details?id=com.amitsn.naadanchords">Android <FontAwesomeIcon className="external-icon" icon = { faExternalLinkAlt } /></a></li>
                  </ul>
                </Col>
                <Col>
                  <h6>CONTRIBUTE</h6>
                  <ul className="list-unstyled">
                    <li>
                      <LinkContainer exact to="/contributions/new-post">
                        <a href="#/">
                          Submit Song
                        </a>
                      </LinkContainer>
                    </li>
                    <li><a target="_blank" rel="noopener noreferrer" href="https://github.com/amits97/naadan-chords/issues">Report bug <FontAwesomeIcon className="external-icon" icon = { faExternalLinkAlt } /></a></li>
                    <li><a target="_blank" rel="noopener noreferrer" href="https://github.com/amits97/naadan-chords/">GitHub <FontAwesomeIcon className="external-icon" icon = { faExternalLinkAlt } /></a></li>
                  </ul>
                  <h6>SOCIAL MEDIA</h6>
                  <ul className="list-unstyled">
                    <li><a target="_blank" rel="noopener noreferrer" href="https://facebook.com/naadanchords">Facebook <FontAwesomeIcon className="external-icon" icon = { faExternalLinkAlt } /></a></li>
                    <li><a target="_blank" rel="noopener noreferrer" href="https://instagram.com/naadanchords">Instagram <FontAwesomeIcon className="external-icon" icon = { faExternalLinkAlt } /></a></li>
                    <li><a target="_blank" rel="noopener noreferrer" href="https://www.youtube.com/channel/UCwV3HuITY0zprR5QjyJX8lg">YouTube <FontAwesomeIcon className="external-icon" icon = { faExternalLinkAlt } /></a></li>
                    <li><a target="_blank" rel="noopener noreferrer" href="https://www.soundcloud.com/asn">SoundCloud <FontAwesomeIcon className="external-icon" icon = { faExternalLinkAlt } /></a></li>
                  </ul>
                </Col>
              </Row>
            </Col>
            <Col sm={4}></Col>
          </Row>
        </Container>
      </footer>
    );
  }
}