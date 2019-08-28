import React from "react";
import { Switch } from "react-router-dom";
import Posts from "./containers/Posts";
import Login from "./containers/Login";
import Signup from "./containers/Signup";
import Admin from "./containers/Admin";
import NewPost from "./containers/NewPost";
import Request from "./containers/Request";
import NotFound from "./containers/NotFound";
import AppliedRoute from "./components/AppliedRoute";
import UnauthenticatedRoute from "./components/UnauthenticatedRoute";
import AuthenticatedRoute from "./components/AuthenticatedRoute";

export default ({ childProps }) =>
  <Switch>
    <AppliedRoute path="/" exact component={Posts} props={{pageKey: window.location.href, isHomePage: true, ...childProps}} />
    <AppliedRoute path="/page/:number" exact component={Posts} props={{pageKey: window.location.href, isHomePage: true, isPageUrl: true, ...childProps}} />
    <AppliedRoute path="/random/" exact component={Posts} props={{pageKey: window.location.href, isRandomPage: true, ...childProps}} />
    <AppliedRoute path="/category/:category" exact component={Posts} props={{pageKey: window.location.href, isCategory: true, ...childProps}} />
    <AppliedRoute path="/category/:category/page/:number" exact component={Posts} props={{pageKey: window.location.href, isCategory: true, isPageUrl: true, ...childProps}} />
    <AppliedRoute path="/author/:userName" exact component={Posts} props={{pageKey: window.location.href, isUserPosts: true, ...childProps}} />
    <AppliedRoute path="/author/:userName/page/:number" exact component={Posts} props={{pageKey: window.location.href, isUserPosts: true, isPageUrl: true, ...childProps}} />
    <UnauthenticatedRoute path="/login" exact component={Login} props={childProps} />
    <UnauthenticatedRoute path="/signup" exact component={Signup} props={childProps} />
    <AuthenticatedRoute path="/admin" exact component={Admin} props={childProps} />
    <AuthenticatedRoute path="/admin/new-post" exact component={NewPost} props={childProps} />
    <AuthenticatedRoute path="/admin/edit-post/:id" exact component={NewPost} props={{isEditMode: true, ...childProps}} />
    <AuthenticatedRoute path="/admin/edit-draft/:id" exact component={NewPost} props={{isEditMode: true, isDraft: true, ...childProps}} />
    <AppliedRoute path="/request" exact component={Request} props={{...childProps}} />
    <AppliedRoute path="/:id" exact component={Posts} props={{pageKey: window.location.href, ...childProps}} />
    { /* Finally, catch all unmatched routes */ }
    <AppliedRoute component={NotFound} props={{...childProps}} />
  </Switch>;