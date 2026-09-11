import {Component} from "react";

export default class SearchComponent extends Component {
  componentDidMount() {
    if (this.props.search) {
      this.props.history.push(`/?s=${this.props.search}`);
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.search && this.props.search !== prevProps?.search) {
      this.props.history.push(`/?s=${this.props.search}`);
    }
  }
}