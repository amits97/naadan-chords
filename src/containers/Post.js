import React, { Component } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { API } from "aws-amplify";
import Skeleton from "react-loading-skeleton";
import Moment from "react-moment";
import Sidebar from "./Sidebar";
import "./Post.css";

export default class Post extends Component {
  constructor(props) {
    super(props);
    this.state = {
      post: {},
      isLoading: true
    };
  }

  formatDate(date) {
    return(
      <Moment format="MMMM D, YYYY">{ date }</Moment>
    );
  }

  post() {
    if(this.props.match.params.id) {
      return API.get("posts", `/posts/${this.props.match.params.id}`);
    }
  }

  async componentDidMount() {
    try {
      const post = await this.post();
      this.setState({
        post: post,
        isLoading: false
      });
    } catch(e) {
      this.setState({
        isLoading: false
      });
      console.log(e);
    }
  }

  renderPost = () => {
    if(this.state.isLoading) {
      return (
        <Skeleton count={15} />
      );
    } else {
      if(this.state.post.postId) {
        let { post } = this.state;
        return (
          <div>
            <h4>{ post.title }</h4>
            <small>{ this.formatDate( post.createdAt ) } <span>|</span> <a href="#/">Amit S Namboothiry</a></small>
            <hr />
            <p>{ post.content }</p>         
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
      <div className="Post">
        <Container>
          <Row>
            <Col sm={8}>
              { this.renderPost() }
            </Col>
            <Col sm={4}>
              <Sidebar />
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}