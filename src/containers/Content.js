import React, { Component } from "react";
import { Row, Col } from "react-bootstrap";
import Skeleton from "react-loading-skeleton";
import { LinkContainer } from "react-router-bootstrap";
import { Helmet } from "react-helmet";
import Moment from "react-moment";
import ReactMarkdown from "react-markdown";
import Disqus from "disqus-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRandom } from "@fortawesome/free-solid-svg-icons";
import Sidebar from "./Sidebar";
import NotFound from "./NotFound";
import ContentParser from "./ContentParser";
import LoaderButton from "../components/LoaderButton";
import "./Content.css";

export default class Content extends Component {
  constructor(props) {
    super(props);
    this.removeMd = require("remove-markdown");
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
        }

        return (
          <LinkContainer to={loadMorelink}>
            <LoaderButton
              isLoading={false}
              text="Next page"
              className="load-posts btn-secondary"
            />
          </LinkContainer>
        );
      }

      let loadMorelink = "/#";
      if(this.props.isHomePage) {
        loadMorelink = "/page/2";
      } else if(this.props.isCategory) {
        loadMorelink = `/category/${this.props.match.params.category}/page/2`;
      }

      return (
        <a href={loadMorelink}>
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

  renderPosts = () => {
    let { isLoading, posts, lastEvaluatedPost, title } = this.props;

    if(isLoading) {
      let skeleton = [];

      for(var i=0; i<15; i++) {
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
      if(posts.length > 0) {
        return (
          <div className="postList">
            <div className="title-container border-bottom mb-2">
              <h6>{title ? title : "LATEST POSTS"}</h6>
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
          </small>
          <hr />
        </div>
      );
    }
  }

  renderPostContent = (post) => {
    if(post.postType === "PAGE") {
      return (
        <ReactMarkdown source={ post.content } />
      );
    } else {
      return (
        <div className="content">
          <ContentParser post={ post } />
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
    return (
      <NotFound isEmbed={true} />
    );
  }

  renderPost = () => {
    let { isLoading, posts } = this.props;
    let post = posts;

    if(isLoading) {
      return (
        <div className="post">
          <h1><Skeleton /></h1>
          <hr />
          <Skeleton count={25} />
        </div>
      );
    } else {
      if(post.postId) {
        return (
          <div className="post">
            { this.renderPostMeta(post) }
            { this.renderPostContent(post) }
            { this.renderDisqusComments(post) }
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
