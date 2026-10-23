import React, { useState, useEffect, useRef } from "react";
import Globe from "react-globe.gl";

const MyGlobe = () => {
  const globeEl = useRef();

  // FIX: Initialized as an empty array instead of an object
  const [countries, setCountries] = useState([]);
  const [hoveredCountry, setHoveredCountry] = useState(null);

  // States for our control panel
  const [autoRotate, setAutoRotate] = useState(true);
  const [showCountries, setShowCountries] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [places, setPlaces] = useState([
    { name: "New York", lat: 40.7128, lng: -74.006 },
    { name: "London", lat: 51.5074, lng: -0.1278 },
    { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
    { name: "Sydney", lat: -33.8688, lng: 151.2093 },
  ]);

  // Fetch data on mount
  useEffect(() => {
    fetch(
      "https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson",
    )
      .then((res) => res.json())
      .then((data) => setCountries(data.features));
  }, []);

  // Effect to handle auto-rotation toggle
  useEffect(() => {
    // Adding a small safety check to ensure the globe controls exist before tweaking them
    if (globeEl.current && globeEl.current.controls()) {
      const controls = globeEl.current.controls();
      controls.autoRotate = autoRotate;
      controls.autoRotateSpeed = 0.5;
      controls.enableDamping = true;
    }
  }, [autoRotate]);

  // Helper to find the center of a country to zoom to
  const getCentroid = (geometry) => {
    let flatCoords = [];
    const flatten = (arr) => {
      if (typeof arr[0] === "number") {
        flatCoords.push(arr);
        return;
      }
      arr.forEach(flatten);
    };
    flatten(geometry.coordinates);
    let minLng = Math.min(...flatCoords.map((c) => c[0]));
    let maxLng = Math.max(...flatCoords.map((c) => c[0]));
    let minLat = Math.min(...flatCoords.map((c) => c[1]));
    let maxLat = Math.max(...flatCoords.map((c) => c[1]));
    return { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 };
  };

  // Search Handler
  const handleSearch = (e) => {
    const countryName = e.target.value;
    setSearchQuery(countryName);
    if (!countryName) return;

    const country = countries.find((c) => c.properties.ADMIN === countryName);
    if (country) {
      const { lat, lng } = getCentroid(country.geometry);
      globeEl.current.pointOfView({ lat, lng, altitude: 0.8 }, 1000);
    }
  };

  const handlePolygonClick = (polygon, event, { lat, lng }) => {
    globeEl.current.pointOfView({ lat, lng, altitude: 0.8 }, 1000);
  };

  const handleReset = () => {
    setSearchQuery(""); // Reset search dropdown
    globeEl.current.pointOfView({ altitude: 2.5 }, 1000);
  };

  // Shared styles for our control panel buttons
  const panelElementStyle = {
    padding: "10px 15px",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    color: "#333",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    fontFamily: "sans-serif",
    backdropFilter: "blur(4px)",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    outline: "none",
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        margin: 0,
        overflow: "hidden",
        position: "relative",
        background: "black",
      }}
    >
      {/* UI Control Panel */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          width: "200px",
        }}
      >
        <select
          value={searchQuery}
          onChange={handleSearch}
          style={panelElementStyle}
        >
          <option value="">Search Country...</option>
          {[...countries]
            .sort((a, b) =>
              a.properties.ADMIN.localeCompare(b.properties.ADMIN),
            )
            .map((c) => (
              <option key={c.properties.ADMIN} value={c.properties.ADMIN}>
                {c.properties.ADMIN}
              </option>
            ))}
        </select>

        <button
          onClick={() => setAutoRotate(!autoRotate)}
          style={panelElementStyle}
        >
          {autoRotate ? "Pause Rotation" : "Start Rotation"}
        </button>

        <button
          onClick={() => setShowCountries(!showCountries)}
          style={panelElementStyle}
        >
          {showCountries ? "Hide Borders" : "Show Borders"}
        </button>

        <button
          onClick={handleReset}
          style={{
            ...panelElementStyle,
            backgroundColor: "rgba(0, 150, 255, 0.8)",
            color: "white",
            border: "none",
          }}
        >
          Reset View
        </button>
      </div>

      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        polygonsData={showCountries ? countries : []}
        polygonAltitude={(d) => (d === hoveredCountry ? 0.06 : 0.01)}
        polygonCapColor={(d) =>
          d === hoveredCountry
            ? "rgba(255, 255, 255, 0.5)"
            : "rgba(255, 255, 255, 0.1)"
        }
        polygonSideColor={() => "rgba(255, 255, 255, 0.2)"}
        polygonStrokeColor={() => "#dddddd"}
        onPolygonHover={setHoveredCountry}
        polygonsTransitionDuration={300}
        polygonLabel={({ properties: d }) => `
          <div style="background: rgba(0, 0, 0, 0.8); padding: 12px; border-radius: 6px; color: white; font-family: sans-serif;">
            <b style="font-size: 16px;">${d.ADMIN}</b> <br />
            Population: ${(d.POP_EST / 1e6).toFixed(1)}M
          </div>
        `}
        onPolygonClick={handlePolygonClick}
        htmlElementsData={places}
        htmlElement={(d) => {
          const el = document.createElement("div");
          el.innerHTML = `
            <div style="width: 14px; height: 14px; background-color: #ff3366; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px #ff3366;"></div>
            <div style="color: white; font-weight: bold; font-family: sans-serif; font-size: 14px; margin-top: 4px; text-align: center; transform: translateX(-30%); text-shadow: 1px 1px 2px black;">${d.name}</div>
          `;
          el.style.pointerEvents = "auto";
          el.style.cursor = "pointer";
          el.onclick = () => {
            globeEl.current.pointOfView(
              { lat: d.lat, lng: d.lng, altitude: 0.5 },
              1000,
            );
          };
          return el;
        }}
        showAtmosphere={true}
        atmosphereColor="lightskyblue"
        atmosphereAltitude={0.15}
      />
    </div>
  );
};

export default MyGlobe;
