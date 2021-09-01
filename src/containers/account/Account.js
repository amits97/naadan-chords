import React from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { Auth, API, Storage } from "aws-amplify";
import { Alert, Button, Dropdown, Form, FormGroup, FormControl, FormLabel, Row, Col, Nav, Tab, FormText } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook } from "@fortawesome/free-brands-svg-icons";
import { faPencilAlt, faTimes, faTrashAlt, faUpload } from "@fortawesome/free-solid-svg-icons";
import { Helmet } from "react-helmet";
import Avatar from 'react-avatar-edit'
import SearchComponent from "../../components/SearchComponent";
import LoaderButton from "../../components/LoaderButton";
import { base64toBlob } from "../../libs/utils";
import * as urlLib from "../../libs/url-lib";
import "./Account.css";
import { LinkContainer } from "react-router-bootstrap";

export default class Account extends SearchComponent {
  constructor(props) {
    super(props);

    this.state = {
      activeTab: "profile",
      isInitialLoading: false,
      isLoading: false,
      name: "",
      username: "",
      email: "",
      isSuccessState: false,
      isErrorState: false,
      errorMessage: "",
      usernameValid: true,
      avatarPreview: null,
      avatarEditMode: false,
      usernameMessage: "",
      previousPassword: "",
      newPassword: "",
      newPasswordConfirm: "",
      identities: [],
      emailVerified: false,
      userTheme: "auto"
    };
  }

  async componentDidMount() {
    window.scrollTo(0, 0);
    this.setState({
      isInitialLoading: true
    });
    try {
      let session = await Auth.currentSession();
      await this.props.getUserAttributes(session);
      let identities = [];

      try {
        identities = JSON.parse(this.props.identities);
      } catch(e) {
        // Do nothing
      }

      this.setState({
        isInitialLoading: false,
        name: this.props.name,
        username: this.props.preferredUsername ? this.props.preferredUsername: this.props.username,
        email: this.props.email,
        identities,
        emailVerified: this.props.emailVerified,
        userTheme: this.props.userTheme
      });
    } catch (e) {
      this.setState({
        isInitialLoading: false
      });
    }

    let activeTabInUrl = urlLib.getUrlParameter("tab");
    let activeTab = activeTabInUrl ? activeTabInUrl : "profile";

    this.setState({
      activeTab
    }, () => {
      if(!activeTabInUrl) {
        urlLib.insertUrlParam("tab", activeTab);
      }
    });
  }

  validateForm() {
    let { activeTab } = this.state;
    let valid = true;

    if(activeTab === "profile") {
      valid = this.state.name.length > 0 && this.state.username.length > 0 && this.state.email.length > 0;
      valid = valid && (this.props.name !== this.state.name || (this.props.preferredUsername ? this.props.preferredUsername !== this.state.username : this.props.username !== this.state.username) || (this.state.avatarPreview || this.state.avatarEditMode));
    } else if(activeTab === "password") {
      valid = this.state.previousPassword.length > 0 && this.state.newPassword.length > 0 && this.state.newPasswordConfirm.length > 0;
      valid = valid && this.validatePassword() && this.validatePasswordConfirm();
    }

    return valid;
  }

  handleChange = event => {
    this.setState({
      [event.target.id]: event.target.value,
      usernameValid: true
    });
  }

  renderError = () => {
    if(this.state.isErrorState) {
      return(
        <Alert variant="danger" onClose={() => this.setState({isErrorState: false}) } dismissible>
          {this.state.errorMessage}
        </Alert>
      );
    }
  }

  renderSuccess = () => {
    if(this.state.isSuccessState) {
      return(
        <Alert variant="success"  onClose={() => this.setState({isSuccessState: false}) } dismissible>
          Updated!
        </Alert>
      );  
    }
  }

