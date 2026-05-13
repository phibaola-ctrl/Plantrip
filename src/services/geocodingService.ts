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
    console.log(`[Geocoding] Requesting: "${query}"`);
    const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[Geocoding] API Error: ${response.status} ${response.statusText}`, errorData);
      throw new Error(`Geocoding failed: ${response.status}`);
    }
    const data = await response.json();
    
    if (data && data.length > 0) {
      console.log(`[Geocoding] Success: "${query}" -> ${data[0].lat}, ${data[0].lon}`);
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
    console.warn(`[Geocoding] No results found for: "${query}"`);
    return null;
  } catch (error) {
    console.error(`[Geocoding] Exception for "${query}":`, error);
    return null;
  }
}
