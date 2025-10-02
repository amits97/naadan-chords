import React from "react";
import { Container, Button } from "react-bootstrap";
import { Helmet } from "react-helmet";
import SearchComponent from "../components/SearchComponent";
import "./AdBlocker.css";

export default class AdBlocker extends SearchComponent {
  componentDidMount() {
    window.scrollTo(0, 0);
  }

  handleRecheck = () => {
    this.props.history.goBack();
  };

  render() {
    return (
      <div className="AdBlocker">
        <Helmet>
          <title>Ad Blocker Detected | Naadan Chords</title>
        </Helmet>
        <Container>
          <div>
            <h2>Ad Blocker Detected</h2>
            <hr />
          </div>
          <p>
            Naadan Chords is a free service that relies on ads for its revenue.
          </p>
          <p>Please disable ad blocker to continue.</p>
          <Button block onClick={this.handleRecheck}>
            I have disabled my ad blocker
          </Button>
          <small className="text-muted d-block pt-2">
            You may need to refresh the page after disabling the ad blocker
          </small>
        </Container>
      </div>
    );
  }
}
