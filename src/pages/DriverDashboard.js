import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBooking } from '../contexts/BookingContext';
import Header from '../components/Header';
import BookingCard from '../components/BookingCard';
import MapComponent from '../components/MapComponent';
import AddressInput from '../components/AddressInput';
import styled from 'styled-components';
import { MapPin, Clock, Navigation, CheckCircle, AlertCircle, Target, Crosshair } from 'lucide-react';
import { watchPosition, clearWatch } from '../utils/geolocation';
import toast from 'react-hot-toast';

const Container = styled.div`
  min-height: 100vh;
  background: #f8fafc;
`;

const Main = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const StatusSection = styled.section`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatusCard = styled.div`
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 0.5rem;
  border-left: 4px solid ${props => props.color || '#dc2626'};
  text-align: center;
`;

const StatusNumber = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: ${props => props.color || '#dc2626'};
  margin-bottom: 0.5rem;
`;

const StatusLabel = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const StatusIcon = styled.div`
  color: ${props => props.color || '#dc2626'};
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: center;
`;

const LocationSection = styled.section`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const LocationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const LocationStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${props => props.online ? '#dcfce7' : '#fee2e2'};
  color: ${props => props.online ? '#166534' : '#dc2626'};
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
`;

const LocationInfo = styled.div`
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
`;

const LocationDetail = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const LocationLabel = styled.span`
  color: #6b7280;
  font-size: 0.875rem;
`;

const LocationValue = styled.span`
  color: #1f2937;
  font-weight: 500;
  font-size: 0.875rem;
`;

const LocationControls = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const LocationButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: ${props => props.active ? '#dc2626' : '#ffffff'};
  color: ${props => props.active ? '#ffffff' : '#374151'};
  border: 2px solid ${props => props.active ? '#dc2626' : '#e5e7eb'};
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.active ? '#b91c1c' : '#f9fafb'};
    border-color: ${props => props.active ? '#b91c1c' : '#d1d5db'};
  }
`;

const RealTimeIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${props => props.active ? '#dcfce7' : '#fee2e2'};
  color: ${props => props.active ? '#166534' : '#dc2626'};
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 1rem;
`;

const PulsingDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.active ? '#10b981' : '#dc2626'};
  animation: ${props => props.active ? 'pulse 2s infinite' : 'none'};
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;

const LocationInstructions = styled.div`
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #0369a1;
`;

const AddressInputWrapper = styled.div`
  flex: 1;
  margin-bottom: 1rem;
`;

const MapInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
`;

const BookingsSection = styled.section`
  margin-bottom: 2rem;
`;

const ActiveBookingAlert = styled.div`
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
`;

const EmptyStateIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const EmptyStateText = styled.p`
  font-size: 1.125rem;
  margin-bottom: 1rem;
