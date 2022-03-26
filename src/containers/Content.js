import React, { Component } from "react";
import { Button, Row, Col, OverlayTrigger, Popover, Modal, Container, Form, DropdownButton, Dropdown } from "react-bootstrap";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { LinkContainer } from "react-router-bootstrap";
import { Helmet } from "react-helmet";
import ReactGA from "react-ga";
import Moment from "react-moment";
import ReactMarkdown from "react-markdown";
import TextareaAutosize from "react-autosize-textarea/lib";
import config from "../config";
import { API } from "aws-amplify";
import StarRatings from "react-star-ratings";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRandom, faHistory, faUserCircle } from "@fortawesome/free-solid-svg-icons";
import { slugify, capitalizeFirstLetter, parseLinksToHtml } from "../libs/utils";
import Sidebar from "./Sidebar";
import NotFound from "./NotFound";
import ContentParser from "./ContentParser";
import LoaderButton from "../components/LoaderButton";
import Login from "./Login";
import * as Styles from "./Styles";
import "./Content.css";

export default class Content extends Component {
  constructor(props) {
    super(props);
    this.ratingEl = React.createRef();
    this.removeMd = require("remove-markdown");
    this.matchedContentInitialized = false;

    this.state = {
      showLoginModal: false,
      rating: undefined,
      comment: null,
      comments: [],
      commentsLoading: true,
      isCommentFormInFocus: false,
      addingComment: false,
      preventRatingSubmit: false
    }
  }

  componentDidMount = () => {
    this.getComments();
  }

  componentDidUpdate = (prevProps, prevState) => {
    if(prevProps.adKey !== this.props.adKey) {
      this.matchedContentInitialized = false;
    }

    if(document.querySelectorAll("div.matchedContent").length > 0 &&!this.matchedContentInitialized) {
      this.matchedContentInitialized = true;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch(e) {
        console.log(e);
      }
    }

    if(this.props.isAuthenticated && !this.props.isLoading && !Array.isArray(this.props.posts) && (this.props.posts.postId !== prevProps.posts.postId)) {
      this.getRating();
    }

    if(!Array.isArray(this.props.posts) && (this.props.posts.postId !== prevProps.posts.postId)) {
      this.getComments();
    }
  }

  getRating = async () => {
    let post = this.props.posts;
    let ratingLog = await API.get("posts", `/rating?postId=${post.postId}`);
    if(ratingLog && ratingLog.hasOwnProperty("rating")) {
      this.setState({
        rating: parseInt(ratingLog.rating)
      });
    } else {
      this.setState({
        rating: undefined
      });   
    }
  }

  getComments = async () => {
    const post = this.props.posts;
    if (post.postId) {
      this.setState({
        commentsLoading: true
      });
      try {
        const comments = await API.get("posts", `/comments?postId=${post.postId}`);
        this.setState({
          comments: comments.Items,
          commentsLoading: false
        });
      } catch(e) {
        console.log(e);
        this.setState({
          commentsLoading: false
        });
      }
    }
  }

  formatDate(date) {
    return(
      <Moment format="MMMM D, YYYY">{ date }</Moment>
    );
  }

