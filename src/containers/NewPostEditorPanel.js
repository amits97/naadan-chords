import React, {Component} from "react";
import {ButtonGroup, Button} from "react-bootstrap";
import "./NewPostEditorPanel.css";

export default class NewPostEditorPanel extends Component {
  render() {
    return (
      <div className="NewPostEditorPanel">
        <ButtonGroup className="border">
          <Button variant="light">Bold</Button>
          <Button variant="light">Italic</Button>
        </ButtonGroup>
      </div>
    );
  }
}