import React from "react";
import { Form, Row, Col, Tabs, Tab } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faSyncAlt, faImage, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import htmlParser from "react-markdown/plugins/html-parser";
import LoaderButton from "../components/LoaderButton";
import { API, Storage } from "aws-amplify";
import ReactMarkdown from "react-markdown";
import { LinkContainer } from "react-router-bootstrap";
import TextareaAutosize from "react-autosize-textarea/lib";
import Skeleton from "react-loading-skeleton";
import SearchComponent from "../components/SearchComponent";
import PromptWrapper from "../components/PromptWrapper";
import * as inputSelectionLib from "../libs/input-selection-lib";
import EditorPanel from "./EditorPanel";
import ContentParser from "./ContentParser";
import "./NewPost.css";

export default class NewPost extends SearchComponent {
  constructor(props) {
    super(props);

    this.parseHtml = htmlParser();
    this.chordsEditor = React.createRef();
    this.fileUploader = React.createRef();

    this.state = {
      isLoading: null,
      title: null,
      song: null,
      album: null,
      music: null,
      category: "MALAYALAM",
      image: null,
      content: null,
      leadTabs: null,
      youtubeId: null,
      postType: "POST",
      submitted: false,
      imageLoading: false
    };
  }

  slugify = (text) => {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/[^\w-]+/g, '')       // Remove all non-word chars
      .replace(/--+/g, '-')         // Replace multiple - with single -
      .replace(/^-+/, '')             // Trim - from start of text
      .replace(/-+$/, '');            // Trim - from end of text
  }

  getFileName = (url) => {
    return url.substring(url.lastIndexOf('/') + 1);
  }

  insertAtCursor = (myValue, addNewLines) => {
    var myField = this.chordsEditor.current.textarea;
    myField.focus();
    var contentValue = this.state.content ? this.state.content : "";
    var selection = inputSelectionLib.getInputSelection(myField);

    if(selection.start === selection.end) {
      contentValue = contentValue.substring(0, selection.start)
      + `{${myValue}}`
      + contentValue.substring(selection.end, contentValue.length);
    } else {
      contentValue = contentValue.substring(0, selection.start)
      + `{start_${myValue}}`
      + `${addNewLines ? "\n" : ""}`
      + contentValue.substring(selection.start, selection.end)
      + `${addNewLines ? "\n" : ""}`
      + `{end_${myValue}}`
      + contentValue.substring(selection.end, contentValue.length);
    }

    this.setState({
      content: contentValue
    });
  }

  safeStringNullOrEmpty = (string, prefix) => {
    if(string === null || string === "") {
      return "";
    } else {
      return prefix ? ` ${prefix} ` + string : string;
    }
  }

  validateForm() {
    if(this.state.postType === "POST") {
      return this.state.title !== null
          && this.state.content !== null
          && this.state.song !== null
          && this.state.album !== null
          && this.state.music !== null;
    } else {
      return this.state.title !== null
          && this.state.content !== null;
    }
  }

  anyDetailsEntered = () => {
    return this.state.title !== null
        || this.state.content !== null
        || this.state.song !== null
        || this.state.album !== null
        || this.state.music !== null;
  }

  handleChange = event => {
    this.setState({
      [event.target.id]: event.target.value
    });

    if(["song", "album"].indexOf(event.target.id) !== -1) {
      let { song, album } = this.state;

      if(event.target.id === "song") {
        song = event.target.value;
      } else {
        album = event.target.value;
      }

      let title = this.safeStringNullOrEmpty(song) + this.safeStringNullOrEmpty(album, " - ");

      this.setState({
        title: title
      });
    }
  }

  preparePostObject = () => {
    return ({
      title: this.state.title,
      song: this.state.song,
      album: this.state.album,
      singers: this.state.singers,
      music: this.state.music,
      category: this.state.category,
      image: this.state.image,
      content: this.state.content,
      leadTabs: this.state.leadTabs,
      youtubeId: this.state.youtubeId,
      postType: this.state.postType
    });
  }

  handleSubmit = async event => {
    event.preventDefault();
  
    this.setState({ isLoading: true, submitted: true });
  
    try {
      if(this.props.isEditMode) {
        await this.updatePost(this.preparePostObject());
        this.props.history.push(`/${this.props.match.params.id}`);
      } else {
        await this.createPost(this.preparePostObject());
        
        if(this.state.postType === "PAGE") {
          this.props.history.push("/admin");
        } else {
          this.props.history.push("/");
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

    if(!this.props.isAdmin) {
      this.props.history.push("/");
    }

    let { isEditMode } = this.props;
    if(isEditMode) {
      this.setState({
        isLoading: true
      });

      try {
        let post = await this.post();

        this.setState({
          title: post.title,
          song: post.song,
          album: post.album,
          singers: post.singers,
          music: post.music,
          category: post.category,
          image: post.image,
          content: post.content,
          leadTabs: post.leadTabs,
          youtubeId: post.youtubeId,
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

  renderPreviewPlaceholder = () => {
    return(
      <div className="preview-placeholder">
        <FontAwesomeIcon className="preview-icon" icon={faEye} />
        <p>Preview</p>
        <small>Start entering details to see live preview</small>
      </div>
    );
  }

  renderPreviewContent = () => {
    if(this.state.postType === "PAGE") {
      return (
        <ReactMarkdown source={ this.state.content } />
      );
    } else {
      return (
        <div className="preview">
          <ContentParser post={this.state}  />
        </div>
      );
    }
  }

  onImageUploadChange = (e) => {
    const file = e.target.files[0];
    this.setState({
      imageLoading: true
    });
    Storage.put(`${this.slugify(this.state.title)}.jpg`, file, {
      contentType: 'image/jpg'
    })
    .then (result => {
      this.setState({
        image: `https://s3.ap-south-1.amazonaws.com/naadanchords-images/public/${result.key}`
      });
    })
    .catch(err => console.log(err));
  }

  resetImage = (e) => {
    e.preventDefault();

    if(window.confirm('Are you sure you want to remove the image?')) {
      var fileUploader = this.fileUploader.current;
      fileUploader.value = null;

      this.setState({
        image: null,
        imageLoading: false
      });
    }
  }

  renderTitleInputs = () => {
    if(this.state.postType === "PAGE") {
      return (
        <div>
          <Form.Group controlId="title">
            <Form.Control autoComplete="off" type="text" placeholder="Title" onChange={this.handleChange} value={this.state.title} />
          </Form.Group>
        </div>
      );
    } else {
      return (
        <div>
          <Row>
            <Col>
              <Form.Group controlId="song">
                <Form.Control autoComplete="off" type="text" placeholder="Song" onChange={this.handleChange} value={this.state.song ? this.state.song : ""} />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="album">
                <Form.Control autoComplete="off" type="text" placeholder="Album" onChange={this.handleChange} value={this.state.album ? this.state.album : ""} />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col>
              <Form.Group controlId="singers">
                <Form.Control autoComplete="off" type="text" placeholder="Singers" onChange={this.handleChange} value={this.state.singers ? this.state.singers : ""} />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="music">
                <Form.Control autoComplete="off" type="text" placeholder="Music" onChange={this.handleChange} value={this.state.music ? this.state.music : ""} />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col>
              <Form.Group>
                <Form.Control as="select" id="category" onChange={this.handleChange} value={this.state.category ? this.state.category : ""}>
                <option value="MALAYALAM">Malayalam</option>
                <option value="TAMIL">Tamil</option>
                <option value="HINDI">Hindi</option>
                </Form.Control>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="image">
                <div className={`image-uploader ${this.state.image ? 'd-none' : 'd-block'}`}>
                  <Form.Control type="file" accept='image/jpg' onChange={(e) => this.onImageUploadChange(e)} className={`${this.state.imageLoading ? 'd-none' : 'd-block'}`} ref={this.fileUploader} />
                  <FontAwesomeIcon icon={faSyncAlt} className={`spinning ${this.state.imageLoading ? 'd-block' : 'd-none'}`} />
                </div>
                <div className={`image-viewer ${this.state.image ? 'd-block' : 'd-none'}`}>
                  <a href={this.state.image} target="_blank" className="text-primary image-link" rel="noopener noreferrer">
                    <FontAwesomeIcon icon={faImage} className="mr-2 image-icon" />{this.state.image ? this.getFileName(this.state.image) : ""}
                  </a>
                  <a className="edit text-primary" href="#/" onClick={this.resetImage}>
                    <FontAwesomeIcon icon={faTrashAlt} className="text-danger" />
                  </a>
                </div>
              </Form.Group>
            </Col>
          </Row>
        </div>
      );
    }
  }

  renderContentInputs = () => {
    if(this.state.postType === "PAGE") {
      return (
        <div>
          <EditorPanel />
          <TextareaAutosize placeholder="Post content" onChange={this.handleChange} value={this.state.content ? this.state.content : "" } id="content" className={`form-control page`} style={{ minHeight: 250 }} />
        </div>
      );
    } else {
      return (
        <Tabs defaultActiveKey="chords">
          <Tab eventKey="chords" title="CHORDS">
            <div className="mt-3">
              <EditorPanel insertAtCursor={this.insertAtCursor} />
              <TextareaAutosize ref={this.chordsEditor} placeholder="Post content" onChange={this.handleChange} value={this.state.content ? this.state.content : "" } id="content" className={`form-control post`} style={{ minHeight: 250 }} />
            </div>
          </Tab>
          <Tab eventKey="tabs" title="LEAD TABS">
            <div className="mt-3">
              <EditorPanel />
              <TextareaAutosize placeholder="Lead tabs (Optional)" onChange={this.handleChange} value={this.state.leadTabs ? this.state.leadTabs : "" } id="leadTabs" className={`form-control post`} style={{ minHeight: 250 }} />
            </div>
          </Tab>
          <Tab eventKey="video" title="VIDEO">
            <div className="mt-3 mb-5">
              <Form.Control autoComplete="off" type="text" id="youtubeId" placeholder="YouTube video ID  (Optional)" onChange={this.handleChange} value={this.state.youtubeId ? this.state.youtubeId : ""} />
            </div>
          </Tab>
        </Tabs>
      );
    }
  }

  cancelPost = (e) => {
    e.preventDefault();
    this.props.history.goBack();
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
      <Form onSubmit={this.handleSubmit}>
        <Row>
          <Col xs={12} md={6}>
            <Form.Group>
              <Form.Control as="select" id="postType" onChange={this.handleChange} value={this.state.postType ? this.state.postType : ""}>
                <option value="POST">Post</option>
                <option value="PAGE">Page</option>
              </Form.Control>
            </Form.Group>

            { this.renderTitleInputs() }
            { this.renderContentInputs() }

            <LoaderButton
              variant="primary"
              disabled={!this.validateForm()}
              type="submit"
              isLoading={this.state.isLoading}
              text={isEditMode ? "Update" : "Create"}
              loadingText={isEditMode ? "Updating…" : "Creating…"}
            />

            <a href="#/" className="text-primary ml-3 pt-1" onClick={this.cancelPost}>Cancel</a>
          </Col>
          <Col xs={12} md={6}>
            <div className="preview-pane">
              <h2 className="title">{this.state.title}</h2>
              {this.state.title ? <hr /> : ''}
              {this.state.title ? this.renderPreviewContent() : this.renderPreviewPlaceholder()}
            </div>
          </Col>
        </Row>
      </Form>
    );
  }

  render() {
    let { isEditMode } = this.props;

    return (
      <div className="NewPost">
        <PromptWrapper when={this.anyDetailsEntered() && !this.state.submitted} message="Are you sure? Any unsaved changes will be lost" />
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