import React, { Component } from "react";
import { API } from "aws-amplify";
import * as urlLib from "../libs/url-lib";
import Content from "./Content";

export default class Posts extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      isPaginationLoading: false,
      posts: {},
      homePosts: [],
      lastEvaluatedHomePost: {},
      scrollY: 0,
      lastEvaluatedPost: {},
      isPostList: false,
      isRandomPost: false
    };
  }

  goBack = (e) => {
    e.preventDefault();

    if(this.state.isRandomPost) {
      this.props.history.push("/");
    } else {
      this.props.history.goBack();
    }
  }

  randomPost() {
    return API.get("posts", `/posts/random`);
  }

  post(postId) {
    return API.get("posts", `/posts/${postId}`);
  }

  posts(category, search) {
    if(category) {
      return API.get("posts", `/posts?category=${category}`);
    } else if(search) {
      return API.get("posts", `/posts?s=${search}`);
    } else {
      return API.get("posts", "/posts");
    }
  }

  loadData = async () => {
    try {
      let posts = {};
      let { isRandomPage } = this.props;
      let postId = this.props.match.params.id;
      let category = this.props.match.params.category;

      if(postId) {
        this.setState({
          isPostList: false,
          isRandomPost: false
        });

        posts = await this.post(postId);
        if(posts.postId !== postId) {
          this.props.history.push(`/${posts.postId}`);
        }
      } else if(isRandomPage) {
        this.setState({
          isPostList: false,
          isRandomPost: true
        });

        posts = await this.randomPost();
        this.props.history.push(`/${posts.postId}`);
      } else {
        this.setState({
          isPostList: true,
          isRandomPost: false
        });

        let postsResult = await this.posts(this.props.isCategory ? category.toUpperCase() : null, urlLib.getUrlParameter("s"));
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
      let searchQuery = urlLib.getUrlParameter("s");

      if(this.props.search || searchQuery) {
        if(!searchQuery) {
          //clear search
          this.props.setSearch("");
        } else if(this.props.search !== searchQuery) {
          this.props.setSearch(searchQuery);
        }

        this.setState({
          posts: {},
          isLoading: true
        });
        this.loadData();
        window.scrollTo(0, 0);
        return;
      }

      if(!prevProps.isRandomPage) {
        if(!this.props.isCategory && !prevProps.isCategory) {
          //navigating away from home
          if(prevProps.match.params.id === undefined) {
            this.setState({
              homePosts: prevState.posts,
              lastEvaluatedHomePost: prevState.lastEvaluatedPost,
              scrollY: window.pageYOffset || document.documentElement.scrollTop
            });
          }
  
          //coming back to home
          if(this.props.isHomePage && !urlLib.getUrlParameter("s")) {
            if(this.state.homePosts.length > 0) {
              this.setState({
                posts: this.state.homePosts,
                lastEvaluatedPost: this.state.lastEvaluatedHomePost
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
  }

  render() {
    let title = "";
    let searchQuery = urlLib.getUrlParameter("s");

    if(this.props.isCategory) {
      title = `${this.props.match.params.category.toUpperCase()} - GUITAR CHORDS AND TABS`
    } else if(searchQuery) {
      title = `SEARCH RESULTS - ${searchQuery.toUpperCase()}`
    }

    let childProps = {
      ...this.state,
      title: title,
      loadPosts: this.loadMorePosts,
      goBack: this.goBack
    }

    return (
      <Content {...childProps} />
    );
  }
}