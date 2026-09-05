import React from "react";
import ReactGA from "react-ga4";
import * as Styles from "../containers/Styles";

const FlexChordsBanner = ({ query }) => {
  const trimmedQuery = (query || "").trim();
  if (!trimmedQuery) {
    return null;
  }

  const targetUrl = `https://flexchords.com/search?q=${encodeURIComponent(
    trimmedQuery,
  )}&utm_source=naadanchords&utm_medium=empty_search_banner&utm_campaign=soft_launch`;

  const handleClick = () => {
    // 1. Google tag (gtag.js) tracking
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "click_flexchords_banner", {
        search_query: trimmedQuery,
        destination_url: targetUrl,
      });
    } else if (typeof gtag === "function") {
      gtag("event", "click_flexchords_banner", {
        search_query: trimmedQuery,
        destination_url: targetUrl,
      });
    }

    // 2. ReactGA tracking (GA4)
    try {
      ReactGA.event({
        category: "Flex Chords Banner",
        action: "click_flexchords_banner",
        label: trimmedQuery,
      });
    } catch (e) {
      console.warn("ReactGA event tracking failed:", e);
    }
  };

  return (
    <Styles.FlexChordsCard>
      <div className="flex-chords-header">
        <div className="flex-chords-brand">
          <img
            src="https://flexchords.com/logo.svg"
            alt="Flex Chords"
            className="flex-chords-logo"
            width="32"
            height="32"
          />
          <div className="flex-chords-brand-info">
            <span className="flex-chords-brand-name">Flex Chords</span>
            <span className="flex-chords-separator">·</span>
            <span className="flex-chords-brand-tagline">
              AI Chord Generator
            </span>
          </div>
        </div>
        <span className="flex-chords-badge">Companion Tool</span>
      </div>

      <div className="flex-chords-content">
        <h4 className="flex-chords-headline">
          Can't find chords for{" "}
          <span className="flex-chords-query">"{trimmedQuery}"</span>?
        </h4>
        <p className="flex-chords-body">
          Automatically transcribe and synchronize chords for any YouTube song
          using our companion AI tool.
        </p>
      </div>

      <div className="flex-chords-footer">
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="flex-chords-cta-btn"
        >
          <span>Find Chords on Flex Chords</span>
          <span className="flex-chords-arrow">→</span>
        </a>
      </div>
    </Styles.FlexChordsCard>
  );
};

export default FlexChordsBanner;
