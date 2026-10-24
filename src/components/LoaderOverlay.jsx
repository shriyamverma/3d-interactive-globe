import React from "react";

const LoaderOverlay = ({ isDataLoaded, isGlobeReady, isImagesLoaded }) => {
  return (
    <div className="loader-overlay">
      <div className="loader-spinner">🌍</div>
      <h2 className="loader-text">Initializing Earth...</h2>
      <div className="loader-status">
        <span style={{ color: isDataLoaded ? "#2ecc71" : "#ffcc00" }}>
          {isDataLoaded ? "✓ Data Loaded" : "Downloading Map Data..."}
        </span>
        <span style={{ color: isGlobeReady ? "#2ecc71" : "#ffcc00" }}>
          {isGlobeReady ? "✓ Textures Loaded" : "Rendering 3D Environment..."}
        </span>
        <span style={{ color: isImagesLoaded ? "#2ecc71" : "#ffcc00" }}>
          {isImagesLoaded ? "✓ Media Loaded" : "Caching Tour Images..."}
        </span>
      </div>
    </div>
  );
};

export default LoaderOverlay;
