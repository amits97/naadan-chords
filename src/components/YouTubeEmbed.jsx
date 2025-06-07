import React from "react";
import "./YouTubeEmbed.css";

const YouTubeEmbed = ({ youtubeId, onLoad }) => {
  return (
    <div className="YouTubeEmbed">
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
