import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const Map = () => {
  useEffect(() => {
    // Initialize the map with a default view
    const defaultCoords: [number, number] = [28.272885, 77.068236];
    const map = L.map('map').setView(defaultCoords, 13);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Add a marker for the user's location
    const userMarker = L.marker(defaultCoords, {
      icon: L.divIcon({
        className: '',
        html: '<div style="font-size: 30px; color: #3182ce;"><svg viewBox="0 0 24 24" fill="currentColor" width="30" height="30"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      }),
    }).addTo(map).bindPopup('<b>Detected Location</b>');

    // Detect real location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.setView([latitude, longitude], 16);
          userMarker.setLatLng([latitude, longitude]);
          userMarker.setPopupContent(`<b>Your Real Location</b><br>Lat: ${latitude.toFixed(6)}<br>Lon: ${longitude.toFixed(6)}`);
        },
        (error) => {
          console.error('Error detecting location for dashboard:', error);
        }
      );
    }

    return () => {
      map.remove();
    };
  }, []);

  return <div id="map" className="h-full w-full rounded-2xl" />;
};

export default Map;
