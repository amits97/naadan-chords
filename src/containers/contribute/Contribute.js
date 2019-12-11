import React from "react";
import { Alert, Button, Form, Row, Col, Tabs, Tab } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faSyncAlt, faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import htmlParser from "react-markdown/plugins/html-parser";
import LoaderButton from "../../components/LoaderButton";
import { API } from "aws-amplify";
import Moment from "react-moment";
import { LinkContainer } from "react-router-bootstrap";
import TextareaAutosize from "react-autosize-textarea/lib";
import Skeleton from "react-loading-skeleton";
import SearchComponent from "../../components/SearchComponent";
import PromptWrapper from "../../components/PromptWrapper";
import * as inputSelectionLib from "../../libs/input-selection-lib";
import { slugify } from "../../libs/utils";
import EditorPanel from "../admin/EditorPanel";
import ContentParser from "../ContentParser";
import "./Contribute.css";

export default class Contribute extends SearchComponent {
  constructor(props) {
    super(props);

    this.parseHtml = htmlParser();
    this.chordsEditor = React.createRef();
    this.tabsEditor = React.createRef();
    this.fileUploader = React.createRef();
    this.autoWriteDraft = null;

    this.state = {
      isLoading: null,
      postId: null,
      title: null,
      song: null,
      album: null,
      music: null,
      category: "MALAYALAM",
      content: null,
      leadTabs: null,
      youtubeId: null,
      submitted: false,
      isAutoSaving: false,
      status: null,
      reviewComment: null,
      autoSaveTimestamp: null,
      inputUpdated: false
    };
  }

  deleteDraft(postId) {
    return API.del("posts", `/drafts/${postId}`);
  }

  getFileName = (url) => {
    return url.substring(url.lastIndexOf('/') + 1);
  }