  prepareLastEvaluatedPostRequest = (lastEvaluatedPost) => {
    return encodeURIComponent(JSON.stringify(lastEvaluatedPost).replace(/"/g, "'"));
  }

  loadPagination = (lastEvaluatedPost) => {
    if(lastEvaluatedPost && lastEvaluatedPost.hasOwnProperty("postId")) {
      if(this.props.isPageUrl) {
        let nextPage = parseInt(this.props.match.params.number) + 1;
        let loadMorelink = "/#";
        if(this.props.isHomePage) {
          loadMorelink = `/page/${nextPage}`;
        } else if(this.props.isCategory) {
          loadMorelink = `/category/${this.props.match.params.category}/page/${nextPage}`;
        } else if(this.props.isUserPosts) {
          loadMorelink = `/author/${this.props.match.params.userName}/page/${nextPage}`;
        }

        return (
          <LinkContainer to={loadMorelink}>
            <a href="#/" className="load-more">
              <LoaderButton
                isLoading={false}
                text="Next page"
                className="load-posts btn-secondary"
              />
            </a>
          </LinkContainer>
        );
      }

      let loadMorelink = "/#";
      if(this.props.isHomePage) {
        loadMorelink = "/page/2";
      } else if(this.props.isCategory) {
        loadMorelink = `/category/${this.props.match.params.category}/page/2`;
      } else if(this.props.isUserPosts) {
        loadMorelink = `/author/${this.props.match.params.userName}/page/2`;
      }

      return (
        <a href={loadMorelink} className="load-more">
          <LoaderButton
            isLoading={this.props.isPaginationLoading}
            onClick={(e) => {
              e.preventDefault();
              this.props.loadPosts(this.prepareLastEvaluatedPostRequest(lastEvaluatedPost));
            }}
            text="Load more"
            loadingText="Loading"
            className="load-posts btn-secondary"
          />
        </a>
      );
    }
  }

  renderTitle = (title, isUserPosts, isCategory, posts, authorCreateDate) => {
    let displayTitle = title ? title : "LATEST POSTS";
    if(isUserPosts) {
      displayTitle = posts[0].authorName;

      if(this.props.isPageUrl) {
        displayTitle += ` - Page ${this.props.match.params.number}`;
      }
    }

    if(isUserPosts) {
      return (
        <div className="header-meta-container bg-light px-3 py-1 rounded">
          <Helmet>
            <title>{`${displayTitle} | Naadan Chords`}</title>
          </Helmet>
          { posts[0].authorPicture && <img className="header-picture" src={posts[0].authorPicture} alt={posts[0].userName} /> }
          { !posts[0].authorPicture && (
            <FontAwesomeIcon className="user-icon" icon={faUserCircle} />
          )}
          <h4>{displayTitle.toUpperCase()}</h4>
          <p><FontAwesomeIcon className="header-icon" icon={faHistory} /> Joined on {this.formatDate(authorCreateDate)}</p>
        </div>
      );
    } else if (isCategory) {
      return (
        <div className="header-meta-container bg-light px-3 rounded">
          <h4>{displayTitle.split(/-(.+)/)[0].trim().toUpperCase()}</h4>
          <p>{displayTitle.split(/-(.+)/)[1].trim()}</p>
        </div>
      );
    } else {
      return (
        <div>
          <Styles.PostListH6>{displayTitle.toUpperCase()}</Styles.PostListH6>
        </div>
      );
    }
  }

  renderPosts = () => {
    let { isLoading, theme, posts, lastEvaluatedPost, title, isUserPosts, isCategory, authorCreateDate } = this.props;

    if(isLoading) {
      let skeleton = [];

      for(var i=0; i<20; i++) {
        skeleton.push(
          <SkeletonTheme key={i} color={theme.backgroundHighlight} highlightColor={theme.body}>
            <Styles.PostItemContainer className="pt-1 pb-1 no-hover">
              <h5><Skeleton /></h5>
              <small><Skeleton /></small>
            </Styles.PostItemContainer>
          </SkeletonTheme>
        );
      }
      return (
        <div className="postList">
          { skeleton }
        </div>
      );
    } else {
      if(posts && posts.length > 0) {
        return (
          <div className="postList">
            <Styles.TitleContainer borderBottom={!isUserPosts && !isCategory} className="mb-2">
              { this.renderTitle(title, isUserPosts, isCategory, posts, authorCreateDate) }
              <LinkContainer to="/random">
                <a href="#/" className={`${title? "d-none":""} random-post`}>
                  <FontAwesomeIcon className="mr-2" icon={ faRandom } />Random
                </a>
              </LinkContainer>
            </Styles.TitleContainer>
            {
              posts.map((post, i) =>
                <Styles.PostItemContainer key={i} alternate={i % 2 !== 0}>
                  <LinkContainer  exact to={`/${ post.postId }`}>
                    <a href="#/" className="post-title">
                      <h5>{ post.title }</h5>
                    </a>
                  </LinkContainer>
                  <small className="post-item-meta">
                    { this.formatDate( post.createdAt ) }
                    <span className="separator"> | </span>
                    <LinkContainer key={i} to={`/author/${ post.userName }`}>
                      <a href="#/">{ post.authorName }</a>
                    </LinkContainer>
                    { this.renderRating(post, true) }
                  </small>
                </Styles.PostItemContainer>
              )
            }
            { this.loadPagination(lastEvaluatedPost) }
          </div>
        );
      } else {
        return this.render404();
      }
    }
  }

  renderRateLink = (isPostList) => {
    if(!isPostList) {
      return (
        <span>
          <hr className="mt-2 mb-2" />
          <a href="#/" className="text-primary" onClick={(e) => {
            e.preventDefault();
            this.ratingEl.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            this.ratingEl.current.click();
          }}>
            Click here to add your rating
          </a>
        </span>
      );
    }
  }

  ratingPopover = (post, isPostList) => {
    if(post.rating && post.ratingCount) {
      return (
        <Popover id="popover-basic" className="p-2">
          Average star rating of <b>{post.rating.toFixed(2)} / 5</b>.
          <br />
          Calculated from ratings by <b>{post.ratingCount}</b> user{post.ratingCount > 1 ? 's' : ''}.
          { this.renderRateLink(isPostList) }
        </Popover>
      );
    } else {
      return (
        <Popover id="popover-basic" className="p-2">
          No ratings yet.<br/>
          <span className={`${isPostList ? 'd-none' : ''}`}>Why don't you be the first? :)</span>
          { this.renderRateLink(isPostList) }
        </Popover>
      );
    }
  }

  renderRating = (post, isPostList) => {
    return (
      <span className={`post-rating ${isPostList ? 'post-list': ''}`}>
        <span className="separator ml-1 mr-1">|</span>
        <OverlayTrigger trigger="click" placement="bottom" overlay={this.ratingPopover(post, isPostList)} rootClose>
          <span>
            <StarRatings
              starRatedColor="#FFD700"
              starHoverColor="#FFD700"
              starDimension={`${isPostList ? '15px' : '18px'}`}
              starSpacing="0.5px"
              numberOfStars={5}
              name="rating"
              rating={post.rating}
            />
            <span className={`ml-1 ${post.ratingCount > 0 ? '' : 'd-none'}`}>
              ({post.ratingCount})
            </span>
          </span>
        </OverlayTrigger>
      </span>
    );
  }

  renderPostMeta = (post) => {
    if(post.postType === "PAGE") {
      return (
        <div>
          <h1 className="page">{ post.title }</h1>
          <hr />
        </div>
      );
    } else {
      return (
        <div>
          <a href="#/" className="navigate-link" onClick={this.props.goBack}>
            <small>← Go back</small>
          </a>
          <h1>{ post.title }</h1>
          <small>
            <LinkContainer to={`/author/${ post.userName }`}>
              <a className="author-picture" href="#/">
                {
                  post.authorPicture ? (
                    <img src={post.authorPicture} alt={post.authorName} />
                  ) : (
                    <FontAwesomeIcon className="user-icon ml-1 mr-1" icon={faUserCircle} />
                  )
                }
              </a>
            </LinkContainer>
            <LinkContainer to={`/author/${ post.userName }`}>
              <a href="#/">{ post.authorName }</a>
            </LinkContainer>
            <span className="ml-1 mr-1">in</span>
            <LinkContainer exact to={`/category/${post.category.toLowerCase()}`}>
              <a href="#/">
                { capitalizeFirstLetter(post.category) }
              </a>
            </LinkContainer>
            <span className="separator ml-1 mr-1">|</span>
            <div className="meta-time-container">
              <FontAwesomeIcon className="d-inline ml-1 mr-1" icon={faHistory} />
              { this.formatDate( post.createdAt ) }
            </div>
            { this.renderRating(post) }
          </small>
          <hr />
        </div>
      );
    }
  }

  changeRating = (newRating, forceSubmit) => {
    let post = this.props.posts;

    if(this.props.isAuthenticated) {
      if(forceSubmit === true || newRating !== this.state.rating) {
        if (newRating !== undefined) {
          this.setState({
            rating: newRating
          });

          API.post("posts", "/rating", {
            body: {
              rating: newRating,
              postId: post.postId
            }
          });
        }
      }
    } else {
      this.setState({
        rating: newRating,
        showLoginModal: true
      });
    }
  }

  renderStarRating = (post) => {
    const { theme } = this.props;

    return (
      <div className="rate-container">
        <div ref={this.ratingEl} className="dummy-anchor"></div>
        <h6 className="rate-heading">RATE THIS POST</h6>
        <div className="rate-inner-container">
          <StarRatings
            starRatedColor="#FFD700"
            starHoverColor="#FFD700"
            starDimension="25px"
            starSpacing="1px"
            numberOfStars={5}
            name="rating"
            rating={this.props.isAuthenticated ? this.state.rating : undefined}
            changeRating={this.changeRating}
          />
          <Button variant={theme.name} onClick={() => this.changeRating(0)} className={`border ${this.state.rating && this.props.isAuthenticated ? 'd-block' : 'd-none'}`} size="sm">
            Clear
          </Button>
        </div>
        <small className={`pt-2 ${this.state.rating && this.props.isAuthenticated ? 'd-block' : 'd-none'}`}><i>You've rated this post. You can change your rating at any time.</i></small>
      </div>
    );
  }

  renderPostContent = (post) => {
    if(post.postType === "PAGE") {
      return (
        <ReactMarkdown components={{
          table: (props) => {
              return <table className="table table-striped">{props.children}</table>
          }
        }}>
          { post.content }
        </ReactMarkdown>
      );
    } else {
      return (
        <div className="content">
          <ContentParser post={ post } {...this.props} />
          { this.renderStarRating(post) }
        </div>
      );
    }
  }

  renderMatchedContentAd = (post) => {
    const { theme } = this.props;

    if(post.postType === "POST" && !config.noAds.includes(post.postId)) {
      return (
        <div className="matchedContent">
          <br />
          <hr />
            <h6>YOU MAY ALSO LIKE</h6>
            <ins className="adsbygoogle"
            style={{display: "block"}}
            data-ad-format="autorelaxed"
            data-ad-client="ca-pub-1783579460797635"
            data-ad-slot={theme.name === "light" ? "2717060707" : "5061016497"}
            key={this.props.adKey}>
          </ins>
        </div>
      );
    }
  }

  handleCommentChange = event => {
    this.setState({
      [event.target.id]: event.target.value
    });
  }

  deleteComment = async(commentId) => {
    if(window.confirm('Are you sure you want to delete this comment?')) {
      let { comments } = this.state;
      await API.del("posts", `/comments/${commentId}`);
      comments = comments.filter(comment => {
        return comment.commentId !== commentId
      });
      this.setState({
        comments
      });
    }
  }

  onCommentSubmit = async (e) => {
    e.preventDefault();
    const { comment, comments } = this.state;
    const post = this.props.posts;

    this.setState({
      addingComment: true
    });

    try {
      const response = await API.post("posts", "/comments", {
        body: {
          postId: post.postId,
          content: comment
        }
      });
      comments.unshift(response);
      this.setState({
        comment: null,
        isCommentFormInFocus: false,
        comments: comments
      });
    } catch(e) {
      console.log(e);
    } finally {
      this.setState({
        addingComment: false
      });
    }
  }

  renderComments = (post) => {
    const { commentsLoading, comments, isCommentFormInFocus, comment, addingComment } = this.state;
    const { isAuthenticated, picture, name, preferredUsername, username, theme } = this.props;
    const loggedInUser = preferredUsername ?? username;

    if(post.song) {
      return (
        <div className="comment-section">
          <br />
          <hr />
          <h6 className="comment-heading">
            {`COMMENTS${commentsLoading ? '' : ' (' + comments.length + ')'}`}
          </h6>
          { commentsLoading ? (
            <SkeletonTheme color={theme.backgroundHighlight} highlightColor={theme.body}>
              <Skeleton count={5} />
            </SkeletonTheme>
          ) : (
            <Container>
              <Row className="comment no-hover px-2 py-2">
                <div className="pic-col">
                  {(isAuthenticated && picture) ? (
                    <img className="author-pic" alt={name} src={picture} />
                  ) : (
                    <p className="text-muted">
                      <FontAwesomeIcon className="user-icon ml-1 mr-1" icon={faUserCircle} />
                    </p>
                  )}
                </div>
                <div className="content-col">
                  <Form
                    onClick={() => {
                      if (!isAuthenticated) {
                        this.setState({
                          showLoginModal: true,
                          preventRatingSubmit: true
                        });
                      }
                    }}
                    onFocus={() => {
                      if (isAuthenticated) {
                        this.setState({
                          isCommentFormInFocus: true
                        });
                      }
                    }}
                    onSubmit={this.onCommentSubmit}
                  >
                    <TextareaAutosize
                      className={`form-control ${isCommentFormInFocus ? 'focus' : ''}`}
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
                              isCommentFormInFocus: false
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
                return (
                  <Row
                    key={index}
                    className={`comment px-2 py-2 ${(isAuthenticated && comment.userName === loggedInUser) ? "comment-owner" : ""}`}
                  >
                    <div className="pic-col">
                      {comment.authorPicture ? (
                        <img className="author-pic" alt={`Commented by ${comment.authorName}`} src={comment.authorPicture} />
                      ) : (
                        <p className="text-muted">
                          <FontAwesomeIcon className="user-icon ml-1 mr-1" icon={faUserCircle} />
                        </p>
                      )}
                    </div>
                    <div className="content-col">
                      <div className="author-meta-row text-muted">
                        <b>{`${comment.authorName}`} </b>
                        <small>• <Moment fromNow>{comment.createdAt}</Moment></small>
                        <DropdownButton
                          variant="link"
                          className="float-right delete-comment"
                          alignRight
                        >
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
                      <p dangerouslySetInnerHTML={{__html: parseLinksToHtml(comment.content)}}></p>
                    </div>
                  </Row>
                );
              })}
            </Container>
          )}
        </div>
      );
    }
  }

  render404 = () => {
    if(this.props.search) {
      //Event to track empty search results
      ReactGA.event({
        category: 'Search',
        action: 'Empty result',
        label: this.props.search
      });
    }

    return (
      <NotFound isEmbed={true} />
    );
  }

  closeLoginModal = (retryRatingSubmit) => {
    const { preventRatingSubmit } = this.state;

    if(retryRatingSubmit && !preventRatingSubmit) {
      this.changeRating(this.state.rating, true);
    }

    this.setState({
      showLoginModal: false,
      preventRatingSubmit: false
    });
  }

  renderStructuredData = (post) => {
    if(post.postType === "POST") {
      let structuredData = [];
      let category = post.category.toLowerCase();
      let album = post.album;

      structuredData.push(
        <script key={1} type="application/ld+json">
          {`
            {
              "@context": "http://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement":[
              {
                "@type": "ListItem",
                "position": 1,
                "item":{
                  "@id": "https://www.naadanchords.com/category/${category}",
                  "name": "${capitalizeFirstLetter(post.category)}"
                }
              },
              {
                "@type": "ListItem",
                "position": 2,
                "item":{
                  "@id": "https://www.naadanchords.com/album/${slugify(album)}",
                  "name": "${album}"
                }
              },
              {
                "@type": "ListItem",
                "position": 3,
                "item":{
                  "@id": "https://www.naadanchords.com/${post.postId}",
                  "name": "${post.song}"
                }
              }]
            }
          `}
        </script>
      );

      if(post.hasOwnProperty("rating")) {
        let createdAtISOString = new Date(post.createdAt).toISOString();

        structuredData.push(
          <script key={2} type="application/ld+json">
            {
              `{
                "@context":"http://schema.org",
                "@type":"MusicRecording",
                "byArtist": {
                  "@context":"http://schema.org",
                  "@type":"MusicGroup",
                  "name":"${post.singers}"
                },
                "inAlbum": {
                  "@context":"http://schema.org",
                  "@type":"MusicAlbum",
                  "name":"${post.album}",
                  "byArtist": {
                    "@context":"http://schema.org",
                    "@type":"MusicGroup",
                    "name":"${post.music}"
                  }
                },
                "name":"${post.song}",
                "url":"https://www.naadanchords.com/${post.postId}",
                "datePublished": "${createdAtISOString}",
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": "${post.rating}",
                  "reviewCount": "${post.ratingCount}"
                }
              }`
            }
          </script>
        );
      }

      return structuredData;
    }
  }

  renderPost = () => {
    let { isLoading, posts, theme } = this.props;
    let post = posts;

    if(isLoading) {
      return (
        <div className="post">
          <SkeletonTheme color={theme.backgroundHighlight} highlightColor={theme.body}>
            <h1><Skeleton /></h1>
            <hr />
            <Skeleton count={50} />
          </SkeletonTheme>
        </div>
      );
    } else {
      if(post.postId) {
        let loginChildProps = {
          isDialog: true,
          closeLoginModal: this.closeLoginModal
        };

        return (
          <div className="post">
            <Modal
              style={{top: "20px"}}
              show={this.state.showLoginModal}
              onHide={this.closeLoginModal}
            >
              <Modal.Header closeButton>
              <Modal.Title>
                Login
              </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Login {...loginChildProps} {...this.props} />
              </Modal.Body>
            </Modal>
            { this.renderPostMeta(post) }
            { this.renderPostContent(post) }
            { this.renderMatchedContentAd(post) }
            { this.renderComments(post) }
            { this.renderStructuredData(post) }
          </div>
        );
      } else {
        return this.render404();
      }
    }
  }

  renderContent = () => {
    let { posts, isPostList } = this.props;
    
    if(Array.isArray(posts) || isPostList) {
      //render all posts
      return this.renderPosts();
    } else {
      //render single post
      return this.renderPost();
    }
  }

  renderSEOTags() {
    let { posts = {} } = this.props;

    if(posts.content && !Array.isArray(posts)) {
      let description = "";
      let imageURL = "";

      if(posts.postType === "PAGE") {
        description = posts.content.substring(0, 157).trim();
        description = description.substr(0, Math.min(description.length, description.lastIndexOf(" "))) + "..";
        description = this.removeMd(description);
      } else {
        description = `Guitar chords and tabs of ${posts.song} - ${posts.album} with lyrics`;
        description += `. Music by ${posts.music} and Sung by ${posts.singers}.`;
        if (posts.lyrics) {
          description += ` Lyrics penned by ${posts.lyrics}.`;
        }
        description += ` Transpose chords to any scale or pitch.`
        imageURL = posts.image ? posts.image : "";
      }

      return (
        <Helmet>
          <title>{posts.title.toUpperCase()} | Naadan Chords</title>
          <meta name="description" content={description} />
          <meta name="twitter:card" content="summary" />
          <meta property="og:title" content={`${posts.title} | Naadan Chords`} />
          <meta property="og:description" content={description} />
          <meta property="og:image" content={imageURL} />
        </Helmet>
      );
    } else {
      return (
        <Helmet>
          <title>{this.props.title ? `${capitalizeFirstLetter(this.props.title)} | Naadan Chords` : "Naadan Chords | Guitar Chords and Tabs of Malayalam Songs"}</title>
          <meta name="description" content="Naadan Chords is the best place to get the chords for your favorite Malayalam and Tamil songs. Transpose chords to any scale or pitch, autoscroll chord sheet to play hassle free and adjust font size of lyrics." />
          <meta name="twitter:card" content="summary" />
          <meta property="og:title" content="Naadan Chords | Guitar Chords and Tabs of Malayalam Songs" />
          <meta property="og:description" content="Naadan Chords is the best place to get the chords for your favorite Malayalam and Tamil songs. Transpose chords to any scale or pitch, autoscroll chord sheet to play hassle free and adjust font size of lyrics." />
        </Helmet>
      );
    }
  }

  renderTopAd = () => {
    if(this.state.posts && !Array.isArray(this.state.posts) && config.noAds.includes(this.state.posts.postId)) {
      return;
    }

    return (
      <div className="ad" style={{maxHeight: "120px"}}>
        <ins className="adsbygoogle"
          style={{display:"block"}}
          data-ad-client="ca-pub-1783579460797635"
          data-ad-slot="6826392919"
          data-ad-format="horizontal"
          data-full-width-responsive="false"
          key={this.props.adKey}>
        </ins>
      </div>
    );
  }

  render() {
    return (
      <Styles.ContentContainer className="Content">
        { this.renderSEOTags() }
        <Row className="contentRow">
          <Col lg={8} className="contentColumn">
            { this.renderTopAd() }
            { this.renderContent() }
          </Col>
          <Styles.SidebarCol lg={4} className="sidebarColumn">
            <Sidebar {...this.props} />
          </Styles.SidebarCol>
        </Row>
      </Styles.ContentContainer>
    );
  }
}
