import React, { Component, Fragment } from "react";
import Moment from "react-moment";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import {
  Button,
  Container,
  Dropdown,
  DropdownButton,
  Form,
  OverlayTrigger,
  Popover,
  Row,
} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserCircle,
  faHeart as faHeartFilled,
  faReply,
} from "@fortawesome/free-solid-svg-icons";
import { faHeart } from "@fortawesome/free-regular-svg-icons";
import TextareaAutosize from "react-autosize-textarea/lib";
import LoaderButton from "../../components/LoaderButton";
import { API, parseLinksToHtml } from "../../libs/utils";
import * as Styles from "../Styles";
import "./Comments.css";

export default class Comments extends Component {
  constructor(props) {
    super(props);

    this.state = {
      commentsLoading: true,
      comments: [],
      commentBeingEdited: {},
      commentBeingReplied: {},
      isCommentFormInFocus: false,
      comment: null,
      addingComment: false,
      replyComment: null,
      addingReplyComment: false,
    };
  }

  getComments = async (hideLoad = false) => {
    const post = this.props.posts;
    if (post.postId) {
      if (!hideLoad) {
        this.setState({
          commentsLoading: true,
        });
      }
      try {
        const comments = await API.get(
          "posts",
          `/comments?postId=${post.postId}`
        );
        this.setState({
          comments: comments.Items,
          commentsLoading: false,
        });
      } catch (e) {
        console.log(e);
        this.setState({
          commentsLoading: false,
        });
      }
    }
  };

  componentDidMount = () => {
    this.getComments();
  };

  componentDidUpdate = (prevProps) => {
    if (
      !Array.isArray(this.props.posts) &&
      this.props.posts.postId !== prevProps.posts.postId
    ) {
      this.getComments();
    }
  };

  handleEditCommentClick = (comment) => {
    this.setState({
      commentBeingEdited: comment,
      isCommentFormInFocus: false,
    });
  };

  handleReplyClick = (comment) => {
    const { commentBeingReplied } = this.state;

    if (commentBeingReplied.commentId === comment.commentId) {
      this.setState({ commentBeingReplied: {} });
    } else {
      this.setState({
        commentBeingReplied: comment,
      });
    }

    this.setState({
      replyComment: "",
    });
  };

  handleCommentChange = (event) => {
    this.setState({
      [event.target.id]: event.target.value,
    });
  };

  handleCommentBeingEditedChange = (event) => {
    const { commentBeingEdited } = this.state;

    this.setState({
      commentBeingEdited: {
        ...commentBeingEdited,
        content: event.target.value,
      },
    });
  };

  filterDeletedComment = (comments, deletedCommentId) => {
    let filteredComments = [];
    filteredComments = comments.filter((comment, index) => {
      if (comment.repliesList) {
        comments[index].repliesList = this.filterDeletedComment(
          comment.repliesList,
          deletedCommentId
        );
      }
      return comment.commentId !== deletedCommentId;
    });
    return filteredComments;
  };

