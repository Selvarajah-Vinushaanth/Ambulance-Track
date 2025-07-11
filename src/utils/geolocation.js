// IP-based geolocation service
export const getLocationFromIP = async () => {
  try {
    // First try to get user's IP
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipResponse.json();
    
    // Then get location from IP
    const locationResponse = await fetch(`https://ipapi.co/${ipData.ip}/json/`);
    const locationData = await locationResponse.json();
    
    return {
      lat: locationData.latitude,
      lng: locationData.longitude,
      city: locationData.city,
      country: locationData.country_name,
      ip: ipData.ip
    };
  } catch (error) {
    console.error('Failed to get location from IP:', error);
    // Fallback to a default location (you can change this)
    return {
      lat: 40.7128,
      lng: -74.0060,
      city: 'New York',
      country: 'United States',
      ip: 'unknown'
    };
  }
};

// Alternative geolocation using browser GPS (more accurate but requires user permission)
export const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
};

// Watch position for continuous tracking
export const watchPosition = (callback, errorCallback) => {
  if (!navigator.geolocation) {
    errorCallback(new Error('Geolocation is not supported by this browser'));
    return null;
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      callback({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      });
    },
    errorCallback,
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000
    }
  );

  return watchId;
};

// Stop watching position
export const clearWatch = (watchId) => {
  if (watchId && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
};

// Calculate distance between two points using Haversine formula
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

// Estimate travel time based on distance (rough estimate)
export const estimateTravelTime = (distance) => {
  // Assume average speed of 40 km/h in urban areas
  const averageSpeed = 40;
  const timeInHours = distance / averageSpeed;
  const timeInMinutes = timeInHours * 60;
  return Math.round(timeInMinutes);
};

// Get address from coordinates (reverse geocoding)
export const getAddressFromCoordinates = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=YOUR_API_KEY&language=en&pretty=1`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results[0].formatted;
    }
    
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    console.error('Failed to get address from coordinates:', error);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};

// Mock function for demonstration - in production, you'd use a real geocoding service
export const mockGetAddressFromCoordinates = (lat, lng) => {
  const areas = [
    'Downtown Medical Center',
    'City Hospital Area',
    'Emergency Services District',
    'Healthcare Plaza',
    'Medical Complex',
    'Hospital District',
    'Emergency Care Center',
    'Metropolitan Medical Area'
  ];
  
  const randomArea = areas[Math.floor(Math.random() * areas.length)];
  return `${randomArea}, ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
};
