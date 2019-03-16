import React from "react";
import { Switch } from "react-router-dom";
import Posts from "./containers/Posts";
import Post from "./containers/Post";
import AppliedRoute from "./components/AppliedRoute";

export default () =>
  <Switch>
    <AppliedRoute path="/" exact component={Posts} />
    <AppliedRoute path="/:id" exact component={Post} />
  </Switch>;