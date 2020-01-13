import React, { Component } from "react";
import { Button, Form, Row, Col, Tabs, Tab, Alert } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faExternalLinkAlt, faSyncAlt, faImage, faTrashAlt, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import htmlParser from "react-markdown/plugins/html-parser";
import LoaderButton from "../../components/LoaderButton";
import { API, Storage } from "aws-amplify";
import ReactMarkdown from "react-markdown";
import Moment from "react-moment";
import { Helmet } from "react-helmet";
import { LinkContainer } from "react-router-bootstrap";
import TextareaAutosize from "react-autosize-textarea/lib";
import Skeleton from "react-loading-skeleton";
import PromptWrapper from "../../components/PromptWrapper";
import * as inputSelectionLib from "../../libs/input-selection-lib";
import { safeStringNullOrEmpty, slugify } from "../../libs/utils";
import EditorPanel from "../account/EditorPanel";
import ContentParser from "../ContentParser";
import "./Editor.css";

export default class Editor extends Component {
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
      image: null,
      content: null,
      leadTabs: null,
      youtubeId: null,
      postType: "POST",
      authorName: null,
      userId: null,
      submitted: false,
      imageLoading: false,
      isAutoSaving: false,
      status: null,
      isApproving: false,
      isRejecting: false,
      reviewComment: null,
      addingComment: false,
      autoSaveTimestamp: null,
      inputUpdated: false
    };
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

      let title = safeStringNullOrEmpty(song) + safeStringNullOrEmpty(album, " - ");

      this.setState({
        title: title
      });
    }
  }

  preparePostObject = (addUserId) => {
    let { isAdmin } = this.props;

    let postObject = {
      title: this.state.title,
      postType: this.state.postType,
      song: this.state.song,
      album: this.state.album,
      singers: this.state.singers,
      music: this.state.music,
      category: (this.state.postType === "PAGE") ? "PAGE" : this.state.category,
      image: this.state.image,
      content: this.state.content,
      leadTabs: this.state.leadTabs,
      youtubeId: this.state.youtubeId
    };

    if(isAdmin && addUserId) {
      postObject.userId = this.state.userId;
    }
    return postObject;
  }

  handleDraft = async () => {
    this.autoWriteDraft = setInterval(async () => {
      let { inputUpdated, title, singers, music, postType } = this.state;
      const autoSave = (postType === "PAGE") ? inputUpdated && title : inputUpdated && title && singers && music

      if(autoSave) {
        this.setState({
          isAutoSaving: true,
          inputUpdated: false
        });
        await this.writeDraft(this.preparePostObject());
        this.setState({
          isAutoSaving: false,
          autoSaveTimestamp: new Date()
        });
      }
    }, 10000);
  }

  handleReviewComment = async event => {
    event.preventDefault();

    this.setState({ addingComment: true });

    try {
      await this.props.addReviewComment(this.state.reviewComment);
      this.props.history.push(this.props.reviewCommentRedirectUrl);
    } catch(e) {
      console.log(e);
      this.setState({ addingComment: false });
    }
  }

  handleSubmit = async (event, isReviewMode, approve) => {
    event.preventDefault();

    if(this.props.isAdmin) {
      if(isReviewMode) {
        if(approve) {
          this.setState({ isApproving: true });
          await this.props.createPost(this.preparePostObject(true));
        } else {
          this.setState({ isRejecting: true });
          await this.props.rejectPost();
        }
        this.props.history.push(this.props.reviewRedirectUrl);
      } else {
        this.setState({ isLoading: true, submitted: true });
  
        try {
          try {
            await this.deleteDraft(slugify(this.state.title));
          } catch (e) {
            console.log(e);
          }
  
          if(this.props.isEditMode && !this.props.isDraft) {
            await this.props.updatePost(this.preparePostObject());
            this.props.history.push(this.props.editRedirectUrl);
          } else {
            await this.props.createPost(this.preparePostObject());
            if(this.state.postType === "PAGE") {
              this.props.history.push(this.props.pageSubmitRedirectUrl);
            } else {
              this.props.history.push(this.props.postSubmitRedirectUrl);
            }
          }
        } catch (e) {
          console.log(e);
          this.setState({ isLoading: false });
        }
      }
    } else if(this.props.isContribution) {
      this.setState({ isLoading: true, submitted: true });

      try {
        try {
          await this.deleteDraft(slugify(this.state.title));
        } catch (e) {
          console.log(e);
        }

        if(this.props.isEditMode && !this.props.isDraft) {
          await this.props.updatePost(this.preparePostObject());
          this.props.history.push(this.props.editRedirectUrl);
        } else {
          await this.props.createPost(this.preparePostObject());
          this.props.history.push(this.props.postSubmitRedirectUrl);
        }
      } catch (e) {
        this.setState({ isLoading: false });
      }
    }
  }

  writeDraft(post) {
    return API.post("posts", "/drafts", {
      body: post
    });
  }

  deleteDraft(postId) {
    return API.del("posts", `/drafts/${postId}`);
  }

  post() {
    if(this.props.isViewMode || this.props.isAdmin) {
      return API.get("posts", `/posts/${this.props.match.params.id}`);
    } else {
      return API.get("posts", `/contributions/${this.props.match.params.id}`);
    }
  }

  draft() {
    return API.get("posts", `/drafts/${this.props.match.params.id}`);
  }

  contribution() {
    return API.get("posts", `/contributions/${this.props.match.params.id}`);
  }

  componentWillUnmount() {
    if(this.autoWriteDraft) {
      clearInterval(this.autoWriteDraft);
    }
  }

  async componentDidMount() {
    let { isEditMode, isDraft, isReviewMode, isViewMode } = this.props;
    if(isEditMode || isReviewMode || isViewMode) {
      this.setState({
        isLoading: true
      });

      try {
        let post;
        if(isDraft) {
          post = await this.draft();
        } else if(isReviewMode) {
          post = await this.contribution();
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
          image: post.image,
          content: post.content,
          leadTabs: post.leadTabs,
          youtubeId: post.youtubeId,
          status: post.status,
          postType: post.postType,
          authorName: post.authorName ? post.authorName : null,
          reviewComment: post.comment ? post.comment : null,
          userId: post.userId ? post.userId : null,
          autoSaveTimestamp: post.createdAt,
          isLoading: false
        });

        if(isDraft) {
          this.handleDraft();
        }
      } catch(e) {
        console.log(e);

        this.setState({
          isLoading: false
        });
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
    if(this.state.postType === "PAGE") {
      return (
        <ReactMarkdown source={ this.state.content } renderers={{
          table: (props) => {
              return <table className="table table-bordered table-hover">{props.children}</table>
          }
        }} />
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
    Storage.put(`${slugify(this.state.title)}.jpg`, file, {
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
    let { isContribution, isViewMode } = this.props;

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
          {this.props.isReviewMode ?
            <Row>
              <Col>
                <Form.Group controlId="userId">
                  <small className="text-muted">Submitted by <b>{this.state.authorName}</b></small>
                  <Form.Control autoComplete="off" type="text" placeholder="Author" onChange={this.handleChange} value={this.state.userId ? this.state.userId : ""} />
                </Form.Group>
              </Col>
            </Row>
          : null}
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
            { 
              isContribution ?
                null
              :
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
              }
          </Row>
        </div>
      );
    }
  }

  renderContentInputs = () => {
    if(this.state.postType === "PAGE") {
      return (
        <div>
          <TextareaAutosize placeholder="Post content" onChange={this.handleChange} value={this.state.content ? this.state.content : "" } id="content" className={`form-control page`} style={{ minHeight: 250 }} />
        </div>
      );
    } else {
      let { isViewMode } = this.props;
      return (
        <Tabs defaultActiveKey="chords">
          <Tab eventKey="chords" title="CHORDS">
            <div className="mt-3">
              <EditorPanel insertAtCursor={this.insertAtCursor} insertRef={this.chordsEditor} readOnly={isViewMode} />
              <TextareaAutosize ref={this.chordsEditor} placeholder="Post content" onChange={this.handleChange} value={this.state.content ? this.state.content : "" } id="content" className={`form-control post`} style={{ minHeight: 250 }} readOnly={isViewMode} />
            </div>
          </Tab>
          <Tab eventKey="tabs" title="LEAD TABS">
            <div className="mt-3">
              <EditorPanel insertAtCursor={this.insertAtCursor} insertRef={this.tabsEditor} readOnly={isViewMode} />
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
  }

  cancelPost = (e) => {
    e.preventDefault();
    this.props.history.goBack();
  }

  renderReviewCommentInput(isReviewMode) {
    if(isReviewMode) {
      return (
        <React.Fragment>
          <small className="text-muted">Comment from Admin</small>
          <TextareaAutosize style={{ minHeight: 58 }} placeholder="Add review comment" onChange={this.handleChange} value={this.state.reviewComment ? this.state.reviewComment : "" } id="reviewComment" className={`form-control review-comment mb-3`} />
          { this.state.reviewComment ?
            <LoaderButton
              variant="primary"
              className="review-comment-submit"
              type="submit"
              isLoading={this.state.addingComment}
              text={<React.Fragment>Comment <FontAwesomeIcon icon={faPaperPlane} className="ml-2" /></React.Fragment>}
              loadingText="Sending…"
            />
            : null
          }
        </React.Fragment>
      );
    }
  }

  renderEditor() {
    let { isAdmin, isContribution, isEditMode, isReviewMode, isViewMode } = this.props;

    if((isEditMode || isReviewMode || isViewMode) && this.state.isLoading && !this.state.submitted) {
      return(
        <Row>
          <Col>
            <Skeleton count={10} />
          </Col>
        </Row>
      )
    }

    return (
      <React.Fragment>
          { isAdmin && isReviewMode ?
            <React.Fragment>
              <Form onSubmit={this.handleReviewComment}>
                <Row>
                  <Col xs={12} md={6}>
                    { this.renderReviewCommentInput(isReviewMode) }
                  </Col>
                  <Col xs={12} md={6}>
                    { this.props.isReviewMode && this.state.reviewComment ?
                      <Alert variant="warning">
                        <Alert.Heading>
                          Comment from Admin
                        </Alert.Heading>
                        {this.state.reviewComment}
                      </Alert>
                      : null
                    }
                  </Col>
                </Row>
              </Form>
              <hr />
            </React.Fragment>
            : null
          }
        <Form onSubmit={this.handleSubmit}>
          <Row>
            <Col>
              { isContribution && this.state.reviewComment && this.state.status === "NEEDS_REVISION" ?
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
              { (isAdmin && isReviewMode) || (isContribution) ? null :
                <Form.Group>
                  <Form.Control as="select" id="postType" onChange={this.handleChange} value={this.state.postType ? this.state.postType : ""}>
                    <option value="POST">Post</option>
                    <option value="PAGE">Page</option>
                  </Form.Control>
                </Form.Group>
              }

              { this.renderTitleInputs() }
              { this.renderContentInputs() }

              { isAdmin && isReviewMode ?
                  <span className="review-submit-container d-inline-block">
                    <LoaderButton
                      variant="success"
                      className="review-submit"
                      onClick={(e) => this.handleSubmit(e, isReviewMode, true)}
                      isLoading={this.state.isApproving}
                      text="Approve"
                      loadingText="Approving…"
                    />
                    <LoaderButton
                      variant="danger"
                      className="review-submit ml-2"
                      onClick={(e) => this.handleSubmit(e, isReviewMode, false)}
                      isLoading={this.state.isRejecting}
                      text="Reject"
                      loadingText="Rejecting…"
                      />
                  </span>
                : (
                  isContribution && isViewMode ?
                    null
                  :
                    <LoaderButton
                    variant="primary"
                    className="post-submit"
                    disabled={!this.validateForm()}
                    type="submit"
                    isLoading={this.state.isLoading}
                    text={this.props.submitButton.text}
                    loadingText={this.props.submitButton.loadingText}
                    />
                )
              }

              <a href="#/" className={`text-primary pt-1 ${isViewMode ? '' : 'ml-3'}`} onClick={this.cancelPost}>Cancel</a>

              <div className="auto-save float-right pt-2">
                <span className={`float-right ${(this.state.isAutoSaving || this.state.autoSaveTimestamp === null) ? 'd-none' : ''}`}>
                  Saved <Moment fromNow>{ this.state.autoSaveTimestamp }</Moment>
                </span>
                <span className={`auto-saving float-right ${this.state.isAutoSaving ? '' : 'd-none'}`}>
                  <FontAwesomeIcon icon={faSyncAlt} className="float-left auto-saving-icon spinning" />
                  <span className={`float-right`}>Saving…</span>
                </span>
              </div>
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
      </React.Fragment>
    );
  }

  renderSEOTags() {
    return (
      <Helmet>
        <title>{ this.props.seo.title }</title>
        <meta name="description" content={ this.props.seo.description } />
        <meta name="twitter:card" content={ this.props.seo.twitterSummary } />
        <meta property="og:title" content={ this.props.seo.title } />
        <meta property="og:description" content={ this.props.seo.description } />
      </Helmet>
    );
  }

  render() {
    let {
      isContribution,
      dashboardName,
      dashboardLink,
      isReviewMode,
      isViewMode,
      pageTitle,
      helpContent
    } = this.props;

    return (
      <div className="container Editor">
        { this.renderSEOTags() }
        <PromptWrapper when={this.anyDetailsEntered() && !this.state.submitted && !isReviewMode && !isViewMode} message="Are you sure? Any unsaved changes will be lost" />
        <div className="header border-bottom">
          <h1 className="float-left">
            <LinkContainer exact to={ dashboardLink }>
              <a href="#/" className="text-primary">{ dashboardName }</a>
            </LinkContainer>
            <span> <small>&raquo;</small> { pageTitle }</span>
          </h1>
          {isViewMode ? <Button href={`/${this.state.postId}`} target="_blank" variant="primary" className="float-right">Open Song <span><FontAwesomeIcon icon={faExternalLinkAlt} /></span></Button> : null}
        </div>
        { isContribution ? helpContent : null }
        { this.renderEditor() }
      </div>
    );
  }
}