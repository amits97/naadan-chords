import React, {Component} from "react";
import {ButtonGroup, Button} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBold, faItalic, faHeading, faGripLines, faGuitar, faArrowsAltV } from "@fortawesome/free-solid-svg-icons";
import "./EditorPanel.css";

export default class EditorPanel extends Component {
  handleClick = (text, addNewLines) => {
    this.props.insertAtCursor(text, addNewLines);
  }

  render() {
    return (
      <div className="EditorPanel">
        <ButtonGroup>
          <ButtonGroup className="border">
            <Button variant="light" onClick={() => this.handleClick("bold")}>
              <FontAwesomeIcon icon={faBold} />
              <span>Bold</span>
            </Button>
            <Button variant="light" onClick={() => this.handleClick("italic")}>
              <FontAwesomeIcon icon={faItalic} />
              <span>Italic</span>
            </Button>
          </ButtonGroup>
          <ButtonGroup className="ml-2 border">
            <Button variant="light" onClick={() => this.handleClick("heading")}>
              <FontAwesomeIcon icon={faHeading} />
              <span>Heading</span>
            </Button>
          </ButtonGroup>
          <ButtonGroup className="ml-2 border">
            <Button variant="light" onClick={() => this.handleClick("separator")}>
              <FontAwesomeIcon icon={faGripLines} />
              <span>Separator</span>
            </Button>
          </ButtonGroup>
          <ButtonGroup className="ml-2 border">
            <Button variant="light" onClick={() => this.handleClick("tab", true)}>
              <FontAwesomeIcon icon={faGuitar} />
              <span>Tabs</span>
            </Button>
            <Button variant="light" onClick={() => this.handleClick("strumming")}>
              <FontAwesomeIcon icon={faArrowsAltV} />
              <span>Strumming</span>
            </Button>
          </ButtonGroup>
        </ButtonGroup>
      </div>
    );
  }
}