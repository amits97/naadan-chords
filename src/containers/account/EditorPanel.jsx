import React, { Component } from "react";
import { ButtonGroup, Button, OverlayTrigger, Tooltip } from "react-bootstrap";
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

  popperConfig = {
    modifiers: [
      {
        name: "flip",
        options: {
          allowedAutoPlacements: ["top", "bottom"],
        },
      },
    ],
  };

  renderTooltip = (id, text) => <Tooltip id={id}>{text}</Tooltip>;

  render() {
    let { readOnly } = this.props;

    return (
      <div className="EditorPanel">
        <ButtonGroup>
          <OverlayTrigger
            placement="auto"
            trigger="hover"
            popperConfig={this.popperConfig}
            overlay={this.renderTooltip("tooltip-bold", "Bold (Cmd/Ctrl + B)")}
          >
            <Button
              variant="link"
              onClick={() => this.handleClick("bold")}
              disabled={readOnly}
            >
              <FontAwesomeIcon icon={faBold} />
              <span>Bold</span>
            </Button>
          </OverlayTrigger>
          <OverlayTrigger
            placement="auto"
            trigger="hover"
            popperConfig={this.popperConfig}
            overlay={this.renderTooltip("tooltip-italic", "Italic (Cmd/Ctrl + I)")}
          >
            <Button
              variant="link"
              onClick={() => this.handleClick("italic")}
              disabled={readOnly}
            >
              <FontAwesomeIcon icon={faItalic} />
              <span>Italic</span>
            </Button>
          </OverlayTrigger>
          <OverlayTrigger
            placement="auto"
            trigger="hover"
            popperConfig={this.popperConfig}
            overlay={this.renderTooltip(
              "tooltip-heading",
              "Heading (Cmd/Ctrl + H)"
            )}
          >
            <Button
              variant="link"
              onClick={() => this.handleClick("heading")}
              disabled={readOnly}
            >
              <FontAwesomeIcon icon={faHeading} />
              <span>Heading</span>
            </Button>
          </OverlayTrigger>
          <OverlayTrigger
            placement="auto"
            trigger="hover"
            popperConfig={this.popperConfig}
            overlay={this.renderTooltip(
              "tooltip-separator",
              "Separator (Cmd/Ctrl + Enter)"
            )}
          >
            <Button
              variant="link"
              onClick={() => this.handleClick("separator")}
              disabled={readOnly}
            >
              <FontAwesomeIcon icon={faGripLines} />
              <span>Separator</span>
            </Button>
          </OverlayTrigger>
          <OverlayTrigger
            placement="auto"
            trigger="hover"
            popperConfig={this.popperConfig}
            overlay={this.renderTooltip("tooltip-tab", "Tabs (Cmd/Ctrl + K)")}
          >
            <Button
              variant="link"
              onClick={() => this.handleClick("tab", true)}
              disabled={readOnly}
            >
              <FontAwesomeIcon icon={faGuitar} />
              <span>Tabs</span>
            </Button>
          </OverlayTrigger>
          <OverlayTrigger
            placement="auto"
            trigger="hover"
            popperConfig={this.popperConfig}
            overlay={this.renderTooltip(
              "tooltip-strumming",
              "Strumming (Cmd/Ctrl + Shift + S)"
            )}
          >
            <Button
              variant="link"
              onClick={() => this.handleClick("strumming")}
              disabled={readOnly}
            >
              <FontAwesomeIcon icon={faArrowsAltV} />
              <span>Strumming</span>
            </Button>
          </OverlayTrigger>
        </ButtonGroup>
      </div>
    );
  }
}
