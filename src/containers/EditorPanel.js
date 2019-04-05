import React, {Component} from "react";
import {ButtonGroup, Button} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBold, faItalic } from "@fortawesome/free-solid-svg-icons";
import "./EditorPanel.css";

export default class EditorPanel extends Component {
  render() {
    return (
      <div className="EditorPanel">
        <ButtonGroup className="border">
          <Button variant="light"><FontAwesomeIcon icon={faBold} /></Button>
          <Button variant="light"><FontAwesomeIcon icon={faItalic} /></Button>
        </ButtonGroup>
      </div>
    );
  }
}