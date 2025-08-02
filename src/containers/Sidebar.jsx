import React, { Component } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEllipsisV,
  faTimes,
  faArrowTrendUp,
} from "@fortawesome/free-solid-svg-icons";
import { Tabs, Tab, OverlayTrigger, Popover } from "react-bootstrap";
import config from "../config";
import { LinkContainer } from "react-router-bootstrap";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { API } from "../libs/utils";
import * as Styles from "./Styles";
import "./Sidebar.css";

export default class Sidebar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      topPosts: [],
      topRatedPosts: [],
      mobileSidebarOpened: false,
      adKey: props.pageKey,
    };
  }

  topPosts() {
    return API.get("posts", "/posts/top-posts");
  }

  async componentDidMount() {
    if (
      !this.props.isLocalhost &&
      !noAds?.includes(
        window.location.pathname.replace(/\//, "") + window.location.search
      )
    ) {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    }

    try {
      let topPosts = await this.topPosts();
      this.setState({
        isLoading: false,
        topPosts: topPosts,
      });
    } catch (e) {
      console.log(e);
    }
  }

  handleMobileSidebarClick = () => {
    this.setState({
      mobileSidebarOpened: !this.state.mobileSidebarOpened,
    });
  };

  constructTopPosts = (topRated) => {
    let topPosts = topRated ? this.state.topRatedPosts : this.state.topPosts;
    let topPostsList = [];
    let trendIconShown = false;

    for (let i = 0; i < topPosts.length; i++) {
      const showTrendIcon =
        !trendIconShown && topPosts[i].popularityTrend === "UP";
      if (showTrendIcon) trendIconShown = true;

      topPostsList.push(
        <li key={`${i}`}>
          <span className="post-row">
            {showTrendIcon && (
              <OverlayTrigger
                overlay={
                  <Popover id="popover-basic" className="p-2">
                    Trending
                  </Popover>
                }
              >
                <span className="trend-icon">
                  <FontAwesomeIcon className="d-inline" icon={faArrowTrendUp} />
                </span>
              </OverlayTrigger>
            )}
            <LinkContainer
              to={`/${topPosts[i].postId}`}
              title={topPosts[i].title}
            >
              <a href="#/">{topPosts[i].title}</a>
            </LinkContainer>
          </span>
        </li>
      );
    }

    return topPostsList;
  };

  renderTopPostsList = (topRated) => {
    const { theme } = this.props;

    if (this.state.isLoading) {
      return (
        <div className="top-posts loading">
          <ol className="list-unstyled">
            <SkeletonTheme
              color={theme.backgroundHighlight}
              highlightColor={theme.body}
            >
              <Skeleton count={10} />
            </SkeletonTheme>
          </ol>
        </div>
      );
    } else {
      return (
        <div className="top-posts">
          <ol className="list-unstyled">{this.constructTopPosts(topRated)}</ol>
        </div>
      );
    }
  };

  loadTopRatedPosts = async () => {
    if (this.state.topRatedPosts.length === 0) {
      try {
        let topRatedPosts = await API.get("posts", "/rating/top-rated-posts");
        this.setState({
          isLoading: false,
          topRatedPosts: topRatedPosts,
        });
      } catch (e) {
        //Do nothing
      }
    }
  };

  tabChanged = (eventKey) => {
    if (
      eventKey === "top-rated-posts" &&
      this.state.topRatedPosts.length === 0
    ) {
      this.setState({
        isLoading: true,
      });

      this.loadTopRatedPosts();
    }
  };

  renderSidebarWidget = () => {
    return (
      <Styles.SidebarWidgetContainer>
        <Tabs
          className="sidebar-widget"
          defaultActiveKey="top-posts"
          onSelect={this.tabChanged}
        >
          <Tab eventKey="top-posts" title={<h6>POPULAR</h6>} key="top-posts">
            {this.renderTopPostsList()}
          </Tab>
          <Tab
            eventKey="top-rated-posts"
            title={<h6>TOP RATED</h6>}
            key="top-rated-posts"
          >
            {this.renderTopPostsList(true)}
          </Tab>
        </Tabs>
      </Styles.SidebarWidgetContainer>
    );
  };

  componentDidUpdate(prevProps, prevState) {
    if (!this.props.search && !this.props.isRandomPage) {
      if (this.props.pageKey !== prevProps.pageKey || prevProps.search) {
        this.setState({
          adKey: this.props.pageKey,
        });
      }
    }

    if (this.props.pageKey !== prevProps.pageKey) {
      if (this.state.mobileSidebarOpened) {
        this.handleMobileSidebarClick();
      }
    }

    if (
      this.state.adKey !== prevState.adKey &&
      !this.props.isLocalhost &&
      !noAds?.includes(
        window.location.pathname.replace(/\//, "") + window.location.search
      )
    ) {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    }
  }

  renderSidebarAd1 = () => {
    if (
      (this.props.posts &&
        !Array.isArray(this.props.posts) &&
        noAds?.includes(window.location.pathname.replace(/\//, ""))) ||
      noAds?.includes(
        window.location.pathname.replace(/\//, "") + window.location.search
      ) ||
      this.props.isLocalhost
    ) {
      return <br />;
    }

    return (
      <div className="ad1">
        <ins
          className="adsbygoogle"
          style={{ display: "inline-block", width: "300px", height: "250px" }}
          data-ad-client="ca-pub-1783579460797635"
          data-ad-slot="4869884700"
          key={this.state.adKey}
        ></ins>
      </div>
    );
  };

  renderSidebarAd2 = () => {
    if (
      (this.props.posts &&
        !Array.isArray(this.props.posts) &&
        noAds?.includes(window.location.pathname.replace(/\//, ""))) ||
      noAds?.includes(
        window.location.pathname.replace(/\//, "") + window.location.search
      ) ||
      this.props.isLocalhost
    ) {
      return;
    }

    return (
      <div className="ad2">
        <ins
          className="adsbygoogle"
          style={{ display: "inline-block", width: "300px", height: "250px" }}
          data-ad-client="ca-pub-1783579460797635"
          data-ad-slot="9918861903"
          key={this.state.adKey}
        ></ins>
      </div>
    );
  };

  render() {
    let { mobileSidebarOpened } = this.state;
    const { isChordControlsTrayMaximized, posts } = this.props;
    let isPage = false;
    let isPostList = false;

    if (posts && Array.isArray(posts)) {
      isPostList = true;
    } else {
      if (posts) {
        isPage = posts.postType === "PAGE";
      } else {
        isPage = true;
      }
    }

    const keepButtonAtBottom = mobileSidebarOpened
      ? true
      : isPostList || isPage;

    return (
      <div className="Sidebar">
        <Styles.SidebarContainer
          className={`sidebar ${mobileSidebarOpened ? "opened" : ""}`}
        >
          <div className="sidebar-content">
            {this.renderSidebarAd1()}
            <div className="sticky">
              {this.renderSidebarWidget()}
              {this.renderSidebarAd2()}
            </div>
          </div>
        </Styles.SidebarContainer>
        <div
          className={`sidebar-button btn btn-primary ${
            keepButtonAtBottom ? "" : "post-position"
          } ${isChordControlsTrayMaximized ? "tray-maximized" : ""}`}
          onClick={this.handleMobileSidebarClick}
        >
          <FontAwesomeIcon icon={mobileSidebarOpened ? faTimes : faEllipsisV} />
        </div>
      </div>
    );
  }
}
