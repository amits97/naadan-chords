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
      mobileSidebarOpened: false
    };
  }

  topPosts() {
    return API.get("posts", "/top-posts");
  }

  async componentDidMount() {
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

  render() {
    let { mobileSidebarOpened } = this.state;

    return (
      <div className="Sidebar">
        <div className={`sidebar ${mobileSidebarOpened ? 'opened' : ''} bg-white`}>
          <div className="sidebar-content">
            <h6>FOLLOW NAADAN CHORDS</h6>
            <hr />
            <FacebookProvider appId="178749152169432">
              <Page href="https://www.facebook.com/naadanchords/" adaptContainerWidth hideCTA showFacepile="false" />
            </FacebookProvider>
            {this.renderTopPostsList()}
          </div>
        </div>
        <div className="sidebar-button btn btn-primary" onClick={this.handleMobileSidebarClick}>
          <FontAwesomeIcon icon={mobileSidebarOpened ? faTimes : faEllipsisV} />
        </div>
      </div>
    );
  }
}