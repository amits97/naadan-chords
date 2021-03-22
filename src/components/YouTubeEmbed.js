import React from "react";
import "./YouTubeEmbed.css";

const YouTubeEmbed = ({ youtubeId, onLoad }) => {
  return (
    <div className="YouTubeEmbed">
      <div className="video-wrapper"> 
				<div className="video-container">			
				  <iframe title={`video-${youtubeId}`} src={`https://www.youtube.com/embed/${youtubeId}`} frameBorder="0" allowFullScreen onLoad={onLoad}></iframe>			
				</div>
		  </div>
    </div>
  );
};

export default YouTubeEmbed;
