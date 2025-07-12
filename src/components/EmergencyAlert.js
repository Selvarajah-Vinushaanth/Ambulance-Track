import React, { useState } from 'react';
import styled from 'styled-components';
import { AlertTriangle, Phone, MapPin, Send, Navigation, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBooking } from '../contexts/BookingContext';
import { getCurrentPosition } from '../utils/geolocation';
import { geocodeAddress } from '../utils/geocoding';
import { findNearestHospital } from '../utils/hospitals';
import { useGoogleMaps } from '../contexts/GoogleMapsContext';
import toast from 'react-hot-toast';

const EmergencyButton = styled.button`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background: #dc2626;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
  transition: all 0.3s ease;
  z-index: 1000;
  animation: pulse 2s infinite;

  &:hover {
    background: #b91c1c;
    transform: scale(1.1);
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
    }
    50% {
      box-shadow: 0 4px 20px rgba(220, 38, 38, 0.6);
    }
    100% {
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
    }
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  max-width: 400px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  color: #dc2626;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  width: 100%;

  &:focus {
    outline: none;
    border-color: #dc2626;
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  resize: vertical;
  min-height: 100px;

  &:focus {
    outline: none;
    border-color: #dc2626;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const Button = styled.button`
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmergencyButton2 = styled(Button)`
  background: #dc2626;
  color: white;

  &:hover:not(:disabled) {
    background: #b91c1c;
  }
`;

const CancelButton = styled(Button)`
  background: #e5e7eb;
  color: #374151;

  &:hover:not(:disabled) {
    background: #d1d5db;
  }
`;

const LocationInfo = styled.div`
  background: #f3f4f6;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
`;

const QuickButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const QuickButton = styled.button`
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  background: white;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;

  &:hover {
    border-color: #dc2626;
    background: #fef2f2;
  }

  &.selected {
    border-color: #dc2626;
    background: #fef2f2;
    color: #dc2626;
  }
`;

const HospitalRoutingCard = styled.div`
  background: #f0f9ff;
  border: 2px solid #0284c7;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
`;

const HospitalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  color: #0284c7;
  font-weight: 600;
`;

const HospitalInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const HospitalName = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e40af;
`;

const HospitalDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
`;

const RoutePreview = styled.div`
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin-top: 0.75rem;
  font-size: 0.875rem;
