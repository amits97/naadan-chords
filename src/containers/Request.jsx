import React from "react";
import {
  Container,
  Row,
  Col,
  FormGroup,
  FormLabel,
  FormControl,
  FormText,
  Button,
} from "react-bootstrap";
import { Helmet } from "react-helmet";
import { fetchAuthSession } from "aws-amplify/auth";
import { API } from "../libs/utils";
import LoaderButton from "../components/LoaderButton";
import SearchComponent from "../components/SearchComponent";
import Sidebar from "./Sidebar";
import "./Request.css";

export default class Request extends SearchComponent {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      isErrorState: false,
      errorMessage: "",
      submitted: false,
      name: "",
      email: "",
      message: "",
    };
  }

  validateForm() {
    return (
      this.state.name.length > 0 &&
      this.state.email.length > 0 &&
      this.state.message.length
    );
  }

  handleChange = (event) => {
    this.setState({
      [event.target.id]: event.target.value,
    });
  };

  handleSubmit = async (event) => {
    event.preventDefault();
    const { name, email, message } = this.state;
    this.setState({ isLoading: true, isErrorState: false, errorMessage: "" });

    try {
      await API.post("posts", `/request`, {
        body: {
          name,
          email,
          message,
        },
      });
    } catch (e) {
      this.setState({
        isLoading: false,
        isErrorState: true,
        errorMessage: e.message,
        errorType: e.code,
      });
    } finally {
      this.setState({
        isLoading: false,
        submitted: true,
      });
    }
  };

  async componentDidMount() {
    try {
      let session = await fetchAuthSession();
      await this.props.getUserAttributes(session);
      if (this.props.isAuthenticated) {
        this.props.userHasAuthenticated(true);
        this.setState({
          name: this.props.name,
          email: this.props.email,
        });
      }
    } catch (e) {
      if (e !== "No current user") {
        console.log(e);
      }
    }

    window.scrollTo(0, 0);
  }

  renderSEOTags = () => {
    let description =
      "Contact form to request for the chords of a song that you would really like to see on Naadan Chords.";

    return (
      <Helmet>
        <title>{"Request".toUpperCase()} | Naadan Chords</title>
        <meta name="description" content={description} />
        <meta name="twitter:card" content="summary" />
        <meta property="og:title" content="Request | Naadan Chords" />
        <meta property="og:description" content={description} />
      </Helmet>
    );
  };

  renderTopAd = () => {
    return (
      <div className="ad" style={{ maxHeight: "120px" }}>
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client="ca-pub-1783579460797635"
          data-ad-slot="6826392919"
          data-ad-format="horizontal"
          data-full-width-responsive="false"
        ></ins>
      </div>
    );
  };

  render() {
    return (
      <div className="Request">
        {this.renderSEOTags()}
        <Container>
          <Row className="contentRow">
            <Col lg={8} className="contentColumn">
              {this.renderTopAd()}
              <div>
                <h2>Request</h2>
                <hr />
              </div>

              {this.state.submitted ? (
                <React.Fragment>
                  {this.state.isErrorState ? (
                    <p>
                      Failed to submit!
                      <br />
                      {this.state.errorMessage}
                    </p>
                  ) : (
                    <p>
                      Thank you! Your request has been submitted.
                      <br />
                      We will try our best to publish your request as soon as
                      possible.
                    </p>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() =>
                      this.setState({
                        submitted: false,
                        message: this.state.isErrorState
                          ? this.state.message
                          : "",
                      })
                    }
                  >
                    Go back
                  </Button>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <p>
                    Request for the chords of a song that you would really like
                    to see on Naadan Chords.
                  </p>
                  <form onSubmit={this.handleSubmit}>
                    <FormGroup controlId="name">
                      <FormLabel>Name</FormLabel>
                      <FormControl
                        type="text"
                        value={this.state.name}
                        onChange={this.handleChange}
                      />
                    </FormGroup>
                    <FormGroup controlId="email">
                      <FormLabel>Email</FormLabel>
                      <FormControl
                        type="email"
                        value={this.state.email}
                        onChange={this.handleChange}
                      />
                      <FormText className="text-muted">
                        Used only to let you know when the song is posted.
                      </FormText>
                    </FormGroup>
                    <FormGroup controlId="message">
                      <FormLabel>Message</FormLabel>
                      <FormControl
                        as="textarea"
                        value={this.state.message}
                        onChange={this.handleChange}
                        rows={3}
                      />
                    </FormGroup>
                    <LoaderButton
                      block
                      disabled={!this.validateForm()}
                      type="submit"
                      isLoading={this.state.isLoading}
                      text="Submit Request"
                      loadingText="Submitting Request…"
                    />
                  </form>
                </React.Fragment>
              )}
            </Col>
            <Col lg={4} className="sidebarColumn">
              <Sidebar {...this.props} />
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}
