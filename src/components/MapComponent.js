import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import styled from 'styled-components';
import { getLocationFromIP } from '../utils/geolocation';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapWrapper = styled.div`
  height: 400px;
  width: 100%;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const ambulanceIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTkgMTJIMTVNMTIgOVYxNU0yMSAxMkM5IDEyIDEyIDIxIDEyIDIxQzEyIDIxIDMgMTIgMTIgMTJDMTIgMTIgMTIgMyAxMiAxMkMxMiAxMiAyMSAxMiAyMSAxMloiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
  className: 'ambulance-icon'
});

const patientIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwIDIxVjE5QzIwIDE3LjkzOTEgMTkuNTc4NiAxNi45MjE3IDE4LjgyODQgMTYuMTcxNkMxOC4wNzgzIDE1LjQyMTQgMTcuMDYwOSAxNSAxNiAxNUg4QzYuOTM5MTMgMTUgNS45MjE3MiAxNS40MjE0IDUuMTcxNTcgMTYuMTcxNkM0LjQyMTQzIDE2LjkyMTcgNCAxNy45MzkxIDQgMTlWMjFNMTYgN0MxNiA5LjIwOTE0IDE0LjIwOTEgMTEgMTIgMTFDOS43OTA4NiAxMSA4IDkuMjA5MTQgOCA3QzggNC43OTA4NiA5Ljc5MDg2IDMgMTIgM0MxNC4yMDkxIDMgMTYgNC43OTA4NiAxNiA3WiIgc3Ryb2tlPSIjMDA3N0ZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4=',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
  className: 'patient-icon'
});

const destinationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDEwQzIxIDEwIDIxIDEwIDIxIDEwQzIxIDEwIDIxIDEwIDIxIDEwQzIxIDEwIDIxIDEwIDIxIDEwQzIxIDEwIDIxIDEwIDIxIDEwQzIxIDEwIDIxIDEwIDIxIDEwQzIxIDEwIDIxIDEwIDIxIDEwQzIxIDEwIDIxIDEwIDIxIDEwQzIxIDEwIDIxIDEwIDIxIDEwQzIxIDEwIDIxIDEwIDIxIDEwQzIxIDEwIDIxIDEwIDIxIDEwQzIxIDEwIDIxIDEwIDIxIDEwQzIxIDEwIDIxIDEwIDIxIDEwQzIxIDEwIDIxIDEwIDIxIDEwQzIxIDEwIDIxIDEwIDIxIDEwQzIxIDEwIDIxIDEwIDIxIDEwQzIxIDEwIDIxIDEwIDIxIDEwWiIgc3Ryb2tlPSIjMTBiOTgxIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4=',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
  className: 'destination-icon'
});

const MapComponent = ({ 
  ambulanceLocation, 
  patientLocation, 
  destination,
  showPatient = true,
  showAmbulance = true,
  showRoute = true,
  center = null
}) => {
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]); // Default to NYC
  const [userLocation, setUserLocation] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);

  useEffect(() => {
    // Get user location from IP
    const getUserLocation = async () => {
      try {
        const location = await getLocationFromIP();
        setUserLocation(location);
        if (!center) {
          setMapCenter([location.lat, location.lng]);
        }
      } catch (error) {
        console.error('Failed to get user location:', error);
      }
    };

    getUserLocation();
  }, [center]);

  useEffect(() => {
    if (center) {
      setMapCenter(center);
    } else if (ambulanceLocation) {
      setMapCenter([ambulanceLocation.lat, ambulanceLocation.lng]);
    } else if (patientLocation) {
      setMapCenter([patientLocation.lat, patientLocation.lng]);
    }
  }, [center, ambulanceLocation, patientLocation]);

  // Create route points for the blue path
  useEffect(() => {
    if (ambulanceLocation && patientLocation && showRoute) {
      // Simple straight line route - in production, you'd use a routing service
      const points = [
        [ambulanceLocation.lat, ambulanceLocation.lng],
        [patientLocation.lat, patientLocation.lng]
      ];
      setRoutePoints(points);
    } else if (ambulanceLocation && destination && showRoute) {
      const points = [
        [ambulanceLocation.lat, ambulanceLocation.lng],
        [destination.lat, destination.lng]
      ];
      setRoutePoints(points);
    } else {
      setRoutePoints([]);
    }
  }, [ambulanceLocation, patientLocation, destination, showRoute]);

  return (
    <MapWrapper>
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Blue route path */}
        {routePoints.length > 0 && (
          <Polyline
            positions={routePoints}
            color="#2563eb"
            weight={4}
            opacity={0.8}
            dashArray="5, 10"
          />
        )}
        
        {showAmbulance && ambulanceLocation && (
          <Marker
            position={[ambulanceLocation.lat, ambulanceLocation.lng]}
            icon={ambulanceIcon}
          >
            <Popup>
              <div>
                <h3>🚑 Ambulance</h3>
                <p>Current Location</p>
                <p>Lat: {ambulanceLocation.lat.toFixed(4)}</p>
                <p>Lng: {ambulanceLocation.lng.toFixed(4)}</p>
                <p>Status: En Route</p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {showPatient && patientLocation && (
          <Marker
            position={[patientLocation.lat, patientLocation.lng]}
            icon={patientIcon}
          >
            <Popup>
              <div>
                <h3>👤 Patient Location</h3>
                <p>Pickup Point</p>
                <p>Lat: {patientLocation.lat.toFixed(4)}</p>
                <p>Lng: {patientLocation.lng.toFixed(4)}</p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {destination && (
          <Marker
            position={[destination.lat, destination.lng]}
            icon={destinationIcon}
          >
            <Popup>
              <div>
                <h3>🏥 Destination</h3>
                <p>Drop-off Point</p>
                <p>Lat: {destination.lat.toFixed(4)}</p>
                <p>Lng: {destination.lng.toFixed(4)}</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </MapWrapper>
  );
};

export default MapComponent;
