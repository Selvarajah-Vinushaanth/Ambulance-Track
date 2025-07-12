// Hospital database for Sri Lanka
export const hospitals = [
  // Kandy area hospitals
  {
    id: 'kandy_general',
    name: 'Kandy General Hospital',
    coordinates: { lat: 7.2906, lng: 80.6337 },
    address: 'Kandy General Hospital, Kandy, Sri Lanka',
    services: ['Emergency', 'Cardiology', 'Neurology', 'Orthopedics'],
    phone: '+94 81 222 2261',
    type: 'public'
  },
  {
    id: 'teaching_hospital_kandy',
    name: 'Teaching Hospital Kandy',
    coordinates: { lat: 7.2973, lng: 80.6350 },
    address: 'Teaching Hospital Kandy, Peradeniya Rd, Kandy, Sri Lanka',
    services: ['Emergency', 'Trauma', 'ICU', 'Surgery'],
    phone: '+94 81 223 8250',
    type: 'public'
  },
  {
    id: 'asiri_kandy',
    name: 'Asiri Medical Hospital Kandy',
    coordinates: { lat: 7.2869, lng: 80.6304 },
    address: 'Asiri Medical Hospital, Kandy, Sri Lanka',
    services: ['Emergency', 'Cardiology', 'Oncology', 'Neurology'],
    phone: '+94 81 223 3500',
    type: 'private'
  },
  
  // Colombo area hospitals
  {
    id: 'colombo_national',
    name: 'National Hospital of Sri Lanka',
    coordinates: { lat: 6.9271, lng: 79.8612 },
    address: 'National Hospital of Sri Lanka, Colombo, Sri Lanka',
    services: ['Emergency', 'Trauma', 'ICU', 'All Specialties'],
    phone: '+94 11 269 1111',
    type: 'public'
  },
  {
    id: 'asiri_colombo',
    name: 'Asiri Medical Hospital Colombo',
    coordinates: { lat: 6.9044, lng: 79.8606 },
    address: 'Asiri Medical Hospital, Colombo, Sri Lanka',
    services: ['Emergency', 'Cardiology', 'Oncology', 'Neurology'],
    phone: '+94 11 446 6100',
    type: 'private'
  },
  
  // Gampaha area hospitals
  {
    id: 'gampaha_general',
    name: 'Gampaha General Hospital',
    coordinates: { lat: 7.0873, lng: 80.0142 },
    address: 'Gampaha General Hospital, Gampaha, Sri Lanka',
    services: ['Emergency', 'General Medicine', 'Surgery'],
    phone: '+94 33 222 2261',
    type: 'public'
  },
  
  // Galle area hospitals
  {
    id: 'galle_general',
    name: 'Karapitiya Teaching Hospital',
    coordinates: { lat: 6.0535, lng: 80.2210 },
    address: 'Karapitiya Teaching Hospital, Galle, Sri Lanka',
    services: ['Emergency', 'Trauma', 'ICU', 'Surgery'],
    phone: '+94 91 223 2261',
    type: 'public'
  },
  
  // Jaffna area hospitals
  {
    id: 'jaffna_general',
    name: 'Jaffna Teaching Hospital',
    coordinates: { lat: 9.6615, lng: 80.0255 },
    address: 'Jaffna Teaching Hospital, Jaffna, Sri Lanka',
    services: ['Emergency', 'General Medicine', 'Surgery'],
    phone: '+94 21 222 2261',
    type: 'public'
  },
  
  // Anuradhapura area hospitals
  {
    id: 'anuradhapura_general',
    name: 'Anuradhapura General Hospital',
    coordinates: { lat: 8.3114, lng: 80.4037 },
    address: 'Anuradhapura General Hospital, Anuradhapura, Sri Lanka',
    services: ['Emergency', 'General Medicine', 'Surgery'],
    phone: '+94 25 222 2261',
    type: 'public'
  },
  
  // Kurunegala area hospitals
  {
    id: 'kurunegala_general',
    name: 'Kurunegala General Hospital',
    coordinates: { lat: 7.4818, lng: 80.3609 },
    address: 'Kurunegala General Hospital, Kurunegala, Sri Lanka',
    services: ['Emergency', 'General Medicine', 'Surgery'],
    phone: '+94 37 222 2261',
    type: 'public'
  },
  
  // Ratnapura area hospitals
  {
    id: 'ratnapura_general',
    name: 'Ratnapura General Hospital',
    coordinates: { lat: 6.6828, lng: 80.3992 },
    address: 'Ratnapura General Hospital, Ratnapura, Sri Lanka',
    services: ['Emergency', 'General Medicine', 'Surgery'],
    phone: '+94 45 222 2261',
    type: 'public'
  }
];

// Calculate distance between two coordinates using Haversine formula
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Find the nearest hospital to a given location
export const findNearestHospital = (userLocation, maxDistance = 50) => {
  if (!userLocation || !userLocation.lat || !userLocation.lng) {
    return null;
  }

  let nearestHospital = null;
  let shortestDistance = Infinity;

  hospitals.forEach(hospital => {
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      hospital.coordinates.lat,
      hospital.coordinates.lng
    );

    if (distance < shortestDistance && distance <= maxDistance) {
      shortestDistance = distance;
      nearestHospital = { ...hospital, distance };
    }
  });

  return nearestHospital;
};

// Get hospitals within a specific radius
export const getHospitalsInRadius = (userLocation, radius = 25) => {
  if (!userLocation || !userLocation.lat || !userLocation.lng) {
    return [];
  }

  return hospitals
    .map(hospital => ({
      ...hospital,
      distance: calculateDistance(
        userLocation.lat,
        userLocation.lng,
        hospital.coordinates.lat,
        hospital.coordinates.lng
      )
    }))
    .filter(hospital => hospital.distance <= radius)
    .sort((a, b) => a.distance - b.distance);
};

// Get hospital by ID
export const getHospitalById = (id) => {
  return hospitals.find(hospital => hospital.id === id);
};

// Get hospitals by type
export const getHospitalsByType = (type) => {
  return hospitals.filter(hospital => hospital.type === type);
};

export default hospitals;
