import React, { Component } from "react";
import { API } from "aws-amplify";
import { Helmet } from "react-helmet";
import ReactGA from "react-ga";
import * as urlLib from "../libs/url-lib";
import { slugify, capitalizeFirstLetter } from "../libs/utils";
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
      redirectUrl: "",
      adKey: props.pageKey
    };
  }

  makeTitle(slug) {
    return slug.split('-').join(' ');
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

  posts(category, search, user, album) {
    if(category) {
      category = this.getCategoryFromLegacy(category).toUpperCase();
      return API.get("posts", `/posts?category=${category}`);
    } else if(search) {
      return API.get("posts", `/posts?s=${search}`);
    } else if(user){
      return API.get("posts", `/user-posts?userName=${user}`);
    } else if(album) {
      album = capitalizeFirstLetter(this.makeTitle(album));
      return API.get("posts", `/posts?album=${album}`);
    } else {
      return API.get("posts", "/posts");
    }
  }

  pagePosts(pageNumber, category, userName, album) {
    if(category) {
      return API.get("posts", `/posts?category=${category.toUpperCase()}&page=${pageNumber}`);
    } else if(userName) {
      return API.get("posts", `/user-posts?userName=${userName}&page=${pageNumber}`);
    } else if(album) {
      album = capitalizeFirstLetter(this.makeTitle(album));
      return API.get("posts", `/posts?album=${album}&page=${pageNumber}`);
    } else {
      return API.get("posts", `/posts?page=${pageNumber}`);
    }
  }

  lessThanOneHourAgo = (date) => {
    date = parseInt(date);
    const HOUR = 1000 * 60 * 60;
    const anHourAgo = Date.now() - HOUR;
    return date > anHourAgo;
  }

  postVisit(postId) {
    if(typeof Storage !== "undefined") {
      let localStorageItem = localStorage.getItem(postId);
      if(localStorageItem === null || !this.lessThanOneHourAgo(localStorageItem)) {
        localStorage.setItem(postId, new Date().getTime());

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
      let { isRandomPage, isPageUrl } = this.props;
      let postId = this.props.match.params.id;
      let category = this.props.match.params.category;
      let album = this.props.match.params.album;
      let pageNumber = this.props.match.params.number;
      let userName = this.props.match.params.userName;

      if(this.props.search) {
        this.setState({
          isPostList: true,
          isRandomPost: false
        });

        this.props.closeNav();
        let postsResult = await this.posts(null, this.props.search);

        posts = postsResult.Items? postsResult.Items : [];

        this.setPagination(postsResult);
      } else if(isPageUrl) {
        let postsResult = [];
        if(this.props.isCategory) {
          postsResult = await this.pagePosts(pageNumber, category);
        } else if(this.props.isUserPosts) {
          postsResult = await this.pagePosts(pageNumber, null, userName);
        } else if(this.props.isAlbum) {
          postsResult = await this.pagePosts(pageNumber, null, null, album);
        } else {
          postsResult = await this.pagePosts(pageNumber);
        }
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

          this.setState({
            redirect: true,
            redirectUrl: `/${posts.postId}`
          });
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

        let postsResult = await this.posts(this.props.isCategory ? category.toUpperCase() : null, null, this.props.isUserPosts ? this.props.match.params.userName : null, this.props.isAlbum ? this.props.match.params.album : null);
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
        queryRequest += `&category=${category.toUpperCase()}`;
      } else if(this.props.isAlbum) {
        let album = capitalizeFirstLetter(this.makeTitle(this.props.match.params.album));
        queryRequest += `&album=${album}`;
      }
      let postsResult = [];
      if(this.props.isUserPosts) {
        postsResult = await API.get("posts",`/user-posts?userName=${this.props.match.params.userName}&exclusiveStartKey=${exclusiveStartKey}`)
      } else {
        postsResult = await API.get("posts", queryRequest);
      }
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
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch(e) {
      console.log(e);
    }

    if(!urlLib.getUrlParameter("s")) {
      this.loadData();
      window.scrollTo(0, 0);
    }

    if(this.props.isCategory) {
      let category = this.props.match.params.category.toLowerCase();
      if(this.getCategoryFromLegacy(category) !== category) {
        this.props.history.push(`/category/${this.getCategoryFromLegacy(category)}`)

        this.setState({
          redirect: true,
          redirectUrl: `/category/${this.getCategoryFromLegacy(category)}`
        });
      }
    }

    if(this.props.isAlbum) {
      let album = this.props.match.params.album;
      if(slugify(album) !== album) {
        this.props.history.push(`/album/${slugify(album)}`)

        this.setState({
          redirect: true,
          redirectUrl: `/album/${slugify(album)}`
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
    if(this.props.search === "" && prevProps.search && (this.props.match.params.id || this.props.isCategory || this.props.isUserPosts || this.props.isAlbum)) {
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

      if(!this.props.search) {
        this.setState({
          adKey: this.props.pageKey
        });        
      }
    } else {
      if(urlLib.getUrlParameter("s")) {
        this.props.setSearch(urlLib.getUrlParameter("s"));
        return;
      }

      if(prevProps.pageKey !== this.props.pageKey) {
        if(!prevProps.isRandomPage) {
          if(!this.props.isCategory && !prevProps.isCategory && !this.props.isUserPosts && !prevProps.isUserPosts && !this.props.isPageUrl && !prevProps.isPageUrl && !this.props.isAlbum && !prevProps.isAlbum) {
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

        if(!this.props.isRandomPage) {
          this.setState({
            adKey: this.props.pageKey
          });
        }
        ReactGA.pageview(window.location.pathname + window.location.search);
      }
    }

    if(prevState.adKey !== this.state.adKey) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch(e) {
        console.log(e);
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
      <div className="ad" style={{maxHeight: "120px"}}>
        <ins className="adsbygoogle"
          style={{display:"block"}}
          data-ad-client="ca-pub-1783579460797635"
          data-ad-slot="6826392919"
          data-ad-format="horizontal"
          data-full-width-responsive="false"
          key={this.state.adKey}>
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

    if(searchQuery) {
      title = `SEARCH RESULTS - ${searchQuery.toUpperCase()}`;
    } else if(this.props.isUserPosts) {
      let userName = this.props.match.params.userName || "";
      userName = this.makeTitle(userName);
      title = `POSTS BY ${userName.toUpperCase()}`;
    } else if(this.props.isPageUrl) {
      if(this.props.isCategory) {
        title = `${this.getCategoryFromLegacy(this.props.match.params.category).toUpperCase()} - GUITAR CHORDS AND TABS - PAGE ${this.props.match.params.number}`;
      } else if (this.props.isAlbum) {
        title = `${this.makeTitle(this.props.match.params.album)} - GUITAR CHORDS AND TABS - PAGE ${this.props.match.params.number}`;
      } else {
        title = `LATEST POSTS - PAGE ${this.props.match.params.number}`;
      }
    } else if(this.props.isCategory) {
      title = `${this.getCategoryFromLegacy(this.props.match.params.category).toUpperCase()} - GUITAR CHORDS AND TABS`;
    } else if(this.props.isAlbum) {
      title = `${this.makeTitle(this.props.match.params.album)} - GUITAR CHORDS AND TABS`;
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
        <div className="container">
          <Content {...childProps} />
        </div>
      </div>
    );
  }
}