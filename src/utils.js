// Calculates the distance between two coordinates in kilometers (Haversine formula)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
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
  return Math.round(R * c);
};

// Finds the center coordinate of a GeoJSON country geometry
export const getCentroid = (geometry) => {
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
