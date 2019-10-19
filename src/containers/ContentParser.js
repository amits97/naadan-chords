import React, { Component } from "react";
import ReactDOM from "react-dom";
import { Tabs, Tab } from "react-bootstrap";
import * as vexchords from "vexchords";
import { findGuitarChord } from 'chord-fingering';
import YouTubeEmbed from "../components/YouTubeEmbed";
import ChordControls from "./ChordControls";
import ChordsPopup from "./ChordsPopup";
import "./ContentParser.css";

export default class ContentParser extends Component {
  constructor(props){
    super(props);

    this.autoScrollTimer = null;
    this.state = {
      content: "",
      transposeAmount: 0,
      fontSize: 15,
      scrollAmount: 0,
      isVideoReady: false,
      hasChordPopupsRendered: false
    }
  }

  getFilename = (url) => {
    if (url) {
      var m = url.toString().match(/.*\/(.+?)\./);
      if (m && m.length > 1) {
         return m[1];
      }
    }
    return "";
  }

  stripHtml = (html) => {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  }

  transposeChords = (transposeAmount) => {
    var finalTransposeAmount = (this.state.transposeAmount + transposeAmount) % 12;
    this.setState({
      transposeAmount: finalTransposeAmount
    });
  }

  changeFontSize = (changeAmount) => {
    this.setState({
      fontSize: this.state.fontSize + changeAmount
    });
  }

  autoScroll = (scrollAmount) => {
    clearInterval(this.autoScrollTimer);

    if(scrollAmount !== 0) {
      this.autoScrollTimer = setInterval(() => {
        window.scrollBy(0, scrollAmount);
      }, 100);
    }
  }

  changeScrollAmount = (changeAmount) => {
    let scrollAmount = this.state.scrollAmount + changeAmount;

    this.setState({
      scrollAmount: scrollAmount
    });
    this.autoScroll(scrollAmount);
  }

  parseContent = (content) => {
    if(!content) {
      content = this.state.content;
    }

    const tabRegExp = /{start_tab}\n([\s\S]*?)\n{end_tab}/gim;
    const boldRegExp = /{start_bold}([\s\S]*?){end_bold}/gim;
    const italicRegExp = /{start_italic}([\s\S]*?){end_italic}/gim;
    const headingRegExp = /{start_heading}([\s\S]*?){end_heading}/gim;
    const strummingRegExp = /{start_strumming}([\s\S]*?){end_strumming}/gim;
    const imageRegExp = /{start_image}([\s\S]*?){end_image}/gim;
    const separatorRegExp = /{separator}/gim;

    const ignoreChordsRegExp = /<span class="ignore-chords">([\s\S]*?)<\/span>/g;

    //Chords regex
    const scale = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const notes = "[CDEFGAB]";
    const tabBeginning = "(?!\\|)";
    const chords = "(maj7|maj|min7|min|sus2|sus4|m7|m6add9|m7sus2|add9|m|b|bm|5|7|b7|bsus2)?";
    const sharp = "(#)?";
    const chordsRegex = new RegExp("\\b" + notes  + chords + "\\b" + sharp + chords + tabBeginning, "g");
    const chordsOnlyRegex = new RegExp(chords, "g");

    //replace tabs
    content = content.replace(tabRegExp, (match, p1) => {
      return (`<div class="tabs">${p1}</div>`);
    });

    //replace bold
    content = content.replace(boldRegExp, (match, p1) => {
      return (`<b>${p1}</b>`);
    });

    //replace italic
    content = content.replace(italicRegExp, (match, p1) => {
      return (`<i>${p1}</i>`);
    });

    //replace heading
    content = content.replace(headingRegExp, (match, p1) => {
      return (`<h4>${p1}</h4>`);
    });

    //replace separator
    content = content.replace(separatorRegExp, (match, p1) => {
      return (`<hr />`);
    });

    //replace strumming
    content = content.replace(strummingRegExp, (match, p1) => {
      return (`<span class="ignore-chords">${p1}</span>`);
    });

    if(this.state.transposeAmount !== 0) {
      //undo accidental transposes
      let ignoreChordTags = content.match(ignoreChordsRegExp);
      if(ignoreChordTags && ignoreChordTags.length > 0) {
        content = content.replace(ignoreChordsRegExp, (match) => {
          return match.replace(chordsRegex, (match, p1, p2, p3) => {
            let i = (scale.indexOf(match.replace(chordsOnlyRegex,'')) - this.state.transposeAmount) % scale.length;
            p1 = p1 ? p1.replace("#","") : "";
            p2 = p2 ? p2.replace("#","") : "";
            p3 = p3 ? p3.replace("#","") : "";
            return (`${scale[ i < 0 ? i + scale.length : i ] + p1 + p2 + p3}`);
          });
        });
      }
    }

    //replace chords
    content = content.replace(chordsRegex, (match, p1, p2, p3) => {
      let i = (scale.indexOf(match.replace(chordsOnlyRegex,'')) + this.state.transposeAmount) % scale.length;
      p1 = p1 ? p1.replace("#","") : "";
			p2 = p2 ? p2.replace("#","") : "";
			p3 = p3 ? p3.replace("#","") : "";
      return (`<span class="chord">${scale[ i < 0 ? i + scale.length : i ] + p1 + p2 + p3}</span>`);
    });

    //replace image
    content = content.replace(imageRegExp, (match, p1) => {
      return (`<img src="${p1}" alt="${this.getFilename(p1)}" />`);
    });

    return {__html: content};
  }

