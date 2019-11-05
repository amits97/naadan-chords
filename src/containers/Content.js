import React, { Component } from "react";
import { Row, Col, OverlayTrigger, Popover, Modal } from "react-bootstrap";
import Skeleton from "react-loading-skeleton";
import { LinkContainer } from "react-router-bootstrap";
import { Helmet } from "react-helmet";
import ReactGA from "react-ga";
import Moment from "react-moment";
import ReactMarkdown from "react-markdown";
import Disqus from "disqus-react";
import { API } from "aws-amplify";
import StarRatings from 'react-star-ratings';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRandom } from "@fortawesome/free-solid-svg-icons";
import Sidebar from "./Sidebar";
import NotFound from "./NotFound";
import ContentParser from "./ContentParser";
import LoaderButton from "../components/LoaderButton";
import Login from "./Login";
import "./Content.css";

export default class Content extends Component {
  constructor(props) {
    super(props);
    this.ratingEl = React.createRef();
    this.removeMd = require("remove-markdown");
    this.matchedContentInitialized = false;

    this.state = {
      showLoginModal: false,
      rating: undefined
    }
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

  slugify(text) {
    return text.toString().toLowerCase().split(' ').join('-');
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

  renderTitle = (title, isUserPosts, posts) => {
    let displayTitle = title ? title : "LATEST POSTS";
    if(isUserPosts) {
      displayTitle = `Posts by - ${posts[0].authorName}`;

      if(this.props.isPageUrl) {
        displayTitle += ` - Page ${this.props.match.params.number}`;
      }
    }

    if(isUserPosts) {
      return (
        <div>
          <Helmet>
            <title>{`${displayTitle} | Naadan Chords`}</title>
          </Helmet>
          <h6>{displayTitle.toUpperCase()}</h6>
        </div>
      );
    } else {
      return (
        <div>
          <h6>{displayTitle.toUpperCase()}</h6>
        </div>
      );
    }
  }

  renderPosts = () => {
    let { isLoading, posts, lastEvaluatedPost, title, isUserPosts } = this.props;

    if(isLoading) {
      let skeleton = [];

      for(var i=0; i<20; i++) {
        skeleton.push(
          <div key={i} className="post pt-1 pb-1 no-hover">
            <h5><Skeleton /></h5>
            <small><Skeleton /></small>
          </div>
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
            <div className="title-container border-bottom mb-2">
              { this.renderTitle(title, isUserPosts, posts) }
              <LinkContainer to="/random">
                <a href="#/" className={`${title? "d-none":""} random-post text-primary`}>
                  <FontAwesomeIcon className="mr-2" icon={ faRandom } />Random
                </a>
              </LinkContainer>
            </div>
            {
              posts.map((post, i) =>
                <div key={i} className={`post ${ (i % 2 === 0) ? "" : "bg-light"}`}>
                  <LinkContainer  exact to={`/${ post.postId }`}>
                    <a href="#/" className="post-title">
                      <h5>{ post.title }</h5>
                    </a>
                  </LinkContainer>
                  <small>
                    { this.formatDate( post.createdAt ) }
                    <span className="separator"> | </span>
                    <LinkContainer key={i} to={`/author/${ post.userName }`}>
                      <a href="#/">{ post.authorName }</a>
                    </LinkContainer>
                  </small>
                  <small>
                    { this.renderRating(post, true) }
                  </small>
                </div>
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

  capitalizeFirstLetter = (string) => {
    return string.toLowerCase().split(' ').map((s) => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');
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
            { this.formatDate( post.createdAt ) }
            <span className="separator ml-1 mr-1">|</span>
            Posted by&nbsp;
            <LinkContainer to={`/author/${ post.userName }`}>
              <a href="#/">{ post.authorName }</a>
            </LinkContainer>
            <span className="ml-1 mr-1">in</span>
            <LinkContainer exact to={`/category/${post.category.toLowerCase()}`}>
              <a href="#/">
                { this.capitalizeFirstLetter(post.category) }
              </a>
            </LinkContainer>
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
    } else {
      this.setState({
        rating: newRating,
        showLoginModal: true
      });
    }
  }

  renderStarRating = (post) => {
    return (
      <div className="rate-container">
        <div ref={this.ratingEl} className="dummy-anchor"></div>
        <h6 className="rate-heading">RATE THIS POST</h6>
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
        <small className={`pt-2 ${this.state.rating && this.props.isAuthenticated ? 'd-block' : 'd-none'}`}><i>You've rated this post. You can change your rating at any time.</i></small>
      </div>
    );
  }

  renderPostContent = (post) => {
    if(post.postType === "PAGE") {
      return (
        <ReactMarkdown source={ post.content } />
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
    if(post.postType === "POST") {
      return (
        <div className="matchedContent">
          <br />
          <hr />
            <h6>YOU MAY ALSO LIKE</h6>
            <ins className="adsbygoogle"
            style={{display: "block"}}
            data-ad-format="autorelaxed"
            data-ad-client="ca-pub-1783579460797635"
            data-ad-slot="2717060707"
            key={this.props.adKey}>
          </ins>
        </div>
      );
    }
  }

  renderDisqusComments = (post) => {
    if(post.song) {
      //Disqus comments
      let disqusShortname = "naadantest";
      let disqusConfig = {
        url: `https://www.naadanchords.com/${post.postId}`,
        identifier: post.postId,
        title: post.title
      };

      return (
        <div>
          <br />
          <hr />
          <Disqus.DiscussionEmbed shortname={disqusShortname} config={disqusConfig} />
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
    this.setState({
      showLoginModal: false
    });

    if(retryRatingSubmit) {
      this.changeRating(this.state.rating, true);
    }
  }

  renderStructuredData = (post) => {
    if(post.postType === "POST" && post.hasOwnProperty("rating")) {
      let createdAtISOString = new Date(post.createdAt).toISOString();
      let category = post.category.toLowerCase();

      return (
        <React.Fragment>
          <script type="application/ld+json">
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
          <script type="application/ld+json">
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
                    "name": "${this.capitalizeFirstLetter(post.category)}"
                  }
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "item":{
                    "@id": "https://www.naadanchords.com/${post.postId}",
                    "name": "${post.title}"
                  }
                }]
              }
            `}
          </script>
        </React.Fragment>
      );
    }
  }

  renderPost = () => {
    let { isLoading, posts } = this.props;
    let post = posts;

    if(isLoading) {
      return (
        <div className="post">
          <h1><Skeleton /></h1>
          <hr />
          <Skeleton count={50} />
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
            { this.renderDisqusComments(post) }
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
        description += `. Music by ${posts.music} and Sung by ${posts.singers}. Transpose chords to any scale or pitch.`;
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
          <title>{this.props.title ? `${this.capitalizeFirstLetter(this.props.title)} | Naadan Chords` : "Naadan Chords | Guitar Chords and Tabs of Malayalam Songs"}</title>
          <meta name="description" content="Naadan Chords is the best place to get the chords for your favorite Malayalam and Tamil songs. Transpose chords to any scale or pitch, autoscroll chord sheet to play hassle free and adjust font size of lyrics." />
          <meta name="twitter:card" content="summary" />
          <meta property="og:title" content="Naadan Chords | Guitar Chords and Tabs of Malayalam Songs" />
          <meta property="og:description" content="Naadan Chords is the best place to get the chords for your favorite Malayalam and Tamil songs. Transpose chords to any scale or pitch, autoscroll chord sheet to play hassle free and adjust font size of lyrics." />
        </Helmet>
      );
    }
  }

  render() {
    return (
      <div className="Content">
        { this.renderSEOTags() }
        <Row className="contentRow">
          <Col lg={8} className="contentColumn">
            { this.renderContent() }
          </Col>
          <Col lg={4} className="sidebarColumn border-left">
            <Sidebar {...this.props} />
          </Col>
        </Row>
      </div>
    );
  }
}
