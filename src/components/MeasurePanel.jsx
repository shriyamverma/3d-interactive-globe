import React from "react";

const MeasurePanel = ({
  measurePoints,
  measureDistance,
  setMeasurePoints,
  setMeasureDistance,
}) => {
  return (
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
  );
};

export default MeasurePanel;
