import React, { useState } from 'react';
import styled from 'styled-components';
import { AlertTriangle, Phone, MapPin, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBooking } from '../contexts/BookingContext';
import { getCurrentPosition } from '../utils/geolocation';
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

const EmergencyAlert = () => {
  const { user } = useAuth();
  const { createBooking } = useBooking();
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedEmergency, setSelectedEmergency] = useState('');

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

  const handleEmergencyClick = async () => {
    if (!user || user.role !== 'patient') {
      toast.error('Only patients can send emergency alerts');
      return;
    }

    setLoading(true);
    try {
      const position = await getCurrentPosition();
      setLocation(position);
      setShowModal(true);
    } catch (error) {
      console.error('Location error:', error);
      toast.error('Unable to get location. Please enable location services.');
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
        toast.success(`Emergency alert sent! Estimated cost: $${emergencyBooking.pricing?.totalFare?.toFixed(2) || '100.00'}`);
        setShowModal(false);
        setMessage('');
        setSelectedEmergency('');
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
                Location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </LocationInfo>
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
                • Base Emergency Fare: $100.00<br/>
                • Distance Rate: $5.00/km<br/>
                • Estimated Total: ~$150.00<br/>
                <small>* Final cost depends on actual distance and services required</small>
              </div>
            </div>

            <Form onSubmit={handleSubmit}>
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
