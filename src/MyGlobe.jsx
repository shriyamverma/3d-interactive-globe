import React, { useState, useEffect } from 'react';
import Globe from 'react-globe.gl';

const MyGlobe = () => {
  const [countries, setCountries] = useState({ features: [] });
  const [hoveredCountry, setHoveredCountry] = useState(null);

  useEffect(() => {
    // Fetch the GeoJSON data containing country boundaries
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(data => setCountries(data.features)); // We only need the 'features' array
  }, []);
  
  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, overflow: 'hidden' }}>
      <Globe
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        
        // Polygon (Country) Data
        polygonsData={countries}
        
        // Altitude: Hovered country raises up slightly in 3D
        polygonAltitude={d => d === hoveredCountry ? 0.06 : 0.01}
        
        // Color: Hovered country turns bright blue, others remain transparent dark
        polygonCapColor={d => d === hoveredCountry ? 'rgba(0, 150, 255, 0.6)' : 'rgba(0, 0, 0, 0.3)'}
        
        // The 3D side walls of the polygons
        polygonSideColor={() => 'rgba(0, 150, 255, 0.15)'}
        
        // The border lines between countries
        polygonStrokeColor={() => '#444444'}
        
        // Update state when mouse hovers over a country
        onPolygonHover={setHoveredCountry}
        
        // Smooth transition animation when hovering
        polygonsTransitionDuration={300}
      />
    </div>
  );
};

export default MyGlobe;