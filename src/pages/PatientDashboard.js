import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBooking } from '../contexts/BookingContext';
import Header from '../components/Header';
import BookingCard from '../components/BookingCard';
import styled from 'styled-components';
import { Plus, Calendar, Clock, CheckCircle, XCircle, MapPin } from 'lucide-react';

const Container = styled.div`
  min-height: 100vh;
  background: #f8fafc;
`;

const Main = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const WelcomeSection = styled.section`
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const WelcomeTitle = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
`;

const WelcomeSubtitle = styled.p`
  font-size: 1.125rem;
  opacity: 0.9;
  margin-bottom: 1.5rem;
`;

const ActionButton = styled.button`
  background: white;
  color: #dc2626;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover {
    background: #f9fafb;
    transform: translateY(-1px);
  }
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
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #dc2626;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const StatIcon = styled.div`
  color: #dc2626;
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

const EmptyStateSubtext = styled.p`
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
`;

const PatientDashboard = () => {
  const { user } = useAuth();
  const { bookings, getBookings, loading } = useBooking();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      getBookings(user.id, user.role);
    }
  }, [user]);

  const handleNewBooking = () => {
    navigate('/book');
  };

  const handleTrackBooking = (bookingId) => {
    navigate(`/track/${bookingId}`);
  };

  // Calculate statistics
  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const activeBookings = bookings.filter(b => ['assigned', 'en_route', 'arrived'].includes(b.status)).length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;

  // Get recent bookings (last 5)
  const recentBookings = bookings
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // Get active bookings
  const activeBookingsList = bookings.filter(b => 
    ['assigned', 'en_route', 'arrived'].includes(b.status)
  );

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
        <WelcomeSection>
          <WelcomeTitle>Welcome back, {user?.name}!</WelcomeTitle>
          <WelcomeSubtitle>
            Need emergency medical assistance? Book an ambulance instantly.
          </WelcomeSubtitle>
          <ActionButton onClick={handleNewBooking}>
            <Plus size={20} />
            Book New Ambulance
          </ActionButton>
        </WelcomeSection>

        <StatsGrid>
          <StatCard>
            <StatIcon>
              <Calendar size={24} />
            </StatIcon>
            <StatNumber>{totalBookings}</StatNumber>
            <StatLabel>Total Bookings</StatLabel>
          </StatCard>
          <StatCard>
            <StatIcon>
              <Clock size={24} />
            </StatIcon>
            <StatNumber>{pendingBookings}</StatNumber>
            <StatLabel>Pending</StatLabel>
          </StatCard>
          <StatCard>
            <StatIcon>
              <MapPin size={24} />
            </StatIcon>
            <StatNumber>{activeBookings}</StatNumber>
            <StatLabel>Active</StatLabel>
          </StatCard>
          <StatCard>
            <StatIcon>
              <CheckCircle size={24} />
            </StatIcon>
            <StatNumber>{completedBookings}</StatNumber>
            <StatLabel>Completed</StatLabel>
          </StatCard>
        </StatsGrid>

        {activeBookingsList.length > 0 && (
          <Section>
            <SectionTitle>Active Bookings</SectionTitle>
            {activeBookingsList.map(booking => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onTrack={handleTrackBooking}
                userRole={user.role}
              />
            ))}
          </Section>
        )}

        <Section>
          <SectionTitle>Recent Bookings</SectionTitle>
          {recentBookings.length > 0 ? (
            recentBookings.map(booking => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onTrack={handleTrackBooking}
                userRole={user.role}
              />
            ))
          ) : (
            <EmptyState>
              <EmptyStateIcon>🚑</EmptyStateIcon>
              <EmptyStateText>No bookings yet</EmptyStateText>
              <EmptyStateSubtext>
                Click "Book New Ambulance" to request emergency medical assistance.
              </EmptyStateSubtext>
              <ActionButton onClick={handleNewBooking}>
                <Plus size={20} />
                Book Your First Ambulance
              </ActionButton>
            </EmptyState>
          )}
        </Section>
      </Main>
    </Container>
  );
};

export default PatientDashboard;
