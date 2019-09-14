import React from "react";
import Skeleton from "react-loading-skeleton";
import { Auth } from "aws-amplify";
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
      errorMessage: ""
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
        username: this.props.username,
        email: this.props.email
      });
    } catch (e) {
      console.log(e);
      this.setState({
        isInitialLoading: false
      });
    }
  }

  validateForm() {
    return this.state.name.length > 0 && this.state.username.length > 0 && this.state.email.length > 0;
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

    try {
      let user = await Auth.currentAuthenticatedUser();
      await Auth.updateUserAttributes(user, {
        name: this.state.name
      });
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
              value={this.state.username}
              disabled
            />
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