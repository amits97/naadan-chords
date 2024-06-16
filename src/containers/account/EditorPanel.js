import React, { Component } from "react";
import { ButtonGroup, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBold,
  faItalic,
  faHeading,
  faGripLines,
  faGuitar,
  faArrowsAltV,
} from "@fortawesome/free-solid-svg-icons";
import "./EditorPanel.css";

export default class EditorPanel extends Component {
  handleClick = (text, addNewLines) => {
    this.props.insertAtCursor(text, addNewLines, this.props.insertRef);
  };

  render() {
    let { readOnly } = this.props;

    return (
      <div className="EditorPanel">
        <ButtonGroup>
          <Button
            variant="link"
            onClick={() => this.handleClick("bold")}
            disabled={readOnly}
          >
            <FontAwesomeIcon icon={faBold} />
            <span>Bold</span>
          </Button>
          <Button
            variant="link"
            onClick={() => this.handleClick("italic")}
            disabled={readOnly}
          >
            <FontAwesomeIcon icon={faItalic} />
            <span>Italic</span>
          </Button>
          <Button
            variant="link"
            onClick={() => this.handleClick("heading")}
            disabled={readOnly}
          >
            <FontAwesomeIcon icon={faHeading} />
            <span>Heading</span>
          </Button>
          <Button
            variant="link"
            onClick={() => this.handleClick("separator")}
            disabled={readOnly}
          >
            <FontAwesomeIcon icon={faGripLines} />
            <span>Separator</span>
          </Button>
          <Button
            variant="link"
            onClick={() => this.handleClick("tab", true)}
            disabled={readOnly}
          >
            <FontAwesomeIcon icon={faGuitar} />
            <span>Tabs</span>
          </Button>
          <Button
            variant="link"
            onClick={() => this.handleClick("strumming")}
            disabled={readOnly}
          >
            <FontAwesomeIcon icon={faArrowsAltV} />
            <span>Strumming</span>
          </Button>
        </ButtonGroup>
      </div>
    );
  }
}
