import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBooking } from '../contexts/BookingContext';
import { useForm } from 'react-hook-form';
import Header from '../components/Header';
import MapComponent from '../components/MapComponent';
import styled from 'styled-components';
import { MapPin, Phone, User, AlertCircle, Calendar, Clock, ArrowLeft } from 'lucide-react';
import { getLocationFromIP, getCurrentPosition } from '../utils/geolocation';

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

const BookingForm = styled.form`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormSection = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
`;

const InputGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const InputWrapper = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  padding-left: 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    outline: none;
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  padding-left: 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  resize: vertical;
  min-height: 100px;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    outline: none;
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  padding-left: 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  background: white;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    outline: none;
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }
`;

const Icon = styled.div`
  position: absolute;
  left: 0.75rem;
  top: 0.75rem;
  color: #6b7280;
`;

const ErrorMessage = styled.span`
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: block;
`;

const LocationButton = styled.button`
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
  margin-top: 0.5rem;
  transition: background-color 0.2s;

  &:hover {
    background: #2563eb;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const PriorityGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const PriorityButton = styled.button`
  padding: 0.75rem;
  border: 1px solid ${props => props.selected ? '#dc2626' : '#d1d5db'};
  background: ${props => props.selected ? '#dc2626' : 'white'};
  color: ${props => props.selected ? 'white' : '#374151'};
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  text-align: center;
  transition: all 0.2s;

  &:hover {
    border-color: #dc2626;
    background: ${props => props.selected ? '#b91c1c' : '#fef2f2'};
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background: #b91c1c;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const MapSection = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  height: fit-content;
`;

const LocationInfo = styled.div`
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
`;

const BookingPage = () => {
  const { user } = useAuth();
  const { createBooking, loading } = useBooking();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm();
  
  const [currentLocation, setCurrentLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [priority, setPriority] = useState('medium');

  const pickupLocation = watch('pickupLocation');
  const destinationLocation = watch('destinationLocation');

  useEffect(() => {
    // Get user's approximate location on component mount
    getApproximateLocation();
  }, []);

  const getApproximateLocation = async () => {
    try {
      setGettingLocation(true);
      const location = await getLocationFromIP();
      setCurrentLocation(location);
    } catch (error) {
      console.error('Failed to get location:', error);
    } finally {
      setGettingLocation(false);
    }
  };

  const getCurrentLocationAccurate = async () => {
    try {
      setGettingLocation(true);
      const position = await getCurrentPosition();
      setCurrentLocation(position);
      setValue('pickupLocation', `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`);
    } catch (error) {
      console.error('Failed to get precise location:', error);
    } finally {
      setGettingLocation(false);
    }
  };

  const onSubmit = async (data) => {
    const bookingData = {
      patientName: data.patientName,
      patientPhone: data.patientPhone,
      pickupAddress: data.pickupAddress,
      pickupLocation: data.pickupLocation,
      destinationAddress: data.destinationAddress,
      destinationLocation: data.destinationLocation,
      medicalCondition: data.medicalCondition,
      priority: priority,
      emergencyContact: data.emergencyContact,
      emergencyContactPhone: data.emergencyContactPhone
    };

    const booking = await createBooking(bookingData);
    if (booking) {
      navigate(`/track/${booking._id}`);
    }
  };

  const handleBack = () => {
    navigate('/patient');
  };

  return (
    <Container>
      <Header />
      <Main>
        <BackButton onClick={handleBack}>
          <ArrowLeft size={16} />
          Back to Dashboard
        </BackButton>

        <BookingForm onSubmit={handleSubmit(onSubmit)}>
          <FormSection>
            <SectionTitle>Emergency Details</SectionTitle>
            
            <InputGroup>
              <Label htmlFor="patientName">Patient Name</Label>
              <InputWrapper>
                <Icon>
                  <User size={20} />
                </Icon>
                <Input
                  id="patientName"
                  type="text"
                  placeholder="Enter patient's full name"
                  {...register('patientName', {
                    required: 'Patient name is required'
                  })}
                />
              </InputWrapper>
              {errors.patientName && <ErrorMessage>{errors.patientName.message}</ErrorMessage>}
            </InputGroup>

            <InputGroup>
              <Label htmlFor="patientPhone">Patient Phone</Label>
              <InputWrapper>
                <Icon>
                  <Phone size={20} />
                </Icon>
                <Input
                  id="patientPhone"
                  type="tel"
                  placeholder="Enter patient's phone number"
                  {...register('patientPhone', {
                    required: 'Phone number is required'
                  })}
                />
              </InputWrapper>
              {errors.patientPhone && <ErrorMessage>{errors.patientPhone.message}</ErrorMessage>}
            </InputGroup>

            <InputGroup>
              <Label htmlFor="medicalCondition">Medical Condition / Emergency</Label>
              <InputWrapper>
                <Icon>
                  <AlertCircle size={20} />
                </Icon>
                <TextArea
                  id="medicalCondition"
                  placeholder="Describe the medical emergency or condition"
                  {...register('medicalCondition', {
                    required: 'Medical condition description is required'
                  })}
                />
              </InputWrapper>
              {errors.medicalCondition && <ErrorMessage>{errors.medicalCondition.message}</ErrorMessage>}
            </InputGroup>

            <InputGroup>
              <Label>Priority Level</Label>
              <PriorityGrid>
                <PriorityButton
                  type="button"
                  selected={priority === 'low'}
                  onClick={() => setPriority('low')}
                >
                  Low
                </PriorityButton>
                <PriorityButton
                  type="button"
                  selected={priority === 'medium'}
                  onClick={() => setPriority('medium')}
                >
                  Medium
                </PriorityButton>
                <PriorityButton
                  type="button"
                  selected={priority === 'high'}
                  onClick={() => setPriority('high')}
                >
                  High
                </PriorityButton>
              </PriorityGrid>
            </InputGroup>

            <InputGroup>
              <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
              <InputWrapper>
                <Icon>
                  <User size={20} />
                </Icon>
                <Input
                  id="emergencyContact"
                  type="text"
                  placeholder="Emergency contact person"
                  {...register('emergencyContact')}
                />
              </InputWrapper>
            </InputGroup>

            <InputGroup>
              <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
              <InputWrapper>
                <Icon>
                  <Phone size={20} />
                </Icon>
                <Input
                  id="emergencyContactPhone"
                  type="tel"
                  placeholder="Emergency contact phone number"
                  {...register('emergencyContactPhone')}
                />
              </InputWrapper>
            </InputGroup>
          </FormSection>

          <div>
            <FormSection>
              <SectionTitle>Location Details</SectionTitle>
              
              <InputGroup>
                <Label htmlFor="pickupAddress">Pickup Address</Label>
                <InputWrapper>
                  <Icon>
                    <MapPin size={20} />
                  </Icon>
                  <Input
                    id="pickupAddress"
                    type="text"
                    placeholder="Enter pickup address"
                    {...register('pickupAddress', {
                      required: 'Pickup address is required'
                    })}
                  />
                </InputWrapper>
                {errors.pickupAddress && <ErrorMessage>{errors.pickupAddress.message}</ErrorMessage>}
                <LocationButton
                  type="button"
                  onClick={getCurrentLocationAccurate}
                  disabled={gettingLocation}
                >
                  <MapPin size={16} />
                  {gettingLocation ? 'Getting Location...' : 'Use Current Location'}
                </LocationButton>
              </InputGroup>

              <InputGroup>
                <Label htmlFor="pickupLocation">Pickup Coordinates</Label>
                <InputWrapper>
                  <Icon>
                    <MapPin size={20} />
                  </Icon>
                  <Input
                    id="pickupLocation"
                    type="text"
                    placeholder="Latitude, Longitude"
                    {...register('pickupLocation', {
                      required: 'Pickup coordinates are required'
                    })}
                  />
                </InputWrapper>
                {errors.pickupLocation && <ErrorMessage>{errors.pickupLocation.message}</ErrorMessage>}
              </InputGroup>

              <InputGroup>
                <Label htmlFor="destinationAddress">Destination (Hospital)</Label>
                <InputWrapper>
                  <Icon>
                    <MapPin size={20} />
                  </Icon>
                  <Input
                    id="destinationAddress"
                    type="text"
                    placeholder="Enter hospital or destination address"
                    {...register('destinationAddress', {
                      required: 'Destination address is required'
                    })}
                  />
                </InputWrapper>
                {errors.destinationAddress && <ErrorMessage>{errors.destinationAddress.message}</ErrorMessage>}
              </InputGroup>

              <InputGroup>
                <Label htmlFor="destinationLocation">Destination Coordinates</Label>
                <InputWrapper>
                  <Icon>
                    <MapPin size={20} />
                  </Icon>
                  <Input
                    id="destinationLocation"
                    type="text"
                    placeholder="Latitude, Longitude"
                    {...register('destinationLocation', {
                      required: 'Destination coordinates are required'
                    })}
                  />
                </InputWrapper>
                {errors.destinationLocation && <ErrorMessage>{errors.destinationLocation.message}</ErrorMessage>}
              </InputGroup>

              <SubmitButton type="submit" disabled={loading}>
                {loading ? 'Creating Booking...' : 'Book Ambulance'}
              </SubmitButton>
            </FormSection>

            <MapSection>
              <SectionTitle>Location Preview</SectionTitle>
              {currentLocation && (
                <LocationInfo>
                  <strong>Your approximate location:</strong><br />
                  {currentLocation.city}, {currentLocation.country}<br />
                  IP: {currentLocation.ip}
                </LocationInfo>
              )}
              <MapComponent
                patientLocation={currentLocation}
                showAmbulance={false}
                showPatient={true}
                center={currentLocation ? [currentLocation.lat, currentLocation.lng] : null}
              />
            </MapSection>
          </div>
        </BookingForm>
      </Main>
    </Container>
  );
};

export default BookingPage;