  handleSubmit = async (event, type) => {
    event.preventDefault();

    this.setState({
      isLoading: true,
      isSuccessState: false,
      isErrorState: false
    });

    if (type === "profile") {
      let valid = this.validateUserName();

      if(!valid) {
        this.setState({
          isLoading: false
        });
        return;
      }

      try {
        let request = {};

        if (this.state.avatarPreview) {
          const blobData = base64toBlob(this.state.avatarPreview.replace(/^data:image\/(png);base64,/, ''));
          const fileName = `${this.props.preferredUsername ?? this.props.username}.png`;

          await Storage.put(fileName, blobData, {
            contentType: 'image/png',
            bucket: "naadanchords-avatars"
          });

          request.picture = `https://s3.ap-south-1.amazonaws.com/naadanchords-avatars/public/${fileName}`;
        } else if (this.state.avatarEditMode) {
          request.picture = 'null';
        }

        if(this.props.name !== this.state.name) {
          request.name = this.state.name;
        }

        if(this.props.preferredUsername ? this.props.preferredUsername !== this.state.username : this.props.username !== this.state.username) {
          request.username = this.state.username;
        }

        await API.post("posts", "/account/update", {
          body: request
        });

        let session = await Auth.currentSession();
        await this.props.getUserAttributes(session);

        this.setState({
          isLoading: false,
          isSuccessState: true,
          avatarPreview: null,
          avatarEditMode: false
        });
      } catch(e) {
        this.setState({
          isLoading: false,
          isErrorState: true,
          usernameValid: e.response?.data?.code !== "UsernameExistsException",
          usernameMessage: e.response?.data?.message || e.message,
          errorMessage: e.response?.data?.message || e.message,
          name: this.props.name
        });
      }
    } else if (type === "password") {
      try {
        let user = await Auth.currentAuthenticatedUser();
        let { previousPassword, newPassword } = this.state;

        await Auth.changePassword(user, previousPassword, newPassword);
        this.setState({
          isLoading: false,
          isSuccessState: true
        });
      } catch(e) {
        this.setState({
          isLoading: false,
          isErrorState: true,
          errorMessage: e.message,
          name: this.props.name
        });
      }
    } else if (type === "appearance") {
      const { userTheme } = this.state;
      try {
        const user = await Auth.currentAuthenticatedUser();
        await Auth.updateUserAttributes(user, {
          'custom:theme': userTheme
        });
        this.setState({
          isLoading: false,
          isSuccessState: true
        });
        await this.props.getUserAttributes();
      } catch(e) {
        this.setState({
          isLoading: false,
          isErrorState: true,
          errorMessage: e.message
        });
      }
    } else {
      this.setState({
        isLoading: false
      });
    }
  }

  validateUserName = () => {
    let {username} = this.state;
    const regExp = /^[a-zA-Z0-9]+$/;

    if(username.match(regExp) === null) {
      this.setState({
        usernameValid: false,
        usernameMessage: "Please enter valid username with only letters and numbers."
      });
      return false;
    }
    return true;
  }

  validatePassword = () => {
    let { newPassword } = this.state;
    return newPassword ? newPassword.length > 7 : true;
  }

  validatePasswordConfirm = () => {
    let { newPasswordConfirm, newPassword } = this.state;
    return newPasswordConfirm ? newPasswordConfirm === newPassword : true;
  }

  renderPasswordForm = () => {
    const { theme } = this.props;

    if(this.state.isInitialLoading) {
      return (
        <SkeletonTheme color={theme.backgroundHighlight} highlightColor={theme.body}>
          <Skeleton count={10} />
        </SkeletonTheme>
      );
    } else {
      return (
        <form onSubmit={(e) => this.handleSubmit(e, "password")}>
          <div className="account-form-wrapper">
            { this.renderError() }
            { this.renderSuccess() }
            <FormGroup controlId="previousPassword">
              <FormLabel>Current password</FormLabel>
              <FormControl
                type="password"
                value={this.state.previousPassword}
                onChange={this.handleChange}
              />
              <FormText className="text-muted">
                <LinkContainer to="/forgot-password">
                  <a href="#/">
                    Forgot Password?
                  </a>
                </LinkContainer>
            </FormText>
            </FormGroup>
            <FormGroup controlId="newPassword">
              <FormLabel>New password</FormLabel>
              <FormControl
                type="password"
                isInvalid={!this.validatePassword()}
                value={this.state.newPassword}
                onChange={this.handleChange}
              />
              <FormControl.Feedback type="invalid" className={(this.validatePassword() ? 'd-none' : 'd-block')}>
                Please enter a password with minimum of 8 characters.
              </FormControl.Feedback>
            </FormGroup>
            <FormGroup controlId="newPasswordConfirm">
              <FormLabel>Confirm new password</FormLabel>
              <FormControl
                type="password"
                isInvalid={!this.validatePasswordConfirm()}
                value={this.state.newPasswordConfirm}
                onChange={this.handleChange}
              />
              <FormControl.Feedback type="invalid" className={(this.validatePasswordConfirm() ? 'd-none' : 'd-block')}>
                Passwords do not match.
              </FormControl.Feedback>
            </FormGroup>
            <LoaderButton
              block
              disabled={!this.validateForm()}
              type="submit"
              isLoading={this.state.isLoading}
              text="Update password"
              loadingText="Updating password…"
            />
          </div>
        </form>
      );
    }
  }

  onAvatarClose = () => {
    this.setState({ avatarPreview: null });
  }

