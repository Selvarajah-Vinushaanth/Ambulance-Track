# Google Maps API Configuration

## Current Issue
The current Google Maps API key doesn't have the required permissions enabled. To fix this:

## Steps to Fix:

### 1. Go to Google Cloud Console
- Visit: https://console.cloud.google.com/
- Select your project

### 2. Enable Required APIs
Navigate to "APIs & Services" > "Library" and enable:
- ✅ Maps JavaScript API
- ✅ Places API  
- ✅ Geocoding API
- ✅ Directions API (for routing)

### 3. Update API Key Restrictions
- Go to "APIs & Services" > "Credentials"
- Click on your API key
- Under "API restrictions", select "Restrict key"
- Add the APIs listed above

### 4. Update the API Key
Replace the API key in: `src/contexts/GoogleMapsContext.js`

```javascript
const { isLoaded, loadError } = useJsApiLoader({
  googleMapsApiKey: 'YOUR_NEW_API_KEY_HERE',
  libraries: libraries,
});
```

## Fallback Solution
The app now includes predefined locations for major Sri Lankan cities:
- Vavuniya, Jaffna, Colombo, Kandy, Galle, Negombo
- Trincomalee, Batticaloa, Kurunegala, Anuradhapura
- Ratnapura, Badulla, Matara, Hambantota, Puttalam
- Kalutara, Chilaw, Kegalle, Monaragala, Polonnaruwa

These will work even without the Google Maps API.

## Testing
1. Try typing "Vavuniya" in the manual location input
2. You should see it appear in suggestions
3. Click to set the location
4. The ambulance should appear on the map at the correct coordinates