  hideVideoTab = () => {
    this.setState({
      isVideoReady: true
    });
  }

  renderTabs = (leadTabs, youtubeId) => {
    let { content, fontSize } = this.state;

    let chordControlsProps = {
      ...this.state,
      transposeChords: this.transposeChords,
      changeFontSize: this.changeFontSize,
      changeScrollAmount: this.changeScrollAmount
    };

    if(leadTabs || youtubeId) {
      const tabs = [
        <Tab eventKey="chords" title="CHORDS" key="chords">
          <div className="tab-contents">
            <div className="chord-sheet" dangerouslySetInnerHTML={ this.parseContent() } style={{fontSize: fontSize}} />
            <ChordControls className={`${content ? '':'d-none'}`} {...chordControlsProps} />
          </div>
        </Tab>
      ];

      if(leadTabs) {
        tabs.push(
          <Tab eventKey="tabs" title="LEAD TABS" key="tabs">
            <div className="tab-contents chord-sheet" dangerouslySetInnerHTML={ this.parseContent(leadTabs) } />
          </Tab>
        );
      }

      if(youtubeId) {
        tabs.push(
          <Tab eventKey="video" title="VIDEO" key="video" className={`${this.state.isVideoReady ? '' : 'visible'}`}>
            <div className="tab-contents chord-sheet">
              <YouTubeEmbed youtubeId={youtubeId} onLoad={this.hideVideoTab} />
            </div>
          </Tab>
        );
      }

      return (
        <Tabs defaultActiveKey="chords">
          { tabs }
        </Tabs>
      );
    } else {
      return (
        <div>
          <div className="chord-sheet" dangerouslySetInnerHTML={ this.parseContent() } style={{fontSize: fontSize}} />
          <ChordControls className={`${content ? '':'d-none'}`} {...chordControlsProps} />
        </div>
      )
    }
  }

  renderSongMeta = () => {
    let { song, album, singers, music } = this.props.post;

    if(song) {
      return (
        <div className="meta">
          <p>
            <b>Song: </b>{song}<br />
            <b>Album: </b>{album}<br />
            <b>Singers: </b>{singers}<br />
            <b>Music: </b>{music}<br />
          </p>
        </div>
      );
    }
  }

  componentDidMount() {
    let content = this.props.post.content ? this.stripHtml(this.props.post.content) : "";

    this.setState({
      content: content
    });
  }

  componentWillUnmount() {
    clearInterval(this.autoScrollTimer);
  }

  componentDidUpdate(prevProps) {
    let prevContent = prevProps.post.content ? prevProps.post.content : "";
    let content = this.props.post.content ? this.props.post.content : "";

    if(prevContent.length !== content.length) {
      let content = this.props.post.content ? this.stripHtml(this.props.post.content) : "";

      this.setState({
        content: content,
        hasChordPopupsRendered: false
      });
    }

    if(!this.state.hasChordPopupsRendered) {
      this.renderChordHelpers();
    }
  }

  renderChordHelpers = () => {
    let chordSpans = document.querySelectorAll("span.chord");

    if(chordSpans) {
      for(let i = 0; i < chordSpans.length; i++) {
        let chordName = chordSpans[i].innerHTML;
        let chord = findGuitarChord(chordName);

        if(chord) {
          let positionString = chord.fingerings[0].positionString;
          let chordPosition = [];
          let chordElement = document.createElement("div");

          for(let i = 1; i <= positionString.length; i++) {
            chordPosition.push([i, positionString[positionString.length-i]]);
          }

          vexchords.draw(chordElement, {
            chord: chordPosition
          }, {
            defaultColor: "#212529"
          });

          ReactDOM.render(<ChordsPopup chordName={chordName} chordElement={chordElement.innerHTML} />, chordSpans[i]);
        }
      }

      this.setState({
        hasChordPopupsRendered: true
      });
    }
  }

  render() {
    let leadTabs = this.props.post.leadTabs ? this.stripHtml(this.props.post.leadTabs) : "";
    let { youtubeId } = this.props.post;

    return (
      <div className="ContentParser">
        { this.renderSongMeta() }
        { this.renderTabs(leadTabs, youtubeId) }
      </div>
    );
  }
}