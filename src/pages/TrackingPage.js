import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBooking } from '../contexts/BookingContext';
import Header from '../components/Header';
import MapComponent from '../components/MapComponent';
import LoadingSpinner from '../components/LoadingSpinner';
import styled from 'styled-components';
import { ArrowLeft, MapPin, Phone, User, Clock, AlertCircle, Navigation, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const Container = styled.div`
  min-height: 100vh;
  background: #f8fafc;
`;

const Main = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  margin-bottom: 1rem;
  font-size: 0.875rem;

  &:hover {
    color: #374151;
  }
`;

const TrackingGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const TrackingCard = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  height: fit-content;
`;

const MapCard = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  height: 600px;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
`;

const StatusHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const BookingId = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const StatusBadge = styled.div`
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: capitalize;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  ${props => {
    switch (props.status) {
      case 'pending':
        return 'background: #fef3c7; color: #92400e;';
      case 'assigned':
        return 'background: #dbeafe; color: #1e40af;';
      case 'en_route':
        return 'background: #fde68a; color: #92400e;';
      case 'arrived':
        return 'background: #d1fae5; color: #065f46;';
      case 'completed':
        return 'background: #dcfce7; color: #166534; border: 2px solid #10b981;';
      case 'cancelled':
        return 'background: #fee2e2; color: #dc2626;';
      default:
        return 'background: #f3f4f6; color: #374151;';
    }
  }}
`;

const TrackingSteps = styled.div`
  position: relative;
  margin: 2rem 0;
`;

const Step = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  position: relative;
`;

const StepIcon = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.completed ? '#10b981' : props.active ? '#3b82f6' : '#e5e7eb'};
  color: ${props => props.completed || props.active ? 'white' : '#6b7280'};
  font-weight: 500;
  flex-shrink: 0;
  ${props => props.completed && 'animation: pulse 2s infinite;'}
  
  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
    }
  }
`;

const StepContent = styled.div`
  flex: 1;
`;

const StepTitle = styled.h3`
  font-size: 1rem;
  font-weight: 500;
  color: ${props => props.completed || props.active ? '#1f2937' : '#6b7280'};
  margin: 0 0 0.25rem 0;
`;

const StepDescription = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
`;

const StepTime = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.25rem;
`;

const StepLine = styled.div`
  position: absolute;
  left: 1.25rem;
  top: 2.5rem;
  width: 2px;
  height: 1.5rem;
  background: ${props => props.completed ? '#10b981' : '#e5e7eb'};
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 0.375rem;
  font-size: 0.875rem;
`;

const InfoLabel = styled.span`
  color: #6b7280;
  min-width: 80px;
`;

const InfoValue = styled.span`
  color: #1f2937;
  font-weight: 500;
`;

const RefreshButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;

  &:hover {
    background: #2563eb;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const CompletionMessage = styled.div`
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  border: 2px solid #10b981;
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 1.5rem 0;
  text-align: center;
  color: #166534;
`;

const CompletionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const CompletionText = styled.p`
  margin: 0;
  font-size: 0.875rem;
  opacity: 0.8;
