import React, { Component } from "react";
import ReactDOM from "react-dom";
import { LinkContainer } from "react-router-bootstrap";
import { Tab, Nav } from "react-bootstrap";
import { getNthOccurenceIndex, parseLinksToHtml, slugify } from "../libs/utils";
import YouTubeEmbed from "../components/YouTubeEmbed";
import ChordControls from "./ChordControls";
import ChordsPopup from "./ChordsPopup";
import * as urlLib from "../libs/url-lib";
import * as Styles from "./Styles";
import "./ContentParser.css";

export default class ContentParser extends Component {
  constructor(props) {
    super(props);

    this.autoScrollTimer = null;
    this.state = {
      content: "",
      transposeAmount: 0,
      fontSize: 15,
      scrollAmount: 0,
      isVideoReady: false,
      hasChordPopupsRendered: false,
      activeTab: "chords",
    };
  }

  getFilename = (url) => {
    if (url) {
      var m = url.toString().match(/.*\/(.+?)\./);
      if (m && m.length > 1) {
        return m[1];
      }
    }
    return "";
  };

  stripHtml = (html) => {
    var doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  transposeChords = (transposeAmount) => {
    var finalTransposeAmount =
      (this.state.transposeAmount + transposeAmount) % 12;
    this.setState({
      transposeAmount: finalTransposeAmount,
    });
  };

  changeFontSize = (changeAmount) => {
    this.setState({
      fontSize: this.state.fontSize + changeAmount,
    });
  };

  autoScroll = (scrollAmount) => {
    clearInterval(this.autoScrollTimer);

    if (scrollAmount !== 0) {
      this.autoScrollTimer = setInterval(() => {
        window.scrollBy(0, scrollAmount);
      }, 100);
    }
  };

  changeScrollAmount = (changeAmount) => {
    let scrollAmount = this.state.scrollAmount + changeAmount;

    this.setState({
      scrollAmount: scrollAmount,
    });
    this.autoScroll(scrollAmount);
  };

  getScale = (p1) => {
    const sharpScale = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ];
    const flatScale = [
      "C",
      "Db",
      "D",
      "Eb",
      "E",
      "F",
      "Gb",
      "G",
      "Ab",
      "A",
      "Bb",
      "B",
    ];

    if (p1 && p1.indexOf("b") !== -1) {
      return flatScale;
    } else {
      return sharpScale;
    }
  };

