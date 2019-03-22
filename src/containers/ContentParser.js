import React, { Component } from "react";
import "./ContentParser.css";

export default class ContentParser extends Component {
  stripHtml = (html) => {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  }

  parseContent = () => {
    const tabRegExp = /{start_tab}\n([\s\S]*?)\n{end_tab}/gim;
    const boldRegExp = /{start_bold}([\s\S]*?){end_bold}/gim;
    const italicRegExp = /{start_italic}([\s\S]*?){end_italic}/gim;
    const headingRegExp = /{start_heading}([\s\S]*?){end_heading}/gim;
    const strummingRegExp = /{start_strumming}([\s\S]*?){end_strumming}/gim;
    const chordsInStrumming = /\[([\s\S]*?)\]/gim;

    //Chords regex
    const notes = "[CDEFGAB]";
    const chords = "(maj7|maj|min7|min|sus2|sus4|m7|m6add9|m7sus2|add9|m|5)?";
    const sharp = "(#)?";
    const chordsRegex = new RegExp("\\b" + notes + chords + "\\b" + sharp + chords, "g");

    let content = this.stripHtml(this.props.content);

    //replace tabs
    content = content.replace(tabRegExp, (match, p1) => {
      return (`<div class="tabs ignore-chords">${p1}</div>`);
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

    //replace strumming
    content = content.replace(strummingRegExp, (match, p1) => {
      return (`<span class="ignore-chords">${p1.replace(chordsInStrumming, (match) => {
        return (`<span class="override-chords">${match}</span>`);
      })}</span>`);
    });

    //replace chords
    content = content.replace(chordsRegex, (match) => {
      return (`<span class="chord">${match}</span>`);
    });

    return {__html: content};
  }

  render() {
    return (
      <div className="ContentParser" dangerouslySetInnerHTML={ this.parseContent() } />
    );
  }
}