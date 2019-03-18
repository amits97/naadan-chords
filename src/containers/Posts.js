import React, { Component } from "react";
import { API } from "aws-amplify";
import Content from "./Content";

export default class Posts extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      posts: {}
    };
  }

  post(postId) {
    return API.get("posts", `/posts/${postId}`);
  }

  posts() {
    return API.get("posts", "/posts");
  }

  loadData = async () => {
    try {
      let posts = {}, postId = this.props.match.params.id;

      if(postId) {
        posts = await this.post(postId);
      } else {
        posts = await this.posts();
      }

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

  componentDidMount() {
    this.loadData();
    window.scrollTo(0, 0);
  }

  componentDidUpdate(prevProps) {
    if(prevProps.pageKey !== this.props.pageKey) {
      this.setState({
        posts: {},
        isLoading: true
      });
  
      this.loadData();
      window.scrollTo(0, 0);
    }
  }

  render() {
    let { isLoading, posts } = this.state;

    return (
      <Content isLoading={isLoading} posts={posts} />
    );
  }
}