// OpenStreetMap Nominatim reverse geocoding utility

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  error?: string;
  source?: 'gps' | 'ip';
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<LocationData> {
  try {
    // High precision coordinates (8 decimal places = ~1mm accuracy)
    const preciseCoords = `${latitude.toFixed(8)}, ${longitude.toFixed(8)}`;
    
    // Use OpenStreetMap Nominatim API for reverse geocoding
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'offSOS-emergency-app'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.display_name) {
          // Combine precise coordinates with readable address
          return {
            latitude,
            longitude,
            address: `${preciseCoords} - ${data.display_name}`
          };
        }
      }
    } catch (nominatimError) {
      console.error('Nominatim API failed:', nominatimError);
    }

    // Fallback to IP-based location if Nominatim fails
    const ipResponse = await fetch('https://ipapi.co/json/');
    if (ipResponse.ok) {
      const ipData = await ipResponse.json();
      if (ipData.latitude && ipData.longitude) {
        const ipPreciseCoords = `${ipData.latitude.toFixed(8)}, ${ipData.longitude.toFixed(8)}`;
        return {
          latitude: ipData.latitude,
          longitude: ipData.longitude,
          address: `${ipPreciseCoords} - ${ipData.city || 'Unknown City'}, ${ipData.region || 'Unknown Region'}, ${ipData.country_name || 'Unknown Country'}`
        };
      }
    }

    // Final fallback - return high precision coordinates only
    return {
      latitude,
      longitude,
      address: preciseCoords
    };
    
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return {
      latitude,
      longitude,
      address: `${latitude.toFixed(8)}, ${longitude.toFixed(8)}`,
      error: 'Location lookup failed'
    };
  }
}

export async function getCurrentLocation(): Promise<LocationData> {
  return new Promise((resolve) => {
    const fallbackToIP = async () => {
      console.log('Falling back to IP-based location...');
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.latitude && data.longitude) {
          const locationData = await reverseGeocode(data.latitude, data.longitude);
          resolve({ ...locationData, source: 'ip' });
        } else {
          resolve({
            latitude: 0,
            longitude: 0,
            address: 'Location unavailable',
            error: 'IP location failed',
            source: 'ip'
          });
        }
      } catch (error) {
        resolve({
          latitude: 0,
          longitude: 0,
          address: 'Location unavailable',
          error: 'All location methods failed',
          source: 'ip'
        });
      }
    };

    const isSecureOrigin = typeof window !== 'undefined' && (window.isSecureContext || window.location.protocol === 'https:');

    if (!isSecureOrigin) {
      console.warn('Not on a secure origin (HTTPS). Falling back to IP-based location.');
      fallbackToIP();
      return;
    }

    if (!navigator.geolocation) {
      console.log('Geolocation not supported, using IP location');
      fallbackToIP();
      return;
    }

    console.log('Attempting high-precision GPS location...');

    // Force high accuracy GPS settings
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log(`GPS success: Lat=${latitude}, Lng=${longitude}, Accuracy=${accuracy}m`);

        const locationData = await reverseGeocode(latitude, longitude);
        resolve({ ...locationData, source: 'gps' });
      },
      (error) => {
        console.error('GPS failed:', error.message || error);
        console.error('GPS error code:', error.code);

        // Specific handling for permission denied (common on HTTP)
        if (error.code === 1) {
          console.warn('Precise GPS blocked. This usually happens on mobile if not using HTTPS. Falling back to IP location.');
        }

        fallbackToIP();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}