  onAvatarCrop = (preview) => {
    this.setState({
      avatarPreview: preview
    });
  }

  onBeforeAvatarFileLoad = (elem) => {
    if(elem.target.files[0].size > 1000000){
      alert("File is too big!");
      elem.target.value = "";
    };
  }

  setEditAvatarMode = (e, avatarEditMode) => {
    e.preventDefault();

    this.setState({
      avatarEditMode,
      avatarPreview: avatarEditMode ? this.state.avatarPreview : null
    });
  }

  renderAccountForm = () => {
    const { theme } = this.props;

    if(this.state.isInitialLoading) {
      return (
        <SkeletonTheme color={theme.backgroundHighlight} highlightColor={theme.body}>
          <Skeleton count={10} />
        </SkeletonTheme>
      );
    } else {
      return (
        <form onSubmit={(e) => this.handleSubmit(e, "profile")}>
          {this.renderError()}
          {this.renderSuccess()}
          <FormGroup controlId="avatar">
            <FormLabel>Profile picture</FormLabel>
            <Row>
              <Col className="avatar-editor">
                {
                  (this.props.picture && !this.state.avatarEditMode) ? (
                    <div className="picture-container">
                      <img src={`${this.props.picture}?${Date.now()}`} alt="Preview" width="200" height="200" />
                      <Dropdown className="edit-button" id="dropdown-basic-button">
                        <Dropdown.Toggle className="border" variant={theme.name} size="sm">
                          <FontAwesomeIcon icon={faPencilAlt} /> Edit
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item href="#/" onClick={(e) => this.setEditAvatarMode(e, true)}><FontAwesomeIcon className="edit-icon" icon={faUpload} /> Replace</Dropdown.Item>
                          <Dropdown.Item href="#/" onClick={(e) => this.setEditAvatarMode(e, true)}><FontAwesomeIcon className="edit-icon" icon={faTrashAlt} /> Delete</Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  ) : (
                    <React.Fragment>
                      <Avatar
                        width={150}
                        height={150}
                        imageHeight={401}
                        onCrop={this.onAvatarCrop}
                        onClose={this.onAvatarClose}
                        onBeforeFileLoad={this.onBeforeAvatarFileLoad}
                        borderStyle={{
                          border: !this.state.avatarPreview ? "1px dashed #ced4da" : null 
                        }}
                        labelStyle={{
                          textAlign: "center",
                          lineHeight: "150px",
                          display: "block",
                          color: "#888888",
                        }}
                        label="+ Upload photo"
                      />
                      { this.state.avatarEditMode && <Button className="cancel-button border" variant="light" size="sm" onClick={(e) => this.setEditAvatarMode(e, false)}><FontAwesomeIcon icon={faTimes} /> Cancel</Button>}
                    </React.Fragment>
                  )
                }
              </Col>
              <Col className="avatar-preview">
                { this.state.avatarPreview && <img src={this.state.avatarPreview} alt="Preview" width="200" height="200" /> }    
              </Col>
            </Row>
          </FormGroup>
          <div className="account-form-wrapper">
            <FormGroup controlId="name">
              <FormLabel>Name</FormLabel>
              <FormControl
                type="text"
                value={this.state.name}
                onChange={this.handleChange}
              />
            </FormGroup>
            <FormGroup controlId="username">
              <FormLabel>Username</FormLabel>
              <FormControl
                type="text"
                isInvalid={!this.state.usernameValid}
                value={this.state.username}
                onChange={this.handleChange}
              />
              <FormControl.Feedback type="invalid" className={(this.state.usernameValid ? 'd-none' : 'd-block')}>
                {this.state.usernameMessage}
              </FormControl.Feedback>
            </FormGroup>
            <FormGroup controlId="email">
              <FormLabel>Email</FormLabel>
              <FormControl
                type="text"
                value={this.state.email}
                disabled
              />
            </FormGroup>
            <LoaderButton
              block
              disabled={!this.validateForm()}
              type="submit"
              isLoading={this.state.isLoading}
              text="Update profile"
              loadingText="Updating profile…"
            />
          </div>
        </form>
      );
    }
  }

  renderAppearanceForm = () => {
    let { userTheme = "auto", isLoading } = this.state;

    return (
      <div className="account-form-wrapper">
        <Form onSubmit={(e) => this.handleSubmit(e, "appearance")}>
          <Form.Group>
            <Form.Label>Theme</Form.Label>
            <Form.Control as="select" id="userTheme" value={userTheme} onChange={this.handleChange}>
              <option value="auto">System Setting</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </Form.Control>
          </Form.Group>
          <LoaderButton
            block
            type="submit"
            isLoading={isLoading}
            text="Update"
            loadingText="Updating…"
          />
        </Form>
      </div>
    );
  }

