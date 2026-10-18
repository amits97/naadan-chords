import React from "react";
import ReactGA from "react-ga4";
import * as Styles from "../containers/Styles";

const FlexChordsBanner = ({
  query,
  headline,
  body,
  buttonText,
  utmMedium,
}) => {
  const trimmedQuery = (query || "").trim();
  const effectiveUtmMedium =
    utmMedium || (trimmedQuery ? "empty_search_banner" : "request_page");

  const targetUrl = trimmedQuery
    ? `https://www.flexchords.com/search?q=${encodeURIComponent(
        trimmedQuery,
      )}&utm_source=naadanchords&utm_medium=${effectiveUtmMedium}&utm_campaign=soft_launch`
    : `https://www.flexchords.com/?utm_source=naadanchords&utm_medium=${effectiveUtmMedium}&utm_campaign=soft_launch`;

  const effectiveHeadline = headline || (
    trimmedQuery ? (
      <>
        Can't find chords for{" "}
        <span className="flex-chords-query">"{trimmedQuery}"</span>?
      </>
    ) : (
      "Want chords right away?"
    )
  );

  const effectiveBody =
    body ||
    "Generate chords for any YouTube song and play along in real-time.";

  const effectiveButtonText =
    buttonText ||
    (trimmedQuery ? "Find Chords on FlexChords" : "Try FlexChords");

  const handleClick = () => {
    // 1. Google tag (gtag.js) tracking
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "click_flexchords_banner", {
        search_query: trimmedQuery || effectiveUtmMedium,
        destination_url: targetUrl,
      });
    } else if (typeof gtag === "function") {
      gtag("event", "click_flexchords_banner", {
        search_query: trimmedQuery || effectiveUtmMedium,
        destination_url: targetUrl,
      });
    }

    // 2. ReactGA tracking (GA4)
    try {
      ReactGA.event({
        category: "FlexChords Banner",
        action: "click_flexchords_banner",
        label: trimmedQuery || effectiveUtmMedium,
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
            src="https://www.flexchords.com/logo.svg"
            alt="FlexChords"
            className="flex-chords-logo"
            width="32"
            height="32"
          />
          <div className="flex-chords-brand-info">
            <span className="flex-chords-brand-name">FlexChords</span>
            <span className="flex-chords-separator">·</span>
            <span className="flex-chords-brand-tagline">
              AI Chord Generator
            </span>
          </div>
        </div>
        <span className="flex-chords-badge">Companion Tool</span>
      </div>

      <div className="flex-chords-content">
        <h4 className="flex-chords-headline">{effectiveHeadline}</h4>
        <p className="flex-chords-body">{effectiveBody}</p>
      </div>

      <div className="flex-chords-footer">
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="flex-chords-cta-btn"
        >
          <span>{effectiveButtonText}</span>
          <span className="flex-chords-arrow">→</span>
        </a>
      </div>
    </Styles.FlexChordsCard>
  );
};

export default FlexChordsBanner;
