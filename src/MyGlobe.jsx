import React, { useState, useEffect, useRef } from "react";
import Globe from "react-globe.gl";
import * as THREE from "three";

// Utilities & Data
import { calculateDistance, getCentroid } from "./utils";
import { initialPlaces } from "./data";
import { tours } from "./tours";
import "./MyGlobe.css";

// Refactored UI Components
import LoaderOverlay from "./components/LoaderOverlay";
import CountryInfoPanel from "./components/CountryInfoPanel";
import MeasurePanel from "./components/MeasurePanel";
import TourPanel from "./components/TourPanel";
import BrandingBadge from "./components/BrandingBadge";
import CreatorHQPanel from "./components/CreatorHQPanel";

// Assets
import earthBlueMarbleImg from "./assets/globe/earth-blue-marble.jpg";
import earthDayImg from "./assets/globe/earth-day.jpg";
import earthNightImg from "./assets/globe/earth-night.jpg";
import earthTopologyImg from "./assets/globe/earth-topology.png";
import moonTextureImg from "./assets/globe/moon-texture.jpg";

const MyGlobe = () => {
  const globeEl = useRef();

  // Core Data States
  const [countries, setCountries] = useState([]);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isGlobeReady, setIsGlobeReady] = useState(false);
  const [isImagesLoaded, setIsImagesLoaded] = useState(false);
  const [customGlobeMaterial, setCustomGlobeMaterial] = useState(null);

  const isLoading = !isDataLoaded || !isGlobeReady || !isImagesLoaded;

  // Control Panel States
  const [autoRotate, setAutoRotate] = useState(true);
  const [showCountries, setShowCountries] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sunlight, setSunlight] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [showMoon, setShowMoon] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(true);

  // Distance Measure Tool States
  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState([]);
  const [measureDistance, setMeasureDistance] = useState(null);

  // Slide-Out Info Panel States
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [countryInfo, setCountryInfo] = useState(null);

  const [countryEncyclopedia, setCountryEncyclopedia] = useState([]);
  const [places] = useState(initialPlaces);
  const [issLocation, setIssLocation] = useState(null);
  const [isHQOpen, setIsHQOpen] = useState(false);
  const poles = [
    { name: "N", lat: 90, lng: 0, isPole: true },
    { name: "S", lat: -90, lng: 0, isPole: true },
  ];
  // --- ADD CREATOR HQ (Coordinates set to Bengaluru) ---
  const creatorHQ = {
    name: "Shriyam's HQ",
    lat: 12.9716,
    lng: 77.5946,
    isHQ: true,
  };

  // Cinematic Tour States
  const [activeTour, setActiveTour] = useState(null);
  const [tourStep, setTourStep] = useState(0);

  // Fetch data and preload images on mount
  useEffect(() => {
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

    const imageUrls = tours
      .flatMap((tour) => tour.stops.map((stop) => stop.image))
      .filter(Boolean);

    const imagePromises = imageUrls.map((url) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = url;
        img.onload = resolve;
        img.onerror = resolve;
      });
    });

    Promise.all(imagePromises).then(() => {
      setIsImagesLoaded(true);
    });
  }, []);

  // Fetch ISS Data
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

  // Camera Controls
  useEffect(() => {
    if (globeEl.current && globeEl.current.controls()) {
      const controls = globeEl.current.controls();
      controls.autoRotate = autoRotate && !activeTour;
      controls.autoRotateSpeed = 0.5;
      controls.enableDamping = true;
    }
  }, [autoRotate, activeTour]);

  // Pre-build the custom globe material
  useEffect(() => {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("Anonymous");

    Promise.all([
      new Promise((res) => textureLoader.load(earthBlueMarbleImg, res)),
      new Promise((res) => textureLoader.load(earthDayImg, res)),
      new Promise((res) => textureLoader.load(earthNightImg, res)),
      new Promise((res) => textureLoader.load(earthTopologyImg, res)),
    ]).then(([blueMarbleTex, dayTex, nightTex, bumpTex]) => {
      const material = new THREE.MeshPhongMaterial({
        map: blueMarbleTex,
        bumpMap: bumpTex,
        bumpScale: 0.015,
        color: new THREE.Color(0xffffff),
        specular: new THREE.Color(0x333333),
        shininess: 15,
      });

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
      customGlobeMaterial.needsUpdate = true;
    }

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

  // 3D Moon & Orbit Animation
  useEffect(() => {
    if (!globeEl.current) return;

    const scene = globeEl.current.scene();
    let moonMesh;
    let animationFrameId;

    if (showMoon) {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.setCrossOrigin("Anonymous");

      const moonGeo = new THREE.SphereGeometry(27, 32, 32);
      const moonMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 1.0,
        metalness: 0.0,
      });

      moonMesh = new THREE.Mesh(moonGeo, moonMat);
      scene.add(moonMesh);

      textureLoader.load(moonTextureImg, (tex) => {
        moonMat.map = tex;
        moonMat.needsUpdate = true;
      });

      let angle = 0;
      const animateMoon = () => {
        angle += 0.002;
        const distance = 250;
        const inclination = 5.14 * (Math.PI / 180);

        moonMesh.position.x = Math.cos(angle) * distance;
        moonMesh.position.z =
          Math.sin(angle) * distance * Math.cos(inclination);
        moonMesh.position.y =
          Math.sin(angle) * distance * Math.sin(inclination);
        moonMesh.rotation.y = -angle + Math.PI / 2;

        animationFrameId = requestAnimationFrame(animateMoon);
      };

      animateMoon();
    }

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

  // Tour Camera Logic
  useEffect(() => {
    if (activeTour && globeEl.current) {
      const stop = activeTour.stops[tourStep];
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
    if (activeTour) return;

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
    endTour();
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
        <LoaderOverlay
          isDataLoaded={isDataLoaded}
          isGlobeReady={isGlobeReady}
          isImagesLoaded={isImagesLoaded}
        />
      )}

      <CountryInfoPanel
        isPanelOpen={isPanelOpen}
        setIsPanelOpen={setIsPanelOpen}
        countryInfo={countryInfo}
      />

      <CreatorHQPanel isHQOpen={isHQOpen} setIsHQOpen={setIsHQOpen} />
      <BrandingBadge
        setIsHQOpen={setIsHQOpen}
        setIsPanelOpen={setIsPanelOpen}
      />

      {measureMode && (
        <MeasurePanel
          measurePoints={measurePoints}
          measureDistance={measureDistance}
          setMeasurePoints={setMeasurePoints}
          setMeasureDistance={setMeasureDistance}
        />
      )}

      {activeTour && (
        <TourPanel
          activeTour={activeTour}
          tourStep={tourStep}
          endTour={endTour}
          prevTourStep={prevTourStep}
          nextTourStep={nextTourStep}
        />
      )}

      {/* Collapsible Control Panel */}
      <div
        className="control-panel"
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          background: "rgba(10, 10, 15, 0.6)",
          backdropFilter: "blur(10px)",
          padding: "15px",
          borderRadius: "12px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.5)",
          zIndex: 10,
          width: "220px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          onClick={() => setIsControlsOpen(!isControlsOpen)}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            borderBottom: isControlsOpen
              ? "1px solid rgba(255, 255, 255, 0.1)"
              : "none",
            paddingBottom: isControlsOpen ? "10px" : "0px",
            marginBottom: isControlsOpen ? "10px" : "0px",
            color: "white",
            fontWeight: "bold",
            userSelect: "none",
          }}
        >
          <span>⚙️ Controls</span>
          <span
            style={{
              transform: isControlsOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.3s ease",
            }}
          >
            ▼
          </span>
        </div>

        {isControlsOpen && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
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
                    {
                      lat: issLocation.lat,
                      lng: issLocation.lng,
                      altitude: 0.8,
                    },
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
        )}
      </div>

      {/* 3D Globe */}
      <Globe
        ref={globeEl}
        onGlobeReady={() => setIsGlobeReady(true)}
        globeMaterial={customGlobeMaterial}
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
        htmlElementsData={[
          ...places,
          ...poles,
          // creatorHQ,
          ...(issLocation ? [issLocation] : []),
          ...(activeTour
            ? activeTour.stops.map((stop) => ({ ...stop, isTourStop: true }))
            : []),
        ]}
        htmlAltitude={(d) => {
          if (d.isISS) return 0.15;
          if (d.isPole) return 0.02;
          // if (d.isHQ) return 0.01;
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
          } else if (d.isHQ) {
            el.innerHTML = `
                <div class="marker-dot" style="background-color: #ffaa00; box-shadow: 0 0 15px #ffaa00; transform: scale(1.5);"></div>
                <div class="marker-label" style="color: #ffaa00; font-weight: bold; text-shadow: 0 0 5px black;">${d.name}</div>
              `;
            el.style.pointerEvents = "auto";
            el.style.cursor = "pointer";
            el.onclick = () => {
              if (measureMode) {
                handleMapClick(d.lat, d.lng);
                return;
              }
              if (activeTour) endTour();
              setIsPanelOpen(false); // Close country panel if open
              setIsHQOpen(true); // Open HQ panel
              globeEl.current.pointOfView(
                { lat: d.lat, lng: d.lng, altitude: 0.5 },
                1000,
              );
            };
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
