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
          <Button variant="link" onClick={() => this.handleClick("bold")}>
            <FontAwesomeIcon icon={faBold} />
            <span>Bold</span>
          </Button>
          <Button variant="link" onClick={() => this.handleClick("italic")}>
            <FontAwesomeIcon icon={faItalic} />
            <span>Italic</span>
          </Button>
          <Button variant="link" onClick={() => this.handleClick("heading")}>
            <FontAwesomeIcon icon={faHeading} />
            <span>Heading</span>
          </Button>
          <Button variant="link" onClick={() => this.handleClick("separator")}>
            <FontAwesomeIcon icon={faGripLines} />
            <span>Separator</span>
          </Button>
          <Button variant="link" onClick={() => this.handleClick("tab", true)}>
            <FontAwesomeIcon icon={faGuitar} />
            <span>Tabs</span>
          </Button>
          <Button variant="link" onClick={() => this.handleClick("strumming")}>
            <FontAwesomeIcon icon={faArrowsAltV} />
            <span>Strumming</span>
          </Button>
        </ButtonGroup>
      </div>
    );
  }
}