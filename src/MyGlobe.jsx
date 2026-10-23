import React, { useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';

const MyGlobe = () => {
  const globeEl = useRef();
  const [countries, setCountries] = useState({ features: [] });
  const [hoveredCountry, setHoveredCountry] = useState(null);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(data => setCountries(data.features));
  }, []);

  const handlePolygonClick = (polygon, event, { lat, lng }) => {
    globeEl.current.pointOfView({ lat, lng, altitude: 0.8 }, 1000);
  };

  // 1. The Reset Function
  const handleReset = () => {
    // Return camera to default coordinates and altitude over 1000ms
    globeEl.current.pointOfView({ lat: 0, lng: 0, altitude: 2.5 }, 1000);
  };

  return (
    // 2. Added position: 'relative' to the wrapper
    <div style={{ width: '100vw', height: '100vh', margin: 0, overflow: 'hidden', position: 'relative' }}>
      
      {/* 3. The Overlaid UI Button */}
      <button 
        onClick={handleReset}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 10, // Ensures it stays on top of the globe canvas
          padding: '10px 20px',
          backgroundColor: 'rgba(0, 150, 255, 0.8)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontFamily: 'sans-serif',
          backdropFilter: 'blur(4px)' // Optional: gives a nice glass effect
        }}
      >
        Reset View
      </button>

      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        polygonsData={countries}
        polygonAltitude={d => d === hoveredCountry ? 0.06 : 0.01}
        polygonCapColor={d => d === hoveredCountry ? 'rgba(0, 150, 255, 0.6)' : 'rgba(0, 0, 0, 0.3)'}
        polygonSideColor={() => 'rgba(0, 150, 255, 0.15)'}
        polygonStrokeColor={() => '#444444'}
        onPolygonHover={setHoveredCountry}
        polygonsTransitionDuration={300}
        polygonLabel={({ properties: d }) => `
          <div style="background: rgba(0, 0, 0, 0.8); padding: 12px; border-radius: 6px; color: white; font-family: sans-serif;">
            <b style="font-size: 16px;">${d.ADMIN}</b> <br />
            Population: ${(d.POP_EST / 1e6).toFixed(1)}M
          </div>
        `}
        onPolygonClick={handlePolygonClick}
      />
    </div>
  );
};

export default MyGlobe;