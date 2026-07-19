import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

import { initMap, addStadiumMarker, addGateMarkers, getDirectionsURL } from '../services/maps';

// Fix Leaflet marker icon issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl
});

export default function MapView({ stadium }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!stadium || !mapContainerRef.current) return;

    // Initialize map
    const map = initMap(mapContainerRef.current, stadium.lat, stadium.lng);
    if (!map) return;
    mapInstanceRef.current = map;

    // Add markers
    addStadiumMarker(map, stadium.lat, stadium.lng, stadium.name);
    addGateMarkers(map, stadium.gates, stadium.lat, stadium.lng);

    // Cleanup on unmount / stadium change
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [stadium]);

  const directionsUrl = stadium
    ? getDirectionsURL(40.7580, -73.9855, stadium.lat, stadium.lng)
    : '#';

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-3">
      <h3 className="text-lg font-bold text-gray-800">Stadium Location Map</h3>
      <div 
        ref={mapContainerRef} 
        style={{ height: '350px' }} 
        className="w-full rounded-md border border-gray-300 z-0"
      ></div>
      {stadium && (
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Coordinates: {stadium.lat.toFixed(4)}, {stadium.lng.toFixed(4)}</span>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 font-semibold hover:underline flex items-center"
          >
            Get Directions (OpenStreetMap) ↗
          </a>
        </div>
      )}
    </div>
  );
}
