import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

const BookingContext = createContext();

const bookingReducer = (state, action) => {
  switch (action.type) {
    case 'SET_BOOKINGS':
      return { ...state, bookings: action.payload };
    case 'ADD_BOOKING':
      return { ...state, bookings: [...state.bookings, action.payload] };
    case 'UPDATE_BOOKING':
      return {
        ...state,
        bookings: state.bookings.map(booking =>
          booking._id === action.payload._id ? action.payload : booking
        )
      };
    case 'SET_ACTIVE_BOOKING':
      return { ...state, activeBooking: action.payload };
    case 'SET_DRIVERS':
      return { ...state, drivers: action.payload };
    case 'UPDATE_DRIVER_LOCATION':
      return {
        ...state,
        drivers: state.drivers.map(driver =>
          driver._id === action.payload.driverId
            ? { ...driver, location: action.payload.location }
            : driver
        )
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

export const BookingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(bookingReducer, {
    bookings: [],
    activeBooking: null,
    drivers: [],
    socket: null,
    loading: false
  });

  useEffect(() => {
    const socket = io('http://localhost:5000');
    
    socket.on('bookingUpdated', (booking) => {
      dispatch({ type: 'UPDATE_BOOKING', payload: booking });
    });

    socket.on('driverLocationUpdated', (data) => {
      dispatch({ type: 'UPDATE_DRIVER_LOCATION', payload: data });
    });

    return () => socket.close();
  }, []);

  const createBooking = async (bookingData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await axios.post('http://localhost:5000/api/bookings', bookingData);
      
      dispatch({ type: 'ADD_BOOKING', payload: response.data });
      toast.success('Booking created successfully!');
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create booking');
      return null;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const getBookings = async (userId, role) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await axios.get(`http://localhost:5000/api/bookings?userId=${userId}&role=${role}`);
      dispatch({ type: 'SET_BOOKINGS', payload: response.data });
    } catch (error) {
      toast.error('Failed to fetch bookings');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      const response = await axios.patch(`http://localhost:5000/api/bookings/${bookingId}/status`, {
        status
      });
      
      dispatch({ type: 'UPDATE_BOOKING', payload: response.data });
      toast.success('Booking status updated!');
      return response.data;
    } catch (error) {
      toast.error('Failed to update booking status');
      return null;
    }
  };

  const assignDriver = async (bookingId, driverId) => {
    try {
      const response = await axios.patch(`http://localhost:5000/api/bookings/${bookingId}/assign`, {
        driverId
      });
      
      dispatch({ type: 'UPDATE_BOOKING', payload: response.data });
      toast.success('Driver assigned successfully!');
      return response.data;
    } catch (error) {
      toast.error('Failed to assign driver');
      return null;
    }
  };

  const getDrivers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/drivers');
      dispatch({ type: 'SET_DRIVERS', payload: response.data });
    } catch (error) {
      toast.error('Failed to fetch drivers');
    }
  };

  const updateDriverLocation = async (location) => {
    try {
      await axios.patch('http://localhost:5000/api/drivers/location', { location });
    } catch (error) {
      console.error('Failed to update driver location:', error);
    }
  };

  const getBookingById = async (bookingId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/bookings/${bookingId}`);
      dispatch({ type: 'SET_ACTIVE_BOOKING', payload: response.data });
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch booking details');
      return null;
    }
  };

  return (
    <BookingContext.Provider value={{
      bookings: state.bookings,
      activeBooking: state.activeBooking,
      drivers: state.drivers,
      loading: state.loading,
      createBooking,
      getBookings,
      updateBookingStatus,
      assignDriver,
      getDrivers,
      updateDriverLocation,
      getBookingById
    }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