  parseContent = (content) => {
    if (!content) {
      content = this.state.content;
    }

    const tabRegExp = /{start_tab}\n([\s\S]*?)\n{end_tab}/gim;
    const boldRegExp = /{start_bold}([\s\S]*?){end_bold}/gim;
    const italicRegExp = /{start_italic}([\s\S]*?){end_italic}/gim;
    const headingRegExp = /{start_heading}([\s\S]*?){end_heading}/gim;
    const strummingRegExp = /{start_strumming}([\s\S]*?){end_strumming}/gim;
    const imageRegExp = /{start_image}([\s\S]*?){end_image}/gim;
    const separatorRegExp = /{separator}/gim;

    const ignoreChordsRegExp =
      /<span class="ignore-chords">([\s\S]*?)<\/span>/g;

    //Chords regex
    const notes = "[CDEFGAB]";
    const tabBeginning = "(?!\\|)";
    const chords =
      "(maj7|maj|min7|min|sus2|sus4|m7|m6add9|m7sus2|6sus2|7sus2|7sus4|add9|add4|5add14|m|5|6|7|dim)?";
    const flat = "(b)?";
    const sharp = "(#)?";
    const tabNumbers = "([-/hps])([0-9]+)";
    const chordsPattern =
      "\\b" + notes + flat + chords + "\\b" + sharp + chords;
    const chordsWithSlashPattern =
      chordsPattern +
      "(/)?\\b" +
      notes +
      "?" +
      flat +
      chords +
      "\\b" +
      sharp +
      chords;
    const chordsRegex = new RegExp(chordsWithSlashPattern + tabBeginning, "g");
    const chordsOnlyRegex = new RegExp(chords, "g");
    const tabsFretNumbersOnlyRegex = new RegExp(tabNumbers, "g");

    //replace tabs
    content = content.replace(tabRegExp, (match, p1) => {
      const tabLineStrings = p1.split("\n");
      let longestTabLineLength = 0;
      for (let i = 0; i < tabLineStrings.length; i++) {
        let tabLine = tabLineStrings[i].trim();
        if (tabLine.includes("-") && tabLine.includes("|")) {
          tabLineStrings[i] = tabLineStrings[i].replace(
            tabsFretNumbersOnlyRegex,
            (match, p1, originalFretPosition) => {
              let newFretPosition =
                Number(originalFretPosition) + this.state.transposeAmount;

              if (newFretPosition < 0) {
                newFretPosition = newFretPosition + 12;
              }

              if (newFretPosition > 17) {
                newFretPosition = newFretPosition - 12;
              }

              newFretPosition = `${newFretPosition}`;
              return p1 + newFretPosition;
            }
          );
          tabLine = tabLineStrings[i];
          let tabLineLength = getNthOccurenceIndex(tabLine, "|", 2) + 1;
          if (tabLineLength > longestTabLineLength) {
            longestTabLineLength = tabLineLength;
          }
        }
      }
      for (let i = 0; i < tabLineStrings.length; i++) {
        let tabLine = tabLineStrings[i].trim();
        if (tabLine.includes("-") && tabLine.includes("|")) {
          let tabLineLength = getNthOccurenceIndex(tabLine, "|", 2) + 1;
          if (tabLineLength < longestTabLineLength) {
            const diff = longestTabLineLength - tabLineLength;
            const filler = "-".repeat(diff);
            tabLineStrings[i] =
              tabLine.slice(0, tabLineLength - 2) +
              filler +
              tabLine.slice(tabLineLength - 2);
          }
        }
      }
      p1 = tabLineStrings.join("\n");
      return `<div class="tabs">${p1}</div>`;
    });

    //replace bold
    content = content.replace(boldRegExp, (match, p1) => {
      return `<b>${p1}</b>`;
    });

    //replace italic
    content = content.replace(italicRegExp, (match, p1) => {
      return `<i>${p1}</i>`;
    });

    //replace heading
    content = content.replace(headingRegExp, (match, p1) => {
      return `<h4>${p1}</h4>`;
    });

    //replace separator
    content = content.replace(separatorRegExp, (match, p1) => {
      return `<hr />`;
    });

    //replace strumming
    content = content.replace(strummingRegExp, (match, p1) => {
      return `<span class="ignore-chords">${p1}</span>`;
    });

    if (this.state.transposeAmount !== 0) {
      //undo accidental transposes
      let ignoreChordTags = content.match(ignoreChordsRegExp);
      if (ignoreChordTags && ignoreChordTags.length > 0) {
        content = content.replace(ignoreChordsRegExp, (match) => {
          return match.replace(chordsRegex, (match, p1, p2, p3, p4) => {
            let scale = this.getScale(p1);
            let i =
              (scale.indexOf(match.replace(chordsOnlyRegex, "")) -
                this.state.transposeAmount) %
              scale.length;
            p1 = p1 ? p1.replace("#", "").replace("b", "") : "";
            p2 = p2 ? p2.replace("#", "").replace("b", "") : "";
            p3 = p3 ? p3.replace("#", "").replace("b", "") : "";
            p4 = p4 ? p4.replace("#", "").replace("b", "") : "";
            return `${scale[i < 0 ? i + scale.length : i] + p1 + p2 + p3 + p4}`;
          });
        });
      }
    }

    //replace chords
    content = content.replace(
      chordsRegex,
      (match, p1, p2, p3, p4, p5, p6, p7, p8, p9) => {
        let scale = this.getScale(p1);
        let i =
          (scale.indexOf(match.split("/")[0].replace(chordsOnlyRegex, "")) +
            this.state.transposeAmount) %
          scale.length;
        let j = match.split("/")[1]
          ? (scale.indexOf(match.split("/")[1].replace(chordsOnlyRegex, "")) +
              this.state.transposeAmount) %
            scale.length
          : null;
        p1 = p1 ? p1.replace("#", "").replace("b", "") : "";
        p2 = p2 ? p2.replace("#", "").replace("b", "") : "";
        p3 = p3 ? p3.replace("#", "").replace("b", "") : "";
        p4 = p4 ? p4.replace("#", "").replace("b", "") : "";
        p5 = p5 ? p5 : "";
        p6 = p6 ? p6.replace("#", "").replace("b", "") : "";
        p7 = p7 ? p7.replace("#", "").replace("b", "") : "";
        p8 = p8 ? p8.replace("#", "").replace("b", "") : "";
        p9 = p9 ? p9.replace("#", "").replace("b", "") : "";
        return `<span class="chord">${
          scale[i < 0 ? i + scale.length : i] +
          p1 +
          p2 +
          p3 +
          p4 +
          p5 +
          (j ? `${scale[j < 0 ? j + scale.length : j]}` : "") +
          p6 +
          p7 +
          p8 +
          p9
        }</span>`;
      }
    );

    //replace image
    content = content.replace(imageRegExp, (match, p1) => {
      return `<img src="${p1}" alt="${this.getFilename(p1)}" />`;
    });

    // replace URLs
    content = parseLinksToHtml(content);

    return { __html: content };
  };

