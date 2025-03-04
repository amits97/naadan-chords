import React from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import {
  Badge,
  Button,
  ListGroup,
  Tab,
  Row,
  Col,
  Nav,
  Form,
  FormControl,
  Table,
} from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import { Helmet } from "react-helmet";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import LoaderButton from "../../components/LoaderButton";
import SearchComponent from "../../components/SearchComponent";
import { API } from "../../libs/utils";
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
      }
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
      `/posts?postType=PAGE${search ? "&s=" + search : ""}`
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
      `/contributions/list?${search ? "s=" + search : ""}`
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
      postsToBeDeleted: postsToBeDeleted,
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
        `Are you sure you want to delete ${postsToBeDeleted.length} posts?`
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
    if (this.state.activeTab === "drafts") {
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
        `/posts?exclusiveStartKey=${exclusiveStartKey}`
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
      JSON.stringify(lastEvaluatedPost).replace(/"/g, "'")
    );
  };

  loadPagination = (lastEvaluatedPost) => {
    if (lastEvaluatedPost && lastEvaluatedPost.hasOwnProperty("postId")) {
      return (
        <LoaderButton
          isLoading={this.state.isPaginationLoading}
          onClick={() => {
            this.loadMorePosts(
              this.prepareLastEvaluatedPostRequest(lastEvaluatedPost)
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
          <ListGroup variant="flush">
            {posts.Items.map((post, i) => {
              return (
                <ListGroup.Item
                  key={i}
                  className={i % 2 === 0 ? "" : "bg-light"}
                >
                  <Form.Check
                    type="checkbox"
                    className="checkbox"
                    onChange={(event) =>
                      this.addPostToDelete(event, post.postId)
                    }
                    checked={
                      this.state.postsToBeDeleted.indexOf(post.postId) !== -1
                    }
                  />
                  {post.status ? (
                    <Badge variant="primary">{post.status}</Badge>
                  ) : null}
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
                </ListGroup.Item>
              );
            })}
          </ListGroup>
          {this.loadPagination(posts.LastEvaluatedKey)}
        </div>
      );
    } else if (posts.Items) {
      return <p className="list-group-item">No posts</p>;
    } else {
      return (
        <SkeletonTheme
          color={theme.backgroundHighlight}
          highlightColor={theme.body}
        >
          <Skeleton count={10}></Skeleton>
        </SkeletonTheme>
      );
    }
  }

  renderEmptySearches = () => {
    const { isLoading, emptySearches } = this.state;
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
      <Styles.AdminTableContainer>
        <Table striped hover responsive>
          <thead>
            <tr>
              <th>Search Query</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {emptySearches.map((item, index) => {
              return (
                <tr key={`${item.searchQuery}-${index}`}>
                  <td>{item.searchQuery}</td>
                  <td>{item.count}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Styles.AdminTableContainer>
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

        <Tab.Container activeKey={activeTab}>
          <Row>
            <Col lg={2}>
              <Styles.SidebarPillContainer>
                <Nav
                  variant="pills"
                  className="nav-pills-container flex-column border"
                >
                  <Nav.Item className="border-bottom">
                    <Nav.Link
                      eventKey="posts"
                      onClick={() => {
                        this.clearCheckboxes();
                        this.setActiveTab("posts");
                      }}
                    >
                      Posts
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item className="border-bottom">
                    <Nav.Link
                      eventKey="pages"
                      onClick={() => {
                        this.clearCheckboxes();
                        this.setActiveTab("pages");
                      }}
                    >
                      Pages
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item className="border-bottom">
                    <Nav.Link
                      eventKey="emptySearches"
                      onClick={() => {
                        this.clearCheckboxes();
                        this.setActiveTab("emptySearches");
                      }}
                    >
                      Empty Searches
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item className="border-bottom">
                    <Nav.Link
                      eventKey="drafts"
                      onClick={() => {
                        this.clearCheckboxes();
                        this.setActiveTab("drafts");
                      }}
                    >
                      Drafts{" "}
                      <span
                        className={`${draftCount > 0 ? "d-inline" : "d-none"}`}
                      >
                        <Badge className="draft-count" variant="primary">
                          {draftCount}
                        </Badge>
                      </span>
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      eventKey="review"
                      onClick={() => {
                        this.clearCheckboxes();
                        this.setActiveTab("review");
                      }}
                    >
                      Review{" "}
                      <span
                        className={`${reviewCount > 0 ? "d-inline" : "d-none"}`}
                      >
                        <Badge className="draft-count" variant="primary">
                          {reviewCount}
                        </Badge>
                      </span>
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Styles.SidebarPillContainer>
            </Col>
            <Col lg={10}>
              <Form onSubmit={this.handleSubmit}>
                {activeTab !== "emptySearches" && (
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
                      className="admin-search"
                      value={this.state.search}
                      onChange={this.handleSearchChange}
                    />
                    <LoaderButton
                      variant="danger"
                      className="mt-1"
                      size="sm"
                      disabled={!this.validateDeletes()}
                      type="submit"
                      isLoading={this.validateDeletes() && this.state.isLoading}
                      text="Delete"
                      loadingText="Deleting..."
                    />
                  </div>
                )}
                <Tab.Content>
                  <Tab.Pane eventKey="posts">
                    {this.renderPosts(posts)}
                  </Tab.Pane>
                  <Tab.Pane eventKey="pages">
                    {this.renderPosts(pages)}
                  </Tab.Pane>
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
            </Col>
          </Row>
        </Tab.Container>

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
