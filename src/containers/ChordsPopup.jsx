import React, { Component } from "react";
import { Carousel, Form } from "react-bootstrap";
import * as vexchords from "vexchords";
import { findGuitarChord } from "chord-fingering";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSyncAlt,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { INSTRUMENTS, STRINGS_COUNT, TUNINGS } from "../libs/constants";
import PopoverStickOnHover from "../components/PopoverStickOnHover";
import "./ChordsPopup.css";

export default class ChordsPopup extends Component {
  constructor(props) {
    super(props);

    this.renderedChordElements = [];

    this.state = {
      popoverOpen: false,
      instrument:
        typeof Storage !== "undefined"
          ? localStorage.getItem("instrument") || INSTRUMENTS.GUITAR
          : INSTRUMENTS.GUITAR,
    };
  }

  componentDidUpdate(prevProps) {
    if (this.props.theme.name !== prevProps.name) {
      this.renderedChordElements = [];

      if (typeof Storage !== "undefined") {
        const savedInstrument = localStorage.getItem("instrument");
        if (savedInstrument && this.state.instrument !== savedInstrument) {
          this.setState({
            instrument: savedInstrument,
          });
        }
      }
    }
  }

  getChordElements = (chordName) => {
    if (this.renderedChordElements.length > 0) {
      return this.renderedChordElements;
    } else {
      const { theme } = this.props;
      const { instrument } = this.state;
      let chord = findGuitarChord(chordName, TUNINGS[instrument]);
      let chordElements = [];
      let validFingeringFound = false;

      if (chord) {
        // If this chord has a specific preferred voicing passed from parent, bubble it to the top.
        if (this.props.preferredVoicing) {
          chord.fingerings.sort((a, b) => {
            const clean = (s) => s.replace(/-/g, "");
            const target = clean(this.props.preferredVoicing);
            const aMatch = clean(a.positionString) === target;
            const bMatch = clean(b.positionString) === target;

            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return 0;
          });
        }

        chord.fingerings.forEach((fingering) => {
          let chordPosition = [];
          let lowestPosition = 12;
          let highestPosition = 0;
          let barre = [];
          let positionString = fingering.positionString.replaceAll("-", "");

          if (positionString.length !== STRINGS_COUNT[instrument]) {
            return;
          } else {
            validFingeringFound = true;
          }

          let hasFrettedNotes = false;
          for (let i = 0; i < positionString.length; i++) {
            let position = positionString[i];
            if (position === "x") continue;

            let fret = parseInt(position);
            if (fret === 0) continue;

            hasFrettedNotes = true;
            if (fret > highestPosition) highestPosition = fret;
            if (fret < lowestPosition) lowestPosition = fret;
          }

          if (!hasFrettedNotes) {
            lowestPosition = 1;
            highestPosition = 1;
          }

          lowestPosition = lowestPosition - 1;
          lowestPosition = lowestPosition < 0 ? 0 : lowestPosition;

          if (highestPosition - lowestPosition > 5) {
            return;
          }

          for (let i = 1; i <= positionString.length; i++) {
            let reverseIndex = positionString.length - i;
            let fretPosition = positionString[reverseIndex];

            if (fretPosition !== "x") {
              let fretVal = parseInt(fretPosition);
              // Keep 0 as 0
              if (fretVal === 0) {
                fretPosition = 0;
              } else {
                fretPosition = fretVal - lowestPosition;
              }
            }

            chordPosition.push([i, fretPosition]);
          }

          if (fingering.barre) {
            let fromString =
              STRINGS_COUNT[instrument] - fingering.barre.stringIndices[0];
            let toString =
              STRINGS_COUNT[instrument] -
              fingering.barre.stringIndices.slice(-1).pop();

            if (fromString - toString > 2) {
              barre.push({
                fromString: fromString,
                toString: toString,
                fret: fingering.barre.fret - lowestPosition,
              });

              let i = chordPosition.length;
              while (i--) {
                if (
                  chordPosition[i][1] ===
                  fingering.barre.fret - lowestPosition
                ) {
                  chordPosition.splice(i, 1);
                }
              }
            }
          }

          let chordElement = document.createElement("div");

          vexchords.draw(
            chordElement,
            {
              chord: chordPosition,
              position: lowestPosition + 1,
              barres: barre,
              tuning: TUNINGS[instrument].split("-").map((note) => note[0]),
            },
            {
              width: 120,
              height: 140,
              fontFamily: "Minlo, Menlo, monospace",
              defaultColor: theme.text,
              numStrings: STRINGS_COUNT[instrument],
            }
          );

          chordElements.push(chordElement);
        });

        if (!validFingeringFound) return;
      } else {
        return;
      }

      this.renderedChordElements = chordElements;
      return chordElements;
    }
  };

  handleChange = (event) => {
    this.setState({
      instrument: event.target.value,
    });

    if (typeof Storage !== "undefined") {
      localStorage.setItem("instrument", event.target.value);
    }
  };

  renderchordPopover = (chordName) => {
    if (this.state.popoverOpen) {
      let chordElements = this.getChordElements(chordName);

      if (chordElements && chordElements.length > 0) {
        return (
          <div className="ChordsPopup">
            <Form.Group>
              <Form.Control
                as="select"
                id="instrument"
                onChange={this.handleChange}
                value={this.state.instrument}
              >
                <option value="GUITAR">GUITAR</option>
                <option value="UKULELE">UKULELE</option>
              </Form.Control>
            </Form.Group>
            <Carousel interval={null} key={this.state.instrument}>
              {chordElements.map((chordElement, index) => {
                return (
                  <Carousel.Item key={index}>
                    <div
                      className="chord-diagram"
                      dangerouslySetInnerHTML={{
                        __html: chordElement.innerHTML,
                      }}
                    ></div>
                  </Carousel.Item>
                );
              })}
            </Carousel>
          </div>
        );
      } else {
        return (
          <div
            className="ChordsPopup p-2"
            style={{ width: "120px", height: "140px" }}
          >
            <span className="error">
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </span>
          </div>
        );
      }
    } else {
      return (
        <div
          className="ChordsPopup p-2"
          style={{ width: "120px", height: "140px" }}
        >
          <FontAwesomeIcon icon={faSyncAlt} className="spinning" />
        </div>
      );
    }
  };

  openPopover = () => {
    this.setState({
      popoverOpen: true,
    });
  };

  render() {
    let { chordName } = this.props;

    return (
      <PopoverStickOnHover
        component={this.renderchordPopover(chordName)}
        placement="auto"
        onMouseEnter={this.openPopover}
        delay={0}
      >
        <span className="chord popup-trigger">{chordName}</span>
      </PopoverStickOnHover>
    );
  }
}
