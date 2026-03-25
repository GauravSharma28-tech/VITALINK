import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Axios, { axiosPrivate } from '../../services/Axios';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { CattleData } from '../Interface';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface GeoFenceMapInterface {
  newLocation: boolean;
  onLocationSelect: (lat: number, lng: number) => void;
  radius: number;
}

interface geoFenceInterface {
  latitude: number;
  longitude: number;
  radius: number;
  zoneType: string;
  zoneName: string;
}

const GeoFenceMap = ({
  newLocation,
  onLocationSelect,
  radius,
}: GeoFenceMapInterface) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const fetchAllGeoFence = async () => {
    try {
      const response = await Axios.get('/geo-fence/');
      const geofences = response.data;

      geofences.forEach((geoFence: geoFenceInterface) => {
        const { latitude, longitude, radius, zoneType } = geoFence;
        if (zoneType === 'safe') {
          const circle = L.circle([latitude, longitude], {
            radius,
            color: '#1F7D53',
            fillColor: '#DDF6D2',
            fillOpacity: 0.3,
          }).addTo(mapRef.current!);
          circle.bindPopup;
          // circle.bindPopup(`<b>${zoneName}</b><br>Radius: ${radius} m`);
        } else {
          const circle = L.circle([latitude, longitude], {
            radius,
            color: '#E83F25',
            fillColor: '#FFAAAA',
            fillOpacity: 0.3,
          }).addTo(mapRef.current!);
          circle.bindPopup('Cannot add Geo-fence inside danger zone');
        }
      });
    } catch (error) {
      console.log('Error in fetching data');
    }
  };

  const fetchAllSensorLocation = async (
    mapRef: React.MutableRefObject<L.Map | null>
  ) => {
    try {
      const response = await axiosPrivate.get('/map');
      const data = await response.data;
      const filteredData = data.filter(
        (item: CattleData) =>
          item.gpsLocation &&
          item.gpsLocation.latitude !== 0 &&
          item.gpsLocation.longitude !== 0
      );

      Object.keys(filteredData).forEach((key) => {
        const value = filteredData[key];

        if (value?.gpsLocation) {
          const marker = L.marker([
            value.gpsLocation.latitude,
            value.gpsLocation.longitude,
          ]).addTo(mapRef.current!);

          marker.bindPopup(
            `<b>Cattle ID: ${key}</b><br>
           Lat: ${value.gpsLocation.latitude}, Lon: ${value.gpsLocation.longitude}<br>
            `
          );
        }
      });
    } catch (error) {
      console.error('Error fetching GPS data:', error);
    }
  };

  useEffect(() => {
    // Initialize the map
    const map = L.map('map').setView([7.250823, 80.592517], 16); // Default view (Coordinate, zoom)
    mapRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(
      map
    );

    // Handle map click
    newLocation &&
      map.on('click', async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        setSelectedLocation({ lat, lng });

        // Remove existing marker and circle if any
        if (markerRef.current) {
          map.removeLayer(markerRef.current);
        }
        if (circleRef.current) {
          map.removeLayer(circleRef.current);
        }

        // Add marker at clicked position
        const marker = L.marker([lat, lng]).addTo(map);
        marker
          .bindPopup(
            `Selected Location<br>Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(
              5
            )}`
          )
          .openPopup();
        markerRef.current = marker;

        // Add geofence
        const circle = L.circle([lat, lng], {
          radius: radius,
          color: 'blue',
          fillColor: '#87ceeb',
          fillOpacity: 0.4,
        }).addTo(map);
        circleRef.current = circle;

        onLocationSelect(lat, lng);
      });

    // fetchAllSensorLocation(mapRef);
    fetchAllGeoFence();

    return () => {
      map.remove();
    };
  }, []);

  useEffect(() => {
    if (selectedLocation && circleRef.current) {
      circleRef.current.setRadius(radius);
    }
  }, [radius]);

  return <div id="map" className="h-full w-full rounded-2xl" />;
};

export default GeoFenceMap;