`;

const EmergencyAlert = () => {
  const { user } = useAuth();
  const { createBooking } = useBooking();
  const { isLoaded } = useGoogleMaps();
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedEmergency, setSelectedEmergency] = useState('');
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationInput, setLocationInput] = useState('');
  const [nearestHospital, setNearestHospital] = useState(null);

  const emergencyTypes = [
    'Heart Attack',
    'Stroke',
    'Accident',
    'Breathing Problems',
    'Severe Bleeding',
    'Unconscious',
    'Chest Pain',
    'Other Emergency'
  ];

  const handleLocationInput = async (value) => {
    setLocationInput(value);
    
    if (value.trim() && value.length > 2 && isLoaded) {
      try {
        const geocodedLocation = await geocodeAddress(value);
        setLocation(geocodedLocation);
        console.log('Geocoded location:', geocodedLocation);
        
        // Find nearest hospital when location is set
        if (geocodedLocation && geocodedLocation.lat && geocodedLocation.lng) {
          const hospital = findNearestHospital(geocodedLocation);
          setNearestHospital(hospital);
          console.log('Nearest hospital:', hospital);
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        // Don't show error toast for every keystroke, just log it
      }
    } else {
      // Clear hospital info if location input is cleared
      setNearestHospital(null);
    }
  };

  const handleEmergencyClick = async () => {
    if (!user || user.role !== 'patient') {
      toast.error('Only patients can send emergency alerts');
      return;
    }

    setLoading(true);
    try {
      const position = await getCurrentPosition();
      setLocation(position);
      
      // Find nearest hospital for current position
      if (position && position.lat && position.lng) {
        const hospital = findNearestHospital(position);
        setNearestHospital(hospital);
        console.log('Nearest hospital:', hospital);
      }
      
      setShowModal(true);
    } catch (error) {
      console.error('Location error:', error);
      toast.error('Unable to get location. Please enable location services or enter manually.');
      setShowModal(true); // Still show modal so user can enter location manually
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() && !selectedEmergency) {
      toast.error('Please describe the emergency');
      return;
    }

    if (!location) {
      toast.error('Please provide your location');
      return;
    }

    setLoading(true);
    try {
      const emergencyMessage = selectedEmergency || message;
      
      const response = await fetch('http://localhost:5000/api/emergency-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          location,
          message: emergencyMessage
        })
      });

      if (response.ok) {
        const emergencyBooking = await response.json();
        toast.success(`🚨 Emergency alert sent! Please pay the fare directly to the ambulance staff.`
);
        setShowModal(false);
        setMessage('');
        setSelectedEmergency('');
        setLocationInput('');
        setNearestHospital(null);
      } else {
        throw new Error('Failed to send emergency alert');
      }
    } catch (error) {
      console.error('Emergency alert error:', error);
      toast.error('Failed to send emergency alert');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setMessage('');
    setSelectedEmergency('');
    setLocationInput('');
    setNearestHospital(null);
  };

  if (!user || user.role !== 'patient') {
    return null;
  }

  return (
    <>
      <EmergencyButton onClick={handleEmergencyClick} disabled={loading}>
        <AlertTriangle size={20} />
      </EmergencyButton>

      {showModal && (
        <Modal onClick={handleClose}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <AlertTriangle size={24} />
              <ModalTitle>Emergency Alert</ModalTitle>
            </ModalHeader>

            {location && (
              <LocationInfo>
                <MapPin size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                Location: {location.formatted_address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`}
              </LocationInfo>
            )}

            {nearestHospital && (
              <HospitalRoutingCard>
                <HospitalHeader>
                  <Navigation size={20} />
                  <span>Nearest Hospital Route</span>
                </HospitalHeader>
                <HospitalInfo>
                  <HospitalName>{nearestHospital.name}</HospitalName>
                  <HospitalDetail>
                    <MapPin size={16} />
                    <span>{nearestHospital.address}</span>
                  </HospitalDetail>
                  <HospitalDetail>
                    <Clock size={16} />
                    <span>{nearestHospital.distance?.toFixed(1)} km away</span>
                  </HospitalDetail>
                  <HospitalDetail>
                    <Phone size={16} />
                    <span>{nearestHospital.phone}</span>
                  </HospitalDetail>
                </HospitalInfo>
                <RoutePreview>
                  <strong>🚑 Emergency Route:</strong><br />
                  📍 From: {locationInput || 'Your location'}<br />
                  🏥 To: {nearestHospital.name}<br />
                  📏 Distance: {nearestHospital.distance?.toFixed(1)} km<br />
                  ⏱️ Est. time: {Math.ceil(nearestHospital.distance / 40 * 60)} minutes
                </RoutePreview>
              </HospitalRoutingCard>
            )}

            <div style={{ 
              background: '#fef3c7', 
              border: '1px solid #f59e0b', 
              borderRadius: '0.5rem', 
              padding: '1rem', 
              marginBottom: '1rem' 
            }}>
              <div style={{ color: '#92400e', fontWeight: '500', marginBottom: '0.5rem' }}>
                ⚠️ Emergency Service Pricing
              </div>
              <div style={{ fontSize: '0.875rem', color: '#92400e' }}>
                In emergency cases, instead of using a fixed or system-generated price, the payment will be calculated dynamically based on the actual distance between:

Pickup Location (patient) ➡️ Drop Location (hospital)
              </div>
            </div>

            <Form onSubmit={handleSubmit}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Your Location:
                </label>
                <Input
                  type="text"
                  value={locationInput}
                  onChange={(e) => handleLocationInput(e.target.value)}
                  placeholder="Enter your location (e.g., Jaffna, Hospital Road, etc.)"
                />
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  {location ? '✓ Location found' : 'Start typing to find your location'}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Select Emergency Type:
                </label>
                <QuickButtons>
                  {emergencyTypes.map((type) => (
                    <QuickButton
                      key={type}
                      type="button"
                      className={selectedEmergency === type ? 'selected' : ''}
                      onClick={() => setSelectedEmergency(type)}
                    >
                      {type}
                    </QuickButton>
                  ))}
                </QuickButtons>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Additional Details:
                </label>
                <TextArea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe the emergency situation..."
                />
              </div>

              {nearestHospital && (
                <HospitalRoutingCard>
                  <HospitalHeader>
                    <MapPin size={16} />
                    Nearest Hospital
                  </HospitalHeader>
                  <HospitalInfo>
                    <HospitalName>{nearestHospital.name}</HospitalName>
                    <HospitalDetail>
                      <Clock size={14} />
                      Estimated Arrival: {nearestHospital.eta} minutes
                    </HospitalDetail>
                    <HospitalDetail>
                      <Phone size={14} />
                      Contact: {nearestHospital.phone}
                    </HospitalDetail>
                  </HospitalInfo>
                  <RoutePreview>
                    Route: {nearestHospital.route}
                  </RoutePreview>
                </HospitalRoutingCard>
              )}

              <ButtonGroup>
                <CancelButton type="button" onClick={handleClose}>
                  Cancel
                </CancelButton>
                <EmergencyButton2 type="submit" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Emergency Alert'}
                </EmergencyButton2>
              </ButtonGroup>
            </Form>
          </ModalContent>
        </Modal>
      )}
    </>
  );
};

export default EmergencyAlert;
