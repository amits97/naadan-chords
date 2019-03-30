import React, { Component } from "react";
import { Tabs, Tab } from "react-bootstrap";
import YouTubeEmbed from "../components/YouTubeEmbed";
import "./ContentParser.css";

export default class ContentParser extends Component {
  constructor(props){
    super(props);

    this.state = {
      isVideoReady: false
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

  parseContent = (content) => {
    const tabRegExp = /{start_tab}\n([\s\S]*?)\n{end_tab}/gim;
    const boldRegExp = /{start_bold}([\s\S]*?){end_bold}/gim;
    const italicRegExp = /{start_italic}([\s\S]*?){end_italic}/gim;
    const headingRegExp = /{start_heading}([\s\S]*?){end_heading}/gim;
    const strummingRegExp = /{start_strumming}([\s\S]*?){end_strumming}/gim;
    const imageRegExp = /{start_image}([\s\S]*?){end_image}/gim;
    const chordsInStrummingRegExp = /\[([\s\S]*?)\]/gim;
    const separatorRegExp = /{separator}/gim;

    //Chords regex
    const notes = "[CDEFGAB]";
    const tabBeginning = "(?!\\|)";
    const chords = "(maj7|maj|min7|min|sus2|sus4|m7|m6add9|m7sus2|add9|m|b|bm|5)?";
    const sharp = "(#)?";
    const chordsRegex = new RegExp("\\b" + notes  + chords + "\\b" + sharp + chords + tabBeginning, "g");

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

    //replace chords
    content = content.replace(chordsRegex, (match) => {
      return (`<span class="chord">${match}</span>`);
    });

    //replace image
    content = content.replace(imageRegExp, (match, p1) => {
      return (`<img src="${p1}" alt="${this.getFilename(p1)}" />`);
    });

    //replace strumming
    content = content.replace(strummingRegExp, (match, p1) => {
      return (`<span class="ignore-chords">${p1.replace(chordsInStrummingRegExp, (match) => {
        return (`<span class="override-chords">${match}</span>`);
      })}</span>`);
    });

    return {__html: content};
  }

  hideVideoTab = () => {
    this.setState({
      isVideoReady: true
    });
  }

  renderTabs = (content, leadTabs, youtubeId) => {
    if(leadTabs || youtubeId) {
      const tabs = [
        <Tab eventKey="chords" title="CHORDS" key="chords">
          <div className="tab-contents chord-sheet" dangerouslySetInnerHTML={ this.parseContent(content) } />
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
        <div className="chord-sheet" dangerouslySetInnerHTML={ this.parseContent(content) } />
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

  render() {
    let content = this.props.post.content ? this.stripHtml(this.props.post.content) : "";
    let leadTabs = this.props.post.leadTabs ? this.stripHtml(this.props.post.leadTabs) : "";
    let { youtubeId } = this.props.post;

    return (
      <div className="ContentParser">
        { this.renderSongMeta() }
        { this.renderTabs(content, leadTabs, youtubeId) }
      </div>
    );
  }
}