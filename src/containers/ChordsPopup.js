import React, { Component } from "react";
import { OverlayTrigger, Popover } from "react-bootstrap";
import "./ChordsPopup.css";

export default class ChordsPopup extends Component {
  renderchordPopover = (chordElement) => {
    return (
      <Popover id="popover-basic">
        <div dangerouslySetInnerHTML={{__html: chordElement}}></div>
      </Popover>
    );
  }

  render() {
    let {chordName, chordElement} = this.props;

    return(
      <OverlayTrigger trigger="hover" placement="auto" overlay={this.renderchordPopover(chordElement)}>
        <span className="chord popup-trigger">
          { chordName }
        </span>
      </OverlayTrigger>
    );
  }
}