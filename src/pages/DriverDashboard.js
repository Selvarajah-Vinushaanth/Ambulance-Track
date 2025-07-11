import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBooking } from '../contexts/BookingContext';
import Header from '../components/Header';
import BookingCard from '../components/BookingCard';
import MapComponent from '../components/MapComponent';
import styled from 'styled-components';
import { MapPin, Clock, Navigation, CheckCircle, AlertCircle } from 'lucide-react';
import { watchPosition, clearWatch } from '../utils/geolocation';

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

  useEffect(() => {
    if (user) {
      getBookings(user.id, user.role);
      startLocationTracking();
    }

    return () => {
      if (locationWatchId) {
        clearWatch(locationWatchId);
      }
    };
  }, [user]);

  const startLocationTracking = () => {
    const watchId = watchPosition(
      (position) => {
        setCurrentLocation(position);
        setLocationOnline(true);
        updateDriverLocation(position);
      },
      (error) => {
        console.error('Location tracking error:', error);
        setLocationOnline(false);
      }
    );
    setLocationWatchId(watchId);
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    await updateBookingStatus(bookingId, newStatus);
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
          
          {currentLocation ? (
            <MapComponent
              ambulanceLocation={currentLocation}
              showPatient={false}
              showAmbulance={true}
              center={[currentLocation.lat, currentLocation.lng]}
            />
          ) : (
            <div style={{ 
              height: '400px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: '#f3f4f6',
              borderRadius: '0.5rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <MapPin size={48} color="#6b7280" />
                <p>Waiting for location...</p>
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
