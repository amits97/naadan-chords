import React, {Component} from "react";
import {ButtonGroup, Button} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBold, faItalic, faHeading, faGripLines, faGuitar } from "@fortawesome/free-solid-svg-icons";
import "./EditorPanel.css";

export default class EditorPanel extends Component {
  // insertAtCursor = (myField, myValue) => {
  //   //IE support
  //   if (document.selection) {
  //       myField.focus();
  //       var sel = document.selection.createRange();
  //       sel.text = myValue;
  //   }
  //   //MOZILLA and others
  //   else if (myField.selectionStart || myField.selectionStart == '0') {
  //       var startPos = myField.selectionStart;
  //       var endPos = myField.selectionEnd;
  //       myField.value = myField.value.substring(0, startPos)
  //           + myValue
  //           + myField.value.substring(endPos, myField.value.length);
  //   } else {
  //       myField.value += myValue;
  //   }
  // }

  render() {
    return (
      <div className="EditorPanel">
        <ButtonGroup>
          <ButtonGroup className="border">
            <Button variant="light"><FontAwesomeIcon icon={faBold} />
              <span>Bold</span>
            </Button>
            <Button variant="light"><FontAwesomeIcon icon={faItalic} />
              <span>Italic</span>
            </Button>
          </ButtonGroup>
          <ButtonGroup className="ml-2 border">
            <Button variant="light"><FontAwesomeIcon icon={faHeading} />
              <span>Heading</span>
            </Button>
            <Button variant="light"><FontAwesomeIcon icon={faGripLines} />
              <span>Separator</span>
            </Button>
          </ButtonGroup>
          <ButtonGroup className="ml-2 border">
            <Button variant="light"><FontAwesomeIcon icon={faGuitar} />
              <span>Tabs</span>
            </Button>
          </ButtonGroup>
        </ButtonGroup>
      </div>
    );
  }
}