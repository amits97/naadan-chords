import React from "react";
import { API } from "aws-amplify";
import { Button, ListGroup, Tab, Row, Col, Nav, Form, FormControl } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import { Helmet } from "react-helmet";
import Skeleton from "react-loading-skeleton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import LoaderButton from "../components/LoaderButton";
import SearchComponent from "../components/SearchComponent";
import "./Admin.css";

export default class Admin extends SearchComponent {
  constructor(props) {
    super(props);

    //timeout variable to throttle search results
    this.searchTimeout = null;

    this.state = {
      posts: [],
      pages: [],
      isLoading: true,
      isPaginationLoading: false,
      activeTab: "posts",
      postsToBeDeleted: [],
      search: ""
    };
  }

  loadData = async () => {
    this.setState({
      isLoading: true,
      posts: [],
      pages: []
    });

    try {
      const posts = await this.posts();
      const pages = await this.pages();

      this.setState({
        posts: posts,
        pages: pages,
        isLoading: false
      });
    } catch (e) {
      console.log(e);
    }
  }

  async componentDidMount() {
    window.scrollTo(0, 0);
    this.loadData();
  }

  posts() {
    let { search } = this.state;
    return API.get("posts", `/posts/${search ? "?s=" + search : ""}`);
  }

  pages() {
    let { search } = this.state;
    return API.get("posts", `/posts?postType=PAGE${search ? "&s=" + search : ""}`);
  }

  addPostToDelete = (event, postId) => {
    let postsToBeDeleted = this.state.postsToBeDeleted;

    if(event.target.checked) {
      postsToBeDeleted.push(postId);
    } else {
      postsToBeDeleted = postsToBeDeleted.filter(function(post){
        return post !== postId;
      });
    }

    this.setState({
      postsToBeDeleted: postsToBeDeleted
    });
  }

  handleNewPostClick = () => {
    this.props.history.push("/admin/new-post");
  }

  validateDeletes() {
    return this.state.postsToBeDeleted.length > 0;
  }

  clearCheckboxes = () => {
    this.setState({
      postsToBeDeleted: []
    });
  }

  toggleCheckboxes = () => {
    if(this.validateDeletes()) {
      this.clearCheckboxes();
    } else {
      let posts = this.state[this.state.activeTab];
      let postsToBeDeleted = [];
      for(var i = 0; i < posts.Items.length; i++) {
        postsToBeDeleted.push(posts.Items[i].postId);
      }
      this.setState({
        postsToBeDeleted: postsToBeDeleted
      });
    }
  }

  handleSubmit = async (event) => {
    event.preventDefault();
    let { postsToBeDeleted } = this.state;

    if(window.confirm(`Are you sure you want to delete ${postsToBeDeleted.length} posts?`)) {
      this.setState({
        isLoading: true
      });
  
      try {
        for(var i = 0; i < postsToBeDeleted.length; i++) {
          await this.deletePost(postsToBeDeleted[i]);
        }
  
        this.setState({
          postsToBeDeleted: []
        });
  
        this.componentDidMount();
      } catch (e) {
        this.setState({
          isLoading: false
        });
  
        console.log(e);
      }
    }
  }

  deletePost(postId) {
    return API.del("posts", `/posts/${postId}`);
  }

  setActiveTab = (tab) => {
    this.setState({
      activeTab: tab
    });
  }

  loadMorePosts = async (exclusiveStartKey) => {
    this.setState({
      isPaginationLoading: true
    });

    try {
      let postsResult = await API.get("posts", `/posts?exclusiveStartKey=${exclusiveStartKey}`);
      this.setState({
        posts: { ...postsResult, Items: this.state.posts.Items.concat(postsResult.Items)},
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

  prepareLastEvaluatedPostRequest = (lastEvaluatedPost) => {
    return encodeURIComponent(JSON.stringify(lastEvaluatedPost).replace(/"/g, "'"));
  }

  loadPagination = (lastEvaluatedPost) => {
    if(lastEvaluatedPost && lastEvaluatedPost.hasOwnProperty("postId")) {
      return (
        <LoaderButton
          isLoading={this.state.isPaginationLoading}
          onClick={() => {
            this.loadMorePosts(this.prepareLastEvaluatedPostRequest(lastEvaluatedPost));
          }}
          text="Load more"
          loadingText="Loading"
          className="load-posts btn-secondary"
        />
      );
    }
  }

  renderPosts(posts) {
    let { isLoading } = this.state;

    if(isLoading) {
      return (
        <Skeleton count={10}></Skeleton>
      );
    }

    if(posts.Items.length > 0) {
      return (
        <div>
          <ListGroup variant="flush">
            {
              posts.Items.map((post, i) => {
                return (
                  <ListGroup.Item key={i}>
                    <Form.Check type="checkbox" className="checkbox" onChange={(event) => this.addPostToDelete(event, post.postId)} checked={this.state.postsToBeDeleted.indexOf(post.postId) !== -1} />
                    <LinkContainer exact to={`/admin/edit-post/${post.postId}`}>
                      <a href="#/" className="text-primary">{ post.title }</a>
                    </LinkContainer>
                  </ListGroup.Item>
                );
              })
            }
          </ListGroup>
          { this.loadPagination(posts.LastEvaluatedKey) }
        </div>
      );
    } else {
      return (
        <p>No posts</p>
      );
    }
  }

  handleSearchChange = (event) => {
    this.setState({
      search: event.target.value
    });

    //clear previous timeouts
    clearTimeout(this.searchTimeout);

    //500ms delay
    this.searchTimeout = setTimeout(() => {
      this.loadData();
      window.scrollTo(0, 0);
    }, 500);
  }

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
    let { posts, pages } = this.state;

    return (
      <div className="Admin">
        { this.renderSEOTags() }
        <div className="header border-bottom">
          <h1 className="float-left">Admin</h1>
          <LinkContainer exact to="/admin/new-post">
            <Button variant="primary" className="float-right"><span><FontAwesomeIcon icon={ faPlus } /></span>New Post</Button>
          </LinkContainer>
        </div>

        <Tab.Container defaultActiveKey="posts">
          <Row>
            <Col sm={2}>
              <Nav variant="pills" className="flex-column">
                <Nav.Item>
                  <Nav.Link eventKey="posts" onClick={() => { this.clearCheckboxes(); this.setActiveTab("posts"); }}>Posts</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="pages" onClick={() => { this.clearCheckboxes(); this.setActiveTab("pages"); }}>Pages</Nav.Link>
                </Nav.Item>
              </Nav>
            </Col>
            <Col sm={10}>
              <Form onSubmit={this.handleSubmit}>
                <div className={`delete-container border-bottom`}>
                  <Form.Check type="checkbox" className="checkbox pt-2 pl-4 form-check" onChange={this.toggleCheckboxes} checked={this.validateDeletes()} />
                  <FormControl type="text" placeholder="Search" className="admin-search" value={this.state.search} onChange={this.handleSearchChange} />
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
                <Tab.Content>
                  <Tab.Pane eventKey="posts">
                    { this.renderPosts(posts) }
                  </Tab.Pane>
                  <Tab.Pane eventKey="pages">
                  { this.renderPosts(pages) }
                  </Tab.Pane>
                </Tab.Content>
              </Form>
            </Col>
          </Row>
        </Tab.Container>

        <div className="new-post-button btn btn-primary" onClick={this.handleNewPostClick}>
          <FontAwesomeIcon icon={ faPlus } />
        </div>
      </div>
    );
  }
}