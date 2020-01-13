import React from "react";
import { API } from "aws-amplify";
import Editor from "../account/Editor";
import SearchComponent from "../../components/SearchComponent";

export default class SubmitSong extends SearchComponent {
  componentDidMount() {
    window.scrollTo(0, 0);
  }

  createPost = (post) => {
    return API.post("posts", "/contributions", {
      body: post
    });
  }

  updatePost = (post) => {
    return API.put("posts", `/contributions/${this.props.match.params.id}`, {
      body: post
    });
  }

  render() {
    let { isEditMode, isDraft, isViewMode } = this.props;
    let childProps = {
      ...this.props,
      isContribution: true,
      helpContent: isViewMode ? <small className="text-muted">Published posts cannot be edited.</small> : <small className="text-muted">All submissions will be published only after an Admin approval process.</small>,
      dashboardName: "Contributions",
      dashboardLink: "/contributions",
      pageTitle: isEditMode? (isDraft ? "Edit Draft" : "Edit Song") : isViewMode ? "View Song" : "Submit Song",
      seo: {
        title: "Contributions - Editor | Naadan Chords",
        description: "",
        twitterSummary: "summary"
      },
      editRedirectUrl: "/contributions",
      postSubmitRedirectUrl: "/contributions",
      submitButton: {
        text: isEditMode ? (isDraft ? "Submit Song" : "Update Song") : "Submit Song",
        loadingText: isEditMode ? (isDraft ? "Submitting…" : "Updating…") : "Submitting…"
      },
      
      // Submit methods
      createPost: this.createPost,
      updatePost: this.updatePost
    };

    return (
      <Editor {...childProps} />
    );
  }
}
