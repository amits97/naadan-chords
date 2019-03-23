import React, { Component } from "react";
import { Tabs, Tab } from "react-bootstrap";
import "./ContentParser.css";

export default class ContentParser extends Component {
  constructor(props) {
    super(props);
    this.state = {
      leadTabs: null
    }
  }

  stripHtml = (html) => {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  }

  renderSongMeta = (content) => {
    const songMetaRegExp = /{start_song_meta}\n([\s\S]*?)\n{end_song_meta}/gim;
    const boldRegExp = /{start_bold}([\s\S]*?){end_bold}/gim;

    //get meta details
    let song_meta_matches = songMetaRegExp.exec(content);
    if(song_meta_matches && song_meta_matches.length > 1) {
      let song_meta = "<div class='meta'><p>" + song_meta_matches[1] + "</p></div>";

      //replace bold
      song_meta = song_meta.replace(boldRegExp, (match, p1) => {
        return (`<b>${p1}</b>`);
      });

      return {__html: song_meta};
    }
  }

  renderLeadTabs = () => {
    return {__html: this.state.leadTabs};
  }

  parseContent = (content) => {
    const tabRegExp = /{start_tab}\n([\s\S]*?)\n{end_tab}/gim;
    const boldRegExp = /{start_bold}([\s\S]*?){end_bold}/gim;
    const italicRegExp = /{start_italic}([\s\S]*?){end_italic}/gim;
    const headingRegExp = /{start_heading}([\s\S]*?){end_heading}/gim;
    const strummingRegExp = /{start_strumming}([\s\S]*?){end_strumming}/gim;
    const chordsInStrummingRegExp = /\[([\s\S]*?)\]/gim;
    const leadTabsRegExp = /{start_lead_tabs}\n([\s\S]*?)\n{end_lead_tabs}/gim;
    const songMetaRegExp = /{start_song_meta}\n([\s\S]*?)\n{end_song_meta}/gim;
    const separatorRegExp = /{separator}/gim;

    //Chords regex
    const notes = "[CDEFGAB]";
    const tabBeginning = "(?!\\|)";
    const chords = "(maj7|maj|min7|min|sus2|sus4|m7|m6add9|m7sus2|add9|m|5)?";
    const sharp = "(#)?";
    const chordsRegex = new RegExp("\\b" + notes  + chords + "\\b" + sharp + chords + tabBeginning, "g");

    //remove song meta
    content = content.replace(songMetaRegExp, (match, p1) => {
      return "";
    });

    //replace tabs
    content = content.replace(tabRegExp, (match, p1) => {
      return (`<div class="tabs">${p1}</div>`);
    });

    //replace bold
    content = content.replace(boldRegExp, (match, p1) => {
      return (`<b>${p1}</b>`);
    });

    //remove lead tabs and save to lead tab state
    content = content.replace(leadTabsRegExp, (match, p1) => {
      if(this.state.leadTabs === null) {
        this.setState({
          leadTabs: p1
        });
      }
      return("");
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

    //replace strumming
    content = content.replace(strummingRegExp, (match, p1) => {
      return (`<span class="ignore-chords">${p1.replace(chordsInStrummingRegExp, (match) => {
        return (`<span class="override-chords">${match}</span>`);
      })}</span>`);
    });

    return {__html: content};
  }

  renderTabs = (content) => {
    let { leadTabs } = this.state;

    if(leadTabs !== null) {
      return (
        <Tabs defaultActiveKey="chords">
          <Tab eventKey="chords" title="CHORDS">
            <div className="pl-3 pr-3" dangerouslySetInnerHTML={ this.parseContent(content) } />
          </Tab>
          <Tab eventKey="tabs" title="LEAD TABS">
            <div className="pl-3 pr-3 ignore-chords" dangerouslySetInnerHTML={ this.renderLeadTabs() } />
          </Tab>
        </Tabs>
      );
    } else {
      return (
        <div dangerouslySetInnerHTML={ this.parseContent(content) } />
      )
    }
  }

  render() {
    let content = this.stripHtml(this.props.content);

    return (
      <div className="ContentParser">
        <div dangerouslySetInnerHTML={ this.renderSongMeta(content) } />
        { this.renderTabs(content) }
      </div>
    );
  }
}