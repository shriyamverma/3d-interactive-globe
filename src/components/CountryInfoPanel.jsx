import React from "react";

const CountryInfoPanel = ({ isPanelOpen, setIsPanelOpen, countryInfo }) => {
  return (
    <div className={`info-panel ${isPanelOpen ? "open" : ""}`}>
      <button
        className="info-panel-close"
        onClick={() => setIsPanelOpen(false)}
      >
        ×
      </button>
      {countryInfo && (
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
              - {countryInfo.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CountryInfoPanel;
