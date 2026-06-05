import React, { useState, useEffect } from "react";
import "./YouTubeEmbed.css";

const YouTubeEmbed = ({ youtubeId, onLoad }) => {
  const [isVertical, setIsVertical] = useState(false);

  useEffect(() => {
    if (!youtubeId) return;

    setIsVertical(false);

    const checkVideoAspect = async () => {
      try {
        const response = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/shorts/${youtubeId}&format=json`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.width && data.height && data.height > data.width) {
            setIsVertical(true);
          }
        }
      } catch (error) {
        console.error("Error fetching oEmbed metadata:", error);
      }
    };

    checkVideoAspect();
  }, [youtubeId]);

  return (
    <div className={`YouTubeEmbed${isVertical ? " is-vertical" : ""}`}>
      <iframe
        title={`video-${youtubeId}`}
        src={`https://www.youtube.com/embed/${youtubeId}`}
        frameBorder="0"
        allowFullScreen
        onLoad={onLoad}
      ></iframe>
    </div>
  );
};

export default YouTubeEmbed;
