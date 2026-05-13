import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Standard fix for Leaflet marker icon paths in production/bundlers
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Navigation, Maximize, ExternalLink, LocateFixed, Search, X } from 'lucide-react';
import { cn } from '@/src/lib/utils';

// Fix for Leaflet default icon issues in React/Vite
// We'll use custom SVG icons for a more luxury look anyway
const createCustomIcon = (number?: number, color: string = '#5A3E36', isEditing?: boolean) => {
  return new L.DivIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative flex items-center justify-center">
        ${isEditing ? `<div class="absolute w-12 h-12 bg-amber-400/30 rounded-full animate-ping"></div>` : ''}
        <div class="absolute w-8 h-8 bg-white/90 backdrop-blur-md rounded-full shadow-lg border-2 ${isEditing ? 'border-amber-500 scale-110' : ''}" 
             style="${!isEditing ? `border-color: ${color};` : ''} display: flex; align-items: center; justify-center; transition: all 0.3s; z-index: 10;">
          ${number ? `<span class="text-[10px] font-bold" style="color: ${isEditing ? '#d97706' : color}">${number}</span>` : `<div class="w-1.5 h-1.5 rounded-full" style="background-color: ${color}"></div>`}
        </div>
        <div class="absolute -bottom-1 w-2 h-2 ${isEditing ? 'bg-amber-500' : ''}" 
             style="${!isEditing ? `background-color: ${color};` : ''} transform: rotate(45deg); border-radius: 2px;"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 36],
    popupAnchor: [0, -32],
  });
};

const destinationIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `
    <div class="relative flex items-center justify-center">
      <div class="w-10 h-10 bg-[#D4AF37] rounded-2xl shadow-xl flex items-center justify-center animate-bounce-slow border-2 border-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// Helper component to handle "flyTo" and bounds
function MapController({ center, zoom, bounds }: { center?: [number, number], zoom?: number, bounds?: L.LatLngBoundsExpression }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1.5 });
    } else if (center) {
      map.flyTo(center, zoom || 13, { duration: 1.5 });
    }
  }, [center, zoom, bounds, map]);

  return null;
}

interface MapLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description?: string;
  time?: string;
}

interface MapViewProps {
  locations: MapLocation[];
  destination: string;
  selectedId?: string | null;
  editingId?: string | null;
  onPointSelect?: (id: string | null) => void;
  className?: string;
}

export default function MapView({ locations, destination, selectedId, editingId, onPointSelect, className }: MapViewProps) {
  const [mapType, setMapType] = useState<'light' | 'dark' | 'satellite'>('light');
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Calculate bounds to show all markers
  const bounds = useMemo(() => {
    if (locations.length === 0) return null;
    const latLngs = locations.map(l => [l.lat, l.lng] as L.LatLngExpression);
    return L.latLngBounds(latLngs);
  }, [locations]);

  const selectedLocation = useMemo(() => 
    locations.find(l => l.id === selectedId),
  [locations, selectedId]);

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
      });
    }
  };

  const openGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  // Polyline coordinates for the route
  const routePath = useMemo(() => 
    locations.map(l => [l.lat, l.lng] as [number, number]),
  [locations]);

  return (
    <div className={cn(
      "relative w-full transition-all duration-700 ease-in-out overflow-hidden group",
      isExpanded ? "h-[80vh] rounded-[40px]" : "h-[500px] rounded-[56px]",
      className
    )}>
      {/* Search Bar Overlay */}
      <div className="absolute top-8 left-8 right-8 z-[1000] flex gap-4 pointer-events-none">
        <div className="flex-1 max-w-md pointer-events-auto">
          <div className="relative group/search">
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm địa điểm..."
              className="w-full bg-white/80 backdrop-blur-2xl border border-luxury-beige/30 rounded-3xl px-6 py-4 pl-14 text-sm shadow-2xl focus:outline-none focus:ring-2 ring-luxury-gold/20 transition-all placeholder:text-luxury-cacao/40"
            />
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-luxury-cacao/40 group-focus-within/search:text-luxury-gold transition-colors" size={18} />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-luxury-cacao/40 hover:text-luxury-espresso"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 pointer-events-auto">
          <button 
            onClick={handleCurrentLocation}
            className="w-14 h-14 bg-white/80 backdrop-blur-2xl border border-luxury-beige/30 rounded-2xl shadow-2xl flex items-center justify-center text-luxury-espresso hover:bg-luxury-gold hover:text-white transition-all duration-500"
            title="Vị trí hiện tại"
          >
            <LocateFixed size={20} />
          </button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "w-14 h-14 bg-white/80 backdrop-blur-2xl border border-luxury-beige/30 rounded-2xl shadow-2xl flex items-center justify-center text-luxury-espresso hover:bg-luxury-gold hover:text-white transition-all duration-500",
              isExpanded && "bg-luxury-espresso text-white"
            )}
          >
            <Maximize size={20} className={cn("transition-transform duration-500", isExpanded && "rotate-45")} />
          </button>
        </div>
      </div>

      {/* Map Content */}
      <div className="w-full h-full relative z-0">
        <MapContainer 
          center={locations.length > 0 ? [locations[0].lat, locations[0].lng] : [21.0285, 105.8542]} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          scrollWheelZoom={true}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url={mapType === 'satellite' 
              ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
              : mapType === 'dark'
                ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
            }
          />
          
          <ZoomControl position="bottomright" />
          
          <MapController 
            center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : undefined}
            zoom={16}
            bounds={!selectedId ? bounds || undefined : undefined}
          />

          {/* User Location Marker */}
          {userLocation && (
            <Marker position={userLocation} icon={new L.Icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })}>
              <Popup>Bạn đang ở đây</Popup>
            </Marker>
          )}

          {/* Route Line */}
          {routePath.length > 1 && (
            <Polyline 
              positions={routePath} 
              pathOptions={{ 
                color: '#D4AF37', 
                weight: 4, 
                opacity: 0.6, 
                dashArray: '10, 15',
                lineCap: 'round'
              }} 
            />
          )}

          {/* Markers */}
          {locations.map((loc, idx) => (
            <Marker 
              key={loc.id} 
              position={[loc.lat, loc.lng]} 
              icon={createCustomIcon(idx + 1, selectedId === loc.id ? '#D4AF37' : '#5A3E36', editingId === loc.id)}
              eventHandlers={{
                click: () => onPointSelect?.(loc.id),
              }}
            >
              <Popup className="luxury-popup">
                <div className="p-4 min-w-[200px]">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-luxury-espresso font-serif">{loc.name}</h4>
                      {loc.time && <p className="text-[10px] text-luxury-gold font-bold uppercase tracking-widest mt-0.5">{loc.time}</p>}
                    </div>
                  </div>
                  <p className="text-xs text-luxury-cacao/70 italic mb-4 leading-relaxed line-clamp-2">{loc.description}</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openGoogleMaps(loc.lat, loc.lng)}
                      className="flex-1 flex items-center justify-center gap-2 bg-luxury-espresso text-white py-2 rounded-xl text-[10px] font-bold hover:bg-luxury-gold transition-colors"
                    >
                      <Navigation size={12} />
                      Chỉ đường
                    </button>
                    <button 
                      onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(loc.name + " " + destination)}`, '_blank')}
                      className="w-10 h-10 flex items-center justify-center bg-luxury-beige/20 text-luxury-espresso rounded-xl hover:bg-luxury-beige/40 transition-colors"
                    >
                      <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Layer Controls */}
      <div className="absolute bottom-8 left-8 z-[1000] flex gap-2">
        {(['light', 'dark', 'satellite'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setMapType(type)}
            className={cn(
              "px-4 py-2 bg-white/80 backdrop-blur-2xl border border-luxury-beige/30 rounded-xl shadow-2xl text-[10px] font-bold uppercase tracking-widest transition-all",
              mapType === type ? "bg-luxury-gold text-white" : "text-luxury-espresso/60 hover:text-luxury-espresso"
            )}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Stats Overlay */}
      <div className="absolute bottom-8 right-16 z-[1000] pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-luxury-espresso/90 backdrop-blur-2xl px-6 py-4 rounded-3xl shadow-2xl border border-white/10 flex items-center gap-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-luxury-gold/20 flex items-center justify-center">
              <MapPin size={18} className="text-luxury-gold" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-luxury-gold uppercase tracking-[0.2em] leading-none mb-1">Điểm đến</p>
              <p className="text-sm font-serif font-bold text-white leading-none">{destination}</p>
            </div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-right">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] leading-none mb-1">Tổng cộng</p>
            <p className="text-sm font-mono font-bold text-luxury-gold leading-none">{locations.length} địa điểm</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