`;

const DriverDashboard = () => {
  const { user } = useAuth();
  const { bookings, getBookings, updateBookingStatus, updateDriverLocation, loading } = useBooking();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationWatchId, setLocationWatchId] = useState(null);
  const [locationOnline, setLocationOnline] = useState(false);
  const [locationMode, setLocationMode] = useState('auto'); // 'auto' or 'manual'
  const [manualLocation, setManualLocation] = useState(null);
  const [locationUpdateInterval, setLocationUpdateInterval] = useState(null);

  useEffect(() => {
    if (user) {
      getBookings(user.id, user.role);
      startLocationTracking();
    }

    return () => {
      if (locationWatchId) {
        clearWatch(locationWatchId);
      }
      if (locationUpdateInterval) {
        clearInterval(locationUpdateInterval);
      }
    };
  }, [user]);

  const startLocationTracking = () => {
    const watchId = watchPosition(
      (position) => {
        setCurrentLocation(position);
        setLocationOnline(true);
        updateDriverLocation(position);
        
        // Show success toast only once
        if (!locationOnline) {
          toast.success('GPS location tracking started');
        }
      },
      (error) => {
        console.error('Location tracking error:', error);
        setLocationOnline(false);
        
        // Show specific error messages
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Location permission denied. Please enable location services.');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('Location information unavailable. Please check your GPS.');
            break;
          case error.TIMEOUT:
            toast.error('Location request timed out. Please try again.');
            break;
          default:
            toast.error('An error occurred while getting your location.');
            break;
        }
      }
    );
    setLocationWatchId(watchId);
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    await updateBookingStatus(bookingId, newStatus);
  };

  const handleLocationModeChange = (mode) => {
    setLocationMode(mode);
    if (mode === 'auto') {
      startLocationTracking();
      setManualLocation(null);
    } else {
      stopLocationTracking();
    }
  };

  const handleManualLocationSelect = (location) => {
    setManualLocation(location);
    setCurrentLocation(location);
    setLocationOnline(true);
    updateDriverLocation(location);
    
    // Start regular updates for manual location (in case driver moves)
    startLocationUpdateInterval(location);
    
    // Show success message with more details
    toast.success(
      `✅ Location set successfully!\n📍 ${location.name || location.address}`,
      {
        duration: 4000,
        style: {
          background: '#10b981',
          color: '#ffffff',
        },
      }
    );
  };

  const startLocationUpdateInterval = (location) => {
    // Clear existing interval
    if (locationUpdateInterval) {
      clearInterval(locationUpdateInterval);
    }
    
    // Update location every 30 seconds for real-time tracking
    const interval = setInterval(() => {
      const currentLoc = getCurrentLocationDisplay();
      if (currentLoc) {
        updateDriverLocation(currentLoc);
      }
    }, 30000);
    
    setLocationUpdateInterval(interval);
  };

  const stopLocationTracking = () => {
    if (locationWatchId) {
      clearWatch(locationWatchId);
      setLocationWatchId(null);
    }
    if (locationUpdateInterval) {
      clearInterval(locationUpdateInterval);
      setLocationUpdateInterval(null);
    }
  };

  const getCurrentLocationDisplay = () => {
    if (locationMode === 'manual' && manualLocation) {
      return manualLocation;
    }
    return currentLocation;
  };

  // Calculate statistics
  const totalBookings = bookings.length;
  const assignedBookings = bookings.filter(b => b.status === 'assigned').length;
  const activeBookings = bookings.filter(b => ['en_route', 'arrived'].includes(b.status)).length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;

  // Get active booking (driver should only have one active booking at a time)
  const activeBooking = bookings.find(b => 
    ['assigned', 'en_route', 'arrived'].includes(b.status)
  );

  // Get recent bookings
  const recentBookings = bookings
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  if (loading) {
    return (
      <Container>
        <Header />
        <Main>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="loading-spinner" />
            <p>Loading your dashboard...</p>
          </div>
        </Main>
      </Container>
    );
  }

  return (
    <Container>
      <Header />
      <Main>
        <StatusSection>
          <StatusGrid>
            <StatusCard color="#dc2626">
              <StatusIcon color="#dc2626">
                <Clock size={24} />
              </StatusIcon>
              <StatusNumber color="#dc2626">{totalBookings}</StatusNumber>
              <StatusLabel>Total Bookings</StatusLabel>
            </StatusCard>
            <StatusCard color="#f59e0b">
              <StatusIcon color="#f59e0b">
                <AlertCircle size={24} />
              </StatusIcon>
              <StatusNumber color="#f59e0b">{assignedBookings}</StatusNumber>
              <StatusLabel>Assigned</StatusLabel>
            </StatusCard>
            <StatusCard color="#3b82f6">
              <StatusIcon color="#3b82f6">
                <Navigation size={24} />
              </StatusIcon>
              <StatusNumber color="#3b82f6">{activeBookings}</StatusNumber>
              <StatusLabel>Active</StatusLabel>
            </StatusCard>
            <StatusCard color="#10b981">
              <StatusIcon color="#10b981">
                <CheckCircle size={24} />
              </StatusIcon>
              <StatusNumber color="#10b981">{completedBookings}</StatusNumber>
              <StatusLabel>Completed</StatusLabel>
            </StatusCard>
          </StatusGrid>
        </StatusSection>

        <LocationSection>
          <LocationHeader>
            <SectionTitle>Your Location</SectionTitle>
            <LocationStatus online={locationOnline}>
              <MapPin size={16} />
              {locationOnline ? 'Online' : 'Offline'}
            </LocationStatus>
          </LocationHeader>
          
          <LocationControls>
            <LocationButton 
              active={locationMode === 'auto'} 
              onClick={() => handleLocationModeChange('auto')}
            >
              <Target size={16} />
              Auto GPS
            </LocationButton>
            {/* <LocationButton 
              active={locationMode === 'manual'} 
              onClick={() => handleLocationModeChange('manual')}
            >
              <Crosshair size={16} />
              Set Manually
            </LocationButton> */}
          </LocationControls>

          {locationMode === 'manual' && (
            <div>
              <LocationInstructions>
                💡 <strong>How to set your location:</strong>
                <br />
                1. Type a location name (e.g., "Vavuniya", "Jaffna", "Colombo")
                <br />
                2. Select from suggestions or press Enter/click "Set Location"
                <br />
                3. Your location will be automatically updated for patients to track
                <br />
                📍 <strong>Note:</strong> Major Sri Lankan cities are available even without internet
              </LocationInstructions>
              <AddressInputWrapper>
                <AddressInput
                  placeholder="Enter your current location (e.g., Vavuniya, Jaffna, Colombo)"
                  onLocationSelect={handleManualLocationSelect}
                />
              </AddressInputWrapper>
            </div>
          )}

          <RealTimeIndicator active={locationOnline}>
            <PulsingDot active={locationOnline} />
            {locationOnline ? 'Real-time tracking active' : 'Real-time tracking inactive'}
          </RealTimeIndicator>
          
          {getCurrentLocationDisplay() && locationOnline && (
            <LocationInfo>
              <LocationDetail>
                <LocationLabel>Mode:</LocationLabel>
                <LocationValue>{locationMode === 'auto' ? 'Auto GPS' : 'Manual'}</LocationValue>
              </LocationDetail>
              <LocationDetail>
                <LocationLabel>Latitude:</LocationLabel>
                <LocationValue>{getCurrentLocationDisplay().lat.toFixed(6)}</LocationValue>
              </LocationDetail>
              <LocationDetail>
                <LocationLabel>Longitude:</LocationLabel>
                <LocationValue>{getCurrentLocationDisplay().lng.toFixed(6)}</LocationValue>
              </LocationDetail>
              {locationMode === 'manual' && manualLocation?.address && (
                <LocationDetail>
                  <LocationLabel>Address:</LocationLabel>
                  <LocationValue>{manualLocation.address}</LocationValue>
                </LocationDetail>
              )}
              {locationMode === 'auto' && getCurrentLocationDisplay().accuracy && (
                <LocationDetail>
                  <LocationLabel>Accuracy:</LocationLabel>
                  <LocationValue>{Math.round(getCurrentLocationDisplay().accuracy)}m</LocationValue>
                </LocationDetail>
              )}
              <LocationDetail>
                <LocationLabel>Last Updated:</LocationLabel>
                <LocationValue>{new Date().toLocaleTimeString()}</LocationValue>
              </LocationDetail>
            </LocationInfo>
          )}
          
          {getCurrentLocationDisplay() && (
            <MapInfo>
              🚑 The ambulance icon on the map shows your current location as the driver
              {locationMode === 'manual' && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                  📍 Location manually set and broadcasting to patients
                </div>
              )}
            </MapInfo>
          )}
          
          {getCurrentLocationDisplay() ? (
            activeBooking ? (
              <MapComponent
                ambulanceLocation={getCurrentLocationDisplay()}
                patientLocation={activeBooking.pickupLocation ? {
                  lat: parseFloat(activeBooking.pickupLocation.split(',')[0]),
                  lng: parseFloat(activeBooking.pickupLocation.split(',')[1])
                } : null}
                destination={activeBooking.destinationLocation ? {
                  lat: parseFloat(activeBooking.destinationLocation.split(',')[0]),
                  lng: parseFloat(activeBooking.destinationLocation.split(',')[1])
                } : null}
                showRoute={true}
                showPatient={true}
                showAmbulance={true}
                center={null}
              />
            ) : (
              <MapComponent
                ambulanceLocation={getCurrentLocationDisplay()}
                showPatient={false}
                showAmbulance={true}
                center={null}
              />
            )
          ) : (
            <div style={{ 
              height: '450px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: '#f3f4f6',
              borderRadius: '0.5rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <MapPin size={48} color="#6b7280" />
                <p>Set your location to continue</p>
                <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                  Use Auto GPS or set your location manually
                </p>
              </div>
            </div>
          )}
        </LocationSection>

        {activeBooking && (
          <BookingsSection>
            <SectionTitle>Active Booking</SectionTitle>
            <ActiveBookingAlert>
              <AlertCircle size={20} />
              You have an active booking. Please complete it before accepting new ones.
            </ActiveBookingAlert>
            <BookingCard
              booking={activeBooking}
              onStatusUpdate={handleStatusUpdate}
              userRole={user.role}
            />
          </BookingsSection>
        )}

        <BookingsSection>
          <SectionTitle>Recent Bookings</SectionTitle>
          {recentBookings.length > 0 ? (
            recentBookings.map(booking => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onStatusUpdate={handleStatusUpdate}
                userRole={user.role}
              />
            ))
          ) : (
            <EmptyState>
              <EmptyStateIcon>🚑</EmptyStateIcon>
              <EmptyStateText>No bookings assigned</EmptyStateText>
              <p>You'll see bookings here when they're assigned to you by the admin.</p>
            </EmptyState>
          )}
        </BookingsSection>
      </Main>
    </Container>
  );
};

export default DriverDashboard;
