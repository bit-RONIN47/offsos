// LocationIQ reverse geocoding utility

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  error?: string;
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<LocationData> {
  try {
    // High precision coordinates (8 decimal places = ~1mm accuracy)
    const preciseCoords = `${latitude.toFixed(8)}, ${longitude.toFixed(8)}`;
    
    // First try LocationIQ API if API key is available
    const apiKey = process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY || process.env.LOCATIONIQ_API_KEY;
    
    if (apiKey && apiKey !== 'your_locationiq_api_key_here') {
      try {
        const response = await fetch(
          `https://us1.locationiq.com/v1/reverse.php?key=${apiKey}&lat=${latitude}&lon=${longitude}&format=json`
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
      } catch (locationIQError) {
        console.error('LocationIQ API failed:', locationIQError);
      }
    }

    // Fallback to IP-based location if LocationIQ fails
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
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.latitude && data.longitude) {
          const locationData = await reverseGeocode(data.latitude, data.longitude);
          resolve(locationData);
        } else {
          resolve({
            latitude: 0,
            longitude: 0,
            address: 'Location unavailable',
            error: 'IP location failed'
          });
        }
      } catch (error) {
        resolve({
          latitude: 0,
          longitude: 0,
          address: 'Location unavailable',
          error: 'All location methods failed'
        });
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const locationData = await reverseGeocode(latitude, longitude);
          resolve(locationData);
        },
        (error) => {
          console.error('Geolocation error:', error);
          fallbackToIP();
        },
        {
          timeout: 10000,
          enableHighAccuracy: true,
          maximumAge: 0
        }
      );
    } else {
      fallbackToIP();
    }
  });
}
