import {Component} from "react";

export default class SearchComponent extends Component {
  componentDidUpdate() {
    if(this.props.search) {
      this.props.history.push(`/?s=${this.props.search}`);
    }
  }
}