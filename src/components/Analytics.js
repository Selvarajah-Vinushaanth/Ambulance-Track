import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ComposedChart, Area, AreaChart } from 'recharts';
import { TrendingUp, Users, DollarSign, Clock, Star, Activity, AlertTriangle, MapPin, Calendar, Award, Timer } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { format } from 'date-fns';

const Container = styled.div`
  padding: 2rem;
  background: #f8fafc;
  min-height: 100vh;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const Subtitle = styled.p`
  color: #6b7280;
  margin: 0.5rem 0 0 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const StatIcon = styled.div`
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  
  ${props => {
    switch (props.type) {
      case 'bookings':
        return 'background: #3b82f6;';
      case 'revenue':
        return 'background: #10b981;';
      case 'drivers':
        return 'background: #8b5cf6;';
      case 'rating':
        return 'background: #f59e0b;';
      case 'response':
        return 'background: #ef4444;';
      default:
        return 'background: #6b7280;';
    }
  }}
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const StatChange = styled.div`
  font-size: 0.75rem;
  color: ${props => props.positive ? '#10b981' : '#ef4444'};
  font-weight: 500;
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const LargeChartGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const SmallChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const ChartCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const ChartTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
`;

const TableCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.th`
  text-align: left;
  padding: 0.75rem;
  font-weight: 600;
  color: #1f2937;
  border-bottom: 2px solid #e5e7eb;
`;

const TableRow = styled.tr`
  &:hover {
    background: #f9fafb;
  }
`;

const TableCell = styled.td`
  padding: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
  color: #6b7280;
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${props => {
    switch (props.status) {
      case 'completed':
        return 'background: #dcfce7; color: #166534;';
      case 'pending':
        return 'background: #fef3c7; color: #92400e;';
      case 'cancelled':
        return 'background: #fee2e2; color: #dc2626;';
      default:
        return 'background: #f3f4f6; color: #374151;';
    }
  }}
