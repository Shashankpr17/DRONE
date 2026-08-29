import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { getSocket } from '../api/socketClient';

export interface MapLayerState {
  waterLevels: boolean;
  waterSpread: boolean;
  settlements: boolean;
  roadStatus: boolean;
  infrastructure: boolean;
  activeAssets: boolean;
  safeRoutes: boolean;
}

export interface MapTargetLocation {
  lat: number;
  lng: number;
  name?: string;
  category?: string;
  zoom?: number;
}

interface DisasterGoogleMapProps {
  layers: MapLayerState;
  targetLocation?: MapTargetLocation | null;
  onSelectFeature?: (feature: any) => void;
  className?: string;
}

// Map Tile Providers
const TILE_LAYERS = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
};

export const DisasterGoogleMap: React.FC<DisasterGoogleMapProps> = ({
  layers,
  targetLocation,
  className = 'w-full h-full min-h-[400px]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const droneMarkerRef = useRef<L.Marker | null>(null);
  const searchMarkerRef = useRef<L.Marker | null>(null);

  const [activeTile, setActiveTile] = useState<'satellite' | 'osm'>('satellite');
  const [currentTelemetry, setCurrentTelemetry] = useState<any>({
    lat: 20.3529,
    lng: 85.8202,
    altitude: 120,
    speed: 45,
    battery: 84,
  });

  // Default coordinate center (KIIT University Campus 6, Bhubaneswar, Odisha)
  const defaultCenter: [number, number] = [20.3529, 85.8202];

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Initialize Leaflet Map
    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    // Add Zoom Control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Add Initial Tile Layer
    const tileConfig = TILE_LAYERS[activeTile];
    const tile = L.tileLayer(tileConfig.url, {
      maxZoom: tileConfig.maxZoom,
      attribution: tileConfig.attribution,
    }).addTo(map);

    tileLayerRef.current = tile;

    // Initialize Layer Group for dynamic features
    const layerGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    // Ensure map tiles resize correctly after mounting
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when user toggles Satellite / Dark / Street
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileConfig = TILE_LAYERS[activeTile];
    const newTile = L.tileLayer(tileConfig.url, {
      maxZoom: tileConfig.maxZoom,
      attribution: tileConfig.attribution,
    }).addTo(map);

    tileLayerRef.current = newTile;
  }, [activeTile]);

  // Handle Flying to Targeted Search Location
  useEffect(() => {
    if (!mapInstanceRef.current || !targetLocation) return;
    const map = mapInstanceRef.current;

    map.flyTo([targetLocation.lat, targetLocation.lng], targetLocation.zoom || 16, {
      duration: 1.2,
      easeLinearity: 0.25,
    });

    if (searchMarkerRef.current) {
      map.removeLayer(searchMarkerRef.current);
      searchMarkerRef.current = null;
    }

    const targetIcon = L.divIcon({
      className: 'custom-target-marker',
      html: `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(37, 99, 235, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 22px; height: 22px; border-radius: 50%; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
            <div style="width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></div>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const marker = L.marker([targetLocation.lat, targetLocation.lng], { icon: targetIcon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #1e293b; min-width: 140px; padding: 2px;">
          <h4 style="margin: 0 0 4px; font-weight: bold; color: #1e40af; font-size: 13px;">📍 ${targetLocation.name || 'Target Location'}</h4>
          ${targetLocation.category ? `<p style="margin: 2px 0; color: #64748b; font-size: 11px;"><strong>Type:</strong> ${targetLocation.category}</p>` : ''}
          <p style="margin: 2px 0; font-family: monospace; font-size: 11px; color: #475569;">GPS: ${targetLocation.lat.toFixed(4)}, ${targetLocation.lng.toFixed(4)}</p>
        </div>
      `)
      .openPopup();

    searchMarkerRef.current = marker;
  }, [targetLocation]);

  // Update Dynamic Layers, Polygons, and Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !layersGroupRef.current) return;
    const group = layersGroupRef.current;
    group.clearLayers();

    // 1. Flood Inundation Polygons (Water Levels around KIIT Campus 6 & Patia Lowlands)
    if (layers.waterLevels) {
      const floodZone1Coords: [number, number][] = [
        [20.3560, 85.8160],
        [20.3585, 85.8220],
        [20.3550, 85.8260],
        [20.3490, 85.8235],
        [20.3480, 85.8170],
      ];

      const floodPoly1 = L.polygon(floodZone1Coords, {
        color: '#dc2626',
        weight: 2,
        fillColor: '#ef4444',
        fillOpacity: 0.38,
      }).bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #1e293b;">
          <h4 style="margin: 0 0 4px; font-weight: bold; color: #dc2626; font-size: 13px;">🌊 KIIT Campus 6 High Inundation Zone</h4>
          <p style="margin: 2px 0;"><strong>Peak Depth:</strong> 2.8m (Waterlogging)</p>
          <p style="margin: 2px 0;"><strong>Risk Level:</strong> Severe Flood Surge</p>
          <p style="margin: 2px 0;"><strong>Spread Velocity:</strong> 1.5 m/s South towards Patia</p>
        </div>
      `);
      group.addLayer(floodPoly1);

      const floodZone2Coords: [number, number][] = [
        [20.3490, 85.8210],
        [20.3420, 85.8250],
        [20.3400, 85.8180],
      ];

      const floodPoly2 = L.polygon(floodZone2Coords, {
        color: '#f59e0b',
        weight: 2,
        fillColor: '#38bdf8',
        fillOpacity: 0.32,
      }).bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #1e293b;">
          <h4 style="margin: 0 0 4px; font-weight: bold; color: #0284c7; font-size: 13px;">🌊 Patia Lowland Water Spread</h4>
          <p style="margin: 2px 0;"><strong>Estimated Depth:</strong> 1.4m</p>
          <p style="margin: 2px 0;"><strong>Status:</strong> Active Inundation</p>
        </div>
      `);
      group.addLayer(floodPoly2);
    }

    // 2. Affected Settlements Markers
    if (layers.settlements) {
      const settlements = [
        { id: 'SET-01', name: 'Campus 6 Hostel Block', lat: 20.3540, lng: 85.8210, status: 'Flood Affected (1.4m Depth)', pop: 620, color: '#dc2626' },
        { id: 'SET-02', name: 'Patia Square Residential', lat: 20.3510, lng: 85.8190, status: 'Partially Submerged (1.8m Depth)', pop: 450, color: '#b91c1c' },
        { id: 'SET-03', name: 'Sikharchandi Foothills', lat: 20.3570, lng: 85.8235, status: 'Flood Risk (0.8m Depth)', pop: 280, color: '#dc2626' },
      ];

      settlements.forEach((s) => {
        const markerIcon = L.divIcon({
          className: 'custom-settlement-marker',
          html: `
            <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
              <div style="background: #1e293b; color: #ffffff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.4); border: 1px solid #475569; margin-bottom: 2px;">
                ${s.name}
              </div>
              <div style="width: 14px; height: 14px; border-radius: 50%; background: ${s.color}; border: 2.5px solid #ffffff; box-shadow: 0 0 6px rgba(0,0,0,0.5);"></div>
            </div>
          `,
          iconSize: [120, 36],
        });

        const marker = L.marker([s.lat, s.lng], { icon: markerIcon }).bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #1e293b;">
            <h4 style="margin: 0 0 4px; font-weight: bold; color: ${s.color}; font-size: 13px;">🏠 ${s.name}</h4>
            <p style="margin: 2px 0;"><strong>Status:</strong> ${s.status}</p>
            <p style="margin: 2px 0;"><strong>Population:</strong> ${s.pop} residents</p>
            <p style="margin: 2px 0; font-family: monospace; font-size: 11px;">GPS: ${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}</p>
          </div>
        `);
        group.addLayer(marker);
      });
    }

    // 3. Critical Infrastructure
    if (layers.infrastructure) {
      const infra = [
        { id: 'H-01', name: 'KIMS Hospital', lat: 20.3545, lng: 85.8150, type: 'Hospital', status: 'Operational (Emergency Hub)', bg: '#059669', text: '#ffffff' },
        { id: 'B-02', name: 'Patia Overbridge B-02', lat: 20.3515, lng: 85.8245, type: 'Bridge', status: 'Risk (High Water Flow)', bg: '#f59e0b', text: '#ffffff' },
        { id: 'SUB-04', name: 'KIIT Substation Sub-04', lat: 20.3485, lng: 85.8165, type: 'Substation', status: 'Submerged (Power Isolated)', bg: '#ea580c', text: '#ffffff' },
      ];

      infra.forEach((item) => {
        const infraIcon = L.divIcon({
          className: 'custom-infra-marker',
          html: `
            <div style="background: ${item.bg}; color: ${item.text}; font-size: 10px; font-weight: bold; padding: 3px 8px; border-radius: 6px; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.5); border: 1.5px solid #ffffff; white-space: nowrap; transform: translate(-50%, -50%);">
              <span>🏢</span>
              <span>${item.name}</span>
            </div>
          `,
          iconSize: [140, 26],
        });

        const marker = L.marker([item.lat, item.lng], { icon: infraIcon }).bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #1e293b;">
            <h4 style="margin: 0 0 4px; font-weight: bold; color: ${item.bg}; font-size: 13px;">🏢 ${item.name}</h4>
            <p style="margin: 2px 0;"><strong>Category:</strong> ${item.type}</p>
            <p style="margin: 2px 0;"><strong>Status:</strong> ${item.status}</p>
            <p style="margin: 2px 0; font-family: monospace; font-size: 11px;">GPS: ${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}</p>
          </div>
        `);
        group.addLayer(marker);
      });
    }

    // 4. Roads & Evacuation Routes
    if (layers.roadStatus || layers.safeRoutes) {
      // Nandankanan Main Road (Partially Blocked)
      const road1: [number, number][] = [
        [20.3580, 85.8170],
        [20.3530, 85.8200],
        [20.3480, 85.8230],
      ];
      const line1 = L.polyline(road1, {
        color: '#ef4444',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.9,
      }).bindPopup('<b>Nandankanan Road</b><br/>Waterlogged & Inaccessible (1.6m Water)');
      group.addLayer(line1);

      // Campus 6 Link Road (Submerged)
      const road2: [number, number][] = [
        [20.3540, 85.8200],
        [20.3505, 85.8210],
      ];
      const line2 = L.polyline(road2, {
        color: '#f59e0b',
        weight: 4,
        opacity: 0.9,
      }).bindPopup('<b>Campus 6 Internal Link</b><br/>Submerged Road');
      group.addLayer(line2);

      // Sikharchandi High Ground Evacuation Route (Safe / Open)
      const safeRoute: [number, number][] = [
        [20.3500, 85.8250],
        [20.3560, 85.8280],
        [20.3600, 85.8320],
      ];
      const safeLine = L.polyline(safeRoute, {
        color: '#10b981',
        weight: 5,
        opacity: 0.95,
      }).bindPopup('<b>Sikharchandi Evacuation Route</b><br/>Elevated Clear Route to High Ground');
      group.addLayer(safeLine);
    }

    // 5. Live Drone Marker
    if (layers.activeAssets) {
      const droneIcon = L.divIcon({
        className: 'custom-drone-marker',
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
            <div style="background: #0284c7; color: #ffffff; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 999px; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.5); border: 1.5px solid #ffffff; margin-bottom: 2px; display: flex; align-items: center; gap: 4px;">
              <span>🛸</span>
              <span>DRONE-001 (${currentTelemetry.battery || 84}%)</span>
            </div>
            <div style="width: 28px; height: 28px; border-radius: 50%; background: rgba(2, 132, 199, 0.35); border: 2px solid #0284c7; display: flex; align-items: center; justify-content: center; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;">
              <div style="width: 10px; height: 10px; border-radius: 50%; background: #0284c7;"></div>
            </div>
          </div>
        `,
        iconSize: [120, 50],
      });

      const droneMarker = L.marker([currentTelemetry.lat, currentTelemetry.lng], { icon: droneIcon }).bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0369a1; line-height: 1.4;">
          <h4 style="margin: 0 0 4px; font-weight: bold; font-size: 14px;">🛸 DRONE-001 (Live Flight Patrol)</h4>
          <p style="margin: 2px 0;"><strong>Location:</strong> KIIT Campus 6 Airspace</p>
          <p style="margin: 2px 0;"><strong>Altitude:</strong> ${currentTelemetry.altitude}m AGL</p>
          <p style="margin: 2px 0;"><strong>Ground Speed:</strong> ${currentTelemetry.speed} km/h</p>
          <p style="margin: 2px 0;"><strong>Battery:</strong> ${currentTelemetry.battery}%</p>
          <p style="margin: 2px 0;"><strong>Flight Mode:</strong> Autonomous Disaster Reconnaissance</p>
        </div>
      `);

      group.addLayer(droneMarker);
      droneMarkerRef.current = droneMarker;
    }
  }, [layers, activeTile, currentTelemetry]);

  // Live WebSocket updates for Drone Telemetry (MAVLink & Standard Telemetry)
  useEffect(() => {
    const socket = getSocket();
    const handleTelemetry = (telemetry: any) => {
      if (telemetry.coordinates) {
        const lat = telemetry.coordinates.lat || 28.6139;
        const lng = telemetry.coordinates.lng || 77.2090;

        setCurrentTelemetry({
          lat,
          lng,
          altitude: telemetry.altitude || 120,
          speed: telemetry.speed || 45,
          battery: telemetry.battery || 84,
        });

        if (droneMarkerRef.current) {
          droneMarkerRef.current.setLatLng([lat, lng]);
        }
      }
    };

    const handleMavlink = (data: any) => {
      if (data && typeof data.lat === 'number' && typeof data.lng === 'number' && data.lat !== 0 && data.lng !== 0) {
        const lat = data.lat;
        const lng = data.lng;

        setCurrentTelemetry((prev: any) => ({
          ...prev,
          lat,
          lng,
          altitude: data.altitude ?? prev.altitude,
          speed: data.speed ?? prev.speed,
          battery: data.battery ?? prev.battery,
          yaw: data.yaw ?? prev.yaw,
        }));

        if (droneMarkerRef.current) {
          droneMarkerRef.current.setLatLng([lat, lng]);
        }
      }
    };

    socket.on('telemetry:update', handleTelemetry);
    socket.on('telemetry:mavlink', handleMavlink);
    return () => {
      socket.off('telemetry:update', handleTelemetry);
      socket.off('telemetry:mavlink', handleMavlink);
    };
  }, []);

  // Listen for search navigation events (coordinates, landmarks, settlements)
  useEffect(() => {
    const handleFlyTo = (e: any) => {
      if (!mapInstanceRef.current || !layersGroupRef.current) return;
      const map = mapInstanceRef.current;
      const group = layersGroupRef.current;
      const { lat, lng, zoom = 16, label = 'Searched Location', category = 'Search Location' } = e.detail || {};

      if (lat && lng) {
        map.flyTo([lat, lng], zoom, { duration: 1.5 });

        // Remove previous search pin if any
        if (searchMarkerRef.current) {
          group.removeLayer(searchMarkerRef.current);
        }

        const searchIcon = L.divIcon({
          className: 'custom-search-pin',
          html: `
            <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
              <div style="background: #f59e0b; color: #000000; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 999px; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.6); border: 2px solid #ffffff; margin-bottom: 2px;">
                📍 ${label}
              </div>
              <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(245, 158, 11, 0.35); border: 2.5px solid #f59e0b; display: flex; align-items: center; justify-content: center;">
                <div style="width: 12px; height: 12px; border-radius: 50%; background: #f59e0b;"></div>
              </div>
            </div>
          `,
          iconSize: [140, 60],
        });

        const newMarker = L.marker([lat, lng], { icon: searchIcon }).bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #1e293b; min-width: 160px;">
            <h4 style="margin: 0 0 4px; font-weight: bold; color: #d97706; font-size: 13px;">📍 ${label}</h4>
            <p style="margin: 2px 0;"><strong>Category:</strong> ${category}</p>
            <p style="margin: 2px 0; font-family: monospace; font-size: 11px;"><strong>Coordinates:</strong> ${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}</p>
          </div>
        `);

        group.addLayer(newMarker);
        searchMarkerRef.current = newMarker;
        setTimeout(() => newMarker.openPopup(), 1200);
      }
    };

    window.addEventListener('map:flyto', handleFlyTo);
    window.addEventListener('map:flyTo', handleFlyTo);
    return () => {
      window.removeEventListener('map:flyto', handleFlyTo);
      window.removeEventListener('map:flyTo', handleFlyTo);
    };
  }, []);

  return (
    <div className={`relative ${className} bg-[#0b1329] overflow-hidden`}>
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[380px] z-0" />

      {/* Map Mode Switcher (Satellite / Street) */}
      <div className="absolute top-4 right-4 z-20 flex bg-surface-container-lowest/95 backdrop-blur-md border border-outline-variant rounded-lg p-1 shadow-md gap-1">
        <button
          onClick={() => setActiveTile('satellite')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            activeTile === 'satellite'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          Satellite
        </button>
        <button
          onClick={() => setActiveTile('osm')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            activeTile === 'osm'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          Street Map
        </button>
      </div>
    </div>
  );
};
