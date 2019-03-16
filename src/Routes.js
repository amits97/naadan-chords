import React from "react";
import { Switch } from "react-router-dom";
import Posts from "./containers/Posts";
import Post from "./containers/Post";
import Login from "./containers/Login";
import AppliedRoute from "./components/AppliedRoute";
import UnauthenticatedRoute from "./components/UnauthenticatedRoute";

export default ({ childProps }) =>
  <Switch>
    <AppliedRoute path="/" exact component={Posts} />
    <UnauthenticatedRoute path="/login" exact component={Login} props={childProps} />
    <AppliedRoute path="/:id" exact component={Post} />
  </Switch>;