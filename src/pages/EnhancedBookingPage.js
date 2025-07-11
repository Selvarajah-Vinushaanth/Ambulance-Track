import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBooking } from '../contexts/BookingContext';
import { useForm } from 'react-hook-form';
import Header from '../components/Header';
import MapComponent from '../components/MapComponent';
import styled from 'styled-components';
import { MapPin, Phone, User, AlertCircle, Calendar, Clock, ArrowLeft, Navigation, Target, Loader } from 'lucide-react';
import { getLocationFromIP as getIPLocation, getCurrentPosition } from '../utils/geolocation';
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
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  height: fit-content;
`;

const MapSection = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  height: fit-content;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #dc2626;
  }

  &.error {
    border-color: #ef4444;
  }

  &:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s;
  resize: vertical;
  min-height: 100px;

  &:focus {
    outline: none;
    border-color: #dc2626;
  }

  &.error {
    border-color: #ef4444;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s;
  background: white;

  &:focus {
    outline: none;
    border-color: #dc2626;
  }

  &.error {
    border-color: #ef4444;
  }
`;

const ErrorMessage = styled.span`
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: block;
`;

const LocationButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const LocationButton = styled.button`
  padding: 0.5rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    border-color: #dc2626;
    background: #fef2f2;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CoordinateDisplay = styled.div`
  background: #f8fafc;
  padding: 0.75rem;
  border-radius: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
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

const PriorityBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 1rem;
  
  ${props => {
    switch (props.priority) {
      case 'critical':
        return 'background: #fee2e2; color: #dc2626;';
      case 'high':
        return 'background: #fef3c7; color: #d97706;';
      case 'medium':
        return 'background: #dbeafe; color: #2563eb;';
      case 'low':
        return 'background: #dcfce7; color: #16a34a;';
      default:
        return 'background: #f3f4f6; color: #6b7280;';
    }
  }}
`;

const EstimatedFare = styled.div`
  background: #f0f9ff;
  border: 1px solid #e0f2fe;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const FareTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #0c4a6e;
  margin: 0 0 0.5rem 0;
