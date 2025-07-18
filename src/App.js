import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { GoogleMapsProvider } from './contexts/GoogleMapsContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PatientDashboard from './pages/PatientDashboard';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import BookingPage from './pages/EnhancedBookingPage';
import TrackingPage from './pages/TrackingPage';
import LoadingSpinner from './components/LoadingSpinner';
import EmergencyAlert from './components/EmergencyAlert';
import Analytics from './components/Analytics';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <GoogleMapsProvider>
      <div className="App">
        <Routes>
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to={`/${user.role}`} />} />
          <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to={`/${user.role}`} />} />
          
          {/* Protected Routes */}
          <Route 
            path="/patient" 
            element={user?.role === 'patient' ? <PatientDashboard /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/driver" 
            element={user?.role === 'driver' ? <DriverDashboard /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/admin" 
            element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/book" 
            element={user?.role === 'patient' ? <BookingPage /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/track/:bookingId" 
            element={user ? <TrackingPage /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/analytics" 
            element={user?.role === 'admin' ? <Analytics /> : <Navigate to="/login" />} 
          />
          
          {/* Default redirect */}
          <Route 
            path="/" 
            element={
              user ? (
                <Navigate to={`/${user.role}`} />
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
        </Routes>
        <EmergencyAlert />
      </div>
    </GoogleMapsProvider>
  );
}

export default App;