`;

const TrackingPage = () => {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const { activeBooking, getBookingById } = useBooking();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    setLoading(true);
    await getBookingById(bookingId);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await getBookingById(bookingId);
    setRefreshing(false);
  };

  const handleBack = () => {
    navigate(`/${user.role}`);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} />;
      case 'assigned':
        return <User size={16} />;
      case 'en_route':
        return <Navigation size={16} />;
      case 'arrived':
        return <MapPin size={16} />;
      case 'completed':
        return <CheckCircle size={16} />;
      case 'cancelled':
        return <AlertCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const getTrackingSteps = () => {
    const steps = [
      { id: 'pending', title: 'Booking Received', description: 'Your request has been received and is being processed' },
      { id: 'assigned', title: 'Driver Assigned', description: 'An ambulance driver has been assigned to your booking' },
      { id: 'en_route', title: 'En Route', description: 'The ambulance is on its way to your location' },
      { id: 'arrived', title: 'Arrived', description: 'The ambulance has arrived at your location' },
      { id: 'completed', title: 'Completed', description: 'Journey completed successfully ✅' }
    ];

    const statusOrder = ['pending', 'assigned', 'en_route', 'arrived', 'completed'];
    const currentStatusIndex = statusOrder.indexOf(activeBooking?.status);

    return steps.map((step, index) => ({
      ...step,
      completed: index < currentStatusIndex || (index === currentStatusIndex && activeBooking?.status === 'completed'),
      active: index === currentStatusIndex && activeBooking?.status !== 'completed'
    }));
  };

  const parseLocation = (locationData) => {
    if (!locationData) return null;
    
    // If it's already an object with lat/lng, return it
    if (typeof locationData === 'object' && locationData.lat && locationData.lng) {
      return {
        lat: parseFloat(locationData.lat),
        lng: parseFloat(locationData.lng)
      };
    }
    
    // If it's a string, parse it
    if (typeof locationData === 'string') {
      const [lat, lng] = locationData.split(',').map(coord => parseFloat(coord.trim()));
      return { lat, lng };
    }
    
    return null;
  };

  if (loading) {
    return <LoadingSpinner message="Loading booking details..." />;
  }

  if (!activeBooking) {
    return (
      <Container>
        <Header />
        <Main>
          <BackButton onClick={handleBack}>
            <ArrowLeft size={16} />
            Back to Dashboard
          </BackButton>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2>Booking not found</h2>
            <p>The booking you're looking for doesn't exist or you don't have access to it.</p>
          </div>
        </Main>
      </Container>
    );
  }

  const pickupLocation = parseLocation(activeBooking.pickupLocation);
  const destinationLocation = parseLocation(activeBooking.destinationLocation);
  const ambulanceLocation = parseLocation(activeBooking.driver?.location);

  // Debug logging
  console.log('TrackingPage - Booking data:', {
    pickupLocation,
    destinationLocation,
    ambulanceLocation,
    rawPickup: activeBooking.pickupLocation,
    rawDestination: activeBooking.destinationLocation,
    rawDriver: activeBooking.driver?.location
  });

  return (
    <Container>
      <Header />
      <Main>
        <BackButton onClick={handleBack}>
          <ArrowLeft size={16} />
          Back to Dashboard
        </BackButton>

        <TrackingGrid>
          <TrackingCard>
            <StatusHeader>
              <BookingId>Booking #{activeBooking._id.slice(-6)}</BookingId>
              <StatusBadge status={activeBooking.status}>
                {getStatusIcon(activeBooking.status)}
                {activeBooking.status}
              </StatusBadge>
            </StatusHeader>

            <InfoGrid>
              <InfoItem>
                <User size={16} />
                <InfoLabel>Patient:</InfoLabel>
                <InfoValue>{activeBooking.patientName}</InfoValue>
              </InfoItem>
              <InfoItem>
                <Phone size={16} />
                <InfoLabel>Phone:</InfoLabel>
                <InfoValue>{activeBooking.patientPhone}</InfoValue>
              </InfoItem>
              <InfoItem>
                <MapPin size={16} />
                <InfoLabel>From:</InfoLabel>
                <InfoValue>{activeBooking.pickupAddress}</InfoValue>
              </InfoItem>
              <InfoItem>
                <MapPin size={16} />
                <InfoLabel>To:</InfoLabel>
                <InfoValue>{activeBooking.destinationAddress}</InfoValue>
              </InfoItem>
              {activeBooking.driver && (
                <InfoItem>
                  <User size={16} />
                  <InfoLabel>Driver:</InfoLabel>
                  <InfoValue>{activeBooking.driver.name}</InfoValue>
                </InfoItem>
              )}
              {activeBooking.driver && (
                <InfoItem>
                  <Phone size={16} />
                  <InfoLabel>Driver Phone:</InfoLabel>
                  <InfoValue>{activeBooking.driver.phone}</InfoValue>
                </InfoItem>
              )}
              <InfoItem>
                <Clock size={16} />
                <InfoLabel>Created:</InfoLabel>
                <InfoValue>{format(new Date(activeBooking.createdAt), 'MMM dd, yyyy HH:mm')}</InfoValue>
              </InfoItem>
              {activeBooking.estimatedArrival && (
                <InfoItem>
                  <Clock size={16} />
                  <InfoLabel>ETA:</InfoLabel>
                  <InfoValue>{format(new Date(activeBooking.estimatedArrival), 'MMM dd, yyyy HH:mm')}</InfoValue>
                </InfoItem>
              )}
            </InfoGrid>

            {activeBooking.medicalCondition && (
              <InfoItem>
                <AlertCircle size={16} />
                <InfoLabel>Condition:</InfoLabel>
                <InfoValue>{activeBooking.medicalCondition}</InfoValue>
              </InfoItem>
            )}

            {activeBooking.status === 'completed' && (
              <CompletionMessage>
                <CompletionTitle>
                  <CheckCircle size={24} />
                  Journey Completed Successfully!
                </CompletionTitle>
                <CompletionText>
                  The ambulance has successfully completed your journey. Thank you for using our service.
                </CompletionText>
              </CompletionMessage>
            )}

            <TrackingSteps>
              <SectionTitle>Tracking Status</SectionTitle>
              {getTrackingSteps().map((step, index) => (
                <div key={step.id}>
                  <Step>
                    <StepIcon completed={step.completed} active={step.active}>
                      {step.completed ? <CheckCircle size={16} /> : index + 1}
                    </StepIcon>
                    <StepContent>
                      <StepTitle completed={step.completed} active={step.active}>
                        {step.title}
                      </StepTitle>
                      <StepDescription>{step.description}</StepDescription>
                      {step.completed && (
                        <StepTime>
                          Completed at {format(new Date(activeBooking.updatedAt), 'MMM dd, HH:mm')}
                        </StepTime>
                      )}
                    </StepContent>
                  </Step>
                  {index < getTrackingSteps().length - 1 && (
                    <StepLine completed={step.completed} />
                  )}
                </div>
              ))}
            </TrackingSteps>

            <RefreshButton onClick={handleRefresh} disabled={refreshing}>
              <Navigation size={16} />
              {refreshing ? 'Refreshing...' : 'Refresh Status'}
            </RefreshButton>
          </TrackingCard>

          <MapCard>
            <SectionTitle>Live Location</SectionTitle>
            <MapComponent
              ambulanceLocation={ambulanceLocation}
              patientLocation={pickupLocation}
              destination={destinationLocation}
              showRoute={true}
              showAmbulance={true}
              showPatient={true}
              center={null}
            />
          </MapCard>
        </TrackingGrid>
      </Main>
    </Container>
  );
};

export default TrackingPage;
