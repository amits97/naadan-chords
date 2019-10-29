import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Helmet } from "react-helmet";
import { Auth } from "aws-amplify";
import SearchComponent from "../components/SearchComponent";
import Sidebar from "./Sidebar";
import "./Request.css";

export default class Request extends SearchComponent {
  constructor(props) {
    super(props);

    this.requestForm = React.createRef();
  }

  async componentDidMount() {
    const script = document.createElement("script");
    script.defer = true;
    script.src = "//www.123formbuilder.com/embed/359128.js";
    script.type = "text/javascript";
    script.dataset["role"] = "form";
    script.dataset["defaultWidth"] = "650px";

    try {
      let session = await Auth.currentSession();
      this.props.userHasAuthenticated(true);
      await this.props.getUserAttributes(session);
      script.dataset["customVars"] = `control2297463=${this.props.name}&control2297464=${this.props.email}`;
    }
    catch(e) {
      if (e !== 'No current user') {
        console.log(e);
      }
    }

    this.requestForm.current.appendChild(script);
    (window.adsbygoogle = window.adsbygoogle || []).push({});

    window.scrollTo(0, 0);
  }

  renderSEOTags = () => {
    let description = "Contact form to request for the chords of a song that you would really like to see on Naadan Chords.";

    return (
      <Helmet>
        <title>{"Request".toUpperCase()} | Naadan Chords</title>
        <meta name="description" content={description} />
        <meta name="twitter:card" content="summary" />
        <meta property="og:title" content="Request | Naadan Chords" />
        <meta property="og:description" content={description} />
      </Helmet>
    );
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

  render() {
    return(
      <div className="Request">
        { this.renderSEOTags() }
        { this.renderTopAd() }
        <Container>
          <Row className="contentRow">
            <Col md={8} className="contentColumn">
              <div>
                <h1>Request</h1>
                <hr />
              </div>
              <p>Request for the chords of a song that you would really like to see on Naadan Chords.</p>
              <div className="contactForm" ref={this.requestForm}></div>
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