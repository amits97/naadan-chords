import React, { Component } from "react";
import { ButtonGroup, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faMinus,
  faCaretDown,
  faCaretUp,
} from "@fortawesome/free-solid-svg-icons";
import * as Styles from "./Styles";
import "./ChordControls.css";

export default class ChordControls extends Component {
  handleTransposeClick = (transposeAmount) => {
    this.props.transposeChords(transposeAmount);
  };

  handleFontSizeClick = (sizeAmount) => {
    this.props.changeFontSize(sizeAmount);
  };

  handleScrollAmountClick = (scrollAmount) => {
    this.props.changeScrollAmount(scrollAmount);
  };

  checkFontSize = (button) => {
    if (button === "up") {
      return this.props.fontSize > 20;
    } else if (button === "down") {
      return this.props.fontSize < 12;
    }
  };

  checkScrollAmount = (button) => {
    if (button === "up") {
      return this.props.scrollAmount > 4;
    } else if (button === "down") {
      return this.props.scrollAmount < 1;
    }
  };

  computeFontAmount = () => {
    return (this.props.fontSize - 15) / 2;
  };

  toggleTray = () => {
    const { isChordControlsTrayMaximized, setIsChordControlsTrayMaximized } =
      this.props;
    let newTrayState = !isChordControlsTrayMaximized;

    setIsChordControlsTrayMaximized(newTrayState);
  };

  render() {
    let {
      transposeAmount,
      fontSize,
      scrollAmount,
      theme,
      isChordControlsTrayMaximized: isTrayMaximized,
    } = this.props;

    return (
      <Styles.ChordControlsContainer
        className={`ChordControls ${this.props.className} ${
          isTrayMaximized ? "" : "minimized"
        }`}
      >
        <div className={`tray-saver ${isTrayMaximized ? "d-none" : ""}`}>
          <Button
            variant="link"
            className="tray-control"
            onClick={() => this.toggleTray()}
          >
            <FontAwesomeIcon icon={faCaretUp} />
          </Button>
        </div>
        <div className="controls-tray">
          <div className="controls-container-holder">
            <div className="controls-container transpose-container">
              <span className="feature-label">
                Transpose{" "}
                <span className="amount text-primary">
                  {transposeAmount ? transposeAmount : ""}
                </span>
              </span>
              <ButtonGroup className={`${transposeAmount ? "ml-3" : ""}`}>
                <Button
                  variant={`outline-${
                    theme.name === "light" ? "dark" : "light"
                  }`}
                  onClick={() => this.handleTransposeClick(1)}
                >
                  <FontAwesomeIcon icon={faPlus} />
                </Button>
                <Button
                  variant={`outline-${
                    theme.name === "light" ? "dark" : "light"
                  }`}
                  onClick={() => this.handleTransposeClick(-1)}
                >
                  <FontAwesomeIcon icon={faMinus} />
                </Button>
              </ButtonGroup>
            </div>

            <div className="controls-container scroll-container">
              <span className="feature-label">
                Scroll{" "}
                <span className="amount text-primary">
                  {scrollAmount ? scrollAmount : ""}
                </span>
              </span>
              <ButtonGroup className={`${scrollAmount ? "ml-3" : ""}`}>
                <Button
                  variant={`outline-${
                    theme.name === "light" ? "dark" : "light"
                  }`}
                  onClick={() => this.handleScrollAmountClick(1)}
                  disabled={this.checkScrollAmount("up")}
                >
                  <FontAwesomeIcon icon={faPlus} />
                </Button>
                <Button
                  variant={`outline-${
                    theme.name === "light" ? "dark" : "light"
                  }`}
                  onClick={() => this.handleScrollAmountClick(-1)}
                  disabled={this.checkScrollAmount("down")}
                >
                  <FontAwesomeIcon icon={faMinus} />
                </Button>
              </ButtonGroup>
            </div>

            <div className="controls-container font-size-container">
              <span className="feature-label">
                Text{" "}
                <span className="amount text-primary" key={fontSize}>
                  {fontSize === 15 ? "" : this.computeFontAmount()}
                </span>
              </span>
              <ButtonGroup className={`${fontSize === 15 ? "" : "ml-3"}`}>
                <Button
                  variant={`outline-${
                    theme.name === "light" ? "dark" : "light"
                  }`}
                  onClick={() => this.handleFontSizeClick(2)}
                  disabled={this.checkFontSize("up")}
                >
                  <FontAwesomeIcon icon={faPlus} />
                </Button>
                <Button
                  variant={`outline-${
                    theme.name === "light" ? "dark" : "light"
                  }`}
                  onClick={() => this.handleFontSizeClick(-2)}
                  disabled={this.checkFontSize("down")}
                >
                  <FontAwesomeIcon icon={faMinus} />
                </Button>
              </ButtonGroup>
            </div>
          </div>

          <Button
            variant="link"
            className={`float-right tray-control ${
              isTrayMaximized ? "" : "d-none"
            }`}
            onClick={() => this.toggleTray()}
          >
            <FontAwesomeIcon icon={faCaretDown} />
          </Button>
        </div>
      </Styles.ChordControlsContainer>
    );
  }
}
