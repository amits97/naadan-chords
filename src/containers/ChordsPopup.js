import React, { Component } from "react";
import { OverlayTrigger, Popover } from "react-bootstrap";
import * as vexchords from "vexchords";
import { findGuitarChord } from 'chord-fingering';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSyncAlt, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import "./ChordsPopup.css";

export default class ChordsPopup extends Component {
  constructor(props) {
    super(props);

    this.state = {
      popoverOpen: false,
      chordElement: null
    };
  }

  getChordElement = (chordName) => {
    if(this.state.chordElement) {
      return this.state.chordElement;
    } else {
      let chord = findGuitarChord(chordName);
      let chordElement = document.createElement("div");
      let chordPosition = [];
      let lowestPosition = 12;
      let barre = [];

      if(chord) {
        let positionString = chord.fingerings[0].positionString;

        if(positionString.length > 6) {
          return;
        }

        for(let i = 0; i < positionString.length; i++) {
          let position = positionString[i];
          if(position !== "x" && parseInt(position) < lowestPosition) {
            lowestPosition = parseInt(position) - 1;
          }
        }

        lowestPosition = lowestPosition < 0 ? 0 : lowestPosition;

        for(let i = 1; i <= positionString.length; i++) {
          let reverseIndex = positionString.length-i;
          let fretPosition = positionString[reverseIndex];

          if(fretPosition !== "x") {
            fretPosition =  parseInt(fretPosition) - lowestPosition;
          }

          chordPosition.push([i, fretPosition]);
        }

        if(chord.fingerings[0].barre) {
          let fromString = 6 - chord.fingerings[0].barre.stringIndices[0];
          let toString = 6 - (chord.fingerings[0].barre.stringIndices.slice(-1).pop());

          if(fromString - toString > 2) {
            barre.push({
              fromString: fromString,
              toString: toString,
              fret: chord.fingerings[0].barre.fret - lowestPosition
            });

            let i = chordPosition.length;
            while(i--) {
              if(chordPosition[i][1] === chord.fingerings[0].barre.fret  - lowestPosition) {
                chordPosition.splice(i, 1);
              }
            }
          }
        }
      } else {
        return;
      }

      vexchords.draw(chordElement, {
        chord: chordPosition,
        position: lowestPosition + 1,
        barres: barre
      }, {
        width: 120,
        height: 140,
        fontFamily: "'DINNextLTPro-Regular', 'Helvetica Neue', sans-serif",
        defaultColor: "#212529"
      });

      this.setState({
        chordElement: chordElement
      });

      return chordElement;
    }
  }

  renderchordPopover = (chordName) => {
    if(this.state.popoverOpen) {
      let chordElement = this.getChordElement(chordName);

      if(chordElement) {
        return (
          <Popover id="popover-basic" className="ChordsPopup">
            <div dangerouslySetInnerHTML={{__html: chordElement.innerHTML}}></div>
          </Popover>
        );
      } else {
        return (
          <Popover id="popover-basic" className="ChordsPopup p-2">
            <div style={{width: "120px", height: "140px"}}>
              <span className="error">
                <FontAwesomeIcon icon={faExclamationTriangle} />
              </span>
            </div>
          </Popover>
        );
      }
    } else {
      return (
        <Popover id="popover-basic" className="ChordsPopup p-2">
          <div style={{width: "120px", height: "140px"}}>
            <FontAwesomeIcon icon={faSyncAlt} className="spinning" />
          </div>
        </Popover>
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
      <OverlayTrigger trigger="hover" placement="auto" overlay={this.renderchordPopover(chordName)} onEntered={this.openPopover}>
        <span className="chord popup-trigger">
          { chordName }
        </span>
      </OverlayTrigger>
    );
  }
}