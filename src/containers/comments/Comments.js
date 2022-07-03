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
} from "@fortawesome/free-solid-svg-icons";
import { faHeart } from "@fortawesome/free-regular-svg-icons";
import TextareaAutosize from "react-autosize-textarea/lib";
import { API } from "aws-amplify";
import LoaderButton from "../../components/LoaderButton";
import { parseLinksToHtml } from "../../libs/utils";
import "./Comments.css";

export default class Comments extends Component {
  constructor(props) {
    super(props);

    this.state = {
      commentsLoading: true,
      comments: [],
      commentBeingEdited: {},
      isCommentFormInFocus: false,
      comment: null,
      addingComment: false,
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

  deleteComment = async (commentId) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      let { comments } = this.state;
      await API.del("posts", `/comments/${commentId}`);
      comments = comments.filter((comment) => {
        return comment.commentId !== commentId;
      });
      this.setState({
        comments,
      });
    }
  };

  onCommentLike = async (
    comment,
    comments,
    index,
    commentLiked,
    loggedInUser,
    name
  ) => {
    if (this.props.isAuthenticated) {
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
      comments[index] = comment;
      this.setState({
        comments,
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
        comments = comments.map((comment) => {
          if (comment.commentId === commentBeingEdited.commentId) {
            return commentBeingEdited;
          }
          return comment;
        });
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

  render() {
    const {
      commentsLoading,
      comments,
      isCommentFormInFocus,
      comment,
      addingComment,
      commentBeingEdited,
    } = this.state;
    const {
      isAuthenticated,
      picture,
      name,
      preferredUsername,
      username,
      theme,
      post,
      setPreventRatingSubmitState,
      setShowLoginModalState,
    } = this.props;
    let loggedInUser = "";

    if (isAuthenticated) {
      loggedInUser = preferredUsername ?? username;
    }

    if (post.song) {
      return (
        <div className="Comments">
          <h6 className="comment-heading">
            {`COMMENTS${commentsLoading ? "" : " (" + comments.length + ")"}`}
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
                <div className="pic-col">
                  {isAuthenticated && picture ? (
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
                <div className="content-col">
                  <Form
                    onClick={() => {
                      if (!isAuthenticated) {
                        setShowLoginModalState(true);
                        setPreventRatingSubmitState(true);
                      }
                    }}
                    onFocus={() => {
                      if (isAuthenticated) {
                        this.setState({
                          isCommentFormInFocus: true,
                          commentBeingEdited: {},
                        });
                      }
                    }}
                    onSubmit={this.onCommentSubmit}
                  >
                    <TextareaAutosize
                      className={`form-control ${
                        isCommentFormInFocus ? "focus" : ""
                      }`}
                      placeholder="Join the discussion..."
                      id="comment"
                      onChange={this.handleCommentChange}
                      value={comment ? comment : ""}
                    />
                    {isCommentFormInFocus && isAuthenticated && (
                      <div className="mb-2 text-right">
                        <a
                          href="#/"
                          className="text-primary pt-1 mr-3"
                          onClick={(e) => {
                            e.preventDefault();
                            this.setState({
                              isCommentFormInFocus: false,
                            });
                          }}
                        >
                          Cancel
                        </a>
                        <LoaderButton
                          variant="primary"
                          className="comment-submit"
                          type="submit"
                          size="sm"
                          isLoading={addingComment}
                          text="Comment"
                          loadingText="Submitting…"
                          disabled={!(comment && comment.length > 0)}
                        />
                      </div>
                    )}
                  </Form>
                </div>
              </Row>
              {comments.map((comment, index) => {
                const commentLiked =
                  comment.likesList &&
                  comment.likesList.some((like) => {
                    return like && like.userName === loggedInUser;
                  });

                return (
                  <Row
                    key={index}
                    className={`comment px-2 py-2 ${
                      isAuthenticated && comment.userName === loggedInUser
                        ? "comment-owner"
                        : ""
                    }`}
                  >
                    <div className="pic-col">
                      {comment.authorPicture ? (
                        <img
                          className="author-pic"
                          alt={`Commented by ${comment.authorName}`}
                          src={comment.authorPicture}
                        />
                      ) : (
                        <p className="text-muted">
                          <FontAwesomeIcon
                            className="user-icon ml-1 mr-1"
                            icon={faUserCircle}
                          />
                        </p>
                      )}
                    </div>
                    <div className="content-col">
                      <div className="author-meta-row text-muted">
                        <b>{`${comment.authorName}`} </b>
                        <small>
                          • <Moment fromNow>{comment.createdAt}</Moment>
                        </small>
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
                      </div>
                      {commentBeingEdited.commentId === comment.commentId ? (
                        <TextareaAutosize
                          className="form-control"
                          onChange={this.handleCommentBeingEditedChange}
                          value={
                            commentBeingEdited.content
                              ? commentBeingEdited.content
                              : ""
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
                            className="comment-like-btn"
                            onClick={() => {
                              this.onCommentLike(
                                comment,
                                comments,
                                index,
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
                            <OverlayTrigger
                              overlay={this.commentLikesPopover(
                                comment.likesList
                              )}
                            >
                              <span className="like-text">
                                {` • ${comment.likesList.length} like${
                                  comment.likesList.length > 1 ? "s" : ""
                                }`}
                              </span>
                            </OverlayTrigger>
                          ) : null}
                        </small>
                        {commentBeingEdited.commentId === comment.commentId && (
                          <div className="float-right">
                            <a
                              href="#/"
                              className="text-primary pt-1 mr-3"
                              onClick={(e) => {
                                e.preventDefault();
                                this.setState({
                                  commentBeingEdited: {},
                                });
                              }}
                            >
                              Cancel
                            </a>
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
                    </div>
                  </Row>
                );
              })}
            </Container>
          )}
        </div>
      );
    } else {
      return null;
    }
  }
}