  disconnectSocialLogin = async (provider) => {
    let { identities } = this.state;
    let providerAttributeValue;

    if (identities && identities.length > 0) {
      identities.forEach((identity) => {
        if (identity.providerName === provider) {
          providerAttributeValue = identity.userId;
        }
      });
    }

    try {
      await API.get("posts", `/account/unlink-provider?providerName=${provider}&providerAttributeName=Cognito_Subject&providerAttributeValue=${providerAttributeValue}`);
      window.location.reload();
    } catch (e) {
      console.log(e);
    }
  }

  handleSocialLogin = async (provider) => {
    await Auth.signOut({ global: true });
    Auth.federatedSignIn({provider});
  }

  renderFacebookForm = () => {
    let { identities, emailVerified } = this.state;
    let hasFacebookLinked = false;

    if (identities && identities.length > 0) {
      identities.forEach((identity) => {
        if (identity.providerName === "Facebook") {
          hasFacebookLinked = true;
        }
      });
    }

    if (hasFacebookLinked) {
      return (
        <form>
          <div className="account-form-wrapper">
            <p>Sweet! You've already connected your account with Facebook. You can login with Facebook to Naadan Chords.</p>
            <Button variant="danger" className="social-login" onClick={() => this.disconnectSocialLogin('Facebook')} block disabled={!emailVerified}>
              <span className="social-icon">
                <FontAwesomeIcon icon={faFacebook} />
              </span>
              Disconnect Facebook
            </Button>
            { !emailVerified ?
                <small className="text-muted">
                  Disconnect disabled as account is not linked to an email verified account.
                </small>
              :
                null
            }
          </div>
        </form>
      );
    } else {
      return (
        <form>
          <div className="account-form-wrapper">
            <p>Connect your Naadan Chords account with Facebook. This allows you to login with Facebook to Naadan Chords.</p>
            <Button className="social-login" onClick={() => this.handleSocialLogin('Facebook')} block>
              <span className="social-icon">
                <FontAwesomeIcon icon={faFacebook} />
              </span>
              Connect with Facebook
            </Button>
          </div>
        </form>
      );
    }
  }

  setActiveTab = (tab) => {
    this.setState({
      activeTab: tab,
      isErrorState: false,
      isSuccessState: false,
      previousPassword: "",
      newPassword: "",
      newPasswordConfirm: ""
    });
    urlLib.insertUrlParam("tab", tab);
  }

  renderSEOTags() {
    return (
      <Helmet>
        <title>Account | Naadan Chords</title>
        <meta name="description" content="" />
        <meta name="twitter:card" content="summary" />
        <meta property="og:title" content="Account | Naadan Chords" />
        <meta property="og:description" content="" />
      </Helmet>
    );
  }

  render() {
    let { activeTab, emailVerified } = this.state;

    return (
      <div className="container Account">
        { this.renderSEOTags() }
        <div className="header border-bottom">
          <h1>Account</h1>
        </div>
        <Tab.Container activeKey={activeTab}>
          <Row>
            <Col lg={2}>
              <Nav variant="pills" className="flex-column border rounded">
                <Nav.Item className="border-bottom">
                  <Nav.Link eventKey="profile" onClick={() => { this.setActiveTab("profile"); }}>Profile</Nav.Link>
                </Nav.Item>
                <Nav.Item className="border-bottom">
                  <Nav.Link eventKey="appearance" onClick={() => { this.setActiveTab("appearance"); }}>Appearance</Nav.Link>
                </Nav.Item>
                {
                   emailVerified?
                    <Nav.Item className="border-bottom">
                      <Nav.Link eventKey="password" onClick={() => { this.setActiveTab("password"); }}>Password</Nav.Link>
                    </Nav.Item>
                  :
                    null
                }
                <Nav.Item>
                  <Nav.Link eventKey="facebook" onClick={() => { this.setActiveTab("facebook"); }}>Facebook</Nav.Link>
                </Nav.Item>
              </Nav>
            </Col>
            <Col lg={10}>
              <Tab.Content>
                <Tab.Pane eventKey="profile">
                  { this.renderAccountForm() }
                </Tab.Pane>
                <Tab.Pane eventKey="appearance">
                  { this.renderAppearanceForm() }
                </Tab.Pane>
                <Tab.Pane eventKey="password">
                  { this.renderPasswordForm() }
                </Tab.Pane>
                <Tab.Pane eventKey="facebook">
                  { this.renderFacebookForm() }
                </Tab.Pane>
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>
      </div>
    );
  }
}