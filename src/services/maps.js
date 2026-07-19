import L from 'leaflet';

export function initMap(containerId, lat, lng, zoom = 15) {
  try {
    const map = L.map(containerId).setView([lat, lng], zoom);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    return map;
  } catch (error) {
    console.error('Error initializing map:', error);
    return null;
  }
}

export function addStadiumMarker(map, lat, lng, label) {
  if (!map) return null;
  const marker = L.marker([lat, lng]).addTo(map);
  if (label) {
    marker.bindPopup(label);
  }
  return marker;
}

export function addGateMarkers(map, gates, stadiumLat, stadiumLng) {
  if (!map || !Array.isArray(gates)) return [];
  
  const markers = [];
  
  gates.forEach(gate => {
    let lat = stadiumLat;
    let lng = stadiumLng;
    
    const gateId = (gate.id || '').toLowerCase();
    
    if (gateId.includes('north')) {
      lat += 0.002;
    } else if (gateId.includes('south')) {
      lat -= 0.002;
    } else if (gateId.includes('east')) {
      lng += 0.003;
    } else if (gateId.includes('west')) {
      lng -= 0.003;
    } else {
      lat += 0.001;
      lng += 0.001;
    }
    
    const marker = L.marker([lat, lng]).addTo(map);
    const popupContent = `<strong>${gate.label || 'Gate'}</strong><br/>${gate.description || ''}`;
    marker.bindPopup(popupContent);
    
    markers.push(marker);
  });
  
  return markers;
}

export function clearMarkers(markers) {
  if (Array.isArray(markers)) {
    markers.forEach(marker => {
      if (marker && typeof marker.remove === 'function') {
        marker.remove();
      }
    });
  }
}

export function getDirectionsURL(fromLat, fromLng, toLat, toLng) {
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${fromLat},${fromLng};${toLat},${toLng}`;
}

export function getBoundingBox(lat, lng, radiusKm = 1) {
  const kmPerDegreeLat = 111;
  const offsetLat = radiusKm / kmPerDegreeLat;
  
  const latInRadians = (lat * Math.PI) / 180;
  const kmPerDegreeLng = 111 * Math.cos(latInRadians);
  const offsetLng = radiusKm / kmPerDegreeLng;
  
  return {
    north: lat + offsetLat,
    south: lat - offsetLat,
    east: lng + offsetLng,
    west: lng - offsetLng
  };
}
