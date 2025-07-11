import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBooking } from '../contexts/BookingContext';
import Header from '../components/Header';
import BookingCard from '../components/BookingCard';
import styled from 'styled-components';
import { Users, Calendar, Clock, CheckCircle, AlertTriangle, MapPin, UserCheck } from 'lucide-react';

const Container = styled.div`
  min-height: 100vh;
  background: #f8fafc;
`;

const Main = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: ${props => props.color || '#dc2626'};
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const StatIcon = styled.div`
  color: ${props => props.color || '#dc2626'};
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: center;
`;

const Section = styled.section`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
`;

const FilterBar = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const FilterButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid ${props => props.active ? '#dc2626' : '#d1d5db'};
  background: ${props => props.active ? '#dc2626' : 'white'};
  color: ${props => props.active ? 'white' : '#374151'};
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;

  &:hover {
    border-color: #dc2626;
    background: ${props => props.active ? '#b91c1c' : '#fef2f2'};
  }
`;

const DriversSection = styled.section`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const DriversGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
`;

const DriverCard = styled.div`
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  transition: all 0.2s;

  &:hover {
    border-color: #dc2626;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
`;

const DriverHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const DriverName = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const DriverStatus = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  background: ${props => props.available ? '#dcfce7' : '#fee2e2'};
  color: ${props => props.available ? '#166534' : '#dc2626'};
`;

const DriverInfo = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
`;

const AssignModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  margin-bottom: 1rem;
`;

const ModalTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;

  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: #dc2626;
          color: white;
          &:hover { background: #b91c1c; }
        `;
      case 'secondary':
        return `
          background: #f3f4f6;
          color: #374151;
          &:hover { background: #e5e7eb; }
        `;
      default:
        return `
          background: #6b7280;
          color: white;
          &:hover { background: #4b5563; }
        `;
    }
  }}
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

const AdminDashboard = () => {
  const { user } = useAuth();
  const { bookings, drivers, getBookings, getDrivers, assignDriver, updateBookingStatus, loading } = useBooking();
  const [statusFilter, setStatusFilter] = useState('all');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    if (user) {
      getBookings(user.id, user.role);
      getDrivers();
    }
  }, [user]);

  const handleAssignDriver = (bookingId) => {
    const booking = bookings.find(b => b._id === bookingId);
    setSelectedBooking(booking);
    setAssignModalOpen(true);
  };

  const handleConfirmAssign = async (driverId) => {
    if (selectedBooking && driverId) {
      await assignDriver(selectedBooking._id, driverId);
      setAssignModalOpen(false);
      setSelectedBooking(null);
    }
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    await updateBookingStatus(bookingId, newStatus);
  };

  // Calculate statistics
  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const activeBookings = bookings.filter(b => ['assigned', 'en_route', 'arrived'].includes(b.status)).length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;
  const availableDrivers = drivers.filter(d => d.available).length;

  // Filter bookings based on status
  const filteredBookings = statusFilter === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === statusFilter);

  const sortedBookings = filteredBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const statusFilters = [
    { value: 'all', label: 'All Bookings' },
    { value: 'pending', label: 'Pending' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'en_route', label: 'En Route' },
    { value: 'arrived', label: 'Arrived' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  if (loading) {
    return (
      <Container>
        <Header />
        <Main>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="loading-spinner" />
            <p>Loading admin dashboard...</p>
          </div>
        </Main>
      </Container>
    );
  }

  return (
    <Container>
      <Header />
      <Main>
        <StatsGrid>
          <StatCard>
            <StatIcon color="#dc2626">
              <Calendar size={24} />
            </StatIcon>
            <StatNumber color="#dc2626">{totalBookings}</StatNumber>
            <StatLabel>Total Bookings</StatLabel>
          </StatCard>
          <StatCard>
            <StatIcon color="#f59e0b">
              <Clock size={24} />
            </StatIcon>
            <StatNumber color="#f59e0b">{pendingBookings}</StatNumber>
            <StatLabel>Pending</StatLabel>
          </StatCard>
          <StatCard>
            <StatIcon color="#3b82f6">
              <MapPin size={24} />
            </StatIcon>
            <StatNumber color="#3b82f6">{activeBookings}</StatNumber>
            <StatLabel>Active</StatLabel>
          </StatCard>
          <StatCard>
            <StatIcon color="#10b981">
              <CheckCircle size={24} />
            </StatIcon>
            <StatNumber color="#10b981">{completedBookings}</StatNumber>
            <StatLabel>Completed</StatLabel>
          </StatCard>
          <StatCard>
            <StatIcon color="#8b5cf6">
              <UserCheck size={24} />
            </StatIcon>
            <StatNumber color="#8b5cf6">{availableDrivers}</StatNumber>
            <StatLabel>Available Drivers</StatLabel>
          </StatCard>
        </StatsGrid>

        <DriversSection>
          <SectionTitle>Drivers Status</SectionTitle>
          <DriversGrid>
            {drivers.map(driver => (
              <DriverCard key={driver._id}>
                <DriverHeader>
                  <DriverName>{driver.name}</DriverName>
                  <DriverStatus available={driver.available}>
                    {driver.available ? 'Available' : 'Busy'}
                  </DriverStatus>
                </DriverHeader>
                <DriverInfo>📞 {driver.phone}</DriverInfo>
                <DriverInfo>📧 {driver.email}</DriverInfo>
                {driver.currentBooking && (
                  <DriverInfo>
                    🚑 Currently on booking #{driver.currentBooking.slice(-6)}
                  </DriverInfo>
                )}
                {driver.location && (
                  <DriverInfo>
                    📍 Location: {driver.location.lat.toFixed(4)}, {driver.location.lng.toFixed(4)}
                  </DriverInfo>
                )}
              </DriverCard>
            ))}
          </DriversGrid>
        </DriversSection>

        <Section>
          <SectionTitle>Manage Bookings</SectionTitle>
          <FilterBar>
            {statusFilters.map(filter => (
              <FilterButton
                key={filter.value}
                active={statusFilter === filter.value}
                onClick={() => setStatusFilter(filter.value)}
              >
                {filter.label}
              </FilterButton>
            ))}
          </FilterBar>

          {sortedBookings.length > 0 ? (
            sortedBookings.map(booking => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onAssignDriver={handleAssignDriver}
                onStatusUpdate={handleStatusUpdate}
                userRole={user.role}
              />
            ))
          ) : (
            <EmptyState>
              <EmptyStateIcon>📋</EmptyStateIcon>
              <EmptyStateText>No bookings found</EmptyStateText>
              <p>
                {statusFilter === 'all' 
                  ? 'No bookings have been created yet.'
                  : `No bookings with status "${statusFilter}".`
                }
              </p>
            </EmptyState>
          )}
        </Section>

        {assignModalOpen && selectedBooking && (
          <AssignModal>
            <ModalContent>
              <ModalHeader>
                <ModalTitle>Assign Driver</ModalTitle>
                <p>Booking #{selectedBooking._id.slice(-6)} - {selectedBooking.patientName}</p>
              </ModalHeader>
              
              <DriversGrid>
                {drivers.filter(d => d.available).map(driver => (
                  <DriverCard key={driver._id}>
                    <DriverHeader>
                      <DriverName>{driver.name}</DriverName>
                      <DriverStatus available={true}>Available</DriverStatus>
                    </DriverHeader>
                    <DriverInfo>📞 {driver.phone}</DriverInfo>
                    <DriverInfo>📧 {driver.email}</DriverInfo>
                    <ModalActions>
                      <Button
                        variant="primary"
                        onClick={() => handleConfirmAssign(driver._id)}
                      >
                        Assign Driver
                      </Button>
                    </ModalActions>
                  </DriverCard>
                ))}
              </DriversGrid>

              <ModalActions>
                <Button
                  variant="secondary"
                  onClick={() => setAssignModalOpen(false)}
                >
                  Cancel
                </Button>
              </ModalActions>
            </ModalContent>
          </AssignModal>
        )}
      </Main>
    </Container>
  );
};

export default AdminDashboard;
