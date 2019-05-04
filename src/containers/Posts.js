import React, { Component } from "react";
import { API } from "aws-amplify";
import { Helmet } from "react-helmet";
import ReactGA from "react-ga";
import * as urlLib from "../libs/url-lib";
import Content from "./Content";
import "./Posts.css";

export default class Posts extends Component {
  constructor(props) {
    super(props);

    //timeout variable to throttle search results
    this.searchTimeout = null;

    this.state = {
      isLoading: true,
      isPaginationLoading: false,
      posts: {},
      homePosts: [],
      lastEvaluatedHomePost: {},
      scrollY: 0,
      lastEvaluatedPost: {},
      isPostList: false,
      isRandomPost: false,
      redirect: false,
      redirectUrl: ""
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
      category = this.getCategoryFromLegacy(category).toUpperCase();
      return API.get("posts", `/posts?category=${category}`);
    } else if(search) {
      return API.get("posts", `/posts?s=${search}`);
    } else {
      return API.get("posts", "/posts");
    }
  }

  postVisit(postId) {
    if(typeof Storage !== "undefined") {
      if(localStorage.getItem(postId) === null) {
        localStorage.setItem(postId, "0");

        return API.post("posts", "/post-visit", {
          body: {
            postId: postId
          }
        });
      }
    }
  }

  setPagination = (postsResult) => {
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

  loadData = async () => {
    try {
      let posts = {};
      let { isRandomPage } = this.props;
      let postId = this.props.match.params.id;
      let category = this.props.match.params.category;

      if(this.props.search) {
        this.setState({
          isPostList: true,
          isRandomPost: false
        });

        this.props.closeNav();
        let postsResult = await this.posts(null, this.props.search);

        posts = postsResult.Items? postsResult.Items : [];

        this.setPagination(postsResult);
      } else if(postId) {
        this.setState({
          isPostList: false,
          isRandomPost: false
        });

        posts = await this.post(postId);
        if(posts.postId !== postId) {
          this.props.history.push(`/${posts.postId}`);
        }

        if(posts.postType === "POST") {
          this.logPostVisit();
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

        let postsResult = await this.posts(this.props.isCategory ? category.toUpperCase() : null);
        posts = postsResult.Items;
        this.setPagination(postsResult);
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

  getCategoryFromLegacy = (category) => {
    category = category.toLowerCase();
    if(category.indexOf("song-guitar-chords-and-tabs") > -1) {
      category = category.replace("-song-guitar-chords-and-tabs", "");
    }

    return category;
  }

  loadMorePosts = async (exclusiveStartKey) => {
    this.setState({
      isPaginationLoading: true
    });

    try {
      let queryRequest = `/posts?exclusiveStartKey=${exclusiveStartKey}`;
      if(this.props.isCategory) {
        let category = this.getCategoryFromLegacy(this.props.match.params.category);
        queryRequest += `&category=${category.toUpperCase()}`
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

  async componentDidMount() {
    (window.adsbygoogle = window.adsbygoogle || []).push({});

    if(!urlLib.getUrlParameter("s")) {
      this.loadData();
      window.scrollTo(0, 0);
    }

    if(this.props.isPageUrl) {
      this.props.history.push("/");

      this.setState({
        redirect: true,
        redirectUrl: "/"
      });
    } else if(this.props.isCategory) {
      let category = this.props.match.params.category.toLowerCase();
      if(this.getCategoryFromLegacy(category) !== category) {
        this.props.history.push(`/category/${this.getCategoryFromLegacy(category)}`)

        this.setState({
          redirect: true,
          redirectUrl: `/category/${this.getCategoryFromLegacy(category)}`
        });
      }
    }

    ReactGA.initialize("UA-34900138-2");
    ReactGA.pageview(window.location.pathname + window.location.search);
  }

  setLoadingAndLoadData = () => {
    this.setState({
      posts: {},
      isLoading: true
    });
    this.loadData();
    window.scrollTo(0, 0);
  }

  componentDidUpdateSearch = (prevProps) => {
    if(this.props.search === "" && prevProps.search && this.props.match.params.id) {
      this.setLoadingAndLoadData();
      return;
    }

    if(prevProps.search !== this.props.search) {
      //clear previous timeouts
      clearTimeout(this.searchTimeout);

      this.setState({
        posts: {},
        isLoading: true
      });

      if(this.props.search) {
        this.props.history.push(`/?s=${this.props.search}`);
      } else {
        this.props.history.push("/");
      }

      //500ms delay
      this.searchTimeout = setTimeout(() => {
        this.loadData();
        window.scrollTo(0, 0);
      }, 500);

      return;
    } else if(!urlLib.getUrlParameter("s")) {
      //clear search
      this.props.setSearch("");       
    }

    (window.adsbygoogle = window.adsbygoogle || []).push({});
    ReactGA.pageview(window.location.pathname + window.location.search);
  }

  logPostVisit = async () => {
    let postId = this.props.match.params.id;

    if(postId) {
      try {
        await this.postVisit(postId);
      } catch(e) {
        console.log(e);
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.props.search || prevProps.search) {
      this.componentDidUpdateSearch(prevProps);
    } else {
      if(urlLib.getUrlParameter("s")) {
        this.props.setSearch(urlLib.getUrlParameter("s"));
        return;
      }

      if(prevProps.pageKey !== this.props.pageKey) {
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

            //coming back home
            if(this.props.isHomePage && !prevProps.search) {
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

          this.setLoadingAndLoadData();
        }

        (window.adsbygoogle = window.adsbygoogle || []).push({});
        ReactGA.pageview(window.location.pathname + window.location.search);
      }
    }
  }

  componentWillUnmount() {
    if(this.props.search) {
      clearTimeout(this.searchTimeout);
      this.props.setSearch("");
    }
  }

  renderTopAd = () => {
    return (
      <div className="ad">
        <ins className="adsbygoogle bg-light"
          style={{display:"inline-block", width: "728px", height: "90px"}}
          data-ad-client="ca-pub-1783579460797635"
          data-ad-slot="1349463901"
          key={this.props.pageKey}>
        </ins>
      </div>
    );
  }

  renderRedirect = () => {
    if(this.state.redirect) {
      return(
        <Helmet>
          <meta name="prerender-status-code" content="301" />
          <meta name="prerender-header" content={`Location: https://www.naadanchords.com${this.state.redirectUrl}`} />
        </Helmet>
      );
    }
  }

  render() {
    let title = "";
    let searchQuery = this.props.search;

    if(this.props.isCategory) {
      title = `${this.getCategoryFromLegacy(this.props.match.params.category).toUpperCase()} - GUITAR CHORDS AND TABS`
    } else if(searchQuery) {
      title = `SEARCH RESULTS - ${searchQuery.toUpperCase()}`
    }

    let childProps = {
      ...this.state,
      ...this.props,
      title: title,
      loadPosts: this.loadMorePosts,
      goBack: this.goBack
    }

    return (
      <div className="Posts">
        { this.renderTopAd() }
        { this.renderRedirect() }
        <Content {...childProps} />
      </div>
    );
  }
}