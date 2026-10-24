import React, { useState, useEffect, useRef } from "react";
import Globe from "react-globe.gl";
import * as THREE from "three";
import { calculateDistance, getCentroid } from "./utils";
import { initialPlaces } from "./data";
import { tours } from "./tours";
import "./MyGlobe.css";

import earthBlueMarbleImg from "./assets/globe/earth-blue-marble.jpg";
import earthDayImg from "./assets/globe/earth-day.jpg";
import earthNightImg from "./assets/globe/earth-night.jpg";
import earthTopologyImg from "./assets/globe/earth-topology.png";
import moonTextureImg from "./assets/globe/moon-texture.jpg";

const MyGlobe = () => {
  const globeEl = useRef();

  const [countries, setCountries] = useState([]);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isGlobeReady, setIsGlobeReady] = useState(false);
  const [isImagesLoaded, setIsImagesLoaded] = useState(false);
  const [customGlobeMaterial, setCustomGlobeMaterial] = useState(null);

  const isLoading = !isDataLoaded || !isGlobeReady || !isImagesLoaded;

  // States for our control panel
  const [autoRotate, setAutoRotate] = useState(true);
  const [showCountries, setShowCountries] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sunlight, setSunlight] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [showMoon, setShowMoon] = useState(false);

  // States for Distance Measure Tool
  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState([]);
  const [measureDistance, setMeasureDistance] = useState(null);

  // States for Slide-Out Info Panel
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [countryInfo, setCountryInfo] = useState(null);

  const [countryEncyclopedia, setCountryEncyclopedia] = useState([]);
  const [places] = useState(initialPlaces);
  const [issLocation, setIssLocation] = useState(null);
  const poles = [
    { name: "N", lat: 90, lng: 0, isPole: true },
    { name: "S", lat: -90, lng: 0, isPole: true },
  ];

  // --- Cinematic Tour States ---
  const [activeTour, setActiveTour] = useState(null);
  const [tourStep, setTourStep] = useState(0);

  // Fetch data and preload images on mount
  useEffect(() => {
    // 1. Fetch JSON Data
    Promise.all([
      fetch(
        "https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson",
      ).then((res) => res.json()),
      fetch(
        "https://raw.githubusercontent.com/mledoze/countries/master/countries.json",
      ).then((res) => res.json()),
    ]).then(([geoData, encyclopediaData]) => {
      setCountries(geoData.features);
      setCountryEncyclopedia(encyclopediaData);
      setIsDataLoaded(true);
    });

    // 2. Preload Tour Images in the background
    // Flatten the tours array to get a single array of all image URLs
    const imageUrls = tours
      .flatMap((tour) => tour.stops.map((stop) => stop.image))
      .filter(Boolean);

    const imagePromises = imageUrls.map((url) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = url;
        img.onload = resolve; // Resolves when downloaded
        img.onerror = resolve; // Resolves even if an image fails, so the app doesn't break
      });
    });

    Promise.all(imagePromises).then(() => {
      setIsImagesLoaded(true); // Images are fully cached!
    });
  }, []);

  useEffect(() => {
    const fetchISS = async () => {
      try {
        const res = await fetch(
          "https://api.wheretheiss.at/v1/satellites/25544",
        );
        const data = await res.json();
        setIssLocation({
          name: "International Space Station",
          lat: data.latitude,
          lng: data.longitude,
          isISS: true,
        });
      } catch (error) {
        console.warn("ISS Tracker temporarily unavailable.");
      }
    };

    fetchISS();
    const interval = setInterval(fetchISS, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (globeEl.current && globeEl.current.controls()) {
      const controls = globeEl.current.controls();
      // Disable auto-rotate when a tour is active
      controls.autoRotate = autoRotate && !activeTour;
      controls.autoRotateSpeed = 0.5;
      controls.enableDamping = true;
    }
  }, [autoRotate, activeTour]);

  // --- NEW: Pre-build the custom globe material ---
  useEffect(() => {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("Anonymous");

    // Download all textures in parallel
    Promise.all([
      new Promise((res) => textureLoader.load(earthBlueMarbleImg, res)),
      new Promise((res) => textureLoader.load(earthDayImg, res)),
      new Promise((res) => textureLoader.load(earthNightImg, res)),
      new Promise((res) => textureLoader.load(earthTopologyImg, res)),
    ]).then(([blueMarbleTex, dayTex, nightTex, bumpTex]) => {
      // Create a custom material with the Blue Marble as the default
      const material = new THREE.MeshPhongMaterial({
        map: blueMarbleTex,
        bumpMap: bumpTex,
        bumpScale: 0.015,
        // --- NEW: Restore standard colors and ocean reflections ---
        color: new THREE.Color(0xffffff),
        specular: new THREE.Color(0x333333), // Gives the oceans a subtle shine
        shininess: 15,
      });

      // Store the textures securely inside the material object so we can swap them instantly later
      material.userData = {
        blueMarble: blueMarbleTex,
        day: dayTex,
        night: nightTex,
      };

      setCustomGlobeMaterial(material);
    });
  }, []);

  // Solar Illumination & Glowing City Lights
  useEffect(() => {
    let interval;

    // 1. Instantly swap the textures on our custom material
    if (customGlobeMaterial) {
      if (sunlight) {
        customGlobeMaterial.map = customGlobeMaterial.userData.day;
        customGlobeMaterial.emissiveMap = customGlobeMaterial.userData.night;
        customGlobeMaterial.emissive = new THREE.Color(0xffffff);
        customGlobeMaterial.emissiveIntensity = 0.8;
      } else {
        customGlobeMaterial.map = customGlobeMaterial.userData.blueMarble;
        customGlobeMaterial.emissiveMap = null;
        customGlobeMaterial.emissiveIntensity = 0;
      }
      customGlobeMaterial.needsUpdate = true; // Tell WebGL to render the changes
    }

    // 2. Position the sun and adjust lighting
    const updateSunPosition = () => {
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
            ambientLight.intensity = 0.02;
            ambientLight.color.setHex(0x222233);
            directionalLight.intensity = 3;
            directionalLight.color.setHex(0xffffee);

            const now = new Date();
            const utcHour =
              now.getUTCHours() +
              now.getUTCMinutes() / 60 +
              now.getUTCSeconds() / 3600;

            const sunLng = 180 - utcHour * 15;
            const month = now.getUTCMonth();
            const sunLat = -23.5 * Math.cos(((month + 0.5) * Math.PI) / 6);

            const phi = (90 - sunLat) * (Math.PI / 180);
            const theta = (90 - sunLng) * (Math.PI / 180);
            const r = 200;

            directionalLight.position.set(
              r * Math.sin(phi) * Math.cos(theta),
              r * Math.cos(phi),
              r * Math.sin(phi) * Math.sin(theta),
            );
          } else {
            ambientLight.intensity = 0.8;
            ambientLight.color.setHex(0xffffff);
            directionalLight.intensity = 1;
            directionalLight.color.setHex(0xffffff);
            directionalLight.position.set(1, 1, 1);
          }
        }
      }
    };

    updateSunPosition();

    if (sunlight) {
      interval = setInterval(updateSunPosition, 60000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sunlight, customGlobeMaterial]);

  // --- NEW: 3D Moon & Orbit Animation ---
  useEffect(() => {
    if (!globeEl.current) return;

    const scene = globeEl.current.scene();
    let moonMesh;
    let animationFrameId;

    if (showMoon) {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.setCrossOrigin("Anonymous");

      // The Earth in react-globe has a radius of 100.
      // We set the Moon to radius 15 so it looks visually balanced.
      // 1. Scientifically accurate relative size (27% of Earth's radius)
      const moonGeo = new THREE.SphereGeometry(27, 32, 32);
      const moonMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 1.0, // The moon is very dusty, not shiny
        metalness: 0.0,
      });

      moonMesh = new THREE.Mesh(moonGeo, moonMat);
      scene.add(moonMesh);

      // Load a high-res texture from the official Three.js examples repository
      textureLoader.load(
        // "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg",
        moonTextureImg,
        (tex) => {
          moonMat.map = tex;
          moonMat.needsUpdate = true;
        },
      );

      // Animate the Moon's orbit
      let angle = 0;
      const animateMoon = () => {
        angle += 0.002; // Speed of the orbit

        // 2. Keep distance at 250 so it stays on screen
        const distance = 250;

        // 3. Accurate 5.14 degree orbital inclination
        const inclination = 5.14 * (Math.PI / 180);

        // Orbit math: radius of 220 units keeps it comfortably outside the Earth
        moonMesh.position.x = Math.cos(angle) * distance;

        // Apply the tilt to the Y and Z axes
        moonMesh.position.z =
          Math.sin(angle) * distance * Math.cos(inclination);
        moonMesh.position.y =
          Math.sin(angle) * distance * Math.sin(inclination);

        // Accurate tidally locked rotation (the same side always faces Earth)
        moonMesh.rotation.y = -angle + Math.PI / 2;

        animationFrameId = requestAnimationFrame(animateMoon);
      };

      animateMoon();
    }

    // Cleanup function when the moon is hidden or component unmounts
    return () => {
      if (moonMesh) {
        scene.remove(moonMesh);
        moonMesh.geometry.dispose();
        moonMesh.material.dispose();
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [showMoon]);

  // --- Tour Camera Logic ---
  useEffect(() => {
    if (activeTour && globeEl.current) {
      const stop = activeTour.stops[tourStep];
      // Fly the camera smoothly to the current tour stop (2500ms duration)
      globeEl.current.pointOfView(
        { lat: stop.lat, lng: stop.lng, altitude: 0.6 },
        2500,
      );
    }
  }, [activeTour, tourStep]);

  const handleMapClick = (lat, lng) => {
    if (!measureMode || activeTour) return;

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

  const showCountryInfo = (properties) => {
    if (activeTour) return; // Disable info panel during tours

    const countryName = properties.ADMIN || properties.NAME || "Unknown";
    setIsPanelOpen(true);

    const a2 = properties.ISO_A2 || properties.iso_a2;
    const isoCode = a2 && a2 !== "-99" ? a2 : null;

    const info = countryEncyclopedia.find(
      (c) =>
        (isoCode && c.cca2 === isoCode) ||
        c.name.common === countryName ||
        c.name.official === countryName,
    );

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

    // Cancel tour if searching
    if (activeTour) endTour();

    const country = countries.find((c) => c.properties.ADMIN === countryName);
    if (country) {
      const { lat, lng } = getCentroid(country.geometry);
      globeEl.current.pointOfView({ lat, lng, altitude: 0.8 }, 1000);
      showCountryInfo(country.properties);
    }
  };

  const handlePolygonClick = (polygon, event, { lat, lng }) => {
    if (activeTour) return;
    if (measureMode) {
      handleMapClick(lat, lng);
      return;
    }

    globeEl.current.pointOfView({ lat, lng, altitude: 0.8 }, 1000);
    showCountryInfo(polygon.properties);
  };

  // --- Tour Handlers ---
  const handleTourSelect = (e) => {
    const tourId = e.target.value;
    if (!tourId) {
      endTour();
      return;
    }

    const selected = tours.find((t) => t.id === tourId);
    if (selected) {
      setIsPanelOpen(false);
      setMeasureMode(false);
      setSearchQuery("");
      setActiveTour(selected);
      setTourStep(0);
    }
  };

  const nextTourStep = () => {
    if (tourStep < activeTour.stops.length - 1) {
      setTourStep((prev) => prev + 1);
    } else {
      endTour();
    }
  };

  const prevTourStep = () => {
    if (tourStep > 0) setTourStep((prev) => prev - 1);
  };

  const endTour = () => {
    setActiveTour(null);
    setTourStep(0);
    globeEl.current.pointOfView({ altitude: 2.5 }, 1500);
  };

  const handleReset = () => {
    setSearchQuery("");
    setMeasurePoints([]);
    setMeasureDistance(null);
    setIsPanelOpen(false);
    endTour(); // Clear tour on reset
    globeEl.current.pointOfView({ altitude: 2.5 }, 1000);
  };

  const toggleMeasureMode = () => {
    setMeasureMode(!measureMode);
    setMeasurePoints([]);
    setMeasureDistance(null);
    setIsPanelOpen(false);
    if (activeTour) endTour();
    if (!measureMode) setAutoRotate(false);
  };

  return (
    <div className="globe-container">
      {isLoading && (
        <div className="loader-overlay">
          <div className="loader-spinner">🌍</div>
          <h2 className="loader-text">Initializing Earth...</h2>
          <div className="loader-status">
            <span style={{ color: isDataLoaded ? "#2ecc71" : "#ffcc00" }}>
              {isDataLoaded ? "✓ Data Loaded" : "Downloading Map Data..."}
            </span>
            <span style={{ color: isGlobeReady ? "#2ecc71" : "#ffcc00" }}>
              {isGlobeReady
                ? "✓ Textures Loaded"
                : "Rendering 3D Environment..."}
            </span>
            <span style={{ color: isImagesLoaded ? "#2ecc71" : "#ffcc00" }}>
              {isImagesLoaded ? "✓ Media Loaded" : "Caching Tour Images..."}
            </span>
          </div>
        </div>
      )}

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

      {/* --- Guided Tour UI Panel --- */}
      {activeTour && (
        <div className="tour-panel">
          <div className="tour-header">
            <span>{activeTour.name}</span>
            <span>
              {tourStep + 1} / {activeTour.stops.length}
            </span>
          </div>

          {activeTour.stops[tourStep].image && (
            <div className="tour-image-container">
              <a
                href={activeTour.stops[tourStep].link}
                target="_blank"
                rel="noopener noreferrer"
                title="Read more on Wikipedia"
              >
                <img
                  src={activeTour.stops[tourStep].image}
                  alt={activeTour.stops[tourStep].name}
                  className="tour-image"
                />
                <div className="tour-image-hint">
                  <small>↗ Read on Wikipedia</small>
                </div>
              </a>
            </div>
          )}

          <h3>{activeTour.stops[tourStep].name}</h3>
          <p>{activeTour.stops[tourStep].description}</p>

          <div className="tour-controls">
            <button className="tour-btn" onClick={endTour}>
              Exit Tour
            </button>
            <button
              className="tour-btn"
              onClick={prevTourStep}
              disabled={tourStep === 0}
            >
              Previous
            </button>
            <button
              className="tour-btn tour-btn-primary"
              onClick={nextTourStep}
            >
              {tourStep === activeTour.stops.length - 1
                ? "Finish"
                : "Next Stop"}
            </button>
          </div>
        </div>
      )}

      {/* Control Panel */}
      <div className="control-panel">
        <select
          value={searchQuery}
          onChange={handleSearch}
          className="panel-element"
          disabled={activeTour}
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

        {/* --- Tour Dropdown --- */}
        <select
          value={activeTour ? activeTour.id : ""}
          onChange={handleTourSelect}
          className="panel-element"
          style={{ color: activeTour ? "#ad8c00" : "inherit" }}
        >
          <option value=""> 🎬 Guided Tours... </option>
          {tours.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className="panel-element"
          disabled={activeTour}
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
          onClick={() => setShowLabels(!showLabels)}
          className="panel-element"
        >
          {showLabels ? "Hide Country Names" : "Show Country Names"}
        </button>
        <button
          onClick={() => setSunlight(!sunlight)}
          className="panel-element"
        >
          {sunlight ? "Disable Sunlight" : "Enable Sunlight"}
        </button>
        <button
          onClick={() => setShowMoon(!showMoon)}
          className="panel-element"
        >
          {showMoon ? "Hide Moon" : "Show Moon"}
        </button>
        <button
          onClick={toggleMeasureMode}
          className={`panel-element ${measureMode ? "active-measure" : ""}`}
          disabled={activeTour}
        >
          {measureMode ? "Stop Measuring" : "Measure Distance"}
        </button>

        <button
          onClick={() => {
            if (issLocation) {
              if (activeTour) endTour();
              globeEl.current.pointOfView(
                { lat: issLocation.lat, lng: issLocation.lng, altitude: 0.8 },
                1000,
              );
            }
          }}
          className="panel-element"
          disabled={!issLocation}
          style={{ fontWeight: "bold" }}
        >
          🛰️ Live ISS satellite
        </button>

        <button onClick={handleReset} className="panel-element btn-reset">
          Reset View
        </button>
      </div>

      {/* 3D Globe */}
      <Globe
        ref={globeEl}
        onGlobeReady={() => setIsGlobeReady(true)}
        globeMaterial={customGlobeMaterial}
        // globeImageUrl={
        //   sunlight
        //     ? "https://unpkg.com/three-globe/example/img/earth-day.jpg"
        //     : "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        // }
        // bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
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
        labelsData={showLabels ? countries : []}
        labelLat={(d) => getCentroid(d.geometry).lat}
        labelLng={(d) => getCentroid(d.geometry).lng}
        labelText={(d) => d.properties.ADMIN}
        labelSize={1.2}
        labelDotRadius={0.3}
        labelColor={() => "rgb(231, 244, 207)"}
        labelResolution={2}
        labelAltitude={0.02}
        onPolygonClick={handlePolygonClick}
        // --- Combine cities, ISS, AND active tour stops ---
        htmlElementsData={[
          ...places,
          ...poles,
          ...(issLocation ? [issLocation] : []),
          ...(activeTour
            ? activeTour.stops.map((stop) => ({ ...stop, isTourStop: true }))
            : []),
        ]}
        htmlAltitude={(d) => {
          if (d.isISS) return 0.15;
          if (d.isPole) return 0.02;
          return 0;
        }}
        htmlElement={(d) => {
          const el = document.createElement("div");

          if (d.isISS) {
            el.innerHTML = `<div style="font-size: 26px; filter: drop-shadow(0px 0px 5px #00ffff); cursor: pointer;">🛰️</div>`;
            el.style.pointerEvents = "auto";
            el.onclick = () => {
              if (activeTour) endTour();
              globeEl.current.pointOfView(
                { lat: d.lat, lng: d.lng, altitude: 0.8 },
                1000,
              );
            };
          } else if (d.isPole) {
            el.innerHTML = `<div style="
              font-size: 28px; 
              font-weight: bold; 
              color: rgba(255, 255, 255, 0.6); 
              text-shadow: 0 0 15px #00ffff;
              pointer-events: none;
              user-select: none;
            ">${d.name}</div>`;
          } else if (d.isTourStop) {
            const isActive = activeTour.stops[tourStep].name === d.name;
            el.innerHTML = `
              <div class="marker-dot" style="background-color: ${isActive ? "#2ecc71" : "#ffcc00"}; box-shadow: 0 0 15px ${isActive ? "#2ecc71" : "#ffcc00"}; transform: scale(${isActive ? 1.5 : 1});"></div>
              <div class="marker-label" style="color: ${isActive ? "#2ecc71" : "white"}; font-weight: ${isActive ? "bold" : "normal"}; text-shadow: 0 0 5px black;">${d.name}</div>
            `;
          } else {
            el.innerHTML = `<div class="marker-dot"></div><div class="marker-label">${d.name}</div>`;
            el.style.pointerEvents = "auto";
            el.style.cursor = "pointer";
            el.onclick = () => {
              if (measureMode) {
                handleMapClick(d.lat, d.lng);
              } else {
                if (activeTour) endTour();
                globeEl.current.pointOfView(
                  { lat: d.lat, lng: d.lng, altitude: 0.5 },
                  1000,
                );
              }
            };
          }
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
