import React from "react";
import { Row, Col } from "react-bootstrap";
import { Helmet } from "react-helmet";
import Sidebar from "./Sidebar";
import SearchComponent from "../components/SearchComponent";
import "./NotFound.css";

export default class NotFound extends SearchComponent {
  componentDidMount() {
    window.scrollTo(0, 0);
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  }

  renderTopAd = () => {
    return (
      <div className="ad">
        <ins className="adsbygoogle bg-light"
          style={{display:"inline-block", width: "728px", height: "90px"}}
          data-ad-client="ca-pub-1783579460797635"
          data-ad-slot="1349463901">
        </ins>
      </div>
    );
  }

  renderNotFound = () => {
    if(this.props.isEmbed) {
      return (
        <div>
          <h3>No posts found!</h3>
          <p>If you think there is something wrong, please <a href="https://github.com/amits97/naadan-chords/issues" target="_blank" rel="noopener noreferrer">report a bug</a>.</p>
        </div>
      );
    } else {
      return (
        <div>
          { this.renderTopAd() }
          <Row className="contentRow">
            <Col md={8} className="contentColumn">
              <h3>Page not found!</h3>
              <p>If you think there is something wrong, please <a href="https://github.com/amits97/naadan-chords/issues" target="_blank" rel="noopener noreferrer">report a bug</a>.</p>
            </Col>
            <Col md={4} className="sidebarColumn border-left">
            <Sidebar {...this.props} />
            </Col>
          </Row>
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