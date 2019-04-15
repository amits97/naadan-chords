import React, {Component} from "react";
import {ButtonGroup, Button} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMinus } from "@fortawesome/free-solid-svg-icons";
import "./ChordControls.css";

export default class ChordControls extends Component {
  handleTransposeClick = (transposeAmount) => {
    this.props.transposeChords(transposeAmount);
  }

  render() {
    return (
      <div className={`ChordControls border bg-light ${this.props.className}`}>
        <div className="transpose-container">
          <span className="feature-label">
            TRANSPOSE <span className="transpose-amount text-primary">{this.props.transposeAmount ? this.props.transposeAmount : ''}</span>
          </span>
          <ButtonGroup>
            <Button variant="outline-dark" onClick={() => this.handleTransposeClick(1)}>
              <FontAwesomeIcon icon={faPlus} />
            </Button>
            <Button variant="outline-dark" onClick={() => this.handleTransposeClick(-1)}>
              <FontAwesomeIcon icon={faMinus} />
            </Button>
          </ButtonGroup>
        </div>
      </div>
    );
  }
}