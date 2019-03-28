import React, { Component } from "react";
import { Row, Col } from "react-bootstrap";
import Skeleton from "react-loading-skeleton";
import { LinkContainer } from "react-router-bootstrap";
import Moment from "react-moment";
import ReactMarkdown from "react-markdown";
import Disqus from "disqus-react";
import Sidebar from "./Sidebar";
import ContentParser from "./ContentParser";
import LoaderButton from "../components/LoaderButton";
import "./Content.css";

export default class Content extends Component {
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
      return (
        <LoaderButton
          isLoading={this.props.isPaginationLoading}
          onClick={() => {
            this.props.loadPosts(this.prepareLastEvaluatedPostRequest(lastEvaluatedPost));
          }}
          text="Load more"
          loadingText="Loading"
          className="load-posts btn-secondary"
        />
      );
    }
  }

  renderPosts = () => {
    let { isLoading, posts, lastEvaluatedPost } = this.props;

    if(isLoading) {
      return (
        <Skeleton count={15} />
      );
    } else {
      if(posts.length > 0) {
        return (
          <div className="postList">
            <h6 className="border-bottom">LATEST POSTS</h6>
            {
              posts.map((post, i) =>
                <LinkContainer key={i} exact to={`/${ post.postId }`}>
                  <div className={`post ${ (i % 2 === 0) ? "" : "bg-light"}`}>
                    <h5>{ post.title }</h5>
                    <small>{ this.formatDate( post.createdAt ) } <span>|</span> <a href="#/">Amit S Namboothiry</a></small>
                  </div>
                </LinkContainer>
              )
            }
            { this.loadPagination(lastEvaluatedPost) }
          </div>
        );
      } else {
        return (
          <h4>No posts found!</h4>
        );
      }
    }
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
          <LinkContainer exact to="/"><a href="#/" className="navigate-link"><small>← Go home</small></a></LinkContainer>
          <h1>{ post.title }</h1>
          <small>{ this.formatDate( post.createdAt ) } <span>|</span> Posted by <a href="#/">Amit S Namboothiry</a></small>
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

  renderPost = () => {
    let { isLoading, posts } = this.props;
    let post = posts;

    if(isLoading) {
      return (
        <Skeleton count={15} />
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
        return (
          <h4>No posts found!</h4>
        );
      }
    }
  }

  renderContent = () => {
    let { posts } = this.props;
    
    if(Array.isArray(posts)) {
      //render all posts
      return this.renderPosts();
    } else {
      //render single post
      return this.renderPost();
    }
  }

  render() {
    return (
      <div className="Content">
        <Row className="contentRow">
          <Col sm={8} className="contentColumn">
            { this.renderContent() }
          </Col>
          <Col sm={4}>
            <Sidebar />
          </Col>
        </Row>
      </div>
    );
  }
}
