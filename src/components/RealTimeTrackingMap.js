import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import styled from 'styled-components';
import { Navigation, MapPin, Clock, Route, User, Car } from 'lucide-react';
import { calculateDistance, estimateTravelTime } from '../utils/geolocation';
import io from 'socket.io-client';
import 'leaflet/dist/leaflet.css';

// Fix default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const Container = styled.div`
  position: relative;
  height: 100%;
  width: 100%;
  border-radius: 1rem;
  overflow: hidden;
`;

const MapWrapper = styled.div`
  height: 100%;
  width: 100%;
  position: relative;
`;

const InfoOverlay = styled.div`
  position: absolute;
  top: 1rem;
  left: 1rem;
  right: 1rem;
  z-index: 1000;
  background: white;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
`;

const LiveIndicator = styled.div`
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  z-index: 1000;
  background: #10b981;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }
`;

const StatusBadge = styled.div`
  background: ${props => {
    switch (props.status) {
      case 'assigned': return '#3b82f6';
      case 'en_route': return '#f59e0b';
      case 'arrived': return '#10b981';
      default: return '#6b7280';
    }
  }};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: capitalize;
`;

// Custom icons for different markers
const createCustomIcon = (color, iconType) => {
  const iconHtml = iconType === 'ambulance' 
    ? '🚑' 
    : iconType === 'patient' 
    ? '🏥' 
    : '📍';
  
  return L.divIcon({
    html: `<div style="
      background: ${color};
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    ">${iconHtml}</div>`,
    className: 'custom-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

// Component to update map view
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
};

const RealTimeTrackingMap = ({ 
  booking, 
  driverLocation, 
  patientLocation, 
  destinationLocation,
  showRoute = true,
  autoCenter = true 
}) => {
  const [socket, setSocket] = useState(null);
  const [currentDriverLocation, setCurrentDriverLocation] = useState(driverLocation);
  const [routePath, setRoutePath] = useState([]);
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const mapRef = useRef();

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Listen for driver location updates
    newSocket.on('driverLocationUpdated', (data) => {
      if (booking && booking.driver && data.driverId === booking.driver._id) {
        setCurrentDriverLocation(data.location);
        setLastUpdate(new Date());
        
        // Calculate new ETA and distance
        if (patientLocation) {
          const newDistance = calculateDistance(
            data.location.lat,
            data.location.lng,
            patientLocation.lat,
            patientLocation.lng
          );
          setDistance(newDistance);
          setEta(estimateTravelTime(newDistance));
        }
      }
    });

    // Listen for booking status updates
    newSocket.on('bookingUpdated', (updatedBooking) => {
      if (booking && updatedBooking._id === booking._id) {
        // Update booking status
        console.log('Booking updated:', updatedBooking.status);
      }
    });

    return () => {
      newSocket.close();
    };
  }, [booking, patientLocation]);

  useEffect(() => {
    setCurrentDriverLocation(driverLocation);
  }, [driverLocation]);

  // Calculate route path
  useEffect(() => {
    if (currentDriverLocation && patientLocation && showRoute) {
      // Simple straight line route (in production, use routing service)
      const path = [
        [currentDriverLocation.lat, currentDriverLocation.lng],
        [patientLocation.lat, patientLocation.lng]
      ];
      setRoutePath(path);
      
      // Calculate initial distance and ETA
      const dist = calculateDistance(
        currentDriverLocation.lat,
        currentDriverLocation.lng,
        patientLocation.lat,
        patientLocation.lng
      );
      setDistance(dist);
      setEta(estimateTravelTime(dist));
    }
  }, [currentDriverLocation, patientLocation, showRoute]);

  // Calculate map center and zoom
  const getMapCenter = () => {
    if (autoCenter && currentDriverLocation && patientLocation) {
      const centerLat = (currentDriverLocation.lat + patientLocation.lat) / 2;
      const centerLng = (currentDriverLocation.lng + patientLocation.lng) / 2;
      return [centerLat, centerLng];
    }
    return currentDriverLocation ? [currentDriverLocation.lat, currentDriverLocation.lng] : [40.7128, -74.0060];
  };

  const getZoomLevel = () => {
    if (distance) {
      // Adjust zoom based on distance
      if (distance < 1) return 15;
      if (distance < 5) return 13;
      if (distance < 10) return 12;
      return 11;
    }
    return 13;
  };

  return (
    <Container>
      <MapWrapper>
        <MapContainer
          center={getMapCenter()}
          zoom={getZoomLevel()}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          <MapUpdater center={getMapCenter()} zoom={getZoomLevel()} />
          
          {/* Driver/Ambulance Marker */}
          {currentDriverLocation && (
            <Marker
              position={[currentDriverLocation.lat, currentDriverLocation.lng]}
              icon={createCustomIcon('#dc2626', 'ambulance')}
            >
              <Popup>
                <div>
                  <strong>🚑 Ambulance</strong><br />
                  {booking?.driver?.name || 'Driver'}<br />
                  <small>Last updated: {lastUpdate.toLocaleTimeString()}</small>
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Patient Pickup Location */}
          {patientLocation && (
            <Marker
              position={[patientLocation.lat, patientLocation.lng]}
              icon={createCustomIcon('#3b82f6', 'patient')}
            >
              <Popup>
                <div>
                  <strong>🏥 Pickup Location</strong><br />
                  {booking?.patientName || 'Patient'}<br />
                  {booking?.pickupAddress}
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Destination Marker */}
          {destinationLocation && (
            <Marker
              position={[destinationLocation.lat, destinationLocation.lng]}
              icon={createCustomIcon('#10b981', 'destination')}
            >
              <Popup>
                <div>
                  <strong>📍 Destination</strong><br />
                  {booking?.destinationAddress}
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Route Line */}
          {routePath.length > 0 && (
            <Polyline
              positions={routePath}
              color="#3b82f6"
              weight={4}
              opacity={0.7}
              dashArray="10, 10"
            />
          )}
        </MapContainer>
      </MapWrapper>
      
      {/* Info Overlay */}
      <InfoOverlay>
        <InfoItem>
          <Route size={16} />
          <span>{distance ? `${distance.toFixed(1)} km` : 'Calculating...'}</span>
        </InfoItem>
        <InfoItem>
          <Clock size={16} />
          <span>ETA: {eta ? `${eta} min` : 'Calculating...'}</span>
        </InfoItem>
        {booking && (
          <StatusBadge status={booking.status}>
            {booking.status}
          </StatusBadge>
        )}
      </InfoOverlay>
      
      {/* Live Indicator */}
      <LiveIndicator>
        <div style={{ 
          width: '8px', 
          height: '8px', 
          borderRadius: '50%', 
          background: 'currentColor' 
        }} />
        Live Tracking
      </LiveIndicator>
    </Container>
  );
};

export default RealTimeTrackingMap;
