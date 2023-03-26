import React, { Component } from "react";
import {
  Button,
  Row,
  Col,
  OverlayTrigger,
  Popover,
  Modal,
} from "react-bootstrap";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { LinkContainer } from "react-router-bootstrap";
import { Helmet } from "react-helmet";
import ReactGA from "react-ga4";
import Moment from "react-moment";
import ReactMarkdown from "react-markdown";
import config from "../config";
import { API } from "aws-amplify";
import StarRatings from "react-star-ratings";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRandom,
  faHistory,
  faUserCircle,
} from "@fortawesome/free-solid-svg-icons";
import { slugify, capitalizeFirstLetter } from "../libs/utils";
import Sidebar from "./Sidebar";
import NotFound from "./NotFound";
import ContentParser from "./ContentParser";
import LoaderButton from "../components/LoaderButton";
import Login from "./Login";
import Comments from "./comments/Comments";
import * as Styles from "./Styles";
import "./Content.css";

export default class Content extends Component {
  constructor(props) {
    super(props);
    this.ratingEl = React.createRef();
    this.removeMd = require("remove-markdown");
    this.inArticleAdInitialized = false;

    this.state = {
      showLoginModal: false,
      rating: undefined,
      preventRatingSubmit: false,
    };
  }

  componentDidUpdate = (prevProps) => {
    if (prevProps.adKey !== this.props.adKey) {
      this.inArticleAdInitialized = false;
    }

    if (!this.props.isLocalhost) {
      if (
        document.querySelectorAll("div.inArticle").length > 0 &&
        !this.inArticleAdInitialized &&
        !config.noAds.includes(window.location.pathname.replace(/\//, ""))
      ) {
        this.inArticleAdInitialized = true;
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
          console.log(e);
        }
      }
    }

    if (
      this.props.isAuthenticated &&
      !this.props.isLoading &&
      !Array.isArray(this.props.posts) &&
      this.props.posts.postId !== prevProps.posts.postId
    ) {
      this.getRating();
    }
  };

  setShowLoginModalState = (value) => {
    this.setState({
      showLoginModal: value,
    });
  };

  setPreventRatingSubmitState = (value) => {
    this.setState({
      preventRatingSubmit: value,
    });
  };

  getRating = async () => {
    let post = this.props.posts;
    let ratingLog = await API.get("posts", `/rating?postId=${post.postId}`);
    if (ratingLog && ratingLog.hasOwnProperty("rating")) {
      this.setState({
        rating: parseInt(ratingLog.rating),
      });
    } else {
      this.setState({
        rating: undefined,
      });
    }
  };

  formatDate(date) {
    return <Moment format="MMMM D, YYYY">{date}</Moment>;
  }

  prepareLastEvaluatedPostRequest = (lastEvaluatedPost) => {
    return encodeURIComponent(
      JSON.stringify(lastEvaluatedPost).replace(/"/g, "'")
    );
  };

  loadPagination = (lastEvaluatedPost) => {
    if (lastEvaluatedPost && lastEvaluatedPost.hasOwnProperty("postId")) {
      if (this.props.isPageUrl) {
        let nextPage = parseInt(this.props.match.params.number) + 1;
        let loadMorelink = "/#";
        if (this.props.isHomePage) {
          loadMorelink = `/page/${nextPage}`;
        } else if (this.props.isCategory) {
          loadMorelink = `/category/${this.props.match.params.category}/page/${nextPage}`;
        } else if (this.props.isUserPosts) {
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
      if (this.props.isHomePage) {
        loadMorelink = "/page/2";
      } else if (this.props.isCategory) {
        loadMorelink = `/category/${this.props.match.params.category}/page/2`;
      } else if (this.props.isUserPosts) {
        loadMorelink = `/author/${this.props.match.params.userName}/page/2`;
      }

      return (
        <a href={loadMorelink} className="load-more">
          <LoaderButton
            isLoading={this.props.isPaginationLoading}
            onClick={(e) => {
              e.preventDefault();
              this.props.loadPosts(
                this.prepareLastEvaluatedPostRequest(lastEvaluatedPost)
              );
            }}
            text="Load more"
            loadingText="Loading"
            className="load-posts btn-secondary"
          />
        </a>
      );
    }
  };

  renderTitle = (title, isUserPosts, isCategory, posts, authorCreateDate) => {
    let displayTitle = title ? title : "LATEST POSTS";
    if (isUserPosts) {
      displayTitle = posts[0].authorName;

      if (this.props.isPageUrl) {
        displayTitle += ` - Page ${this.props.match.params.number}`;
      }
    }

    if (isUserPosts) {
      return (
        <div className="header-meta-container bg-light px-3 py-1 rounded">
          <Helmet>
            <title>{`${displayTitle} | Naadan Chords`}</title>
          </Helmet>
          {posts[0].authorPicture && (
            <img
              className="header-picture"
              src={posts[0].authorPicture}
              alt={posts[0].userName}
            />
          )}
          {!posts[0].authorPicture && (
            <FontAwesomeIcon className="user-icon" icon={faUserCircle} />
          )}
          <h4>{displayTitle.toUpperCase()}</h4>
          <p>
            <FontAwesomeIcon className="header-icon" icon={faHistory} /> Joined
            on {this.formatDate(authorCreateDate)}
          </p>
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
  };

  renderPosts = () => {
    let {
      isLoading,
      theme,
      posts,
      lastEvaluatedPost,
      title,
      isUserPosts,
      isCategory,
      authorCreateDate,
    } = this.props;

    if (isLoading) {
      let skeleton = [];

      for (var i = 0; i < 20; i++) {
        skeleton.push(
          <SkeletonTheme
            key={i}
            color={theme.backgroundHighlight}
            highlightColor={theme.body}
          >
            <Styles.PostItemContainer className="pt-1 pb-1 no-hover">
              <h5>
                <Skeleton />
              </h5>
              <small>
                <Skeleton />
              </small>
            </Styles.PostItemContainer>
          </SkeletonTheme>
        );
      }
      return <div className="postList">{skeleton}</div>;
    } else {
      if (posts && posts.length > 0) {
        return (
          <div className="postList">
            <Styles.TitleContainer
              borderBottom={!isUserPosts && !isCategory}
              className="mb-2"
            >
              {this.renderTitle(
                title,
                isUserPosts,
                isCategory,
                posts,
                authorCreateDate
              )}
              <LinkContainer to="/random">
                <a href="#/" className={`${title ? "d-none" : ""} random-post`}>
                  <FontAwesomeIcon className="mr-2" icon={faRandom} />
                  Random
                </a>
              </LinkContainer>
            </Styles.TitleContainer>
            {posts.map((post, i) => (
              <Styles.PostItemContainer key={i} alternate={i % 2 !== 0}>
                <LinkContainer exact to={`/${post.postId}`}>
                  <a href="#/" className="post-title">
                    <h5>{post.title}</h5>
                  </a>
                </LinkContainer>
                <small className="post-item-meta">
                  {this.formatDate(post.createdAt)}
                  <span className="separator"> | </span>
                  <LinkContainer key={i} to={`/author/${post.userName}`}>
                    <a href="#/">{post.authorName}</a>
                  </LinkContainer>
                  {this.renderRating(post, true)}
                </small>
              </Styles.PostItemContainer>
            ))}
            {this.loadPagination(lastEvaluatedPost)}
          </div>
        );
      } else {
        return this.render404();
      }
    }
  };

  renderRateLink = (isPostList) => {
    if (!isPostList) {
      return (
        <span>
          <hr className="mt-2 mb-2" />
          <a
            href="#/"
            className="text-primary"
            onClick={(e) => {
              e.preventDefault();
              this.ratingEl.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
              this.ratingEl.current.click();
            }}
          >
            Click here to add your rating
          </a>
        </span>
      );
    }
  };

  ratingPopover = (post, isPostList) => {
    if (post.rating && post.ratingCount) {
      return (
        <Popover id="popover-basic" className="p-2">
          Average star rating of <b>{post.rating.toFixed(2)} / 5</b>.
          <br />
          Calculated from ratings by <b>{post.ratingCount}</b> user
          {post.ratingCount > 1 ? "s" : ""}.{this.renderRateLink(isPostList)}
        </Popover>
      );
    } else {
      return (
        <Popover id="popover-basic" className="p-2">
          No ratings yet.
          <br />
          <span className={`${isPostList ? "d-none" : ""}`}>
            Why don't you be the first? :)
          </span>
          {this.renderRateLink(isPostList)}
        </Popover>
      );
    }
  };

  renderRating = (post, isPostList) => {
    return (
      <span className={`post-rating ${isPostList ? "post-list" : ""}`}>
        <span className="separator ml-1 mr-1">|</span>
        <OverlayTrigger
          trigger="click"
          placement="bottom"
          overlay={this.ratingPopover(post, isPostList)}
          rootClose
        >
          <span>
            <StarRatings
              starRatedColor="#FFD700"
              starHoverColor="#FFD700"
              starDimension={`${isPostList ? "15px" : "18px"}`}
              starSpacing="0.5px"
              numberOfStars={5}
              name="rating"
              rating={post.rating}
            />
            <span className={`ml-1 ${post.ratingCount > 0 ? "" : "d-none"}`}>
              ({post.ratingCount})
            </span>
          </span>
        </OverlayTrigger>
      </span>
    );
  };

  renderPostMeta = (post) => {
    if (post.postType === "PAGE") {
      return (
        <div>
          <h2 className="page">{post.title}</h2>
          <hr />
        </div>
      );
    } else {
      return (
        <div>
          <a href="#/" className="navigate-link" onClick={this.props.goBack}>
            <small>← Go back</small>
          </a>
          <h2>{post.title}</h2>
          <small>
            <LinkContainer to={`/author/${post.userName}`}>
              <a className="author-picture" href="#/">
                {post.authorPicture ? (
                  <img src={post.authorPicture} alt={post.authorName} />
                ) : (
                  <FontAwesomeIcon
                    className="user-icon ml-1 mr-1"
                    icon={faUserCircle}
                  />
                )}
              </a>
            </LinkContainer>
            <LinkContainer to={`/author/${post.userName}`}>
              <a href="#/">{post.authorName}</a>
            </LinkContainer>
            <span className="ml-1 mr-1">in</span>
            <LinkContainer
              exact
              to={`/category/${post.category.toLowerCase()}`}
            >
              <a href="#/">{capitalizeFirstLetter(post.category)}</a>
            </LinkContainer>
            <span className="separator ml-1 mr-1">|</span>
            <div className="meta-time-container">
              <FontAwesomeIcon
                className="d-inline ml-1 mr-1"
                icon={faHistory}
              />
              {this.formatDate(post.createdAt)}
            </div>
            {this.renderRating(post)}
          </small>
          <hr />
        </div>
      );
    }
  };

  changeRating = (newRating, forceSubmit) => {
    let post = this.props.posts;

    if (this.props.isAuthenticated) {
      if (forceSubmit === true || newRating !== this.state.rating) {
        if (newRating !== undefined) {
          this.setState({
            rating: newRating,
          });

          API.post("posts", "/rating", {
            body: {
              rating: newRating,
              postId: post.postId,
            },
          });
        }
      }
    } else {
      this.setState({
        rating: newRating,
        showLoginModal: true,
      });
    }
  };

  renderStarRating = (post) => {
    const { theme, isAuthenticated, preferredUsername, username } = this.props;
    let loggedInUser = "";

    if (isAuthenticated) {
      loggedInUser = preferredUsername ?? username;
    }

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
            rating={isAuthenticated ? this.state.rating : undefined}
            changeRating={
              loggedInUser !== post.userName ? this.changeRating : undefined
            }
          />
          <Button
            variant={theme.name}
            onClick={() => this.changeRating(0)}
            className={`border ${
              this.state.rating && isAuthenticated ? "d-block" : "d-none"
            }`}
            size="sm"
          >
            Clear
          </Button>
        </div>
        <small
          className={`pt-2 ${
            this.state.rating && isAuthenticated ? "d-block" : "d-none"
          }`}
        >
          <i>You've rated this post. You can change your rating at any time.</i>
        </small>
        {!this.state.rating && loggedInUser === post.userName && (
          <small className="pt-2">
            <i>You cannot rate your own post.</i>
          </small>
        )}
      </div>
    );
  };

  renderPostContent = (post) => {
    if (post.postType === "PAGE") {
      return (
        <ReactMarkdown
          components={{
            table: (props) => {
              return (
                <table className="table table-striped">{props.children}</table>
              );
            },
          }}
        >
          {post.content}
        </ReactMarkdown>
      );
    } else {
      return (
        <div className="content">
          <ContentParser post={post} {...this.props} />
          {this.renderStarRating(post)}
        </div>
      );
    }
  };

  renderInArticleAd = (post) => {
    const { theme, isLocalhost } = this.props;

    if (!isLocalhost) {
      if (
        post.postType === "POST" &&
        !config.noAds.includes(window.location.pathname.replace(/\//, ""))
      ) {
        return (
          <div className="ad inArticle">
            <ins
              className="adsbygoogle"
              style={{ display: "block", textAlign: "center" }}
              data-ad-client="ca-pub-1783579460797635"
              data-ad-slot={
                theme.name === "light" ? "1204599400" : "1979513076"
              }
              data-ad-format="fluid"
              data-ad-layout="in-article"
            ></ins>
          </div>
        );
      }
    } else {
      return <br />;
    }
  };

  render404 = () => {
    if (this.props.search) {
      //Event to track empty search results
      ReactGA.event({
        category: "Search",
        action: "Empty result",
        label: this.props.search,
      });
    }

    return <NotFound isEmbed={true} />;
  };

  closeLoginModal = (retryRatingSubmit) => {
    const { preventRatingSubmit } = this.state;

    if (retryRatingSubmit && !preventRatingSubmit) {
      this.changeRating(this.state.rating, true);
    }

    this.setState({
      showLoginModal: false,
      preventRatingSubmit: false,
    });
  };

  renderStructuredData = (post) => {
    if (post.postType === "POST") {
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

      if (post.hasOwnProperty("rating")) {
        let createdAtISOString = new Date(post.createdAt).toISOString();

        structuredData.push(
          <script key={2} type="application/ld+json">
            {`{
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
              }`}
          </script>
        );
      }

      return structuredData;
    }
  };

  renderPost = () => {
    let { isLoading, posts, theme } = this.props;
    let post = posts;

    if (isLoading) {
      return (
        <div className="post">
          <SkeletonTheme
            color={theme.backgroundHighlight}
            highlightColor={theme.body}
          >
            <h2>
              <Skeleton />
            </h2>
            <hr />
            <Skeleton count={50} />
          </SkeletonTheme>
        </div>
      );
    } else {
      if (post.postId) {
        let loginChildProps = {
          isDialog: true,
          closeLoginModal: this.closeLoginModal,
        };

        return (
          <div className="post">
            <Modal
              style={{ top: "20px" }}
              show={this.state.showLoginModal}
              onHide={this.closeLoginModal}
            >
              <Modal.Header closeButton>
                <Modal.Title>Login</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Login {...loginChildProps} {...this.props} />
              </Modal.Body>
            </Modal>
            {this.renderPostMeta(post)}
            {this.renderPostContent(post)}
            {this.renderInArticleAd(post)}
            <Comments
              post={post}
              setShowLoginModalState={this.setShowLoginModalState}
              setPreventRatingSubmitState={this.setPreventRatingSubmitState}
              {...this.props}
            />
            {this.renderStructuredData(post)}
          </div>
        );
      } else {
        return this.render404();
      }
    }
  };

  renderContent = () => {
    let { posts, isPostList } = this.props;

    if (Array.isArray(posts) || isPostList) {
      //render all posts
      return this.renderPosts();
    } else {
      //render single post
      return this.renderPost();
    }
  };

  renderSEOTags() {
    let { posts = {} } = this.props;

    if (posts.content && !Array.isArray(posts)) {
      let description = "";
      let imageURL = "";

      if (posts.postType === "PAGE") {
        description = posts.content.substring(0, 157).trim();
        description =
          description.substr(
            0,
            Math.min(description.length, description.lastIndexOf(" "))
          ) + "..";
        description = this.removeMd(description);
      } else {
        description = `Guitar chords and tabs of ${posts.song} - ${posts.album} with lyrics`;
        description += `. Music by ${posts.music} and Sung by ${posts.singers}.`;
        imageURL = posts.image ? posts.image : "";
      }

      return (
        <Helmet>
          <title>{posts.title.toUpperCase()} | Naadan Chords</title>
          <meta name="description" content={description} />
          <meta name="twitter:card" content="summary" />
          <meta
            property="og:title"
            content={`${posts.title} | Naadan Chords`}
          />
          <meta property="og:description" content={description} />
          <meta property="og:image" content={imageURL} />
        </Helmet>
      );
    } else {
      return (
        <Helmet>
          <title>
            {this.props.title
              ? `${capitalizeFirstLetter(this.props.title)} | Naadan Chords`
              : "Naadan Chords | Guitar Chords and Tabs of Malayalam Songs"}
          </title>
          <meta
            name="description"
            content="Naadan Chords is the best place to get the chords for your favorite Malayalam and Tamil songs. Transpose, autoscroll chord sheet and adjust font size of lyrics."
          />
          <meta name="twitter:card" content="summary" />
          <meta
            property="og:title"
            content="Naadan Chords | Guitar Chords and Tabs of Malayalam Songs"
          />
          <meta
            property="og:description"
            content="Naadan Chords is the best place to get the chords for your favorite Malayalam and Tamil songs. Transpose, autoscroll chord sheet and adjust font size of lyrics."
          />
        </Helmet>
      );
    }
  }

  renderTopAd = () => {
    if (
      (this.props.posts &&
        !Array.isArray(this.props.posts) &&
        config.noAds.includes(window.location.pathname.replace(/\//, ""))) ||
      this.props.isLocalhost
    ) {
      return <br className="spacer" />;
    }

    return (
      <div className="ad" style={{ maxHeight: "120px" }}>
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client="ca-pub-1783579460797635"
          data-ad-slot="6826392919"
          data-ad-format="horizontal"
          data-full-width-responsive="false"
          key={this.props.adKey}
        ></ins>
      </div>
    );
  };

  render() {
    return (
      <Styles.ContentContainer className="Content">
        {this.renderSEOTags()}
        <Row className="contentRow">
          <Col lg={8} className="contentColumn">
            {this.renderTopAd()}
            {this.renderContent()}
          </Col>
          <Styles.SidebarCol lg={4} className="sidebarColumn">
            <Sidebar {...this.props} />
          </Styles.SidebarCol>
        </Row>
      </Styles.ContentContainer>
    );
  }
}
