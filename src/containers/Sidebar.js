import React, { Component } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisV, faTimes, faFire, faStar } from "@fortawesome/free-solid-svg-icons";
import { FacebookProvider, Page } from 'react-facebook';
import { Tabs, Tab } from "react-bootstrap";
import config from "../config";
import { LinkContainer } from "react-router-bootstrap";
import Skeleton from "react-loading-skeleton";
import { API } from "aws-amplify";
import "./Sidebar.css";

export default class Sidebar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      topPosts: [],
      topRatedPosts: [],
      mobileSidebarOpened: false,
      adKey: props.pageKey
    };
  }

  topPosts() {
    return API.get("posts", "/top-posts");
  }

  async componentDidMount() {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
    (window.adsbygoogle = window.adsbygoogle || []).push({});

    try {
      let topPosts = await this.topPosts();
      this.setState({
        isLoading: false,
        topPosts: topPosts
      });
    } catch(e) {
      console.log(e);
    }
  }

  componentWillUpdate(nextProps) {
    if(this.props.pageKey !== nextProps.pageKey) {
      if(this.state.mobileSidebarOpened) {
        this.handleMobileSidebarClick();
      }
    }
  }

  handleMobileSidebarClick = () => {
    this.setState({
      mobileSidebarOpened: !this.state.mobileSidebarOpened
    });
  }

  constructTopPosts = (topRated) => {
    let topPosts = topRated ? this.state.topRatedPosts : this.state.topPosts;
    let topPostsList = [];

    for(let i = 0; i < topPosts.length; i++) {
      topPostsList.push(
        <li key={`${i}`}>
          <LinkContainer to={`/${topPosts[i].postId}`}>
            <a href="#/">
              <span>{ i+1 } </span>
              { topPosts[i].title }
            </a>
          </LinkContainer>
        </li>
      );
    }

    return topPostsList;
  }

  renderTopPostsList = (topRated) => {
    if(this.state.isLoading) {
      return (
        <div className="top-posts loading">
          <ul className="list-unstyled">
            <Skeleton count={10} />
          </ul>
        </div>
      );
    } else {
      return (
        <div className="top-posts">
          <ul className="list-unstyled">
          { this.constructTopPosts(topRated) }
          </ul>
        </div>
      );
    }
  }

  loadTopRatedPosts = async () => {
    if(this.state.topRatedPosts.length === 0) {
      try {
        let topRatedPosts = await API.get("posts", "/top-rated-posts");
        this.setState({
          isLoading: false,
          topRatedPosts: topRatedPosts
        });
      } catch(e) {
        //Do nothing
      }
    }
  }

  tabChanged = (eventKey) => {
    if(eventKey === "top-rated-posts" && this.state.topRatedPosts.length === 0) {
      this.setState({
        isLoading: true
      });

      this.loadTopRatedPosts();
    }
  }

  renderSidebarWidget = () => {
    return(
      <Tabs className="sidebar-widget" defaultActiveKey="top-posts" onSelect={this.tabChanged}>
        <Tab eventKey="top-posts" title={<h6><FontAwesomeIcon className="popular-icon" icon={faFire} /> POPULAR</h6>} key="top-posts">
          { this.renderTopPostsList() }
        </Tab>
        <Tab eventKey="top-rated-posts" title={<h6><FontAwesomeIcon className="top-rated-icon" icon={faStar} /> TOP RATED</h6>} key="top-rated-posts">
          { this.renderTopPostsList(true) }
        </Tab>
      </Tabs>
    );
  }

  componentDidUpdate(prevProps, prevState) {
    if(!this.props.search && !this.props.isRandomPage) {
      if((this.props.pageKey !== prevProps.pageKey) || prevProps.search) {
        this.setState({
          adKey: this.props.pageKey
        });
      }
    }

    if(this.state.adKey !== prevState.adKey) {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    }
  }

  renderSidebarAd1 = () => {
    if(this.props.posts && !Array.isArray(this.props.posts) && config.noAds.includes(this.props.posts.postId)) {
      return (
        <br />
      );
    }

    return (
      <div className="ad1">
        <ins className="adsbygoogle"
          style={{display: "inline-block", width: "300px", height: "250px"}}
          data-ad-client="ca-pub-1783579460797635"
          data-ad-slot="4869884700"
          key={this.state.adKey}>
        </ins>
      </div>
    );
  }

  renderSidebarAd2 = () => {
    if(this.props.posts && !Array.isArray(this.props.posts) && config.noAds.includes(this.props.posts.postId)) {
      return;
    }

    return (
      <div className="ad2">
        <ins className="adsbygoogle"
          style={{display: "inline-block", width: "300px", height: "250px"}}
          data-ad-client="ca-pub-1783579460797635"
          data-ad-slot="9918861903"
          key={this.state.adKey}>
        </ins>
      </div>
    );
  }

  render() {
    let { mobileSidebarOpened } = this.state;

    return (
      <div className="Sidebar">
        <div className={`sidebar ${mobileSidebarOpened ? 'opened' : ''} bg-white`}>
          <div className="sidebar-content">
            <div className="facebook-widget">
              <h6>FOLLOW NAADAN CHORDS</h6>
              <hr />
              <FacebookProvider appId="178749152169432">
                <Page href="https://www.facebook.com/naadanchords/" adaptContainerWidth hideCTA showFacepile="false" />
              </FacebookProvider>
            </div>
            {this.renderSidebarAd1()}
            <div className="sticky">
              {this.renderSidebarWidget()}
              {this.renderSidebarAd2()}
            </div>
          </div>
        </div>
        <div className="sidebar-button btn btn-primary" onClick={this.handleMobileSidebarClick}>
          <FontAwesomeIcon icon={mobileSidebarOpened ? faTimes : faEllipsisV} />
        </div>
      </div>
    );
  }
}