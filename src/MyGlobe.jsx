import React, { useState, useEffect, useRef } from "react";
import Globe from "react-globe.gl";
import { calculateDistance, getCentroid } from "./utils";
import { initialPlaces } from "./data";
import "./MyGlobe.css";

const MyGlobe = () => {
  const globeEl = useRef();

  const [countries, setCountries] = useState([]);
  const [hoveredCountry, setHoveredCountry] = useState(null);

  // States for our control panel
  const [autoRotate, setAutoRotate] = useState(true);
  const [showCountries, setShowCountries] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sunlight, setSunlight] = useState(false);

  // States for Distance Measure Tool
  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState([]);
  const [measureDistance, setMeasureDistance] = useState(null);

  // States for Slide-Out Info Panel
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [countryInfo, setCountryInfo] = useState(null);

  // --- NEW: Store the open-source encyclopedia data locally ---
  const [countryEncyclopedia, setCountryEncyclopedia] = useState([]);

  const [places] = useState(initialPlaces);

  // Fetch data on mount
  useEffect(() => {
    // 1. Fetch Globe Borders
    fetch(
      "https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson",
    )
      .then((res) => res.json())
      .then((data) => setCountries(data.features));

    // 2. Fetch Open-Source Country Encyclopedia (mledoze/countries)
    fetch(
      "https://raw.githubusercontent.com/mledoze/countries/master/countries.json",
    )
      .then((res) => res.json())
      .then((data) => setCountryEncyclopedia(data));
  }, []);

  // Auto-rotation toggle
  useEffect(() => {
    if (globeEl.current && globeEl.current.controls()) {
      const controls = globeEl.current.controls();
      controls.autoRotate = autoRotate;
      controls.autoRotateSpeed = 0.5;
      controls.enableDamping = true;
    }
  }, [autoRotate]);

  // Solar Illumination
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

  // Handle Map Clicks for measuring
  const handleMapClick = (lat, lng) => {
    if (!measureMode) return;

    if (measurePoints.length === 0 || measurePoints.length === 2) {
      setMeasurePoints([{ lat, lng }]);
      setMeasureDistance(null);
    } else if (measurePoints.length === 1) {
      const p1 = measurePoints[0];
      const p2 = { lat, lng };
      setMeasurePoints([p1, p2]);
      const dist = calculateDistance(p1.lat, p1.lng, p2.lat, p2.lng);
      setMeasureDistance(dist);
    }
  };

  // --- NEW: INSTANT LOCAL DATA FETCHER ---
  const showCountryInfo = (properties) => {
    const countryName = properties.ADMIN || properties.NAME || "Unknown";
    setIsPanelOpen(true);

    const a2 = properties.ISO_A2 || properties.iso_a2;
    const isoCode = a2 && a2 !== "-99" ? a2 : null;

    // Instantly search our locally downloaded encyclopedia
    const info = countryEncyclopedia.find(
      (c) =>
        (isoCode && c.cca2 === isoCode) ||
        c.name.common === countryName ||
        c.name.official === countryName,
    );

    // Free open-source flag CDN
    const flagUrl = isoCode
      ? `https://flagcdn.com/${isoCode.toLowerCase()}.svg`
      : null;

    if (info) {
      setCountryInfo({
        name: countryName,
        flag: flagUrl,
        capital:
          info.capital && info.capital.length > 0 ? info.capital[0] : "N/A",
        population: properties.POP_EST
          ? properties.POP_EST.toLocaleString()
          : "N/A",
        region: info.region || "N/A",
        currencies: info.currencies
          ? Object.values(info.currencies)
              .map((c) => c.name)
              .join(", ")
          : "N/A",
        languages: info.languages
          ? Object.values(info.languages).join(", ")
          : "N/A",
      });
    } else {
      // Fallback for tiny islands/territories missing from the encyclopedia
      setCountryInfo({
        name: countryName,
        flag: flagUrl,
        capital: "N/A",
        region: properties.CONTINENT || "N/A",
        population: properties.POP_EST
          ? properties.POP_EST.toLocaleString()
          : "N/A",
        currencies: "N/A",
        languages: "N/A",
        error: "Detailed encyclopedia data missing for this specific border.",
      });
    }
  };

  const handleSearch = (e) => {
    const countryName = e.target.value;
    setSearchQuery(countryName);
    if (!countryName) {
      setIsPanelOpen(false);
      return;
    }

    const country = countries.find((c) => c.properties.ADMIN === countryName);
    if (country) {
      const { lat, lng } = getCentroid(country.geometry);
      globeEl.current.pointOfView({ lat, lng, altitude: 0.8 }, 1000);

      showCountryInfo(country.properties);
    }
  };

  const handlePolygonClick = (polygon, event, { lat, lng }) => {
    if (measureMode) {
      handleMapClick(lat, lng);
      return;
    }

    globeEl.current.pointOfView({ lat, lng, altitude: 0.8 }, 1000);
    showCountryInfo(polygon.properties);
  };

  const handleReset = () => {
    setSearchQuery("");
    setMeasurePoints([]);
    setMeasureDistance(null);
    setIsPanelOpen(false);
    globeEl.current.pointOfView({ altitude: 2.5 }, 1000);
  };

  const toggleMeasureMode = () => {
    setMeasureMode(!measureMode);
    setMeasurePoints([]);
    setMeasureDistance(null);
    setIsPanelOpen(false);
    if (!measureMode) setAutoRotate(false);
  };

  return (
    <div className="globe-container">
      {/* Slide-Out Info Panel */}
      <div className={`info-panel ${isPanelOpen ? "open" : ""}`}>
        <button
          className="info-panel-close"
          onClick={() => setIsPanelOpen(false)}
        >
          ×
        </button>

        {countryInfo ? (
          <div style={{ marginTop: "30px" }}>
            {countryInfo.flag && (
              <img
                src={countryInfo.flag}
                alt={`${countryInfo.name} flag`}
                className="flag"
              />
            )}
            <h2 style={{ marginTop: 0, marginBottom: "20px" }}>
              {countryInfo.name}
            </h2>

            <div className="info-item">
              <label>Capital</label>
              <div>{countryInfo.capital}</div>
            </div>

            <div className="info-item">
              <label>Region</label>
              <div>{countryInfo.region}</div>
            </div>

            <div className="info-item">
              <label>Population</label>
              <div>{countryInfo.population}</div>
            </div>

            <div className="info-item">
              <label>Currencies</label>
              <div>{countryInfo.currencies}</div>
            </div>

            <div className="info-item">
              <label>Languages</label>
              <div>{countryInfo.languages}</div>
            </div>

            {countryInfo.error && (
              <div
                style={{
                  color: "coral",
                  marginTop: "20px",
                  fontSize: "12px",
                  fontStyle: "italic",
                }}
              >
                * {countryInfo.error}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Measure UI Panel */}
      {measureMode && (
        <div className="measure-panel">
          <h3 className="measure-title">Measure Distance</h3>
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
              <div className="measure-value">
                {measureDistance.toLocaleString()} km
              </div>
              <button
                className="panel-element btn-measure-reset"
                onClick={() => {
                  setMeasurePoints([]);
                  setMeasureDistance(null);
                }}
              >
                Reset Points
              </button>
            </>
          )}
        </div>
      )}

      {/* Control Panel */}
      <div className="control-panel">
        <select
          value={searchQuery}
          onChange={handleSearch}
          className="panel-element"
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
          className="panel-element"
        >
          {autoRotate ? "Pause Rotation" : "Start Rotation"}
        </button>
        <button
          onClick={() => setShowCountries(!showCountries)}
          className="panel-element"
        >
          {showCountries ? "Hide Borders" : "Show Borders"}
        </button>
        <button
          onClick={() => setSunlight(!sunlight)}
          className="panel-element"
        >
          {sunlight ? "Disable Sunlight" : "Enable Sunlight"}
        </button>
        <button
          onClick={toggleMeasureMode}
          className={`panel-element ${measureMode ? "active-measure" : ""}`}
        >
          {measureMode ? "Stop Measuring" : "Measure Distance"}
        </button>
        <button onClick={handleReset} className="panel-element btn-reset">
          Reset View
        </button>
      </div>

      {/* 3D Globe */}
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
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
        onPolygonClick={handlePolygonClick}
        htmlElementsData={places}
        htmlElement={(d) => {
          const el = document.createElement("div");
          el.innerHTML = `
            <div class="marker-dot"></div>
            <div class="marker-label">${d.name}</div>
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
        ringsData={measurePoints}
        ringColor={() => "#ffcc00"}
        ringMaxRadius={3}
        ringPropagationSpeed={2}
        ringRepeatPeriod={800}
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
