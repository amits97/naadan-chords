import React from "react";
import { Switch } from "react-router-dom";
import Posts from "./containers/Posts";
import Login from "./containers/Login";
import ResetPassword from "./containers/ResetPassword";
import Signup from "./containers/Signup";
import Admin from "./containers/admin/Admin";
import NewPost from "./containers/admin/NewPost";
import Account from "./containers/account/Account";
import Request from "./containers/Request";
import Contributions from "./containers/contribute/Contributions";
import SubmitSong from "./containers/contribute/SubmitSong";
import NotFound from "./containers/NotFound";
import AppliedRoute from "./components/AppliedRoute";
import UnauthenticatedRoute from "./components/UnauthenticatedRoute";
import AuthenticatedRoute from "./components/AuthenticatedRoute";

const Routes = ({ childProps }) => (
  <Switch>
    <AppliedRoute
      path="/"
      exact
      component={Posts}
      props={{
        pageKey: window.location.href.split("?")[0],
        isHomePage: true,
        ...childProps,
      }}
    />
    <AppliedRoute
      path="/page/:number"
      exact
      component={Posts}
      props={{
        pageKey: window.location.href.split("?")[0],
        isHomePage: true,
        isPageUrl: true,
        ...childProps,
      }}
    />
    <AppliedRoute
      path="/random/"
      exact
      component={Posts}
      props={{
        pageKey: window.location.href.split("?")[0],
        isRandomPage: true,
        ...childProps,
      }}
    />
    <AppliedRoute
      path="/category/:category"
      exact
      component={Posts}
      props={{
        pageKey: window.location.href.split("?")[0],
        isCategory: true,
        ...childProps,
      }}
    />
    <AppliedRoute
      path="/category/:category/page/:number"
      exact
      component={Posts}
      props={{
        pageKey: window.location.href.split("?")[0],
        isCategory: true,
        isPageUrl: true,
        ...childProps,
      }}
    />
    <AppliedRoute
      path="/album/:album"
      exact
      component={Posts}
      props={{
        pageKey: window.location.href.split("?")[0],
        isAlbum: true,
        ...childProps,
      }}
    />
    <AppliedRoute
      path="/album/:album/page/:number"
      exact
      component={Posts}
      props={{
        pageKey: window.location.href.split("?")[0],
        isAlbum: true,
        isPageUrl: true,
        ...childProps,
      }}
    />
    <AppliedRoute
      path="/author/:userName"
      exact
      component={Posts}
      props={{
        pageKey: window.location.href.split("?")[0],
        isUserPosts: true,
        ...childProps,
      }}
    />
    <AppliedRoute
      path="/author/:userName/page/:number"
      exact
      component={Posts}
      props={{
        pageKey: window.location.href.split("?")[0],
        isUserPosts: true,
        isPageUrl: true,
        ...childProps,
      }}
    />
    <UnauthenticatedRoute
      path="/login"
      exact
      component={Login}
      props={childProps}
    />
    <AppliedRoute
      path="/forgot-password"
      exact
      component={ResetPassword}
      props={childProps}
    />
    <UnauthenticatedRoute
      path="/signup"
      exact
      component={Signup}
      props={childProps}
    />
    <UnauthenticatedRoute
      path="/signup/verify"
      exact
      component={Signup}
      props={{ isVerify: true, ...childProps }}
    />
    <AuthenticatedRoute
      path="/admin"
      exact
      component={Admin}
      props={childProps}
    />
    <AuthenticatedRoute
      path="/admin/new-post"
      exact
      component={NewPost}
      props={childProps}
    />
    <AuthenticatedRoute
      path="/admin/edit-post/:id"
      exact
      component={NewPost}
      props={{ isEditMode: true, ...childProps }}
    />
    <AuthenticatedRoute
      path="/admin/edit-draft/:id"
      exact
      component={NewPost}
      props={{ isEditMode: true, isDraft: true, ...childProps }}
    />
    <AuthenticatedRoute
      path="/admin/review-post/:id"
      exact
      component={NewPost}
      props={{ isReviewMode: true, ...childProps }}
    />
    <AuthenticatedRoute
      path="/account"
      exact
      component={Account}
      props={{ ...childProps }}
    />
    <AppliedRoute
      path="/request"
      exact
      component={Request}
      props={{ ...childProps }}
    />
    <AuthenticatedRoute
      path="/contributions/"
      exact
      component={Contributions}
      props={childProps}
    />
    <AuthenticatedRoute
      path="/contributions/submit-song"
      exact
      component={SubmitSong}
      props={childProps}
    />
    <AuthenticatedRoute
      path="/contributions/edit-song/:id"
      exact
      component={SubmitSong}
      props={{ isEditMode: true, ...childProps }}
    />
    <AuthenticatedRoute
      path="/contributions/view-song/:id"
      exact
      component={SubmitSong}
      props={{ isViewMode: true, ...childProps }}
    />
    <AuthenticatedRoute
      path="/contributions/edit-draft/:id"
      exact
      component={SubmitSong}
      props={{ isEditMode: true, isDraft: true, ...childProps }}
    />
    <AppliedRoute
      path="/:id"
      exact
      component={Posts}
      props={{ pageKey: window.location.href.split("?")[0], ...childProps }}
    />
    {/* Finally, catch all unmatched routes */}
    <AppliedRoute component={NotFound} props={{ ...childProps }} />
  </Switch>
);

export default Routes;