`;

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Analytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAnalytics();
      fetchRecentBookings();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/analytics/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentBookings = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/bookings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecentBookings(data.slice(0, 10));
      }
    } catch (error) {
      console.error('Failed to fetch recent bookings:', error);
    }
  };

  if (!user || user.role !== 'admin') {
    return <div>Access denied. Admin privileges required.</div>;
  }

  if (loading) {
    return <LoadingSpinner message="Loading analytics..." />;
  }

  if (!analytics) {
    return <div>Failed to load analytics data.</div>;
  }

  const statusData = [
    { name: 'Completed', value: analytics.today.completedBookings, color: '#10b981' },
    { name: 'Cancelled', value: analytics.today.cancelledBookings, color: '#ef4444' },
    { name: 'Pending', value: analytics.today.pendingBookings || (analytics.today.totalBookings - analytics.today.completedBookings - analytics.today.cancelledBookings), color: '#f59e0b' }
  ];

  const priorityData = analytics.priorityDistribution?.map(item => ({
    _id: item._id || 'Unknown',
    count: item.count
  })) || [];

  const peakHoursData = analytics.peakHours?.map(item => ({
    hour: `${item._id}:00`,
    bookings: item.bookings
  })) || [];

  return (
    <Container>
      <Header>
        <Title>Analytics Dashboard</Title>
        <Subtitle>Real-time insights into your ambulance service performance</Subtitle>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatIcon type="bookings">
            <Activity size={24} />
          </StatIcon>
          <StatContent>
            <StatValue>{analytics.today.totalBookings}</StatValue>
            <StatLabel>Total Bookings Today</StatLabel>
            <StatChange positive={analytics.today.totalBookings > 0}>
              {analytics.monthly.totalBookings} this month
            </StatChange>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon type="revenue">
            <DollarSign size={24} />
          </StatIcon>
          <StatContent>
            <StatValue>${analytics.today.totalRevenue?.toFixed(2) || '0.00'}</StatValue>
            <StatLabel>Revenue Today</StatLabel>
            <StatChange positive={analytics.monthly.totalRevenue > 0}>
              ${analytics.monthly.totalRevenue?.toFixed(2) || '0.00'} this month
            </StatChange>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon type="drivers">
            <Users size={24} />
          </StatIcon>
          <StatContent>
            <StatValue>{analytics.activeDrivers}/{analytics.totalDrivers}</StatValue>
            <StatLabel>Active Drivers</StatLabel>
            <StatChange positive={analytics.activeDrivers > 0}>
              {((analytics.activeDrivers / analytics.totalDrivers) * 100).toFixed(1)}% available
            </StatChange>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon type="rating">
            <Star size={24} />
          </StatIcon>
          <StatContent>
            <StatValue>{analytics.averageRating?.toFixed(1) || '5.0'}</StatValue>
            <StatLabel>Average Rating</StatLabel>
            <StatChange positive={analytics.averageRating >= 4}>
              {analytics.totalRatings} reviews
            </StatChange>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon type="response">
            <Timer size={24} />
          </StatIcon>
          <StatContent>
            <StatValue>{Math.round((analytics.responseTime?.avgResponseTime || 0) / 60000)} min</StatValue>
            <StatLabel>Avg Response Time</StatLabel>
            <StatChange positive={analytics.responseTime?.avgResponseTime < 600000}>
              Last 7 days
            </StatChange>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon type="bookings">
            <Calendar size={24} />
          </StatIcon>
          <StatContent>
            <StatValue>{analytics.today.completedBookings}</StatValue>
            <StatLabel>Completed Today</StatLabel>
            <StatChange positive={analytics.today.completedBookings > 0}>
              {analytics.monthly.completedBookings} this month
            </StatChange>
          </StatContent>
        </StatCard>
      </StatsGrid>

      <LargeChartGrid>
        <ChartCard>
          <ChartTitle>Weekly Performance Overview</ChartTitle>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={analytics.weekly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Bar yAxisId="left" dataKey="bookings" fill="#3b82f6" name="Bookings" />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} name="Revenue ($)" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </LargeChartGrid>

      <ChartsGrid>
        <ChartCard>
          <ChartTitle>Booking Status Distribution</ChartTitle>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard>
          <ChartTitle>Priority Distribution</ChartTitle>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </ChartsGrid>

      <SmallChartsGrid>
        <ChartCard>
          <ChartTitle>Peak Hours (Last 7 Days)</ChartTitle>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={peakHoursData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="bookings" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard>
          <ChartTitle>Response Time Analysis</ChartTitle>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
              {Math.round((analytics.responseTime?.avgResponseTime || 0) / 60000)} min
            </div>
            <div style={{ color: '#6b7280', marginBottom: '1rem' }}>Average Response Time</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#6b7280' }}>
              <div>
                Min: {Math.round((analytics.responseTime?.minResponseTime || 0) / 60000)} min
              </div>
              <div>
                Max: {Math.round((analytics.responseTime?.maxResponseTime || 0) / 60000)} min
              </div>
            </div>
          </div>
        </ChartCard>
      </SmallChartsGrid>

      <ChartsGrid>
        <TableCard>
          <ChartTitle>Top Performing Drivers</ChartTitle>
          <Table>
            <thead>
              <tr>
                <TableHeader>Driver ID</TableHeader>
                <TableHeader>Total Rides</TableHeader>
                <TableHeader>Rating</TableHeader>
                <TableHeader>Revenue</TableHeader>
              </tr>
            </thead>
            <tbody>
              {analytics.driverPerformance?.slice(0, 5).map((driver, index) => (
                <TableRow key={driver._id}>
                  <TableCell>#{driver._id.slice(-6)}</TableCell>
                  <TableCell>{driver.totalRides}</TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Star size={14} fill="#f59e0b" color="#f59e0b" />
                      {driver.avgRating?.toFixed(1) || '5.0'}
                    </div>
                  </TableCell>
                  <TableCell>${driver.totalRevenue?.toFixed(2) || '0.00'}</TableCell>
                </TableRow>
              )) || (
                <TableRow>
                  <TableCell colSpan="4" style={{ textAlign: 'center', color: '#6b7280' }}>
                    No driver performance data available
                  </TableCell>
                </TableRow>
              )}
            </tbody>
          </Table>
        </TableCard>

        <TableCard>
          <ChartTitle>Popular Routes</ChartTitle>
          <Table>
            <thead>
              <tr>
                <TableHeader>From</TableHeader>
                <TableHeader>To</TableHeader>
                <TableHeader>Bookings</TableHeader>
              </tr>
            </thead>
            <tbody>
              {analytics.popularRoutes?.slice(0, 5).map((route, index) => (
                <TableRow key={index}>
                  <TableCell style={{ fontSize: '0.75rem' }}>
                    {route._id.pickup?.substring(0, 30)}...
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem' }}>
                    {route._id.destination?.substring(0, 30)}...
                  </TableCell>
                  <TableCell>{route.count}</TableCell>
                </TableRow>
              )) || (
                <TableRow>
                  <TableCell colSpan="3" style={{ textAlign: 'center', color: '#6b7280' }}>
                    No route data available
                  </TableCell>
                </TableRow>
              )}
            </tbody>
          </Table>
        </TableCard>
      </ChartsGrid>

      <TableCard>
        <ChartTitle>Recent Bookings</ChartTitle>
        <Table>
          <thead>
            <tr>
              <TableHeader>ID</TableHeader>
              <TableHeader>Patient</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Priority</TableHeader>
              <TableHeader>Driver</TableHeader>
              <TableHeader>Revenue</TableHeader>
              <TableHeader>Created</TableHeader>
            </tr>
          </thead>
          <tbody>
            {recentBookings.map((booking) => (
              <TableRow key={booking._id}>
                <TableCell>#{booking._id.slice(-6)}</TableCell>
                <TableCell>{booking.patientName}</TableCell>
                <TableCell>
                  <StatusBadge status={booking.status}>
                    {booking.status}
                  </StatusBadge>
                </TableCell>
                <TableCell>
                  <StatusBadge status={booking.priority}>
                    {booking.priority}
                  </StatusBadge>
                </TableCell>
                <TableCell>{booking.driver?.name || 'Unassigned'}</TableCell>
                <TableCell>${booking.pricing?.totalFare?.toFixed(2) || '0.00'}</TableCell>
                <TableCell>{format(new Date(booking.createdAt), 'MMM dd, HH:mm')}</TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </TableCard>
    </Container>
  );
};

export default Analytics;
