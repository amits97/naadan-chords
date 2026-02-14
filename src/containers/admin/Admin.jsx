import React from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import {
  Badge,
  Button,
  Tab,
  Row,
  Col,
  Nav,
  Form,
  FormControl,
  Table,
  OverlayTrigger,
  Popover,
} from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import { Helmet } from "react-helmet";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faHistory } from "@fortawesome/free-solid-svg-icons";
import LoaderButton from "../../components/LoaderButton";
import SearchComponent from "../../components/SearchComponent";
import { API, capitalizeFirstLetter, formatDate } from "../../libs/utils";
import * as urlLib from "../../libs/url-lib";
import * as Styles from "../Styles";
import "./Admin.css";

export default class Admin extends SearchComponent {
  constructor(props) {
    super(props);

    //timeout variable to throttle search results
    this.searchTimeout = null;

    this.state = {
      posts: [],
      pages: [],
      emptySearches: [],
      drafts: [],
      review: [],
      isLoading: true,
      isPaginationLoading: false,
      activeTab: "posts",
      postsToBeDeleted: [],
      search: "",
    };
  }

  loadData = async () => {
    this.setState({
      isLoading: true,
      posts: [],
      pages: [],
      emptySearches: [],
      drafts: [],
      review: [],
    });

    try {
      const { activeTab } = this.state;
      const activeTabData = await this[activeTab]();
      this.setState({
        [activeTab]: activeTabData,
        isLoading: false,
      });

      this.setState({
        posts: activeTab === "posts" ? activeTabData : await this.posts(),
      });

      this.setState({
        pages: activeTab === "pages" ? activeTabData : await this.pages(),
      });

      this.setState({
        emptySearches:
          activeTab === "emptySearches"
            ? activeTabData
            : await this.emptySearches(),
      });

      this.setState({
        drafts: activeTab === "drafts" ? activeTabData : await this.drafts(),
      });

      this.setState({
        review: activeTab === "review" ? activeTabData : await this.review(),
      });
    } catch (e) {
      console.log(e);
    }
  };

  async componentDidMount() {
    window.scrollTo(0, 0);

    let session = await fetchAuthSession();
    await this.props.getUserPrevileges(session);
    if (!this.props.isAdmin) {
      this.props.history.push("/");
    }

    let activeTabInUrl = urlLib.getUrlParameter("tab");
    let activeTab = activeTabInUrl ? activeTabInUrl : "posts";

    this.setState(
      {
        activeTab,
      },
      () => {
        if (!activeTabInUrl) {
          urlLib.insertUrlParam("tab", activeTab);
        }
        this.loadData();
      },
    );
  }

  posts() {
    let { search } = this.state;

    return API.get("posts", `/posts/?${search ? "s=" + search : ""}`);
  }

  pages() {
    let { search } = this.state;
    return API.get(
      "posts",
      `/posts?postType=PAGE${search ? "&s=" + search : ""}`,
    );
  }

  emptySearches() {
    return API.get("posts", `/analytics/empty-search-summary`);
  }

  drafts() {
    let { search } = this.state;
    return API.get("posts", `/drafts/?${search ? "s=" + search : ""}`);
  }

  review() {
    let { search } = this.state;
    return API.get(
      "posts",
      `/contributions/list?${search ? "s=" + search : ""}`,
    );
  }

  addPostToDelete = (event, postId) => {
    let postsToBeDeleted = this.state.postsToBeDeleted;

    if (event.target.checked) {
      postsToBeDeleted.push(postId);
    } else {
      postsToBeDeleted = postsToBeDeleted.filter(function (post) {
        return post !== postId;
      });
    }

    this.setState({
      postsToBeDeleted,
    });
  };

  handleNewPostClick = () => {
    this.props.history.push("/admin/new-post");
  };

  validateDeletes() {
    return this.state.postsToBeDeleted.length > 0;
  }

  clearCheckboxes = () => {
    this.setState({
      postsToBeDeleted: [],
    });
  };

  toggleCheckboxes = () => {
    if (this.validateDeletes()) {
      this.clearCheckboxes();
    } else {
      let posts = this.state[this.state.activeTab];
      let postsToBeDeleted = [];
      for (var i = 0; i < posts.Items.length; i++) {
        postsToBeDeleted.push(posts.Items[i].postId);
      }
      this.setState({
        postsToBeDeleted: postsToBeDeleted,
      });
    }
  };