  hideVideoTab = () => {
    this.setState({
      isVideoReady: true,
    });
  };

  setActiveTab = (tab, e) => {
    e.nativeEvent.preventDefault();
    this.setState({
      activeTab: tab,
    });
    if (this.props.post.content && this.props.post.content.trim()) {
      if (tab === "chords") {
        urlLib.insertUrlParam("tab");
        return;
      }
    } else {
      if (tab === "tabs") {
        urlLib.insertUrlParam("tab");
        return;
      }
    }
    urlLib.insertUrlParam("tab", tab);
  };

  renderTabs = (leadTabs, youtubeId) => {
    let { content, fontSize } = this.state;

    let chordControlsProps = {
      ...this.state,
      ...this.props,
      transposeChords: this.transposeChords,
      changeFontSize: this.changeFontSize,
      changeScrollAmount: this.changeScrollAmount,
    };

    if (leadTabs || youtubeId) {
      const tabs = [];
      let defaultActiveKey = "chords";

      if (this.props.post.content && this.props.post.content.trim()) {
        tabs.push(
          <Nav.Item key="chords">
            <Nav.Link eventKey="chords" href={`/${this.props.post.postId}`}>
              CHORDS
            </Nav.Link>
          </Nav.Item>
        );
      }

      if (leadTabs) {
        defaultActiveKey =
          this.props.post.content && this.props.post.content.trim()
            ? defaultActiveKey
            : "tabs";
        let tabHref =
          defaultActiveKey === "tabs"
            ? `/${this.props.post.postId}`
            : "?tab=tabs";
        tabs.push(
          <Nav.Item key="tabs">
            <Nav.Link eventKey="tabs" href={tabHref}>
              LEAD TABS
            </Nav.Link>
          </Nav.Item>
        );
      }

      if (youtubeId) {
        tabs.push(
          <Nav.Item key="video">
            <Nav.Link
              eventKey="video"
              className={`${this.state.isVideoReady ? "" : "visible"}`}
              href="?tab=video"
            >
              VIDEO
            </Nav.Link>
          </Nav.Item>
        );
      }

      return (
        <Tab.Container
          defaultActiveKey={defaultActiveKey}
          activeKey={this.state.activeTab}
          onSelect={this.setActiveTab}
        >
          <Nav as="nav" className="nav-tabs">
            {tabs}
          </Nav>
          <Tab.Content>
            <Tab.Pane eventKey="chords">
              <div className="tab-contents">
                <div
                  className="chord-sheet"
                  dangerouslySetInnerHTML={this.parseContent()}
                  style={{ fontSize: fontSize }}
                />
                <ChordControls
                  className={`${content ? "" : "d-none"}`}
                  {...chordControlsProps}
                />
              </div>
            </Tab.Pane>
            <Tab.Pane eventKey="tabs">
              <div
                className="tab-contents chord-sheet"
                dangerouslySetInnerHTML={this.parseContent(leadTabs)}
              />
            </Tab.Pane>
            <Tab.Pane eventKey="video">
              <div className="tab-contents chord-sheet">
                {this.state.activeTab === "video" && (
                  <YouTubeEmbed
                    youtubeId={youtubeId}
                    onLoad={this.hideVideoTab}
                  />
                )}
              </div>
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      );
    } else {
      return (
        <div>
          <div
            className="chord-sheet"
            dangerouslySetInnerHTML={this.parseContent()}
            style={{ fontSize: fontSize }}
          />
          <ChordControls
            className={`${content ? "" : "d-none"}`}
            {...chordControlsProps}
          />
        </div>
      );
    }
  };

