import React from "react";

const TourPanel = ({
  activeTour,
  tourStep,
  endTour,
  prevTourStep,
  nextTourStep,
}) => {
  const stop = activeTour.stops[tourStep];

  return (
    <div className="tour-panel">
      <div className="tour-header">
        <span>{activeTour.name}</span>
        <span>
          {tourStep + 1} / {activeTour.stops.length}
        </span>
      </div>

      {stop.image && (
        <div className="tour-image-container">
          <a
            href={stop.link}
            target="_blank"
            rel="noopener noreferrer"
            title="Read more on Wikipedia"
          >
            <img src={stop.image} alt={stop.name} className="tour-image" />
            <div className="tour-image-hint">
              <small>↗ Read on Wikipedia</small>
            </div>
          </a>
        </div>
      )}

      <h3>{stop.name}</h3>
      <p>{stop.description}</p>

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
        <button className="tour-btn tour-btn-primary" onClick={nextTourStep}>
          {tourStep === activeTour.stops.length - 1 ? "Finish" : "Next Stop"}
        </button>
      </div>
    </div>
  );
};

export default TourPanel;
