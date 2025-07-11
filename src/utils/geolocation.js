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
        timeout: 30000, // Increased to 30 seconds
        maximumAge: 300000 // Increased to 5 minutes
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
      timeout: 30000, // Increased to 30 seconds
      maximumAge: 300000 // Increased to 5 minutes
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

// Enhanced geolocation with better accuracy and fallback options
export const getCurrentLocationAccurateEnhanced = async () => {
  try {
    // First try high accuracy GPS
    const position = await getCurrentPosition();
    
    // Try to get a more readable address
    const address = await mockGetAddressFromCoordinates(position.lat, position.lng);
    
    return {
      ...position,
      address: address,
      source: 'gps'
    };
  } catch (gpsError) {
    console.warn('GPS location failed, trying IP-based location:', gpsError);
    
    try {
      // Fallback to IP-based location
      const ipLocation = await getLocationFromIP();
      const address = await mockGetAddressFromCoordinates(ipLocation.lat, ipLocation.lng);
      
      return {
        lat: ipLocation.lat,
        lng: ipLocation.lng,
        accuracy: 1000, // IP-based location is less accurate
        address: address,
        source: 'ip',
        city: ipLocation.city,
        country: ipLocation.country
      };
    } catch (ipError) {
      console.error('Both GPS and IP location failed:', ipError);
      
      // Ultimate fallback - use a default location
      const defaultLat = 40.7128;
      const defaultLng = -74.0060;
      const address = await mockGetAddressFromCoordinates(defaultLat, defaultLng);
      
      return {
        lat: defaultLat,
        lng: defaultLng,
        accuracy: 10000, // Very low accuracy for default location
        address: address,
        source: 'default',
        city: 'New York',
        country: 'United States'
      };
    }
  }
};

// Enhanced function to get location with retry mechanism
export const getLocationWithRetry = async (maxRetries = 3) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const location = await getCurrentLocationAccurateEnhanced();
      return location;
    } catch (error) {
      lastError = error;
      console.warn(`Location attempt ${i + 1} failed:`, error);
      
      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
};

// Get coordinates from address (geocoding)
export const getCoordinatesFromAddress = async (address) => {
  try {
    // For demo purposes, we'll use a mock geocoding service
    // In production, you'd use a real geocoding API like Google Maps or OpenStreetMap
    
    // Mock coordinates based on common addresses
    const mockCoordinates = {
      'downtown': { lat: 40.7589, lng: -73.9851 },
      'hospital': { lat: 40.7614, lng: -73.9776 },
      'airport': { lat: 40.6413, lng: -73.7781 },
      'central park': { lat: 40.7829, lng: -73.9654 },
      'brooklyn': { lat: 40.6782, lng: -73.9442 },
      'queens': { lat: 40.7282, lng: -73.7949 },
      'bronx': { lat: 40.8448, lng: -73.8648 },
      'manhattan': { lat: 40.7831, lng: -73.9712 }
    };
    
    const lowerAddress = address.toLowerCase();
    for (const [key, coords] of Object.entries(mockCoordinates)) {
      if (lowerAddress.includes(key)) {
        return coords;
      }
    }
    
    // If no match found, return a random location in NYC area
    return {
      lat: 40.7128 + (Math.random() - 0.5) * 0.1,
      lng: -74.0060 + (Math.random() - 0.5) * 0.1
    };
  } catch (error) {
    console.error('Failed to get coordinates from address:', error);
    return { lat: 40.7128, lng: -74.0060 };
  }
};

// Enhanced distance calculation with route estimation
export const calculateRouteDistance = (lat1, lng1, lat2, lng2) => {
  const straightDistance = calculateDistance(lat1, lng1, lat2, lng2);
  
  // Add some variation to simulate actual road distance (typically 20-40% longer)
  const routeFactor = 1.2 + Math.random() * 0.2; // 1.2 to 1.4
  const routeDistance = straightDistance * routeFactor;
  
  return {
    straightDistance: straightDistance,
    routeDistance: routeDistance,
    estimatedTime: estimateTravelTime(routeDistance)
  };
};
