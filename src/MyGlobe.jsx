import React, { useState, useEffect, useRef } from "react";
import Globe from "react-globe.gl";

const MyGlobe = () => {
  const globeEl = useRef();

  const [countries, setCountries] = useState([]);
  const [hoveredCountry, setHoveredCountry] = useState(null);

  // States for our control panel
  const [autoRotate, setAutoRotate] = useState(true);
  const [showCountries, setShowCountries] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sunlight, setSunlight] = useState(false);

  // Distance Measure Tool ---
  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState([]);
  const [measureDistance, setMeasureDistance] = useState(null);

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
    if (globeEl.current && globeEl.current.controls()) {
      const controls = globeEl.current.controls();
      controls.autoRotate = autoRotate;
      controls.autoRotateSpeed = 0.5;
      controls.enableDamping = true;
    }
  }, [autoRotate]);

  // --- Solar Illumination (Stub from previous step) ---
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (globeEl.current) {
        const scene = globeEl.current.scene();
        const ambientLight = scene.children.find(
          (c) => c.type === "AmbientLight",
        );
        const directionalLight = scene.children.find(
          (c) => c.type === "DirectionalLight",
        );

        if (ambientLight && directionalLight) {
          if (sunlight) {
            ambientLight.intensity = 0.05;
            directionalLight.intensity = 2;
            const now = new Date();
            const utcHour = now.getUTCHours() + now.getUTCMinutes() / 60;
            const sunLng = 180 - utcHour * 15;
            const month = now.getUTCMonth();
            const sunLat = -23.5 * Math.cos(((month + 0.5) * Math.PI) / 6);
            const phi = (90 - sunLat) * (Math.PI / 180);
            const theta = (sunLng + 90) * (Math.PI / 180);
            const r = 200;
            directionalLight.position.set(
              r * Math.sin(phi) * Math.cos(theta),
              r * Math.cos(phi),
              r * Math.sin(phi) * Math.sin(theta),
            );
          } else {
            ambientLight.intensity = 0.8;
            directionalLight.intensity = 1;
            directionalLight.position.set(1, 1, 1);
          }
        }
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, [sunlight]);

  // Calculate distance (Haversine formula) ---
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c); // Distance in km
  };

  // Handle Map Clicks for measuring ---
  const handleMapClick = (lat, lng) => {
    if (!measureMode) return;

    if (measurePoints.length === 0 || measurePoints.length === 2) {
      // Start a new measurement
      setMeasurePoints([{ lat, lng }]);
      setMeasureDistance(null);
    } else if (measurePoints.length === 1) {
      // Complete the measurement
      const p1 = measurePoints[0];
      const p2 = { lat, lng };
      setMeasurePoints([p1, p2]);
      const dist = calculateDistance(p1.lat, p1.lng, p2.lat, p2.lng);
      setMeasureDistance(dist);
    }
  };

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

  // Updated to support Measure Mode
  const handlePolygonClick = (polygon, event, { lat, lng }) => {
    if (measureMode) {
      handleMapClick(lat, lng);
      return;
    }
    globeEl.current.pointOfView({ lat, lng, altitude: 0.8 }, 1000);
  };

  const handleReset = () => {
    setSearchQuery("");
    setMeasurePoints([]); // Reset distance points
    setMeasureDistance(null);
    globeEl.current.pointOfView({ altitude: 2.5 }, 1000);
  };

  const toggleMeasureMode = () => {
    setMeasureMode(!measureMode);
    setMeasurePoints([]);
    setMeasureDistance(null);
    if (!measureMode) {
      setAutoRotate(false); // Auto-pause rotation when trying to measure
    }
  };

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
      {/* --- UI Bottom Panel for Measure Tool --- */}
      {measureMode && (
        <div
          style={{
            position: "absolute",
            bottom: "30px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0,0,0,0.85)",
            color: "white",
            padding: "20px 30px",
            borderRadius: "12px",
            fontFamily: "sans-serif",
            zIndex: 10,
            textAlign: "center",
            border: "1px solid #ffcc00",
            boxShadow: "0 0 20px rgba(255, 204, 0, 0.3)",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0", color: "#ffcc00" }}>
            Measure Distance
          </h3>
          {measurePoints.length === 0 && (
            <p style={{ margin: 0 }}>
              Click anywhere on the globe to set <b>Point A</b>.
            </p>
          )}
          {measurePoints.length === 1 && (
            <p style={{ margin: 0 }}>
              Click another spot to set <b>Point B</b>.
            </p>
          )}
          {measurePoints.length === 2 && (
            <>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  margin: "10px 0",
                }}
              >
                {measureDistance.toLocaleString()} km
              </div>
              <button
                onClick={() => {
                  setMeasurePoints([]);
                  setMeasureDistance(null);
                }}
                style={{
                  ...panelElementStyle,
                  backgroundColor: "#333",
                  color: "white",
                  border: "1px solid #666",
                  padding: "5px 15px",
                }}
              >
                Reset Points
              </button>
            </>
          )}
        </div>
      )}

      {/* Top Right UI Control Panel */}
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
          onClick={() => setSunlight(!sunlight)}
          style={panelElementStyle}
        >
          {sunlight ? "Disable Sunlight" : "Enable Sunlight"}
        </button>

        {/* --- Measure Mode Toggle Button --- */}
        <button
          onClick={toggleMeasureMode}
          style={{
            ...panelElementStyle,
            backgroundColor: measureMode ? "#ffcc00" : "rgba(255,255,255,0.8)",
          }}
        >
          {measureMode ? "Stop Measuring" : "Measure Distance"}
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
        // --- Intercept direct globe clicks for measuring oceans ---
        onGlobeClick={({ lat, lng }) => {
          if (measureMode) handleMapClick(lat, lng);
        }}
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
            if (measureMode) {
              handleMapClick(d.lat, d.lng);
            } else {
              globeEl.current.pointOfView(
                { lat: d.lat, lng: d.lng, altitude: 0.5 },
                1000,
              );
            }
          };
          return el;
        }}
        // --- Rings at the click points ---
        ringsData={measurePoints}
        ringColor={() => "#ffcc00"}
        ringMaxRadius={3}
        ringPropagationSpeed={2}
        ringRepeatPeriod={800}
        // --- Glowing Arc between the two points ---
        arcsData={
          measurePoints.length === 2
            ? [
                {
                  startLat: measurePoints[0].lat,
                  startLng: measurePoints[0].lng,
                  endLat: measurePoints[1].lat,
                  endLng: measurePoints[1].lng,
                },
              ]
            : []
        }
        arcColor={() => "#ffcc00"}
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={1500}
        arcAltitude={0.2}
        arcStroke={1}
        showAtmosphere={true}
        atmosphereColor="lightskyblue"
        atmosphereAltitude={0.15}
      />
    </div>
  );
};

export default MyGlobe;
