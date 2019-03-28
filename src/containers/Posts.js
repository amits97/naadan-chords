import React, { Component } from "react";
import { API } from "aws-amplify";
import Content from "./Content";

export default class Posts extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      isPaginationLoading: false,
      posts: {},
      homePosts: [],
      scrollY: 0,
      lastEvaluatedPost: {}
    };
  }

  post(postId) {
    return API.get("posts", `/posts/${postId}`);
  }

  posts(category) {
    if(category) {
      return API.get("posts", `/posts?category=${category}`);
    } else {
      return API.get("posts", "/posts");
    }
  }

  loadData = async () => {
    try {
      let posts = {};
      let postId = this.props.match.params.id;
      let category = this.props.match.params.category;

      if(postId) {
        posts = await this.post(postId);
        if(posts.postId !== postId) {
          this.props.history.push(`/${posts.postId}`);
        }
      } else {
        let postsResult = await this.posts(this.props.isCategory ? category.toUpperCase() : null);
        posts = postsResult.Items;

        if(postsResult.hasOwnProperty("LastEvaluatedKey")) {
          this.setState({
            lastEvaluatedPost: postsResult.LastEvaluatedKey
          });
        } else {
          this.setState({
            lastEvaluatedPost: {}
          });
        }
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

  loadMorePosts = async (exclusiveStartKey) => {
    this.setState({
      isPaginationLoading: true
    });

    try {
      let queryRequest = `/posts?exclusiveStartKey=${exclusiveStartKey}`;
      if(this.props.isCategory) {
        queryRequest += `&category=${this.props.match.params.category.toUpperCase()}`
      }
      let postsResult = await API.get("posts", queryRequest);
      this.setState({
        posts: this.state.posts.concat(postsResult.Items),
        lastEvaluatedPost: postsResult.LastEvaluatedKey,
        isPaginationLoading: false
      });
    } catch(e) {
      this.setState({
        isPaginationLoading: false
      });
      console.log(e);
    }
  }

  componentDidMount() {
    this.loadData();
    window.scrollTo(0, 0);
  }

  componentDidUpdate(prevProps, prevState) {
    if(prevProps.pageKey !== this.props.pageKey) {
      if(!this.props.isCategory) {
        //navigating away from home
        if(prevProps.match.params.id === undefined) {
          this.setState({
            homePosts: prevState.posts,
            scrollY: window.pageYOffset || document.documentElement.scrollTop
          });
        }

        //coming back to home
        if(this.props.match.params.id === undefined) {
          if(this.state.homePosts.length > 0) {
            this.setState({
              posts: this.state.homePosts
            });
            window.scrollTo(0, this.state.scrollY);
            return;
          }
        }
      }

      this.setState({
        posts: {},
        isLoading: true
      });
      this.loadData();
      window.scrollTo(0, 0);
    }
  }

  render() {
    let { isLoading, posts, lastEvaluatedPost, isPaginationLoading } = this.state;
    let title = "";
    
    if(this.props.isCategory) {
      title = `${this.props.match.params.category.toUpperCase()} SONG GUITAR CHORDS AND TABS`
    }

    return (
      <Content isLoading={isLoading} posts={posts} lastEvaluatedPost={lastEvaluatedPost} loadPosts = {this.loadMorePosts} isPaginationLoading={isPaginationLoading} title={title} />
    );
  }
}