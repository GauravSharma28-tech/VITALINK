import L from 'leaflet';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { CattleData } from '../Interface';
import { axiosPrivate } from '../../services/Axios';

interface CattleDataProps {
  cattleData: CattleData[];
  highlightedCattleId?: string | null;
}

interface geoFenceInterface {
  latitude: number;
  longitude: number;
  radius: number;
  zoneType: string;
  zoneName: string;
}

// Fix default marker icons (Leaflet issue with Webpack)
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom icons for different statuses
const createStatusIcon = (status: string) => {
  let color = 'gray';
  if (status === 'SAFE') {
    color = 'green';
  } else if (status === 'WARNING') {
    color = 'yellow';
  } else if (status === 'DANGER') {
    color = 'red';
  }

  return L.divIcon({
    className: '',
    html: `
        <div style="font-size: 24px; color: ${color};">
            <svg viewBox="-51.2 -51.2 614.40 614.40" xmlns="http://www.w3.org/2000/svg" fill="#000000" stroke="#000000" stroke-width="0.00512"><g id="SVGRepo_bgCarrier" stroke-width="0"><rect x="-51.2" y="-51.2" width="614.40" height="614.40" rx="307.2" fill="${color}" strokewidth="0"></rect></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path fill="#000000" d="M468.958 108.958c-27.507 2.08-48.997 7.94-71.375 22.572-5.333-2.214-12.62-17.738-16-16-11.82 6.08-14.892 19.555-4.916 32.817l-59.084 9.916c-24.776 3.341-49.567 4.838-74.187 5.334 1.326 3.832 2.96 7.636 4.812 10.05 5.219 6.802 20.323 6.21 21.07 14.75 1.935 22.098-24.876 47.415-47.056 47.057-15.401-.248-17.017-28.762-31.604-33.713-19.097-6.482-41.62 18.77-59.699 9.832-15.267-7.547-24.992-39.8-27.836-50.41-10.213-.127-20.327-.142-30.316.035-12.564.366-22.902 5.645-29.408 14.239-8.676 11.458-11.652 26.658-13.254 42.925-1.78 18.057 6.147 53.007 5.517 70.282-.504 13.85-7.493 11.87-11.912 18.888-13.52 21.47 8.894 20.83 17.014 5.56 12.482-23.473 4.253-63.11 7.195-92.974 1.855-35.76 10.597-23.937 15.664-24.588-4.2 13.065-6.21 30.962-7 51.334 6.895-2.342 36.498-11.6 42.73-.174 6.872 12.598-27.802 22.016-23.878 35.819 2.464 8.666 22.95 2.378 24.582 11.238 3.322 18.035-32.13 38.713-42.236 44.209.812 23.329 1.564 45.567 1.238 65.086H88.91c-4.234-16.543-12.038-49.944-4.06-55.084 21.425-18.091 29.836-37.484 42.732-56.428 8.755 2.556 16.92 4.787 24.782 6.672 3.553.972 7.244 1.771 10.984 2.44 24.859 4.967 61.553 5.678 90.783-.172 3.76 34.12 7.263 68.452 4.602 102.572h28.957c-12.375-26.902-4.263-65.044 13.892-86.27l44.934-33.462c24.881-16.384 42.93-37.996 55.982-63.38 30.402 3.413 57.086 3.29 77.192-.786l12.84-19.55c-24.257-17.857-43.3-36.585-62.948-58.13 10.063-14.533 25.027-22.765 39.375-32.506zm-39.375 54.572a8 8 0 1 1 0 16 8 8 0 0 1 0-16zM366.2 183.481c5.029 9.822-26.17 10.808-24.933 21.772.998 8.847 22.204 3.839 23.53 12.643 3.818 25.373-28.44 53.805-54.08 54.78-14.262.544-34.902-14.06-32.308-28.093 2.605-14.092 34.551-1.657 40.383-14.748 4.724-10.603-18.352-22.01-12.992-32.307 6.264-12.032 30.364-22.553 41.934-22.646 11.57-.093 15.606 3.347 18.466 8.6zm-26.585 126.346l-34.707 23.96 6.464 69.255h34.414c-11.783-22.454-15.58-55.506-6.171-93.215zm-204.561 1.41c-6.047 12.184-14.147 21.97-22.174 31.242 5.97 3.235 11.648 5.414 17.154 6.614 11.218 2.443 21.636.333 29.948-4.408 10.056-5.737 17.521-14.452 24.115-23.368-14.615-.869-32.96-2.962-49.043-10.08zm24.252 52c-8.737 2.585-17.452 3.7-25.566 2.96 5.167 12.624 10.45 24.152 15.824 36.845h28.306c-10.393-18.48-16.148-29.285-18.564-39.805z"></path></g></svg>        
        </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });
};

const LiveLocationMap = ({
  cattleData,
  highlightedCattleId,
}: CattleDataProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current) {
      // Set initial view to a general area first
      mapRef.current = L.map('map').setView([28.272885, 77.068236], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapRef.current);

      const userLocationMarker = L.marker([28.272885, 77.068236], {
        icon: L.divIcon({
          className: '',
          html: '<div style="font-size: 30px; color: #3182ce;"><svg viewBox="0 0 24 24" fill="currentColor" width="30" height="30"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>',
          iconSize: [30, 30],
          iconAnchor: [15, 30],
        }),
      })
        .addTo(mapRef.current)
        .bindPopup('<b>Detected Location</b>');

      // Use Browser Geolocation API
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            console.log('Real location detected:', latitude, longitude);
            if (mapRef.current) {
              mapRef.current.setView([latitude, longitude], 16);
              userLocationMarker.setLatLng([latitude, longitude]);
              userLocationMarker.setPopupContent(
                `<b>Your Real Location</b><br>Lat: ${latitude.toFixed(
                  6
                )}<br>Lon: ${longitude.toFixed(6)}`
              );
            }
          },
          (error) => {
            console.error('Error getting location:', error);
            // Fallback to cattle data or manual coords
            if (cattleData.length > 0 && cattleData[0].gpsLocation) {
              mapRef.current!.setView(
                [
                  cattleData[0].gpsLocation.latitude,
                  cattleData[0].gpsLocation.longitude,
                ],
                16
              );
            }
          }
        );
      }

      // Only add geofences once when map is initialized
      axiosPrivate.get('/geo-fence').then((res) => {
        res.data.forEach((geo: geoFenceInterface) => {
          const { latitude, longitude, radius, zoneType } = geo;
          L.circle([latitude, longitude], {
            radius,
            color: zoneType === 'safe' ? '#1F7D53' : '#E83F25',
            fillColor: zoneType === 'safe' ? '#DDF6D2' : '#FFAAAA',
            fillOpacity: 0.1,
          }).addTo(mapRef.current!);
        });
      });
    }
  }, []);

  // Update cattle markers on data change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear previous markers
    Object.values(markersRef.current).forEach((marker) => {
      mapRef.current!.removeLayer(marker);
    });
    markersRef.current = {};

    // Add updated markers
    cattleData.forEach((data) => {
      if (!data.cattleId) return;
      if (
        data.gpsLocation?.latitude &&
        data.gpsLocation?.longitude &&
        data.deviceId != null
      ) {
        const marker = L.marker(
          [data.gpsLocation.latitude, data.gpsLocation.longitude],
          { icon: createStatusIcon(data.locationStatus) }
        ).addTo(mapRef.current!);

        marker.bindPopup(
          `<div style="font-family: sans-serif; font-size: 14px;">
            <div style="font-weight: bold; margin-bottom: 2px;">Cattle ID: <span style="color: #1a202c">${
              data.cattleId
            }</span></div>
            <div>Location status: 
              <span style="color: ${
                data.locationStatus === 'SAFE'
                  ? 'green'
                  : data.locationStatus === 'WARNING'
                  ? 'orange'
                  : 'red'
              }; font-weight: 600;">
                ${data.locationStatus.toLowerCase()}
              </span>
            </div>
            <div style="margin-top: 2px; font-size: 13px; color: #4A5568;">
            Location: (${data.gpsLocation.latitude.toFixed(
              3
            )}, ${data.gpsLocation.longitude.toFixed(3)})
            </div>
          </div>`,
          {
            offset: L.point(0, -5),
          }
        );

        markersRef.current[data.cattleId.toString()] = marker;
      }
    });
  }, [cattleData]);

  // Highlight selected cattle
  useEffect(() => {
    if (
      highlightedCattleId &&
      markersRef.current[highlightedCattleId] &&
      mapRef.current
    ) {
      const marker = markersRef.current[highlightedCattleId];
      marker.openPopup();
      mapRef.current.setView(marker.getLatLng(), 17, { animate: true });

      const timeout = setTimeout(() => {
        marker.closePopup();
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [highlightedCattleId]);

  return <div id="map" className="h-full w-full rounded-2xl" />;
};

export default LiveLocationMap;