  insertAtCursor = (myValue, addNewLines, insertRef) => {
    var myField = insertRef.current;
    myField.focus();
    const contentState = insertRef.current.getAttribute("id");
    var contentValue = this.state[contentState] ? this.state[contentState] : "";
    var selection = inputSelectionLib.getInputSelection(myField);

    let tabs = `\ne|---------------------------------------------|`;
    tabs += `\nB|---------------------------------------------|`;
    tabs += `\nG|---------------------------------------------|`;
    tabs += `\nD|---------------------------------------------|`;
    tabs += `\nA|---------------------------------------------|`;
    tabs += `\nE|---------------------------------------------|\n`;

    let strumming = 'D DU DUDU';

    if(myValue === "separator") {
      contentValue = contentValue.substring(0, selection.start)
      + `{${myValue}}`
      + contentValue.substring(selection.end, contentValue.length);
    } else {
      if(selection.start === selection.end) {
        contentValue = contentValue.substring(0, selection.start)
        + `{start_${myValue}}${myValue === "tab" ? tabs : myValue === "strumming" ? strumming : ''}`
        + `{end_${myValue}}`
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
    }

    this.setState({
      [contentState]: contentValue
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
    return this.state.title !== null
        && this.state.content !== null
        && this.state.song !== null
        && this.state.album !== null
        && this.state.music !== null;
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
      [event.target.id]: event.target.value,
      inputUpdated: true
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
      content: this.state.content,
      leadTabs: this.state.leadTabs,
      youtubeId: this.state.youtubeId
    });
  }

  handleDraft = async () => {
    this.autoWriteDraft = setInterval(async () => {
      if(this.state.inputUpdated) {
        this.setState({
          isAutoSaving: true,
          inputUpdated: false
        });
        if(this.state.title) {
          await this.writeDraft(this.preparePostObject());
          this.setState({
            isAutoSaving: false,
            autoSaveTimestamp: new Date()
          });
        }
      }
    }, 10000);
  }

  handleSubmit = async event => {
    event.preventDefault();
  
    this.setState({ isLoading: true, submitted: true });

    try {
      try {
        await this.deleteDraft(slugify(this.state.title));
      } catch (e) {
        console.log(e);
      }

      if(this.props.isEditMode && !this.props.isDraft) {
        await this.updatePost(this.preparePostObject());
        this.props.history.push(`/contributions`);
      } else {
        await this.createPost(this.preparePostObject());
        this.props.history.push("/contributions");
      }
    } catch (e) {
      this.setState({ isLoading: false });
    }
  }
  
  createPost(post) {
    return API.post("posts", "/contributions", {
      body: post
    });
  }

  updatePost(post) {
    return API.put("posts", `/contributions/${this.props.match.params.id}`, {
      body: post
    });
  }

  writeDraft(post) {
    return API.post("posts", "/drafts", {
      body: post
    });
  }

  post() {
    if(this.props.isViewMode) {
      return API.get("posts", `/posts/${this.props.match.params.id}`);
    } else {
      return API.get("posts", `/contributions/${this.props.match.params.id}`);
    }
  }

  draft() {
    return API.get("posts", `/drafts/${this.props.match.params.id}`);
  }

  componentWillUnmount() {
    if(this.autoWriteDraft) {
      clearInterval(this.autoWriteDraft);
    }
  }

  async componentDidMount() {
    window.scrollTo(0, 0);

    let { isEditMode, isDraft, isViewMode } = this.props;
    if(isEditMode || isViewMode) {
      this.setState({
        isLoading: true
      });

      try {
        let post;
        if(isDraft) {
          post = await this.draft();
        } else {
          post = await this.post();
        }

        this.setState({
          postId: post.postId,
          title: post.title,
          song: post.song,
          album: post.album,
          singers: post.singers,
          music: post.music,
          category: post.category,
          content: post.content,
          leadTabs: post.leadTabs,
          youtubeId: post.youtubeId,
          reviewComment: post.comment,
          status: post.status,
          autoSaveTimestamp: post.createdAt,
          isLoading: false
        });

        if(isDraft) {
          this.handleDraft();
        }
      } catch(e) {
        this.props.history.push("/contributions");
      }
    } else {
      this.handleDraft();
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
    return (
      <div className="preview">
        <ContentParser post={this.state}  />
      </div>
    );
  }

  renderTitleInputs = (isViewMode) => {
    return (
      <div>
        <Row>
          <Col>
            <Form.Group controlId="song">
              <Form.Control autoComplete="off" type="text" placeholder="Song" onChange={this.handleChange} value={this.state.song ? this.state.song : ""} readOnly={isViewMode} />
            </Form.Group>
          </Col>
          <Col>
            <Form.Group controlId="album">
              <Form.Control autoComplete="off" type="text" placeholder="Album" onChange={this.handleChange} value={this.state.album ? this.state.album : ""} readOnly={isViewMode} />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col>
            <Form.Group controlId="singers">
              <Form.Control autoComplete="off" type="text" placeholder="Singers" onChange={this.handleChange} value={this.state.singers ? this.state.singers : ""} readOnly={isViewMode} />
            </Form.Group>
          </Col>
          <Col>
            <Form.Group controlId="music">
              <Form.Control autoComplete="off" type="text" placeholder="Music" onChange={this.handleChange} value={this.state.music ? this.state.music : ""} readOnly={isViewMode} />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col>
            <Form.Group>
              <Form.Control as="select" id="category" onChange={this.handleChange} value={this.state.category ? this.state.category : ""} readOnly={isViewMode}>
              <option value="MALAYALAM">Malayalam</option>
              <option value="TAMIL">Tamil</option>
              <option value="HINDI">Hindi</option>
              </Form.Control>
            </Form.Group>
          </Col>
        </Row>
      </div>
    );
  }

  renderContentInputs = (isViewMode) => {
    return (
      <Tabs defaultActiveKey="chords">
        <Tab eventKey="chords" title="CHORDS">
          <div className="mt-3">
            <EditorPanel insertAtCursor={this.insertAtCursor} readOnly={isViewMode} insertRef={this.chordsEditor} />
            <TextareaAutosize ref={this.chordsEditor} placeholder="Post content" onChange={this.handleChange} value={this.state.content ? this.state.content : "" } id="content" className={`form-control post`} style={{ minHeight: 250 }} readOnly={isViewMode} />
          </div>
        </Tab>
        <Tab eventKey="tabs" title="LEAD TABS">
          <div className="mt-3">
            <EditorPanel insertAtCursor={this.insertAtCursor} insertRef={this.tabsEditor} />
            <TextareaAutosize ref={this.tabsEditor} placeholder="Lead tabs (Optional)" onChange={this.handleChange} value={this.state.leadTabs ? this.state.leadTabs : "" } id="leadTabs" className={`form-control post`} style={{ minHeight: 250 }} readOnly={isViewMode} />
          </div>
        </Tab>
        <Tab eventKey="video" title="VIDEO">
          <div className="mt-3 mb-5">
            <Form.Control autoComplete="off" type="text" id="youtubeId" placeholder="YouTube video ID  (Optional)" onChange={this.handleChange} value={this.state.youtubeId ? this.state.youtubeId : ""} readOnly={isViewMode} />
          </div>
        </Tab>
      </Tabs>
    );
  }

  cancelPost = (e) => {
    e.preventDefault();
    this.props.history.goBack();
  }

  renderEditor(isEditMode, isDraft, isViewMode) {
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
          <Col>
            { this.state.reviewComment && this.state.status === "NEEDS_REVISION" ?
              <React.Fragment>
                <Alert variant="warning">
                  <Alert.Heading>
                    Comment from Admin
                  </Alert.Heading>
                  {this.state.reviewComment}
                </Alert>
                <hr />
              </React.Fragment>
              : null
            }
          </Col>
        </Row>
        <Row>
          <Col xs={12} md={6}>
            { this.renderTitleInputs(isViewMode) }
            { this.renderContentInputs(isViewMode) }

            {isViewMode ? null : <LoaderButton
              variant="primary"
              disabled={!this.validateForm()}
              type="submit"
              isLoading={this.state.isLoading}
              text={isEditMode ? (isDraft ? "Publish" : "Update") : "Submit"}
              loadingText={isEditMode ? (isDraft ? "Publishing…" : "Updating…") : "Submitting…"}
            />}

            <a href="#/" className={`text-primary pt-1 ${isViewMode ? '' : 'ml-3'}`} onClick={this.cancelPost}>Cancel</a>

            {isViewMode ? null : <div className="auto-save float-right pt-2">
              <span className={`float-right ${(this.state.isAutoSaving || this.state.autoSaveTimestamp === null) ? 'd-none' : ''}`}>
                Saved <Moment fromNow>{ this.state.autoSaveTimestamp }</Moment>
              </span>
              <span className={`auto-saving float-right ${this.state.isAutoSaving ? '' : 'd-none'}`}>
                <FontAwesomeIcon icon={faSyncAlt} className="float-left auto-saving-icon spinning" />
                <span className={`float-right`}>Saving…</span>
              </span>
            </div>}
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
    let { isEditMode, isDraft, isViewMode } = this.props;

    return (
      <div className="container Contribute">
        <PromptWrapper when={this.anyDetailsEntered() && !this.state.submitted && !isViewMode} message="Are you sure? Any unsaved changes will be lost" />

        <div className="header border-bottom">
          <h1 className="float-left">
            <LinkContainer exact to="/contributions">
              <a href="#/" className="text-primary">Contributions</a>
            </LinkContainer>
            <span> <small>&raquo;</small> {`${isEditMode? (isDraft ? "Edit Draft" : "Edit Post") : isViewMode ? "View Post" : "New Post"}`}</span>
          </h1>
          {isViewMode ? <Button href={`/${this.state.postId}`} target="_blank" variant="primary" className="float-right">View Post <span><FontAwesomeIcon icon={faExternalLinkAlt} /></span></Button> : null}
        </div>

        { isViewMode ? <small className="text-muted">Published posts cannot be edited.</small> : <small className="text-muted">All submissions will be published only after an Admin approval process.</small> }
        { this.renderEditor(isEditMode, isDraft, isViewMode) }
      </div>
    );
  }
}