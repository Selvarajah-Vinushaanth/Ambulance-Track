import React, { useEffect, useState, useRef } from 'react';
import { GoogleMap, Marker, Polyline, DirectionsRenderer } from '@react-google-maps/api';
import { useGoogleMaps } from '../contexts/GoogleMapsContext';

const containerStyle = {
  width: '100%',
  height: '450px',
  borderRadius: '0.5rem',
  overflow: 'hidden',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
};

const DEFAULT_CENTER = { lat: 6.9271, lng: 79.8612 };

const MapComponent = ({
  ambulanceLocation,
  patientLocation,
  destination,
  showPatient = true,
  showAmbulance = true,
  showRoute = true,
  center = null,
  autoRefresh = false,
  onRefresh = null
}) => {
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [routePoints, setRoutePoints] = useState([]);
  const [pickupDirections, setPickupDirections] = useState(null);
  const [transportDirections, setTransportDirections] = useState(null);
  const [directions, setDirections] = useState(null);
  const [travelTime, setTravelTime] = useState(null);
  const [distance, setDistance] = useState(null);
  const [refreshTimer, setRefreshTimer] = useState(null);
  const mapRef = useRef(null);

  const { isLoaded, loadError } = useGoogleMaps();

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && onRefresh) {
      const interval = setInterval(() => {
        console.log('Auto-refreshing map data...');
        onRefresh();
      }, 40000); // 40 seconds
      
      setRefreshTimer(interval);
      
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    } else if (refreshTimer) {
      clearInterval(refreshTimer);
      setRefreshTimer(null);
    }
  }, [autoRefresh, onRefresh]);

  // Create icons only when Google Maps is loaded
  const getIcons = () => {
    if (!isLoaded || !window.google?.maps) return {};

    return {
      ambulanceIcon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="18" fill="#dc2626" stroke="#ffffff" stroke-width="2"/>
            <rect x="12" y="16" width="16" height="8" rx="2" fill="#ffffff"/>
            <rect x="16" y="12" width="8" height="4" rx="1" fill="#ffffff"/>
            <rect x="16" y="18" width="8" height="2" fill="#dc2626"/>
            <rect x="19" y="15" width="2" height="8" fill="#dc2626"/>
            <text x="20" y="32" font-family="Arial" font-size="8" font-weight="bold" fill="#ffffff" text-anchor="middle">🚑</text>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(40, 40),
        anchor: new window.google.maps.Point(20, 20)
      },
      patientIcon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="14" fill="#10b981" stroke="#ffffff" stroke-width="2"/>
            <circle cx="16" cy="12" r="4" fill="#ffffff"/>
            <path d="M16 16 C12 16 9 18 9 20 L23 20 C23 18 20 16 16 16 Z" fill="#ffffff"/>
            <text x="16" y="28" font-family="Arial" font-size="6" font-weight="bold" fill="#ffffff" text-anchor="middle">👤</text>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(32, 32),
        anchor: new window.google.maps.Point(16, 16)
      },
      destinationIcon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="#2563eb" stroke="#ffffff" stroke-width="2"/>
            <rect x="10" y="14" width="16" height="8" rx="2" fill="#ffffff"/>
            <rect x="12" y="10" width="12" height="6" rx="1" fill="#ffffff"/>
            <rect x="14" y="16" width="8" height="2" fill="#2563eb"/>
            <rect x="17" y="14" width="2" height="6" fill="#2563eb"/>
            <text x="18" y="30" font-family="Arial" font-size="6" font-weight="bold" fill="#ffffff" text-anchor="middle">🏥</text>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(36, 36),
        anchor: new window.google.maps.Point(18, 18)
      }
    };
  };

  useEffect(() => {
    if (center) {
      setMapCenter(center);
    } else if (ambulanceLocation) {
      setMapCenter({ lat: ambulanceLocation.lat, lng: ambulanceLocation.lng });
    } else if (patientLocation) {
      setMapCenter({ lat: patientLocation.lat, lng: patientLocation.lng });
    } else {
      setMapCenter(DEFAULT_CENTER);
    }
  }, [center, ambulanceLocation, patientLocation]);

  useEffect(() => {
    if (ambulanceLocation && showRoute && isLoaded) {
      const directionsService = new window.google.maps.DirectionsService();
      
      // Clear previous routes
      setPickupDirections(null);
      setTransportDirections(null);
      setDirections(null);
      
      // Route 1: Ambulance → Patient (Red route)
      if (patientLocation) {
        const pickupRequest = {
          origin: new window.google.maps.LatLng(ambulanceLocation.lat, ambulanceLocation.lng),
          destination: new window.google.maps.LatLng(patientLocation.lat, patientLocation.lng),
          travelMode: window.google.maps.TravelMode.DRIVING,
          optimizeWaypoints: true,
          avoidHighways: false,
          avoidTolls: false,
          region: 'LK'
        };
        
        directionsService.route(pickupRequest, (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setPickupDirections(result);
            console.log('Pickup route calculated successfully');
          } else {
            console.error('Pickup route failed:', status);
          }
        });
      }
      
      // Route 2: Patient → Destination (Blue route)
      if (patientLocation && destination) {
        const transportRequest = {
          origin: new window.google.maps.LatLng(patientLocation.lat, patientLocation.lng),
          destination: new window.google.maps.LatLng(destination.lat, destination.lng),
          travelMode: window.google.maps.TravelMode.DRIVING,
          optimizeWaypoints: true,
          avoidHighways: false,
          avoidTolls: false,
          region: 'LK'
        };
        
        directionsService.route(transportRequest, (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setTransportDirections(result);
            console.log('Transport route calculated successfully');
          } else {
            console.error('Transport route failed:', status);
          }
        });
      }
      
      // Calculate total distance and time
      setTimeout(() => {
        let totalDistance = 0;
        let totalTime = 0;
        let distanceText = '';
        let timeText = '';
        
        if (pickupDirections) {
          const pickupRoute = pickupDirections.routes[0];
          if (pickupRoute && pickupRoute.legs[0]) {
            totalDistance += pickupRoute.legs[0].distance.value;
            totalTime += pickupRoute.legs[0].duration.value;
            distanceText = pickupRoute.legs[0].distance.text;
            timeText = pickupRoute.legs[0].duration.text;
          }
        }
        
        if (transportDirections) {
          const transportRoute = transportDirections.routes[0];
          if (transportRoute && transportRoute.legs[0]) {
            totalDistance += transportRoute.legs[0].distance.value;
            totalTime += transportRoute.legs[0].duration.value;
            if (distanceText) {
              distanceText += ` + ${transportRoute.legs[0].distance.text}`;
              timeText += ` + ${transportRoute.legs[0].duration.text}`;
            } else {
              distanceText = transportRoute.legs[0].distance.text;
              timeText = transportRoute.legs[0].duration.text;
            }
          }
        }
        
        if (distanceText) {
          setDistance(distanceText);
          setTravelTime(timeText);
        }
      }, 1000);
      
    } else {
      setPickupDirections(null);
      setTransportDirections(null);
      setDirections(null);
      setTravelTime(null);
      setDistance(null);
    }
  }, [ambulanceLocation, patientLocation, destination, showRoute, isLoaded]);

  if (loadError) {
    return (
      <div style={{
        ...containerStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fee2e2',
        color: '#dc2626'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
          <p>Failed to load Google Maps</p>
          <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>
            Please check your internet connection and try again
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) return (
    <div style={{
      ...containerStyle,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f3f4f6'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ 
          fontSize: '2rem', 
          marginBottom: '1rem'
        }}>🗺️</div>
        <p>Loading Google Maps...</p>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  );

  return (
    <div style={{ position: 'relative' }}>
      {/* Enhanced Route Information Panel */}
      {(travelTime || distance) && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          padding: '12px 16px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          fontSize: '14px',
          fontWeight: '500',
          border: '1px solid #e5e7eb',
          minWidth: '180px'
        }}>
          <div style={{ 
            color: '#1f2937', 
            fontWeight: 'bold', 
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            🚗 Route Information
            {autoRefresh && (
              <div style={{
                fontSize: '10px',
                color: '#10b981',
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  animation: 'pulse 2s infinite'
                }}>
                </div>
                Auto-refresh
              </div>
            )}
          </div>
          {distance && (
            <div style={{ 
              color: '#2563eb', 
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              📍 Distance: <strong>{distance}</strong>
            </div>
          )}
          {travelTime && (
            <div style={{ 
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              ⏱️ ETA: <strong>{travelTime}</strong>
            </div>
          )}
        </div>
      )}
      
      {/* Enhanced Map Legend */}
      {(showAmbulance || showPatient || destination) && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          padding: '12px 16px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          fontSize: '12px',
          fontWeight: '500',
          border: '1px solid #e5e7eb',
          minWidth: '200px'
        }}>
          <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#1f2937' }}>Route Legend:</div>
          {showAmbulance && ambulanceLocation && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '4px',
              color: '#dc2626',
              fontWeight: '500'
            }}>
              <div style={{ 
                width: '20px', 
                height: '3px', 
                backgroundColor: '#dc2626', 
                borderRadius: '2px' 
              }}></div>
              🚑 Ambulance → Patient
            </div>
          )}
          {showPatient && patientLocation && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '4px',
              color: '#10b981',
              fontWeight: '500'
            }}>
              👤 Patient (Pickup Point)
            </div>
          )}
          {destination && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '4px',
              color: '#2563eb',
              fontWeight: '500'
            }}>
              <div style={{ 
                width: '20px', 
                height: '3px', 
                backgroundColor: '#2563eb', 
                borderRadius: '2px' 
              }}></div>
              🏥 Patient → Hospital
            </div>
          )}
          {(showAmbulance || showPatient || destination) && (
            <div style={{ 
              marginTop: '8px', 
              paddingTop: '6px', 
              borderTop: '1px solid #e5e7eb',
              fontSize: '11px',
              color: '#6b7280'
            }}>
              Route via Google Maps
            </div>
          )}
        </div>
      )}
      
      <div style={containerStyle}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={mapCenter}
          zoom={15}
          ref={mapRef}
          options={{
            disableDefaultUI: false,
            clickableIcons: false,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
            zoomControl: true,
            gestureHandling: 'greedy',
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              },
              {
                featureType: 'road',
                elementType: 'labels',
                stylers: [{ visibility: 'on' }]
              },
              {
                featureType: 'landscape',
                elementType: 'geometry',
                stylers: [{ color: '#f5f5f5' }]
              },
              {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{ color: '#c9d9e8' }]
              }
            ]
          }}
        >
          {/* Enhanced marker label styles */}
          <style>
            {`
              .ambulance-marker-label {
                background: rgba(220, 38, 38, 0.1);
                border-radius: 4px;
                padding: 2px 4px;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
              }
              .patient-marker-label {
                background: rgba(16, 185, 129, 0.1);
                border-radius: 4px;
                padding: 2px 4px;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
              }
              .destination-marker-label {
                background: rgba(37, 99, 235, 0.1);
                border-radius: 4px;
                padding: 2px 4px;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
              }
              @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
              }
            `}
          </style>
          {/* Route 1: Ambulance → Patient (Red Route) */}
          {pickupDirections && (
            <DirectionsRenderer
              directions={pickupDirections}
              options={{
                polylineOptions: {
                  strokeColor: '#dc2626',
                  strokeWeight: 6,
                  strokeOpacity: 0.9
                },
                suppressMarkers: true,
                preserveViewport: false
              }}
            />
          )}
          
          {/* Route 2: Patient → Destination (Blue Route) */}
          {transportDirections && (
            <DirectionsRenderer
              directions={transportDirections}
              options={{
                polylineOptions: {
                  strokeColor: '#2563eb',
                  strokeWeight: 6,
                  strokeOpacity: 0.9
                },
                suppressMarkers: true,
                preserveViewport: false
              }}
            />
          )}

          {/* Fallback polyline if directions fail */}
          {!directions && routePoints.length > 1 && (
            <Polyline
              path={routePoints}
              options={{ strokeColor: '#dc2626', strokeWeight: 4, strokeOpacity: 0.8 }}
            />
          )}

          {/* Enhanced Ambulance Marker */}
          {showAmbulance && ambulanceLocation && (() => {
            const icons = getIcons();
            return (
              <Marker
                position={{ lat: ambulanceLocation.lat, lng: ambulanceLocation.lng }}
                icon={icons.ambulanceIcon}
                title="🚑 Ambulance - Current Location"
                label={{
                  text: "🚑",
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: "#dc2626",
                  className: "ambulance-marker-label"
                }}
                zIndex={1000}
                optimized={false}
              />
            );
          })()}

          {/* Enhanced Patient Marker */}
          {showPatient && patientLocation && (() => {
            const icons = getIcons();
            return (
              <Marker
                position={{ lat: patientLocation.lat, lng: patientLocation.lng }}
                icon={icons.patientIcon}
                title="👤 Patient - Pickup Location"
                label={{
                  text: "👤",
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: "#10b981",
                  className: "patient-marker-label"
                }}
                zIndex={999}
                optimized={false}
              />
            );
          })()}

          {/* Enhanced Destination Marker */}
          {destination && (() => {
            const icons = getIcons();
            return (
              <Marker
                position={{ lat: destination.lat, lng: destination.lng }}
                icon={icons.destinationIcon}
                title="🏥 Hospital - Destination"
                label={{
                  text: "🏥",
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: "#2563eb",
                  className: "destination-marker-label"
                }}
                zIndex={998}
                optimized={false}
              />
            );
          })()}
        </GoogleMap>
      </div>
    </div>
  );
};

export default MapComponent;