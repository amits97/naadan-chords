import React, { Component } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisV, faTimes } from "@fortawesome/free-solid-svg-icons";
import "./Sidebar.css";

export default class Sidebar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      mobileSidebarOpened: false
    };
  }

  componentWillUpdate() {
    if(this.state.mobileSidebarOpened) {
      this.handleMobileSidebarClick();
    }
  }

  handleMobileSidebarClick = () => {
    this.setState({
      mobileSidebarOpened: !this.state.mobileSidebarOpened
    });
  }

  renderPostList = (posts) => {
    //todo
  }

  renderSidebarList = () => {
    //todo
  }

  render() {
    let { mobileSidebarOpened } = this.state;

    return (
      <div className="Sidebar">
        <div className={`sidebar bg-light border-left ${mobileSidebarOpened ? 'opened' : ''}`}>
          <div className="sidebar-content p-5">
            {this.renderSidebarList()}
          </div>
        </div>
        <div className="sidebar-button btn btn-primary" onClick={this.handleMobileSidebarClick}>
          <FontAwesomeIcon icon={mobileSidebarOpened ? faTimes : faEllipsisV} />
        </div>
      </div>
    );
  }
}