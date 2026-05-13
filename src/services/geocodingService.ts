export interface GeoLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description?: string;
  time?: string;
}

export async function geocodeLocation(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Geocoding failed');
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.error('Error geocoding:', query, error);
    return null;
  }
}
