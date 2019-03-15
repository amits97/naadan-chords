import React, { Component } from "react";
import { API } from "aws-amplify";
import Skeleton from "react-loading-skeleton";
import { Container, Row, Col } from "react-bootstrap";
import Moment from "react-moment";
import "./Posts.css";

export default class Posts extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      posts: []
    };
  }

  posts() {
    return API.get("posts", "/posts");
  }

  async componentDidMount() {
    try {
      const posts = await this.posts();
      this.setState({
        posts: posts,
        isLoading: false
      });
    } catch(e) {
      this.setState({
        isLoading: false
      });
      console.log(e);
    }
  }

  formatDate(date) {
    return(
      <Moment format="MMMM D, YYYY">{ date }</Moment>
    );
  }

  renderPosts = () => {
    if(this.state.isLoading) {
      return (
        <Skeleton count={15} />
      );
    } else {
      if(this.state.posts.length > 0) {
        return (
          <div>
            <h6>LATEST POSTS</h6>
            {
              this.state.posts.map((post, i) =>
                <div key={i} className="post">
                  <h4>{ post.title }</h4>
                  <small>{ this.formatDate( post.createdAt ) } <span>|</span> <a href="#/">Amit S Namboothiry</a></small>
                </div>
              )
            }
          </div>
        );
      } else {
        return (
          <h4>No posts found!</h4>
        );
      }
    }
  }

  render() {
    return (
      <div className="Posts">
        <Container>
          <Row>
            <Col sm={8} className="postList">
              { this.renderPosts() }
            </Col>
            <Col sm={4}>

            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}