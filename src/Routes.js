import React from "react";
import { Route, Switch } from "react-router-dom";
import Posts from "./containers/Posts";

export default () =>
  <Switch>
    <Route path="/" exact component={Posts} />
  </Switch>;