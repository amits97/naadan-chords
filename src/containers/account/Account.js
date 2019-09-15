import React from "react";
import Skeleton from "react-loading-skeleton";
import { Auth, API } from "aws-amplify";
import { Alert, FormGroup, FormControl, FormLabel } from "react-bootstrap";
import SearchComponent from "../../components/SearchComponent";
import LoaderButton from "../../components/LoaderButton";
import "./Account.css";

export default class Account extends SearchComponent {
  constructor(props) {
    super(props);

    this.state = {
      isInitialLoading: false,
      isLoading: false,
      name: "",
      username: "",
      email: "",
      isSuccessState: false,
      isErrorState: false,
      errorMessage: "",
      usernameValid: true,
      usernameMessage: ""
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
      this.setState({
        isInitialLoading: false,
        name: this.props.name,
        username: this.props.preferredUsername ? this.props.preferredUsername: this.props.username,
        email: this.props.email
      });
    } catch (e) {
      this.setState({
        isInitialLoading: false
      });
    }
  }

  validateForm() {
    let valid = this.state.name.length > 0 && this.state.username.length > 0 && this.state.email.length > 0;
    valid = valid && (this.props.name !== this.state.name || (this.props.username !== this.state.username && this.props.preferredUsername !== this.state.username));
    return valid;
  }

  handleChange = event => {
    this.setState({
      [event.target.id]: event.target.value
    });
  }

  renderError = () => {
    if(this.state.isErrorState) {
      return(
        <Alert variant="danger">
          {this.state.errorMessage}
        </Alert>
      );
    }
  }

  renderSuccess = () => {
    if(this.state.isSuccessState) {
      return(
        <Alert variant="success">
          Updated!
        </Alert>
      );  
    }
  }

  handleSubmit = async event => {
    event.preventDefault();

    this.setState({
      isLoading: true,
      isSuccessState: false,
      isErrorState: false
    });

    let valid = await this.validateUserName();

    if(!valid) {
      this.setState({
        isLoading: false
      });
      return;
    }

    try {
      let user = await Auth.currentAuthenticatedUser();

      let updateUserAttributes = {};

      if(this.props.name !== this.state.name) {
        updateUserAttributes.name = this.state.name;
      }

      if(this.props.username !== this.state.username && this.props.preferredUsername !== this.state.username) {
        updateUserAttributes.preferred_username = this.state.username;
      }

      await Auth.updateUserAttributes(user, updateUserAttributes);
      let session = await Auth.currentSession();
      await this.props.getUserAttributes(session);
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
  }

  validateUserName = async () => {
    let {username} = this.state;
    const regExp = /^[a-zA-Z0-9]+$/;

    if(username.match(regExp) === null) {
      this.setState({
        usernameValid: false,
        usernameMessage: "Please enter valid username with only letters and numbers."
      });

      return false;
    } else {
      this.setState({
        usernameValid: true
      });

      if(this.props.username !== username) {
        try {
          let result = await API.get("posts", `/username-check?username=${username}`);
          if(result.userExists) {
            this.setState({
              usernameValid: false,
              usernameMessage: "Username already exists. Please try a different one."
            });
            return false;
          }
          return true;
        } catch(e) {
          console.log(e);
        }
      } else {
        return true;
      }
    }
  }

  renderForm = () => {
    if(this.state.isInitialLoading) {
      return (
        <Skeleton count={10} />
      );
    } else {
      return (
        <form onSubmit={this.handleSubmit}>
          {this.renderError()}
          {this.renderSuccess()}
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
            text="Update"
            loadingText="Updating…"
          />
        </form>
      );
    }
  }

  render() {
    return (
      <div className="Account">
        <div className="header border-bottom">
          <h1>Account</h1>
        </div>
        <small className="text-muted mb-4 d-block">Stay tuned, more features coming soon!</small>
        {this.renderForm()}
      </div>
    );
  }
}