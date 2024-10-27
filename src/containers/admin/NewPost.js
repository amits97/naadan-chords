import React from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { API } from "../../libs/utils";
import Editor from "../account/Editor";
import SearchComponent from "../../components/SearchComponent";

export default class NewPost extends SearchComponent {
  async componentDidMount() {
    window.scrollTo(0, 0);

    let session = await fetchAuthSession();
    await this.props.getUserPrevileges(session);
    if (!this.props.isAdmin) {
      this.props.history.push("/");
    }
  }

  addReviewComment = (reviewComment) => {
    return API.post(
      "posts",
      `/contributions/${this.props.match.params.id}/comment`,
      {
        body: {
          comment: reviewComment,
        },
      }
    );
  };

  createPost = (post) => {
    return API.post("posts", "/posts", {
      body: post,
    });
  };

  rejectPost = () => {
    return API.del(
      "posts",
      `/contributions/${this.props.match.params.id}/reject`
    );
  };

  updatePost = (post) => {
    return API.put("posts", `/posts/${this.props.match.params.id}`, {
      body: post,
    });
  };

  render() {
    let { isEditMode, isDraft, isReviewMode } = this.props;
    let childProps = {
      ...this.props,
      isAdmin: true,
      dashboardName: "Admin",
      dashboardLink: "/admin",
      pageTitle: isEditMode
        ? isDraft
          ? "Edit Draft"
          : "Edit Post"
        : isReviewMode
        ? "Review Post"
        : "New Post",
      seo: {
        title: "Admin - Editor | Naadan Chords",
        description: "",
        twitterSummary: "summary",
      },
      reviewCommentRedirectUrl: "/admin",
      reviewRedirectUrl: "/admin",
      editRedirectUrl: `/${this.props.match.params.id}`,
      pageSubmitRedirectUrl: "/admin",
      postSubmitRedirectUrl: "/",
      submitButton: {
        text: isEditMode ? (isDraft ? "Publish" : "Update") : "Create",
        loadingText: isEditMode
          ? isDraft
            ? "Publishing…"
            : "Updating…"
          : "Creating…",
      },

      // Submit methods
      addReviewComment: this.addReviewComment,
      createPost: this.createPost,
      rejectPost: this.rejectPost,
      updatePost: this.updatePost,
    };

    return <Editor {...childProps} />;
  }
}
