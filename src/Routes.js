import React from "react";
import { Switch } from "react-router-dom";
import Posts from "./containers/Posts";
import Post from "./containers/Post";
import Login from "./containers/Login";
import Admin from "./containers/Admin";
import AppliedRoute from "./components/AppliedRoute";
import UnauthenticatedRoute from "./components/UnauthenticatedRoute";
import AuthenticatedRoute from "./components/AuthenticatedRoute";

export default ({ childProps }) =>
  <Switch>
    <AppliedRoute path="/" exact component={Posts} />
    <UnauthenticatedRoute path="/login" exact component={Login} props={childProps} />
    <AuthenticatedRoute path="/admin" exact component={Admin} props={childProps} />
    <AppliedRoute path="/:id" exact component={Post} />
  </Switch>;