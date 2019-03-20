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

    let content = this.stripHtml(this.props.content);

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

    return {__html: content};
  }

  render() {
    return (
      <div className="ContentParser" dangerouslySetInnerHTML={ this.parseContent() } />
    );
  }
}