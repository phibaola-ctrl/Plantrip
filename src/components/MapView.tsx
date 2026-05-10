import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Info, Navigation, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/src/lib/ThemeContext';

// Fix for Leaflet default icon issues in React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationMarker {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
}

interface MapViewProps {
  locations: string[]; // Location names to geocode
  destination: string;
  activities: { activity: string; description: string; location?: string }[];
  onPointSelect?: (index: number) => void;
}

// Component to handle map view updates and initialization
function MapController({ center, zoom, markers }: { center: [number, number]; zoom: number; markers: any[] }) {
  const map = useMap();
  
  useEffect(() => {
    // Force relayout when markers change or on mount
    setTimeout(() => {
      map.invalidateSize();
    }, 250);
  }, [map, markers]);

  useEffect(() => {
    if (center[0] !== 0 || center[1] !== 0) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);

  return null;
}

export default function MapView({ locations, destination, activities, onPointSelect }: MapViewProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState<[number, number]>([10.8231, 106.6297]);

  const isPhiMode = typeof destination === 'string' && destination.trim().toLowerCase() === 'phi';

  useEffect(() => {
    const geocodeLocations = async () => {
      setLoading(true);
      
      if (isPhiMode) {
        // Just create some "Phi" markers around a center for the effect
        const baseLat = 10.7626222;
        const baseLng = 106.660172;
        const phiMarkers: LocationMarker[] = Array.from({ length: 5 }, (_, i) => ({
          id: `phi-${i}`,
          name: "Phi",
          description: "Phi đẹp trai thanh lịch vô địch khắp vũ trụ",
          lat: baseLat + (Math.random() - 0.5) * 0.02,
          lng: baseLng + (Math.random() - 0.5) * 0.02,
        }));
        setMarkers(phiMarkers);
        setCenter([baseLat, baseLng]);
        setLoading(false);
        return;
      }

      const newMarkers: LocationMarker[] = [];
      
      // Combine destination into queries for better accuracy
      const queries = activities.map(act => ({
        query: act.location ? `${act.location}, ${destination}` : `${act.activity}, ${destination}`,
        name: act.activity,
        description: act.description
      }));

      // Fallback: search for just the destination if others fail
      let destinationCoords: [number, number] | null = null;
      try {
        const destResponse = await fetch(
          `/api/geocode?q=${encodeURIComponent(destination)}`
        );
        const destData = await destResponse.json();
        if (destData && destData.length > 0) {
          destinationCoords = [parseFloat(destData[0].lat), parseFloat(destData[0].lon)];
          setCenter(destinationCoords);
        }
      } catch (e) {
        console.error('Destination geocoding error:', e);
      }

      for (const item of queries) {
        try {
          const response = await fetch(
            `/api/geocode?q=${encodeURIComponent(item.query)}`
          );
          const data = await response.json();
          
          if (data && data.length > 0) {
            newMarkers.push({
              id: Math.random().toString(36).substr(2, 9),
              name: item.name,
              description: item.description,
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon)
            });
          }
        } catch (error) {
          console.error('Geocoding error:', error);
        }
        // Small delay to respect Nominatim usage policy (1 request per second is recommended)
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (newMarkers.length > 0) {
        setMarkers(newMarkers);
        // Calculate center
        const avgLat = newMarkers.reduce((sum, m) => sum + m.lat, 0) / newMarkers.length;
        const avgLng = newMarkers.reduce((sum, m) => sum + m.lng, 0) / newMarkers.length;
        setCenter([avgLat, avgLng]);
      }
      setLoading(false);
    };

    geocodeLocations();
  }, [destination, activities]);

  if (loading && markers.length === 0) {
    return (
      <div className="w-full h-[500px] bg-luxury-bg rounded-[56px] flex flex-col items-center justify-center border border-luxury-beige/20 relative overflow-hidden">
        {/* Animated Skeleton Lines */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#5A3E36" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        <div className="relative z-10 flex flex-col items-center">
          <Navigation className="text-luxury-cacao/40 animate-pulse mb-6" size={48} />
          <div className="flex flex-col items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-luxury-cacao/60 animate-pulse">Mapping Curation</p>
            <div className="w-16 h-px bg-luxury-beige/40" />
            <p className="text-[8px] text-luxury-cacao/30 font-medium uppercase tracking-[0.2em]">{destination}</p>
          </div>
        </div>
        {/* Scanning effect */}
        <motion.div 
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-y-0 w-64 bg-gradient-to-r from-transparent via-luxury-beige/10 to-transparent skew-x-12"
        />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative w-full h-[600px] rounded-[56px] overflow-hidden border border-luxury-beige/30 shadow-2xl group"
    >
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={false}
        className="w-full h-full z-10"
        style={{ height: '100%', width: '100%' }}
      >
        <MapController center={center} zoom={12} markers={markers} />
        {/* Luxury-themed tiles - adaptive to theme */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={theme === 'light' 
            ? "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png"
          }
        />

        {/* Path line between points - splitted into segments for interaction */}
        {markers.map((marker, idx) => {
          if (idx === markers.length - 1) return null;
          const nextMarker = markers[idx + 1];
          return (
            <Polyline 
              key={`segment-${idx}`}
              positions={[
                [marker.lat, marker.lng],
                [nextMarker.lat, nextMarker.lng]
              ]}
              eventHandlers={{
                click: () => onPointSelect?.(idx)
              }}
              pathOptions={{ 
                color: '#5A3E36', 
                weight: 6, 
                dashArray: '10, 10', 
                opacity: 0.3 
              }}
            />
          );
        })}
        
        {markers.map((marker, idx) => (
          <Marker 
            key={marker.id} 
            position={[marker.lat, marker.lng]}
            eventHandlers={{
              click: () => onPointSelect?.(idx)
            }}
          >
            <Popup className="luxury-popup">
              <div className="p-4 space-y-4 min-w-[240px]">
                <div className="flex items-center gap-3 text-[10px] font-bold text-luxury-cacao uppercase tracking-[0.2em] opacity-60">
                  <div className="w-1.5 h-1.5 bg-luxury-espresso rounded-full" />
                  <span>{t?.('itinerary.timeline') || 'Activity Point'}</span>
                </div>
                <h4 className="text-xl font-serif font-bold text-luxury-espresso border-b border-luxury-beige/10 pb-3">
                  {marker.name}
                </h4>
                <p className="text-sm text-luxury-espresso/70 leading-relaxed font-medium">
                  {marker.description}
                </p>
                
                <div className="pt-2">
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${marker.lat},${marker.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-3 w-full py-3 bg-luxury-espresso text-luxury-ivory rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-luxury-espresso/90 transition-all shadow-lg shadow-luxury-espresso/20"
                  >
                    <Navigation size={12} />
                    <span>Get Directions</span>
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Overlay Controls */}
      <div className="absolute top-8 left-8 z-20 flex flex-col gap-4">
        <div className="bg-luxury-ivory/90 dark:bg-luxury-ivory/80 backdrop-blur-xl p-4 rounded-3xl shadow-xl border border-luxury-beige/30 flex items-center gap-4 transition-colors">
          <div className="w-10 h-10 bg-luxury-espresso text-luxury-ivory rounded-2xl flex items-center justify-center">
            <Navigation size={18} />
          </div>
          <div>
            <p className="text-[8px] text-luxury-cacao uppercase font-bold tracking-[0.2em]">Interactive Guide</p>
            <p className="font-serif font-bold text-sm text-luxury-espresso tracking-tight">{destination}</p>
          </div>
        </div>

        <button 
          onClick={() => setCenter([...center])}
          className="bg-luxury-ivory/90 dark:bg-luxury-ivory/80 backdrop-blur-xl w-12 h-12 rounded-2xl shadow-xl border border-luxury-beige/30 flex items-center justify-center text-luxury-espresso hover:bg-luxury-espresso hover:text-luxury-ivory transition-all duration-300 group"
          title="Recenter Map"
        >
          <MapPin size={18} className="group-hover:scale-110 transition-transform" />
        </button>
      </div>

      <div className="absolute bottom-8 right-8 z-20">
        <div className="bg-luxury-espresso text-luxury-ivory px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl text-[10px] font-bold uppercase tracking-[0.3em]">
          <Info size={14} className="text-luxury-beige" />
          <span>{markers.length} Selected Points</span>
        </div>
      </div>
      
      {/* Decorative inner shadow */}
      <div className="absolute inset-0 pointer-events-none z-20 shadow-[inset_0_0_80px_rgba(90,62,54,0.1)] rounded-[56px]" />
    </motion.div>
  );
}