`;

const FareBreakdown = styled.div`
  color: #0369a1;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const BookingPage = () => {
  const { user } = useAuth();
  const { createBooking, loading } = useBooking();
  const navigate = useNavigate();
  const [pickupLocation, setPickupLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [estimatedFare, setEstimatedFare] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [hospitals, setHospitals] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    getValues
  } = useForm({
    defaultValues: {
      patientName: user?.name || '',
      patientPhone: user?.phone || '',
      priority: 'medium'
    }
  });

  const watchedPriority = watch('priority');

  useEffect(() => {
    // Get user's current location automatically
    getInitialLocation();
    // Fetch nearby hospitals
    fetchNearbyHospitals();
  }, []);

  useEffect(() => {
    // Calculate estimated fare when locations change
    if (pickupLocation && destinationLocation) {
      calculateEstimatedFare();
    }
  }, [pickupLocation, destinationLocation, watchedPriority]);

  const getInitialLocation = async () => {
    try {
      // Try GPS first, then fallback to IP
      const position = await getCurrentPosition();
      setPickupLocation(position);
      setValue('pickupLocation', `${position.lat},${position.lng}`);
      toast.success('Current location detected automatically');
    } catch (error) {
      try {
        const ipLocation = await getIPLocation();
        setPickupLocation(ipLocation);
        setValue('pickupLocation', `${ipLocation.lat},${ipLocation.lng}`);
        toast.success('Location detected from IP');
      } catch (ipError) {
        toast.error('Unable to detect location automatically');
      }
    }
  };

  const fetchNearbyHospitals = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/hospitals');
      if (response.ok) {
        const data = await response.json();
        setHospitals(data);
      }
    } catch (error) {
      console.error('Failed to fetch hospitals:', error);
    }
  };

  const calculateEstimatedFare = () => {
    if (!pickupLocation || !destinationLocation) return;

    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = (destinationLocation.lat - pickupLocation.lat) * Math.PI / 180;
    const dLon = (destinationLocation.lng - pickupLocation.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(pickupLocation.lat * Math.PI / 180) * Math.cos(destinationLocation.lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    // Calculate fare based on distance and priority
    const baseFare = 50;
    const distanceFare = distance * 2; // $2 per km
    const priorityMultiplier = {
      low: 1,
      medium: 1.2,
      high: 1.5,
      critical: 2
    };

    const totalFare = (baseFare + distanceFare) * priorityMultiplier[watchedPriority];

    setEstimatedFare({
      baseFare,
      distanceFare,
      priorityMultiplier: priorityMultiplier[watchedPriority],
      totalFare,
      distance: distance.toFixed(2)
    });
  };

  const getCurrentLocationAccurate = async () => {
    setGettingLocation(true);
    try {
      const position = await getCurrentPosition();
      setPickupLocation(position);
      setValue('pickupLocation', `${position.lat},${position.lng}`);
      
      // Reverse geocode to get address
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}`
        );
        const data = await response.json();
        if (data.display_name) {
          setValue('pickupAddress', data.display_name);
        }
      } catch (geocodeError) {
        console.error('Geocoding error:', geocodeError);
      }
      
      toast.success('Precise location obtained');
    } catch (error) {
      toast.error('Unable to get precise location');
    } finally {
      setGettingLocation(false);
    }
  };

  const getLocationFromIPHandler = async () => {
    setGettingLocation(true);
    try {
      const location = await getIPLocation();
      setPickupLocation(location);
      setValue('pickupLocation', `${location.lat},${location.lng}`);
      setValue('pickupAddress', `${location.city}, ${location.country}`);
      toast.success('Location detected from IP');
    } catch (error) {
      toast.error('Unable to detect location');
    } finally {
      setGettingLocation(false);
    }
  };

  const selectHospital = (hospital) => {
    const location = { lat: hospital.location.lat, lng: hospital.location.lng };
    setDestinationLocation(location);
    setValue('destinationLocation', `${hospital.location.lat},${hospital.location.lng}`);
    setValue('destinationAddress', hospital.address);
    toast.success(`Selected ${hospital.name}`);
  };

  const handleAddressChange = async (field, value) => {
    if (value.length > 3) {
      // Simple geocoding for demo - in production, use a proper geocoding service
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=1`
        );
        const data = await response.json();
        if (data.length > 0) {
          const location = {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
          };
          
          if (field === 'pickupAddress') {
            setPickupLocation(location);
            setValue('pickupLocation', `${location.lat},${location.lng}`);
          } else if (field === 'destinationAddress') {
            setDestinationLocation(location);
            setValue('destinationLocation', `${location.lat},${location.lng}`);
          }
        }
      } catch (error) {
        console.error('Geocoding error:', error);
      }
    }
  };

  const onSubmit = async (data) => {
    try {
      const bookingData = {
        ...data,
        pickupLocation: pickupLocation ? `${pickupLocation.lat},${pickupLocation.lng}` : data.pickupLocation,
        destinationLocation: destinationLocation ? `${destinationLocation.lat},${destinationLocation.lng}` : data.destinationLocation,
        route: estimatedFare ? {
          distance: parseFloat(estimatedFare.distance),
          estimatedFare: estimatedFare.totalFare
        } : null
      };

      const booking = await createBooking(bookingData);
      toast.success('Booking created successfully!');
      navigate(`/track/${booking._id}`);
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to create booking. Please try again.');
    }
  };

  const handleBack = () => {
    navigate('/patient');
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return '#dc2626';
      case 'high': return '#d97706';
      case 'medium': return '#2563eb';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
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
            <SectionTitle>
              <Calendar size={20} />
              Booking Details
            </SectionTitle>

            <PriorityBadge priority={watchedPriority}>
              <AlertCircle size={16} />
              {watchedPriority.toUpperCase()} Priority
            </PriorityBadge>

            <FormGroup>
              <Label>Patient Name</Label>
              <Input
                {...register('patientName', { required: 'Patient name is required' })}
                className={errors.patientName ? 'error' : ''}
              />
              {errors.patientName && <ErrorMessage>{errors.patientName.message}</ErrorMessage>}
            </FormGroup>

            <FormGroup>
              <Label>Patient Phone</Label>
              <Input
                {...register('patientPhone', { required: 'Phone number is required' })}
                className={errors.patientPhone ? 'error' : ''}
              />
              {errors.patientPhone && <ErrorMessage>{errors.patientPhone.message}</ErrorMessage>}
            </FormGroup>

            <FormGroup>
              <Label>Priority Level</Label>
              <Select
                {...register('priority', { required: 'Priority is required' })}
                className={errors.priority ? 'error' : ''}
              >
                <option value="low">Low - Non-urgent transport</option>
                <option value="medium">Medium - Standard emergency</option>
                <option value="high">High - Urgent medical attention</option>
                <option value="critical">Critical - Life-threatening</option>
              </Select>
              {errors.priority && <ErrorMessage>{errors.priority.message}</ErrorMessage>}
            </FormGroup>

            <FormGroup>
              <Label>Pickup Address</Label>
              <Input
                {...register('pickupAddress', { required: 'Pickup address is required' })}
                className={errors.pickupAddress ? 'error' : ''}
                onChange={(e) => handleAddressChange('pickupAddress', e.target.value)}
              />
              <LocationButtonGroup>
                <LocationButton 
                  type="button" 
                  onClick={getCurrentLocationAccurate}
                  disabled={gettingLocation}
                >
                  {gettingLocation ? <Loader size={16} /> : <Navigation size={16} />}
                  GPS Location
                </LocationButton>
                <LocationButton 
                  type="button" 
                  onClick={getLocationFromIPHandler}
                  disabled={gettingLocation}
                >
                  {gettingLocation ? <Loader size={16} /> : <Target size={16} />}
                  IP Location
                </LocationButton>
              </LocationButtonGroup>
              {pickupLocation && (
                <CoordinateDisplay>
                  📍 {pickupLocation.lat.toFixed(6)}, {pickupLocation.lng.toFixed(6)}
                </CoordinateDisplay>
              )}
              {errors.pickupAddress && <ErrorMessage>{errors.pickupAddress.message}</ErrorMessage>}
            </FormGroup>

            <FormGroup>
              <Label>Destination Address</Label>
              <Input
                {...register('destinationAddress', { required: 'Destination address is required' })}
                className={errors.destinationAddress ? 'error' : ''}
                onChange={(e) => handleAddressChange('destinationAddress', e.target.value)}
              />
              {destinationLocation && (
                <CoordinateDisplay>
                  📍 {destinationLocation.lat.toFixed(6)}, {destinationLocation.lng.toFixed(6)}
                </CoordinateDisplay>
              )}
              {errors.destinationAddress && <ErrorMessage>{errors.destinationAddress.message}</ErrorMessage>}
            </FormGroup>

            {hospitals.length > 0 && (
              <FormGroup>
                <Label>Quick Select Hospital</Label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {hospitals.slice(0, 3).map((hospital) => (
                    <LocationButton
                      key={hospital._id}
                      type="button"
                      onClick={() => selectHospital(hospital)}
                    >
                      🏥 {hospital.name}
                    </LocationButton>
                  ))}
                </div>
              </FormGroup>
            )}

            <FormGroup>
              <Label>Medical Condition</Label>
              <TextArea
                {...register('medicalCondition', { required: 'Medical condition is required' })}
                className={errors.medicalCondition ? 'error' : ''}
                placeholder="Describe the medical condition or emergency..."
              />
              {errors.medicalCondition && <ErrorMessage>{errors.medicalCondition.message}</ErrorMessage>}
            </FormGroup>

            <FormGroup>
              <Label>Emergency Contact</Label>
              <Input
                {...register('emergencyContact')}
                placeholder="Emergency contact name"
              />
            </FormGroup>

            <FormGroup>
              <Label>Emergency Contact Phone</Label>
              <Input
                {...register('emergencyContactPhone')}
                placeholder="Emergency contact phone"
              />
            </FormGroup>

            {estimatedFare && (
              <EstimatedFare>
                <FareTitle>Estimated Fare</FareTitle>
                <FareBreakdown>
                  Base fare: ${estimatedFare.baseFare.toFixed(2)}<br />
                  Distance ({estimatedFare.distance} km): ${estimatedFare.distanceFare.toFixed(2)}<br />
                  Priority multiplier: {estimatedFare.priorityMultiplier}x<br />
                  <strong>Total: ${estimatedFare.totalFare.toFixed(2)}</strong>
                </FareBreakdown>
              </EstimatedFare>
            )}

            <SubmitButton type="submit" disabled={loading}>
              {loading ? <Loader size={16} /> : <Phone size={16} />}
              {loading ? 'Creating Booking...' : 'Book Ambulance'}
            </SubmitButton>
          </FormSection>

          <MapSection>
            <SectionTitle>
              <MapPin size={20} />
              Location Preview
            </SectionTitle>
            <MapComponent
              ambulanceLocation={null}
              patientLocation={pickupLocation}
              destination={destinationLocation}
              showAmbulance={false}
              showPatient={true}
              showRoute={false}
            />
          </MapSection>
        </BookingForm>
      </Main>
    </Container>
  );
};

export default BookingPage;
