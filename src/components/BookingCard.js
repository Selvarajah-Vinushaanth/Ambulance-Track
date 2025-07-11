import React from 'react';
import styled from 'styled-components';
import { Clock, MapPin, User, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const Card = styled.div`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 12px -1px rgba(0, 0, 0, 0.15);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: start;
  margin-bottom: 1rem;
`;

const BookingId = styled.h3`
  color: #1f2937;
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: capitalize;
  
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
  ${props => props.status === 'completed' && 'animation: pulse 2s infinite;'}
  
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

const Priority = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  ${props => {
    switch (props.priority) {
      case 'high':
        return 'background: #fee2e2; color: #dc2626;';
      case 'medium':
        return 'background: #fef3c7; color: #92400e;';
      case 'low':
        return 'background: #d1fae5; color: #065f46;';
      default:
        return 'background: #f3f4f6; color: #374151;';
    }
  }}
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
`;

const InfoValue = styled.span`
  color: #1f2937;
  font-weight: 500;
`;

const Description = styled.p`
  color: #6b7280;
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
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
      case 'success':
        return `
          background: #10b981;
          color: white;
          &:hover { background: #059669; }
        `;
      case 'warning':
        return `
          background: #f59e0b;
          color: white;
          &:hover { background: #d97706; }
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

const BookingCard = ({ booking, onStatusUpdate, onAssignDriver, onTrack, userRole }) => {
  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      assigned: '#3b82f6',
      en_route: '#f59e0b',
      arrived: '#10b981',
      completed: '#059669',
      cancelled: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const formatDateTime = (dateString) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const canUpdateStatus = (currentStatus, newStatus) => {
    const statusFlow = {
      pending: ['assigned', 'cancelled'],
      assigned: ['en_route', 'cancelled'],
      en_route: ['arrived', 'cancelled'],
      arrived: ['completed', 'cancelled'],
      completed: [],
      cancelled: []
    };
    return statusFlow[currentStatus]?.includes(newStatus);
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <BookingId>Booking #{booking._id?.slice(-6)}</BookingId>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <StatusBadge status={booking.status}>
              {booking.status === 'completed' && <CheckCircle size={14} style={{ marginRight: '0.25rem' }} />}
              {booking.status}
            </StatusBadge>
            {booking.priority && (
              <Priority priority={booking.priority}>
                {booking.priority === 'high' && <AlertCircle size={14} />}
                {booking.priority}
              </Priority>
            )}
          </div>
        </div>
      </CardHeader>

      <InfoGrid>
        <InfoItem>
          <User size={16} />
          <span>Patient: <InfoValue>{booking.patientName}</InfoValue></span>
        </InfoItem>
        <InfoItem>
          <Calendar size={16} />
          <span>Created: <InfoValue>{formatDateTime(booking.createdAt)}</InfoValue></span>
        </InfoItem>
        <InfoItem>
          <MapPin size={16} />
          <span>From: <InfoValue>{booking.pickupAddress}</InfoValue></span>
        </InfoItem>
        <InfoItem>
          <MapPin size={16} />
          <span>To: <InfoValue>{booking.destinationAddress}</InfoValue></span>
        </InfoItem>
        {booking.driver && (
          <InfoItem>
            <User size={16} />
            <span>Driver: <InfoValue>{booking.driver.name}</InfoValue></span>
          </InfoItem>
        )}
        {booking.estimatedArrival && (
          <InfoItem>
            <Clock size={16} />
            <span>ETA: <InfoValue>{formatDateTime(booking.estimatedArrival)}</InfoValue></span>
          </InfoItem>
        )}
      </InfoGrid>

      {booking.medicalCondition && (
        <Description>
          <strong>Medical Condition:</strong> {booking.medicalCondition}
        </Description>
      )}

      <Actions>
        {onTrack && (
          <Button variant="secondary" onClick={() => onTrack(booking._id)}>
            Track Ambulance
          </Button>
        )}

        {userRole === 'admin' && booking.status === 'pending' && onAssignDriver && (
          <Button variant="primary" onClick={() => onAssignDriver(booking._id)}>
            Assign Driver
          </Button>
        )}

        {userRole === 'driver' && booking.status === 'assigned' && onStatusUpdate && (
          <Button variant="success" onClick={() => onStatusUpdate(booking._id, 'en_route')}>
            Start Journey
          </Button>
        )}

        {userRole === 'driver' && booking.status === 'en_route' && onStatusUpdate && (
          <Button variant="success" onClick={() => onStatusUpdate(booking._id, 'arrived')}>
            Mark Arrived
          </Button>
        )}

        {userRole === 'driver' && booking.status === 'arrived' && onStatusUpdate && (
          <Button variant="success" onClick={() => onStatusUpdate(booking._id, 'completed')}>
            Complete Journey
          </Button>
        )}

        {booking.status !== 'completed' && booking.status !== 'cancelled' && onStatusUpdate && (
          <Button variant="warning" onClick={() => onStatusUpdate(booking._id, 'cancelled')}>
            Cancel
          </Button>
        )}
      </Actions>
    </Card>
  );
};

export default BookingCard;
