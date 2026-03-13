import React, { useMemo } from 'react';
import { MapPin, Navigation2, Crosshair, ExternalLink, Zap } from 'lucide-react';
import { User, ServiceOrder, OrderStatus } from '../types';

interface MapVisualizerProps {
  orders: ServiceOrder[];
  onNavigate: (order: ServiceOrder) => void;
  height?: string;
  className?: string;
  currentLocation?: { lat: number, lng: number } | null;
  employees?: User[];
}

// Helper to calculate distance between two points
const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2));
};

const MapVisualizer: React.FC<MapVisualizerProps> = ({ orders, onNavigate, height = "h-64", className = "", currentLocation, employees = [] }) => {
  // 1. Route Logic: Sort orders to create a logical path (Simple Nearest Neighbor simulation)
  // We assume a starting point (e.g., Office/Central SP) if needed, or just start with the first order.
  const sortedOrders = useMemo(() => {
    if (orders.length === 0) return [];
    
    // Clone to not mutate original
    const pending = orders.filter(o => o.status !== OrderStatus.COMPLETED);
    const completed = orders.filter(o => o.status === OrderStatus.COMPLETED);
    
    // Sort pending by proximity to each other (simplified TSP)
    const sortedPending: ServiceOrder[] = [];
    let currentPool = [...pending];
    
    // Start with current location if available, else the first pending order
    if (currentPool.length > 0) {
      let currentLat = currentLocation?.lat ?? currentPool[0].lat;
      let currentLng = currentLocation?.lng ?? currentPool[0].lng;

      while (currentPool.length > 0) {
        // Find nearest to current
        let nearest = currentPool[0];
        let minDist = getDistance(currentLat, currentLng, nearest.lat, nearest.lng);

        for (let i = 1; i < currentPool.length; i++) {
          const dist = getDistance(currentLat, currentLng, currentPool[i].lat, currentPool[i].lng);
          if (dist < minDist) {
            minDist = dist;
            nearest = currentPool[i];
          }
        }
        
        sortedPending.push(nearest);
        currentLat = nearest.lat;
        currentLng = nearest.lng;
        currentPool = currentPool.filter(o => o.id !== nearest.id);
      }
    }

    return [...completed, ...sortedPending];
  }, [orders, currentLocation]);

  // 2. Normalization Logic: Fit points into the container 0-100%
  const { normalizedPoints, boundingBox, normalizedCurrentLocation, normalizedEmployees } = useMemo(() => {
    if (orders.length === 0 && !currentLocation && employees.length === 0) return { normalizedPoints: [], boundingBox: null, normalizedCurrentLocation: null, normalizedEmployees: [] };

    const lats = orders.map(o => o.lat);
    const lngs = orders.map(o => o.lng);
    
    if (currentLocation) {
      lats.push(currentLocation.lat);
      lngs.push(currentLocation.lng);
    }

    employees.forEach(emp => {
      if (emp.lat && emp.lng) {
        lats.push(emp.lat);
        lngs.push(emp.lng);
      }
    });
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Add padding (buffer) so points aren't on the extreme edge
    const latBuffer = (maxLat - minLat) * 0.2 || 0.001;
    const lngBuffer = (maxLng - minLng) * 0.2 || 0.001;

    const latRange = (maxLat - minLat) + (latBuffer * 2);
    const lngRange = (maxLng - minLng) + (lngBuffer * 2);

    const points = sortedOrders.map((order, index) => {
      // Invert Lat because screen Y goes down, but Lat goes up (North)
      // Actually map coordinates: Max Lat is Top (0%), Min Lat is Bottom (100%)
      const y = ((maxLat + latBuffer) - order.lat) / latRange * 100;
      const x = (order.lng - (minLng - lngBuffer)) / lngRange * 100;
      return { ...order, x, y, sequenceIndex: index + 1 };
    });

    let normCurrent = null;
    if (currentLocation) {
        const y = ((maxLat + latBuffer) - currentLocation.lat) / latRange * 100;
        const x = (currentLocation.lng - (minLng - lngBuffer)) / lngRange * 100;
        normCurrent = { x, y };
    }

    const normEmployees = employees.filter(e => e.lat && e.lng).map(emp => {
      const y = ((maxLat + latBuffer) - emp.lat!) / latRange * 100;
      const x = (emp.lng! - (minLng - lngBuffer)) / lngRange * 100;
      return { ...emp, x, y };
    });

    return { 
      normalizedPoints: points, 
      boundingBox: { minLat, maxLat, minLng, maxLng },
      normalizedCurrentLocation: normCurrent,
      normalizedEmployees: normEmployees
    };
  }, [orders, sortedOrders, currentLocation, employees]);

  // 3. Generate SVG Path
  const routePath = useMemo(() => {
    if (normalizedPoints.length === 0) return '';
    
    let pathString = '';
    
    if (normalizedCurrentLocation && normalizedPoints.length > 0) {
        pathString = `M ${normalizedCurrentLocation.x},${normalizedCurrentLocation.y} L `;
    } else if (normalizedPoints.length > 0) {
        pathString = `M `;
    }
    
    const points = normalizedPoints.map(p => `${p.x},${p.y}`).join(' L ');
    return pathString + points;
  }, [normalizedPoints, normalizedCurrentLocation]);

  // 4. Generate Google Maps Deep Link
  const handleOpenGoogleMaps = () => {
    if (sortedOrders.length === 0) return;
    
    // Format: https://www.google.com/maps/dir/Origin/Waypoint1/Waypoint2/Destination
    const baseUrl = "https://www.google.com/maps/dir/";
    const pendingOrders = sortedOrders.filter(o => o.status !== OrderStatus.COMPLETED);
    
    let waypoints = pendingOrders.map(o => `${o.lat},${o.lng}`).join('/');
    
    if (currentLocation) {
        waypoints = `${currentLocation.lat},${currentLocation.lng}/${waypoints}`;
    }

    if (!waypoints) return;

    // Open in new tab (Mobile will try to open App)
    window.open(`${baseUrl}${waypoints}`, '_blank');
  };

  return (
    <div className={`relative w-full ${height} bg-slate-900 rounded-2xl overflow-hidden shadow-2xl group isolate border border-slate-700 flex flex-col ${className}`}>
      
      {/* Map Area */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* Dark Mode Map Base Grid */}
        <div className="absolute inset-0 bg-[#0f172a]" 
             style={{ 
               backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', 
               backgroundSize: '20px 20px' 
             }}>
        </div>
        
        {/* City Blocks Abstract Geometry (Decorations) */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
           <div className="absolute top-1/4 left-1/4 w-1/3 h-1/3 border-2 border-slate-500 rounded-3xl"></div>
           <div className="absolute top-1/2 left-2/3 w-40 h-40 bg-slate-800 rounded-full blur-3xl"></div>
        </div>

        {/* GPS Header UI */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20 pointer-events-none">
          <div className="bg-slate-800/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-300 shadow-lg border border-slate-600 flex items-center gap-2">
            <Crosshair size={12} className="text-blue-400" />
            <span>LAT: {boundingBox?.minLat.toFixed(2) || '0.00'} • LNG: {boundingBox?.minLng.toFixed(2) || '0.00'}</span>
          </div>
          <div className="bg-green-500/20 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold text-green-400 shadow-lg border border-green-500/30 flex items-center gap-2 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
            GPS LIVE
          </div>
        </div>

        {/* Dynamic SVG Route Line */}
        <style>
          {`
            @keyframes dash {
              to {
                stroke-dashoffset: -100;
              }
            }
          `}
        </style>
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ filter: 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))' }}>
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
            </linearGradient>
            <marker id="arrowhead" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
               <polygon points="0 0, 4 2, 0 4" fill="#3b82f6" />
            </marker>
          </defs>
          <path 
            d={routePath} 
            stroke="url(#routeGradient)" 
            strokeWidth="3" 
            fill="none" 
            strokeLinecap="round" 
            strokeDasharray="6 4"
            style={{ animation: 'dash 20s linear infinite' }}
          />
        </svg>

        {/* Current Location Pin */}
        {normalizedCurrentLocation && (
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30"
            style={{ left: `${normalizedCurrentLocation.x}%`, top: `${normalizedCurrentLocation.y}%` }}
          >
            <div className="relative flex flex-col items-center">
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-50 animate-ping duration-1000"></span>
              <div className="relative p-2 rounded-full border-2 bg-green-500 border-white shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
              <div className="absolute top-8 bg-slate-900/95 backdrop-blur-md text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-xl border border-slate-700 whitespace-nowrap">
                Você está aqui
              </div>
            </div>
          </div>
        )}

        {/* Employee Pins */}
        {normalizedEmployees?.map((emp) => (
          <div 
            key={emp.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-25 transition-all hover:scale-110 hover:z-30 cursor-pointer"
            style={{ left: `${emp.x}%`, top: `${emp.y}%` }}
          >
            <div className="relative group/emp flex flex-col items-center">
              <div className="relative p-1.5 rounded-full border-2 bg-purple-500 border-white shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
              <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white p-2 rounded-xl shadow-2xl border border-slate-700 w-32 hidden group-hover/emp:block z-50 animate-in fade-in slide-in-from-top-2 duration-200 text-center">
                <p className="font-bold text-xs truncate">{emp.name}</p>
                <p className="opacity-70 text-[10px] uppercase tracking-wider">Técnico</p>
              </div>
            </div>
          </div>
        ))}

        {/* Pins */}
        {normalizedPoints.map((point) => {
          const isCompleted = point.status === OrderStatus.COMPLETED;
          
          return (
            <div 
              key={point.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 transition-all hover:scale-110 hover:z-30 cursor-pointer"
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              onClick={() => onNavigate(point)}
            >
              <div className="relative group/pin flex flex-col items-center">
                {/* Number Badge */}
                <div className="absolute -top-6 bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-600 shadow-sm z-20">
                   {point.sequenceIndex}
                </div>

                {/* Pulse Effect for Active Orders */}
                {!isCompleted && (
                  <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-50 animate-ping duration-1000"></span>
                )}
                
                <div className={`relative p-2 rounded-xl border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-colors ${
                  isCompleted 
                    ? 'bg-slate-700 border-slate-500' 
                    : 'bg-gradient-to-br from-blue-500 to-indigo-600 border-white'
                }`}>
                  {isCompleted ? <MapPin className="text-slate-300 w-4 h-4" /> : <Navigation2 className="text-white w-4 h-4 fill-current" />}
                </div>
                
                {/* Detailed Tooltip */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl shadow-2xl border border-slate-700 w-48 hidden group-hover/pin:block z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="font-bold text-sm truncate">{point.customerName}</p>
                  <p className="text-xs text-blue-300 font-mono mb-1">{point.lat.toFixed(4)}, {point.lng.toFixed(4)}</p>
                  <p className="opacity-70 text-[10px] uppercase tracking-wider">{point.address}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer / Optimization Bar */}
      <div className="bg-slate-800 border-t border-slate-700 p-3 flex justify-between items-center z-30">
        <div className="flex items-center gap-2">
           <Zap size={14} className="text-yellow-400 fill-current" />
           <span className="text-xs text-slate-300 font-medium">Rota Otimizada por IA</span>
        </div>
        <button 
          onClick={handleOpenGoogleMaps}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition shadow-lg shadow-blue-900/20 active:scale-95"
        >
          <ExternalLink size={14} /> Abrir no Google Maps
        </button>
      </div>
    </div>
  );
};

export default MapVisualizer;
