import React, {Component} from "react";
import {Prompt} from "react-router-dom";

export default class PromptWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = {
      when: false
    }
  }

  componentDidMount() {
    this.setState({
      when: true
    });
  }

  render() {
    return(
      <Prompt
        when={this.state.when && this.props.when}
        message={this.props.message}
      />
    )
  }
}