import React, {Component} from "react";
import { Row, Col } from "react-bootstrap";
import { Helmet } from "react-helmet";
import Sidebar from "./Sidebar";
import "./NotFound.css";

export default class NotFound extends Component {
  componentDidMount() {
    window.scrollTo(0, 0);
  }

  render404Core = () => {
    return (
      <div>
        <h3>Sorry, page not found!</h3>
        <p>If you think there is something wrong, please <a href="https://github.com/amits97/naadan-chords/issues" target="_blank" rel="noopener noreferrer">report a bug</a>.</p>
      </div>
    );
  }

  renderNotFound = () => {
    if(this.props.isEmbed) {
      return this.render404Core();
    } else {
      return (
        <Row className="contentRow">
          <Col md={8} className="contentColumn">
            { this.render404Core() }
          </Col>
          <Col md={4} className="sidebarColumn border-left">
            <Sidebar pageKey={this.props.pageKey} />
          </Col>
        </Row>
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