  handleSubmit = async (event) => {
    event.preventDefault();
    let { postsToBeDeleted } = this.state;

    if (
      window.confirm(
        `Are you sure you want to delete ${postsToBeDeleted.length} posts?`,
      )
    ) {
      this.setState({
        isLoading: true,
      });

      try {
        for (var i = 0; i < postsToBeDeleted.length; i++) {
          await this.deletePost(postsToBeDeleted[i]);
        }

        this.setState({
          postsToBeDeleted: [],
        });

        this.componentDidMount();
      } catch (e) {
        this.setState({
          isLoading: false,
        });

        console.log(e);
      }
    }
  };

  deletePost(postId) {
    if (this.state.activeTab === "emptySearches") {
      return API.del("posts", `/analytics/empty-search-summary/${postId}`);
    } else if (this.state.activeTab === "drafts") {
      return API.del("posts", `/drafts/${postId}`);
    } else {
      return API.del("posts", `/posts/${postId}`);
    }
  }

  setActiveTab = (tab) => {
    this.setState({
      activeTab: tab,
    });
    urlLib.insertUrlParam("tab", tab);
  };

  loadMorePosts = async (exclusiveStartKey) => {
    this.setState({
      isPaginationLoading: true,
    });

    try {
      let postsResult = await API.get(
        "posts",
        `/posts?exclusiveStartKey=${exclusiveStartKey}`,
      );
      this.setState({
        posts: {
          ...postsResult,
          Items: this.state.posts.Items.concat(postsResult.Items),
        },
        lastEvaluatedPost: postsResult.LastEvaluatedKey,
        isPaginationLoading: false,
      });
    } catch (e) {
      this.setState({
        isPaginationLoading: false,
      });
      console.log(e);
    }
  };

