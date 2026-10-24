import React from "react";

const LoaderOverlay = ({ isDataLoaded, isGlobeReady, isImagesLoaded }) => {
  return (
    <div className="loader-overlay">
      <div className="loader-spinner">🌍</div>
      <h2 className="loader-text" style={{ marginBottom: "5px" }}>
        Interactive Earth
      </h2>
      <p
        style={{
          color: "#00ffff",
          letterSpacing: "3px",
          margin: "0 0 20px 0",
          fontSize: "12px",
          textTransform: "uppercase",
        }}
      >
        Engineered by Shriyam Verma
      </p>
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
