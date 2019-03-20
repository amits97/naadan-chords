import React, { Component } from "react";
import { Form, Row, Col } from "react-bootstrap";
import htmlParser from "react-markdown/plugins/html-parser";
import LoaderButton from "../components/LoaderButton";
import { API } from "aws-amplify";
import ReactMarkdown from "react-markdown";
import { LinkContainer } from "react-router-bootstrap";
import TextareaAutosize from "react-autosize-textarea";
import Skeleton from "react-loading-skeleton";
import ContentParser from "./ContentParser";
import "./NewPost.css";

export default class NewPost extends Component {
  constructor(props) {
    super(props);

    this.parseHtml = htmlParser();

    this.state = {
      isLoading: null,
      title: "",
      content: "",
      postType: "POST",
      submitted: false
    };
  }

  validateForm() {
    return this.state.title.length > 0
          && this.state.content.length > 0;
  }

  handleChange = event => {
    this.setState({
      [event.target.id]: event.target.value
    });
  }

  handleSubmit = async event => {
    event.preventDefault();
  
    this.setState({ isLoading: true, submitted: true });
  
    try {
      if(this.props.isEditMode) {
        await this.updatePost({
          title: this.state.title,
          content: this.state.content,
          postType: this.state.postType
        });
        this.props.history.push(`/${this.props.match.params.id}`);
      } else {
        await this.createPost({
          title: this.state.title,
          content: this.state.content,
          postType: this.state.postType
        });
        
        if(this.state.postType === "PAGE") {
          this.props.history.push("/admin");
        } else {
          this.props.history.push("/blog");
        }
      }
    } catch (e) {
      alert(e);
      this.setState({ isLoading: false });
    }
  }
  
  createPost(post) {
    return API.post("posts", "/posts", {
      body: post
    });
  }

  updatePost(post) {
    return API.put("posts", `/posts/${this.props.match.params.id}`, {
      body: post
    });
  }

  post() {
    return API.get("posts", `/posts/${this.props.match.params.id}`);
  }

  async componentDidMount() {
    window.scrollTo(0, 0);

    let { isEditMode } = this.props;
    if(isEditMode) {
      this.setState({
        isLoading: true
      });

      try {
        let post = await this.post();

        this.setState({
          title: post.title,
          content: post.content,
          postType: post.postType,
          isLoading: false
        });
      } catch(e) {
        console.log(e);

        this.setState({
          isLoading: false
        });
      }
    } 
  }

  renderPreviewContent = () => {
    if(this.state.postType === "PAGE") {
      return (
        <ReactMarkdown source={ this.state.content } />
      );
    } else {
      return (
        <div className="preview">
          <ContentParser content = { this.state.content } />
        </div>
      );
    }
  }

  renderEditor(isEditMode) {
    if(isEditMode && this.state.isLoading && !this.state.submitted) {
      return(
        <Row>
          <Col>
            <Skeleton count={10} />
          </Col>
        </Row>
      )
    }
  
    return (
      <Row>
        <Col xs={12} md={6}>
          <Form onSubmit={this.handleSubmit}>
            <Form.Group controlId="title">
              <Form.Control type="text" placeholder="Song Name - Album" onChange={this.handleChange} value={this.state.title} className="titleInput" />
            </Form.Group>
    
            <TextareaAutosize placeholder="Post content" onChange={this.handleChange} value={this.state.content} id="content" className={`form-control ${ this.state.postType === "PAGE" ? "page" : "post"}`} style={{ minHeight: 250 }} />
    
            <Form.Control as="select" id="postType" onChange={this.handleChange} value={this.state.postType}>
              <option value="POST">Post</option>
              <option value="PAGE">Page</option>
            </Form.Control>
    
            <LoaderButton
              variant="primary"
              disabled={!this.validateForm()}
              type="submit"
              isLoading={this.state.isLoading}
              text={isEditMode ? "Update" : "Create"}
              loadingText={isEditMode ? "Updating…" : "Creating…"}
            />
          </Form>
        </Col>
        <Col xs={12} md={6}>
          <div className="preview-pane">
            <h2 className="title">{this.state.title}</h2>
            {this.state.title ? <hr /> : ''}
            {this.renderPreviewContent()}
          </div>
        </Col>
      </Row>
    );
  }

  render() {
    let { isEditMode } = this.props;

    return (
      <div className="NewPost">
        <h1>
          <LinkContainer exact to="/admin">
            <a href="#/" className="text-primary">Admin</a>
          </LinkContainer>
          <span> <small>&raquo;</small> {`${isEditMode? "Edit Post" : "New Post"}`}</span>
        </h1>
        <hr />
        { this.renderEditor(isEditMode) }
      </div>
    );
  }
}