  prepareLastEvaluatedPostRequest = (lastEvaluatedPost) => {
    return encodeURIComponent(
      JSON.stringify(lastEvaluatedPost).replace(/"/g, "'"),
    );
  };

  loadPagination = (lastEvaluatedPost) => {
    if (lastEvaluatedPost && lastEvaluatedPost.hasOwnProperty("postId")) {
      return (
        <LoaderButton
          isLoading={this.state.isPaginationLoading}
          onClick={() => {
            this.loadMorePosts(
              this.prepareLastEvaluatedPostRequest(lastEvaluatedPost),
            );
          }}
          text="Load more"
          loadingText="Loading"
          className="load-posts btn-secondary"
        />
      );
    }
  };

  renderPosts(posts, isDraft, isContribution) {
    let { isLoading } = this.state;
    const { theme } = this.props;

    if (isLoading) {
      return (
        <SkeletonTheme
          color={theme.backgroundHighlight}
          highlightColor={theme.body}
        >
          <Skeleton count={10}></Skeleton>
        </SkeletonTheme>
      );
    }

    if (posts.Items && posts.Items.length > 0) {
      return (
        <div>
          <Styles.AuthenticatedTableContainer>
            <Table>
              <tbody>
                {posts.Items.map((post, i) => (
                  <tr
                    key={post.postId}
                    className={i % 2 === 0 ? "" : "bg-light"}
                  >
                    <td>
                      <Form.Check
                        type="checkbox"
                        onChange={(event) =>
                          this.addPostToDelete(event, post.postId)
                        }
                        checked={this.state.postsToBeDeleted.includes(
                          post.postId,
                        )}
                      />
                    </td>
                    <td>
                      <LinkContainer
                        exact
                        to={`/admin/${
                          isDraft
                            ? "edit-draft"
                            : isContribution
                              ? "review-post"
                              : "edit-post"
                        }/${post.postId}`}
                      >
                        <a href="#/" className="text-primary">
                          {post.title}
                        </a>
                      </LinkContainer>
                    </td>
                    <td>{post.authorName}</td>
                    <td>{capitalizeFirstLetter(post.category || "")}</td>
                    <td>
                      {formatDate(post.createdAt)}
                      {post.updatedAt > post.createdAt && (
                        <>
                          <OverlayTrigger
                            trigger="click"
                            placement="bottom"
                            overlay={
                              <Popover id="popover-basic" className="p-2">
                                Updated on {formatDate(post.updatedAt)}
                              </Popover>
                            }
                            rootClose
                          >
                            <span className="post-updated-badge">
                              <FontAwesomeIcon icon={faHistory} />
                            </span>
                          </OverlayTrigger>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Styles.AuthenticatedTableContainer>
          {this.loadPagination(posts.LastEvaluatedKey)}
        </div>
      );
    } else {
      return <p className="list-group-item">No posts available.</p>;
    }
  }

  renderEmptySearches = () => {
    const { isLoading, emptySearches, postsToBeDeleted } = this.state;
    const { theme } = this.props;

    if (isLoading) {
      return (
        <SkeletonTheme
          color={theme.backgroundHighlight}
          highlightColor={theme.body}
        >
          <Skeleton count={10}></Skeleton>
        </SkeletonTheme>
      );
    }

    return (
      <Styles.AuthenticatedTableContainer>
        <Table>
          <tbody>
            {emptySearches.map((item, index) => {
              const isChecked = postsToBeDeleted.includes(item.searchQuery);
              return (
                <tr
                  className={index % 2 === 0 ? "" : "bg-light"}
                  key={`${item.searchQuery}-${index}`}
                >
                  <td>
                    <Form.Check
                      type="checkbox"
                      onChange={(event) =>
                        this.addPostToDelete(event, item.searchQuery)
                      }
                      checked={isChecked}
                    />
                  </td>
                  <td>{item.searchQuery}</td>
                  <td>{item.count}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Styles.AuthenticatedTableContainer>
    );
  };

  handleSearchChange = (event) => {
    this.setState({
      search: event.target.value,
    });

    //clear previous timeouts
    clearTimeout(this.searchTimeout);

    //500ms delay
    this.searchTimeout = setTimeout(() => {
      this.loadData();
      window.scrollTo(0, 0);
    }, 500);
  };

  renderSEOTags() {
    return (
      <Helmet>
        <title>Admin | Naadan Chords</title>
        <meta name="description" content="" />
        <meta name="twitter:card" content="summary" />
        <meta property="og:title" content="Admin | Naadan Chords" />
        <meta property="og:description" content="" />
      </Helmet>
    );
  }

  render() {
    let { posts, pages, drafts, review, activeTab } = this.state;
    let draftCount =
      drafts && drafts.Items ? this.state.drafts.Items.length : 0;
    let reviewCount = review && review.Items ? review.Items.length : 0;

    return (
      <div className="container Admin">
        {this.renderSEOTags()}
        <div className="header border-bottom">
          <h1 className="float-left">Admin</h1>
          <LinkContainer exact to="/admin/new-post">
            <Button variant="primary" className="float-right">
              <span>
                <FontAwesomeIcon icon={faPlus} />
              </span>
              New Post
            </Button>
          </LinkContainer>
        </div>

        <Styles.AuthenticatedContentContainer>
          <Tab.Container
            activeKey={activeTab}
            onSelect={(key) => {
              this.clearCheckboxes();
              this.setActiveTab(key);
            }}
          >
            <Nav as="nav" className="nav-tabs">
              <Nav.Item>
                <Nav.Link eventKey="posts">POSTS</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="pages">PAGES</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="emptySearches">EMPTY SEARCHES</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="drafts">
                  DRAFTS{" "}
                  {draftCount > 0 && (
                    <Badge className="draft-count" variant="primary">
                      {draftCount}
                    </Badge>
                  )}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="review">
                  REVIEW{" "}
                  {reviewCount > 0 && (
                    <Badge className="draft-count" variant="primary">
                      {reviewCount}
                    </Badge>
                  )}
                </Nav.Link>
              </Nav.Item>
            </Nav>
            <Form onSubmit={this.handleSubmit}>
              <div className="delete-container border-bottom">
                <Form.Check
                  type="checkbox"
                  className="checkbox pt-2 pl-4 form-check"
                  onChange={this.toggleCheckboxes}
                  checked={this.validateDeletes()}
                />
                <FormControl
                  type="text"
                  placeholder="Search"
                  className="admin-search bg-light"
                  name="admin-search"
                  value={this.state.search}
                  onChange={this.handleSearchChange}
                />
                <LoaderButton
                  variant="danger"
                  className="mt-0"
                  size="sm"
                  disabled={!this.validateDeletes()}
                  type="submit"
                  isLoading={this.validateDeletes() && this.state.isLoading}
                  text="Delete"
                  loadingText="Deleting..."
                />
              </div>
              <Tab.Content>
                <Tab.Pane eventKey="posts">{this.renderPosts(posts)}</Tab.Pane>
                <Tab.Pane eventKey="pages">{this.renderPosts(pages)}</Tab.Pane>
                <Tab.Pane eventKey="emptySearches">
                  {this.renderEmptySearches()}
                </Tab.Pane>
                <Tab.Pane eventKey="drafts">
                  {this.renderPosts(drafts, true)}
                </Tab.Pane>
                <Tab.Pane eventKey="review">
                  {this.renderPosts(review, null, true)}
                </Tab.Pane>
              </Tab.Content>
            </Form>
          </Tab.Container>
        </Styles.AuthenticatedContentContainer>

        <div
          className="new-post-button btn btn-primary"
          onClick={this.handleNewPostClick}
        >
          <FontAwesomeIcon icon={faPlus} />
        </div>
      </div>
    );
  }
}
