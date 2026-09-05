import {Component} from "react";

export default class SearchComponent extends Component {
  componentDidUpdate(prevProps) {
    if (this.props.search && this.props.search !== prevProps?.search) {
      this.props.history.push(`/?s=${this.props.search}`);
    }
  }
}