  deleteComment = async (commentId) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      let { comments } = this.state;
      await API.del("posts", `/comments/${commentId}`);
      comments = this.filterDeletedComment(comments, commentId);
      this.setState({
        comments,
      });
    }
  };

  onCommentLike = async (comment, commentLiked, loggedInUser, name) => {
    if (this.props.isAuthenticated) {
      const { comments } = this.state;

      // Instant UI update magic
      if (commentLiked) {
        comment.likesList = comment.likesList.filter(
          (like) => like.userName !== loggedInUser
        );
      } else {
        comment.likesList = comment.likesList || [];
        comment.likesList.push({
          userName: loggedInUser,
          authorName: name,
        });
      }
      this.setState({
        comments: this.updateEditedComment(comments, comment),
      });

      try {
        await API.post("posts", "/comments/like", {
          body: {
            commentId: comment.commentId,
          },
        });
        this.getComments(true);
      } catch (e) {
        console.log(e);
      }
    } else {
      const { setShowLoginModalState, setPreventRatingSubmitState } =
        this.props;
      setShowLoginModalState(true);
      setPreventRatingSubmitState(true);
    }
  };

  addRepliedComment = (comments, commentBeingReplied, newComment) => {
    let updatedComments;
    updatedComments = comments.map((comment, index) => {
      if (comment.commentId === commentBeingReplied.commentId) {
        comments[index].repliesList = comments[index].repliesList || [];
        comments[index].repliesList.push(newComment);
      } else if (comment.repliesList) {
        comments[index].repliesList = this.addRepliedComment(
          comments[index].repliesList,
          commentBeingReplied,
          newComment
        );
      }
      return comment;
    });
    return updatedComments;
  };

  onCommentReplySubmit = async (e) => {
    e.preventDefault();
    const { replyComment, commentBeingReplied } = this.state;
    let { comments } = this.state;

    this.setState({
      addingReplyComment: true,
    });

    try {
      const response = await API.post("posts", "/comments", {
        body: {
          content: replyComment,
          parentCommentId: commentBeingReplied.commentId,
        },
      });

      let updatedComments = this.addRepliedComment(
        comments,
        commentBeingReplied,
        response
      );

      this.setState({
        comments: updatedComments,
        replyComment: null,
        commentBeingReplied: {},
      });
    } catch (e) {
      console.log(e);
    } finally {
      this.setState({
        addingReplyComment: false,
      });
    }
  };

  updateEditedComment = (comments, commentBeingEdited) => {
    let updatedComments;
    updatedComments = comments.map((comment, index) => {
      if (comment.commentId === commentBeingEdited.commentId) {
        return commentBeingEdited;
      } else if (comment.repliesList) {
        comments[index].repliesList = this.updateEditedComment(
          comments[index].repliesList,
          commentBeingEdited
        );
      }
      return comment;
    });
    return updatedComments;
  };

  onCommentSubmit = async (e) => {
    e.preventDefault();
    let { comment, comments, commentBeingEdited } = this.state;
    const post = this.props.posts;

    this.setState({
      addingComment: true,
    });

    try {
      const response = await API.post("posts", "/comments", {
        body: {
          postId: post.postId,
          content: commentBeingEdited.commentId
            ? commentBeingEdited.content
            : comment,
          commentId: commentBeingEdited.commentId,
        },
      });

      if (commentBeingEdited.commentId) {
        comments = this.updateEditedComment(comments, commentBeingEdited);
      } else {
        comments.unshift(response);
      }

      this.setState({
        comment: null,
        isCommentFormInFocus: false,
        comments: comments,
        commentBeingEdited: {},
      });
    } catch (e) {
      console.log(e);
    } finally {
      this.setState({
        addingComment: false,
      });
    }
  };

  commentLikesPopover = (likesList = []) => {
    return (
      <Popover id="popover-basic" className="p-2">
        {likesList.map((like) => {
          return (
            <Fragment key={like.userName}>
              {like.authorName}
              <br />
            </Fragment>
          );
        })}
      </Popover>
    );
  };

  userPicColFragment = ({ picture, name, renderBlankSpace = false }) => {
    if (renderBlankSpace) {
      return <div className="pic-col"></div>;
    }

    return (
      <div className="pic-col">
        {picture ? (
          <img className="author-pic" alt={name} src={picture} />
        ) : (
          <p className="text-muted">
            <FontAwesomeIcon
              className="user-icon ml-1 mr-1"
              icon={faUserCircle}
            />
          </p>
        )}
      </div>
    );
  };

  commentContentColFragment = ({
    formOnClick,
    formOnFocus,
    formOnSubmit,
    placeholder = "",
    id = "",
    onCommentChange,
    commentValue = "",
    textAreaAdditionalClass = "",
    shouldShowActions = true,
    onCancel,
    isAddingComment = false,
  }) => {
    return (
      <div className="content-col">
        <Form
          onClick={formOnClick}
          onFocus={formOnFocus}
          onSubmit={formOnSubmit}
        >
          <TextareaAutosize
            className={`form-control ${textAreaAdditionalClass}`}
            placeholder={placeholder}
            id={id}
            onChange={onCommentChange}
            value={commentValue || ""}
          />
          {shouldShowActions && (
            <div className="cancel-input mb-2 text-right">
              <Button
                type="button"
                variant="link"
                className="text-primary"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <LoaderButton
                variant="primary"
                className="comment-submit"
                type="submit"
                size="sm"
                isLoading={isAddingComment}
                text="Comment"
                loadingText="Submitting…"
                disabled={!(commentValue && commentValue.length > 0)}
              />
            </div>
          )}
        </Form>
      </div>
    );
  };

  renderComments = (comments, nestLevel = 1) => {
    const {
      replyComment,
      addingReplyComment,
      commentBeingEdited,
      commentBeingReplied,
      addingComment,
    } = this.state;
    const {
      preferredUsername,
      username,
      isAuthenticated,
      name,
      picture,
      setShowLoginModalState,
      setPreventRatingSubmitState,
    } = this.props;

    let loggedInUser = "";

    if (isAuthenticated) {
      loggedInUser = preferredUsername ?? username;
    }

    return comments.map((comment, index) => {
      const commentLiked =
        comment.likesList &&
        comment.likesList.some((like) => {
          return like && like.userName === loggedInUser;
        });

      return (
        <React.Fragment key={index}>
          <Row
            className={`comment ${
              isAuthenticated && comment.userName === loggedInUser
                ? "comment-owner"
                : ""
            }`}
          >
            {this.userPicColFragment({
              picture: comment.authorPicture,
              name: comment.authorName,
            })}
            <div className="content-col">
              <div className="author-meta-row">
                <Styles.CommentAuthorName>
                  {comment.authorName}
                </Styles.CommentAuthorName>
                <small>
                  • <Moment fromNow>{comment.createdAt}</Moment>
                </small>
                {isAuthenticated && comment.userName === loggedInUser && (
                  <DropdownButton
                    variant="link"
                    title=""
                    className="float-right delete-comment"
                    alignRight
                  >
                    <Dropdown.Item
                      href="#"
                      onClick={() => {
                        this.handleEditCommentClick(comment);
                      }}
                    >
                      Edit
                    </Dropdown.Item>
                    <Dropdown.Item
                      href="#"
                      onClick={() => {
                        this.deleteComment(comment.commentId);
                      }}
                    >
                      Delete
                    </Dropdown.Item>
                  </DropdownButton>
                )}
              </div>
              {commentBeingEdited.commentId === comment.commentId ? (
                <TextareaAutosize
                  className="form-control"
                  onChange={this.handleCommentBeingEditedChange}
                  value={
                    commentBeingEdited.content ? commentBeingEdited.content : ""
                  }
                />
              ) : (
                <p
                  dangerouslySetInnerHTML={{
                    __html: parseLinksToHtml(comment.content),
                  }}
                ></p>
              )}
              <div className="comment-actions-row">
                <small>
                  <Button
                    size="sm"
                    variant="link"
                    className="comment-action-btn"
                    onClick={() => {
                      this.onCommentLike(
                        comment,
                        commentLiked,
                        loggedInUser,
                        name
                      );
                    }}
                  >
                    {commentLiked ? (
                      <FontAwesomeIcon
                        className="heartFilled user-icon ml-1 mr-1"
                        icon={faHeartFilled}
                        title="Unlike comment"
                      />
                    ) : (
                      <FontAwesomeIcon
                        className="user-icon ml-1 mr-1"
                        icon={faHeart}
                        title="Like comment"
                      />
                    )}
                  </Button>
                  {comment.likesList && comment.likesList.length > 0 ? (
                    <>
                      {` • `}
                      <OverlayTrigger
                        overlay={this.commentLikesPopover(comment.likesList)}
                      >
                        <span className="like-text">
                          {`${comment.likesList.length} like${
                            comment.likesList.length > 1 ? "s" : ""
                          }`}
                        </span>
                      </OverlayTrigger>
                    </>
                  ) : null}
                  <span className={`${nestLevel >= 4 ? "d-none" : ""}`}>
                    {` • `}
                    <Button
                      size="sm"
                      variant="link"
                      className={`${
                        commentBeingReplied.commentId === comment.commentId
                          ? "is-active"
                          : ""
                      } comment-action-btn`}
                      onClick={() => {
                        this.handleReplyClick(comment);
                      }}
                    >
                      <FontAwesomeIcon
                        className="user-icon ml-1 mr-1"
                        icon={faReply}
                        title="Reply to comment"
                      />
                      {` Reply`}
                    </Button>
                  </span>
                </small>
                {commentBeingEdited.commentId === comment.commentId && (
                  <div className="float-right">
                    <Button
                      type="button"
                      variant="link"
                      className="text-primary"
                      onClick={(e) => {
                        e.preventDefault();
                        this.setState({
                          commentBeingEdited: {},
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <LoaderButton
                      variant="primary"
                      className="comment-submit"
                      type="submit"
                      size="sm"
                      isLoading={addingComment}
                      text="Update"
                      loadingText="Updating…"
                      onClick={this.onCommentSubmit}
                      disabled={
                        !(
                          commentBeingEdited.content &&
                          commentBeingEdited.content.length > 0 &&
                          commentBeingEdited.content !== comment.content
                        )
                      }
                    />
                  </div>
                )}
              </div>
              {comment.repliesList &&
                this.renderComments(comment.repliesList, nestLevel + 1)}
            </div>
          </Row>
          {commentBeingReplied.commentId === comment.commentId && (
            <Row key={index} className={`comment px-2 py-2`}>
              {this.userPicColFragment({ renderBlankSpace: true })}
              {this.userPicColFragment({
                picture: isAuthenticated && picture,
                name,
              })}
              {this.commentContentColFragment({
                formOnClick: () => {
                  if (!isAuthenticated) {
                    setShowLoginModalState(true);
                    setPreventRatingSubmitState(true);
                  }
                },
                formOnSubmit: this.onCommentReplySubmit,
                placeholder: `Reply to ${commentBeingReplied.authorName}`,
                id: "replyComment",
                onCommentChange: this.handleCommentChange,
                commentValue: replyComment,
                textAreaAdditionalClass: "reply-area",
                shouldShowActions: isAuthenticated,
                onCancel: (e) => {
                  e.preventDefault();
                  this.handleReplyClick(comment);
                },
                isAddingComment: addingReplyComment,
              })}
            </Row>
          )}
        </React.Fragment>
      );
    });
  };

  commentsCount = (comments) => {
    let count = 0;

    for (let i = 0; i < comments.length; i++) {
      count++;
      if (comments[i].repliesList) {
        count += this.commentsCount(comments[i].repliesList);
      }
    }
    return count;
  };

  render() {
    const {
      commentsLoading,
      comments,
      isCommentFormInFocus,
      comment,
      addingComment,
    } = this.state;
    const {
      isAuthenticated,
      picture,
      name,
      theme,
      post,
      setPreventRatingSubmitState,
      setShowLoginModalState,
    } = this.props;

    if (post.song) {
      return (
        <div className="Comments">
          <h6 className="comment-heading">
            {`COMMENTS${
              commentsLoading ? "" : " (" + this.commentsCount(comments) + ")"
            }`}
          </h6>
          {commentsLoading ? (
            <SkeletonTheme
              color={theme.backgroundHighlight}
              highlightColor={theme.body}
            >
              <Skeleton count={5} />
            </SkeletonTheme>
          ) : (
            <Container>
              <Row className="comment no-hover px-2 py-2">
                {this.userPicColFragment({
                  picture: isAuthenticated && picture,
                  name,
                })}
                {this.commentContentColFragment({
                  formOnClick: () => {
                    if (!isAuthenticated) {
                      setShowLoginModalState(true);
                      setPreventRatingSubmitState(true);
                    }
                  },
                  formOnFocus: () => {
                    if (isAuthenticated) {
                      this.setState({
                        isCommentFormInFocus: true,
                        commentBeingEdited: {},
                      });
                    }
                  },
                  formOnSubmit: this.onCommentSubmit,
                  placeholder: "Join the discussion...",
                  id: "comment",
                  onCommentChange: this.handleCommentChange,
                  commentValue: comment,
                  textAreaAdditionalClass: isCommentFormInFocus ? "focus" : "",
                  shouldShowActions: isCommentFormInFocus && isAuthenticated,
                  onCancel: (e) => {
                    e.preventDefault();
                    this.setState({
                      isCommentFormInFocus: false,
                    });
                  },
                  isAddingComment: addingComment,
                })}
              </Row>
              {this.renderComments(comments)}
            </Container>
          )}
        </div>
      );
    } else {
      return null;
    }
  }
}
