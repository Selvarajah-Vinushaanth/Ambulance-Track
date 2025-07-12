import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { MapPin, Navigation, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { watchPosition, clearWatch, getCurrentPosition } from '../utils/geolocation';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const LocationTracker = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
`;

const LocationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const LocationTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const LocationStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: ${props => props.connected ? '#10b981' : '#ef4444'};
`;

const LocationInfo = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const LocationItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const LocationLabel = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const LocationValue = styled.span`
  font-size: 0.875rem;
  color: #1f2937;
  font-weight: 500;
`;

const LocationActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const LocationButton = styled.button`
  background: ${props => props.primary ? '#3b82f6' : '#f3f4f6'};
  color: ${props => props.primary ? 'white' : '#374151'};
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.primary ? '#2563eb' : '#e5e7eb'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LocationHistory = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
`;

const HistoryItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.875rem;

  &:last-child {
    border-bottom: none;
  }
`;

const RealTimeLocationTracker = () => {
  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get initial location
    getCurrentLocation();
    
    // Cleanup on unmount
    return () => {
      if (watchId) {
        clearWatch(watchId);
      }
    };
  }, []);

  const getCurrentLocation = async () => {
    try {
      setError(null);
      const position = await getCurrentPosition();
      setLocation(position);
      setAccuracy(position.accuracy);
      setLastUpdate(new Date());
      
      // Send location to server if user is a driver
      if (user && user.role === 'driver') {
        await updateDriverLocation(position);
      }
    } catch (err) {
      setError('Failed to get current location');
      toast.error('Location access denied or unavailable');
    }
  };

  const startTracking = () => {
    if (isTracking) return;

    const id = watchPosition(
      (position) => {
        setLocation(position);
        setAccuracy(position.accuracy);
        setLastUpdate(new Date());
        setError(null);
        
        // Add to history
        setLocationHistory(prev => [
          {
            lat: position.lat,
            lng: position.lng,
            timestamp: new Date(),
            accuracy: position.accuracy
          },
          ...prev.slice(0, 9) // Keep only last 10 entries
        ]);
        
        // Send to server if user is a driver
        if (user && user.role === 'driver') {
          updateDriverLocation(position);
        }
      },
      (err) => {
        setError('Location tracking failed');
        setIsTracking(false);
        setWatchId(null);
        toast.error('Location tracking stopped due to error');
      }
    );

    if (id) {
      setWatchId(id);
      setIsTracking(true);
      toast.success('Location tracking started');
    }
  };

  const stopTracking = () => {
    if (watchId) {
      clearWatch(watchId);
      setWatchId(null);
      setIsTracking(false);
      toast.success('Location tracking stopped');
    }
  };

  const updateDriverLocation = async (position) => {
    try {
      await fetch('http://localhost:5000/api/drivers/location', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          location: {
            lat: position.lat,
            lng: position.lng,
            accuracy: position.accuracy,
            timestamp: new Date()
          }
        })
      });
    } catch (err) {
      console.error('Failed to update driver location:', err);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatCoordinate = (coord) => {
    return coord ? coord.toFixed(6) : 'N/A';
  };

  if (!user) {
    return null;
  }

  return (
    <LocationTracker>
      <LocationHeader>
        <LocationTitle>
          <MapPin size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          Real-time Location
        </LocationTitle>
        <LocationStatus connected={!error && location}>
          {error ? <WifiOff size={16} /> : <Wifi size={16} />}
          {error ? 'Disconnected' : 'Connected'}
        </LocationStatus>
      </LocationHeader>

      <LocationInfo>
        <LocationItem>
          <LocationLabel>Latitude</LocationLabel>
          <LocationValue>{formatCoordinate(location?.lat)}</LocationValue>
        </LocationItem>
        <LocationItem>
          <LocationLabel>Longitude</LocationLabel>
          <LocationValue>{formatCoordinate(location?.lng)}</LocationValue>
        </LocationItem>
        <LocationItem>
          <LocationLabel>Accuracy</LocationLabel>
          <LocationValue>
            {accuracy ? `±${Math.round(accuracy)}m` : 'N/A'}
          </LocationValue>
        </LocationItem>
        <LocationItem>
          <LocationLabel>Last Update</LocationLabel>
          <LocationValue>
            {lastUpdate ? formatTime(lastUpdate) : 'Never'}
          </LocationValue>
        </LocationItem>
      </LocationInfo>

      <LocationActions>
        <LocationButton primary onClick={getCurrentLocation}>
          <RefreshCw size={16} />
          Refresh
        </LocationButton>
        {!isTracking ? (
          <LocationButton primary onClick={startTracking}>
            <Navigation size={16} />
            Start Tracking
          </LocationButton>
        ) : (
          <LocationButton onClick={stopTracking}>
            Stop Tracking
          </LocationButton>
        )}
      </LocationActions>

      {locationHistory.length > 0 && (
        <LocationHistory>
          <LocationLabel style={{ marginBottom: '0.5rem' }}>
            Recent Locations
          </LocationLabel>
          {locationHistory.map((item, index) => (
            <HistoryItem key={index}>
              <span>
                {formatCoordinate(item.lat)}, {formatCoordinate(item.lng)}
              </span>
              <span style={{ color: '#6b7280' }}>
                {formatTime(item.timestamp)}
              </span>
            </HistoryItem>
          ))}
        </LocationHistory>
      )}

      {error && (
        <div style={{ 
          background: '#fee2e2', 
          color: '#dc2626', 
          padding: '0.75rem', 
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          marginTop: '1rem'
        }}>
          {error}
        </div>
      )}
    </LocationTracker>
  );
};

export default RealTimeLocationTracker;
