import React, { Component } from "react";
import { Carousel} from "react-bootstrap";
import * as vexchords from "vexchords";
import { findGuitarChord } from "chord-fingering";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSyncAlt, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import PopoverStickOnHover from "../components/PopoverStickOnHover";
import "./ChordsPopup.css";

export default class ChordsPopup extends Component {
  constructor(props) {
    super(props);

    this.renderedChordElements = [];

    this.state = {
      popoverOpen: false
    };
  }

  componentDidUpdate(prevProps) {
    if (this.props.theme.name !== prevProps.name) {
      this.renderedChordElements = [];
    }
  }

  getChordElements = (chordName) => {
    if(this.renderedChordElements.length > 0) {
      return this.renderedChordElements;
    } else {
      const { theme } = this.props;
      let chord = findGuitarChord(chordName);
      let chordElements = [];
      let chordPositions = [];
      let lowestPositions = [];
      let barres = [];
      let validFingeringFound = false;

      if(chord) {
        chord.fingerings.forEach((fingering) => {
          let chordPosition = [];
          let lowestPosition = 12;
          let highestPosition = 0;
          let barre = [];
          let positionString = fingering.positionString;

          if (positionString.length !== 6) {
            return;
          } else {
            validFingeringFound = true;
          }

          for(let i = 0; i < positionString.length; i++) {
            let position = positionString[i];

            if(position !== "x" && parseInt(position) > highestPosition) {
              highestPosition = parseInt(position);
            }

            if(position !== "x" && parseInt(position) < lowestPosition) {
              lowestPosition = parseInt(position) - 1;
            }
          }

          if (highestPosition - lowestPosition > 5) {
            return;
          }
  
          lowestPosition = lowestPosition < 0 ? 0 : lowestPosition;

          for(let i = 1; i <= positionString.length; i++) {
            let reverseIndex = positionString.length-i;
            let fretPosition = positionString[reverseIndex];
  
            if(fretPosition !== "x") {
              fretPosition = parseInt(fretPosition) - lowestPosition;
            }

            chordPosition.push([i, fretPosition]);
          }

          if(fingering.barre) {
            let fromString = 6 - fingering.barre.stringIndices[0];
            let toString = 6 - (fingering.barre.stringIndices.slice(-1).pop());
  
            if(fromString - toString > 2) {
              barre.push({
                fromString: fromString,
                toString: toString,
                fret: fingering.barre.fret - lowestPosition
              });
  
              let i = chordPosition.length;
              while(i--) {
                if(chordPosition[i][1] === fingering.barre.fret  - lowestPosition) {
                  chordPosition.splice(i, 1);
                }
              }
            }
          }

          chordPositions.push(chordPosition);
          lowestPositions.push(lowestPosition);
          barres.push(barre);
        });

        if (!validFingeringFound) return;
      } else {
        return;
      }

      for (let i = 0; i < chordPositions.length; i++) {
        let chordElement = document.createElement("div");

        vexchords.draw(chordElement, {
          chord: chordPositions[i],
          position: lowestPositions[i] + 1,
          barres: barres[i]
        }, {
          width: 120,
          height: 140,
          fontFamily: "'DINNextLTPro-Regular', 'Helvetica Neue', sans-serif",
          defaultColor: theme.text
        });

        chordElements.push(chordElement);
      }

      this.renderedChordElements = chordElements;
      return chordElements;
    }
  }

  renderchordPopover = (chordName) => {
    if(this.state.popoverOpen) {
      let chordElements = this.getChordElements(chordName);

      if(chordElements && chordElements.length > 0) {
        return (
          <div className="ChordsPopup">
            <Carousel interval={null}>
              {
                chordElements.map((chordElement, index) => {
                  return (
                    <Carousel.Item key={index}>
                      <div className="chord-diagram" dangerouslySetInnerHTML={{__html: chordElement.innerHTML}}></div>
                    </Carousel.Item>
                  );
                })
              }
            </Carousel>
          </div>
        );
      } else {
        return (
          <div className="ChordsPopup p-2" style={{width: "120px", height: "140px"}}>
            <span className="error">
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </span>
          </div>
        );
      }
    } else {
      return (
        <div className="ChordsPopup p-2" style={{width: "120px", height: "140px"}}>
          <FontAwesomeIcon icon={faSyncAlt} className="spinning" />
        </div>
      );
    }
  }

  openPopover = () => {
    this.setState({
      popoverOpen: true
    });
  }

  render() {
    let {chordName} = this.props;

    return(
      <PopoverStickOnHover
          component={this.renderchordPopover(chordName)}
          placement="auto"
          onMouseEnter={this.openPopover}
          delay={0}
      >
        <span className="chord popup-trigger">
          { chordName }
        </span>
      </PopoverStickOnHover>
    );
  }
}