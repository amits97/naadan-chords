import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Helmet } from "react-helmet";
import Sidebar from "./Sidebar";
import SearchComponent from "../components/SearchComponent";
import "./NotFound.css";

export default class NotFound extends SearchComponent {
  constructor(props) {
    super(props);
    this.adLoaded = false;
  }

  componentDidMount() {
    window.scrollTo(0, 0);
    this.adLoaded = true;
  }

  componentDidUpdate() {
    SearchComponent.prototype.componentDidUpdate.call(this);
    if(!this.adLoaded) {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    }
  }

  renderTopAd = () => {
    return (
      <div className="ad" style={{maxHeight: "120px"}}>
        <ins className="adsbygoogle"
          style={{display:"block"}}
          data-ad-client="ca-pub-1783579460797635"
          data-ad-slot="6826392919"
          data-ad-format="horizontal"
          data-full-width-responsive="false">
        </ins>
      </div>
    );
  }

  renderNotFound = () => {
    if(this.props.isEmbed) {
      return (
        <div>
          <h3>No posts found!</h3>
          <ul>
            <li><a href="/request">Click here</a> to submit a request for the song you are looking for - it will only take a second.</li>
            <li>If you think there is something wrong, please <a href="https://github.com/amits97/naadan-chords/issues" target="_blank" rel="noopener noreferrer">report a bug</a>.</li>
          </ul>
        </div>
      );
    } else {
      return (
        <div>
          { this.renderTopAd() }
          <Container>
            <Row className="contentRow">
              <Col md={8} className="contentColumn">
                <h3>Page not found!</h3>
                <p>If you think there is something wrong, please <a href="https://github.com/amits97/naadan-chords/issues" target="_blank" rel="noopener noreferrer">report a bug</a>.</p>
              </Col>
              <Col md={4} className="sidebarColumn border-left">
              <Sidebar {...this.props} />
              </Col>
            </Row>
          </Container>
        </div>
      );
    }
  }

  render() {
    return(
      <div className="NotFound">
        <Helmet>
          <meta name="prerender-status-code" content="501" />
        </Helmet>
        { this.renderNotFound() }
      </div>
    );
  }
}