  renderSongMeta = () => {
    let { song, album, singers, lyrics, music, scale, tempo, timeSignature } =
      this.props.post;
    let showScaleInfo = scale || tempo || timeSignature;

    if (song) {
      return (
        <div className="meta">
          <ul style={{ marginBottom: showScaleInfo ? "0.8rem" : "1.5rem" }}>
            <li>
              <span className="text-muted">Song</span>
              {song}
            </li>
            <li>
              <span className="text-muted">Album</span>
              <LinkContainer to={`/album/${slugify(album)}`}>
                <a href="#/">{album}</a>
              </LinkContainer>
            </li>
            {singers ? (
              <li>
                <span className="text-muted">Singers</span>
                {singers}
              </li>
            ) : null}
            {lyrics ? (
              <li>
                <span className="text-muted">Lyrics</span>
                {lyrics}
              </li>
            ) : null}
            <li>
              <span className="text-muted">Music</span>
              {music}
            </li>
          </ul>

          {showScaleInfo ? (
            <Styles.ScaleInfoContainer className="px-3 py-2 mb-4">
              <p className="mb-0">
                {scale ? (
                  <React.Fragment>
                    <span className="text-muted">Scale - </span>
                    {scale}
                    <br />
                  </React.Fragment>
                ) : null}
                {tempo ? (
                  <React.Fragment>
                    <span className="text-muted">Tempo - </span>
                    {tempo} bpm
                    <br />
                  </React.Fragment>
                ) : null}
                {timeSignature ? (
                  <React.Fragment>
                    <span className="text-muted">Time Signature - </span>
                    {timeSignature}
                  </React.Fragment>
                ) : null}
              </p>
            </Styles.ScaleInfoContainer>
          ) : null}
        </div>
      );
    }
  };

  componentDidMount() {
    let content = this.props.post.content
      ? this.stripHtml(this.props.post.content)
      : "";

    this.setState({
      content: content,
    });

    let defaultActiveTab =
      this.props.post.content && this.props.post.content.trim()
        ? "chords"
        : "tabs";
    let activeTabInUrl = urlLib.getUrlParameter("tab");
    let activeTab = activeTabInUrl ? activeTabInUrl : defaultActiveTab;
    this.setState({
      activeTab,
    });
  }

  componentWillUnmount() {
    clearInterval(this.autoScrollTimer);
  }

  componentDidUpdate(prevProps, prevState) {
    let prevContent = prevProps.post.content ? prevProps.post.content : "";
    let content = this.props.post.content ? this.props.post.content : "";

    if (prevContent.length !== content.length) {
      let content = this.props.post.content
        ? this.stripHtml(this.props.post.content)
        : "";

      this.setState({
        content: content,
        hasChordPopupsRendered: false,
      });
    }

    if (
      !this.state.hasChordPopupsRendered ||
      this.state.transposeAmount !== prevState.transposeAmount ||
      this.props.theme.name !== prevProps.theme.name
    ) {
      this.renderChordHelpers();
    }
  }

  hasIgnoreChordsParent(depthLimit, element) {
    if (
      element &&
      element.className &&
      element.className.split(" ").indexOf("ignore-chords") >= 0
    ) {
      return true;
    }
    depthLimit--;
    if (depthLimit > 0) {
      return (
        element.parentNode &&
        this.hasIgnoreChordsParent(depthLimit, element.parentNode)
      );
    } else {
      return false;
    }
  }

  renderChordHelpers = () => {
    let chordSpans = document.querySelectorAll("span.chord");
    const { theme } = this.props;

    if (chordSpans) {
      for (let i = 0; i < chordSpans.length; i++) {
        let chordName = chordSpans[i].innerText;
        let parentElement = chordSpans[i].parentElement;
        if (parentElement && !this.hasIgnoreChordsParent(5, parentElement)) {
          ReactDOM.render(
            <ChordsPopup chordName={chordName} theme={theme} />,
            chordSpans[i]
          );
        }
      }

      this.setState({
        hasChordPopupsRendered: true,
      });
    }
  };

  render() {
    let leadTabs = this.props.post.leadTabs
      ? this.stripHtml(this.props.post.leadTabs)
      : "";
    let { youtubeId } = this.props.post;

    return (
      <div className="ContentParser">
        {this.renderSongMeta()}
        {this.renderTabs(leadTabs, youtubeId)}
      </div>
    );
  }
}
