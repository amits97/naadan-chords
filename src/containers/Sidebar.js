import React, { Component } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisV, faTimes, faFire } from "@fortawesome/free-solid-svg-icons";
import { FacebookProvider, Page } from 'react-facebook';
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

  constructTopPosts = () => {
    let {topPosts} = this.state;
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

  renderTopPostsList = () => {
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
          <h6><FontAwesomeIcon className="popular-icon" icon={faFire} /> POPULAR THIS WEEK</h6>
          <hr />
          <ul className="list-unstyled">
          { this.constructTopPosts() }
          </ul>
        </div>
      );
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(!(this.props.search)) {
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
    return (
      <div className="ad1">
        <ins className="adsbygoogle bg-light"
          style={{display: "inline-block", width: "250px", height: "250px"}}
          data-ad-client="ca-pub-1783579460797635"
          data-ad-slot="4869884700"
          key={this.state.adKey}>
        </ins>
      </div>
    );
  }

  renderSidebarAd2 = () => {
    return (
      <div className="sticky-ad ad2">
        <ins className="adsbygoogle bg-light"
          style={{display: "inline-block", width: "250px", height: "250px"}}
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
            {this.renderTopPostsList()}
            {this.renderSidebarAd2()}
          </div>
        </div>
        <div className="sidebar-button btn btn-primary" onClick={this.handleMobileSidebarClick}>
          <FontAwesomeIcon icon={mobileSidebarOpened ? faTimes : faEllipsisV} />
        </div>
      </div>
    );
  }
}