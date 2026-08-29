import React, { useState } from 'react';
import { settlementsData, infrastructureData, roadAccessibilityData, waterSpreadData as defaultWaterSpread } from '../data/mockData';
import { DisasterGoogleMap, type MapLayerState, type MapTargetLocation } from '../components/DisasterGoogleMap';

export const FloodMapIntelligence: React.FC = () => {
  const [layers, setLayers] = useState<MapLayerState>({
    waterLevels: true,
    waterSpread: true,
    settlements: true,
    roadStatus: true,
    infrastructure: true,
    activeAssets: true,
    safeRoutes: true,
  });

  const [targetLocation] = useState<MapTargetLocation | null>(null);
  const waterSpreadData = defaultWaterSpread;

  return (
    <div className="relative w-full h-[calc(100vh-64px)] min-h-[600px] overflow-hidden bg-surface-container-low flex flex-col">
      {/* Interactive Google Map with live GIS overlays */}
      <div className="absolute inset-0 z-0">
        <DisasterGoogleMap
          layers={layers}
          targetLocation={targetLocation}
          className="w-full h-full"
        />
      </div>

      {/* Main Overlay Bento Grid Panels */}
      <div className="relative z-20 flex-1 p-4 md:p-6 flex flex-col justify-between pointer-events-none">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
          {/* Left Panel: Map Layer Controls */}
          <div className="pointer-events-auto w-full sm:w-80 bg-surface-container-lowest/95 backdrop-blur-md rounded-xl border border-outline-variant shadow-lg flex flex-col max-h-[70vh] overflow-y-auto">
            <div className="p-3 border-b border-outline-variant bg-surface-bright/80 rounded-t-xl flex justify-between items-center sticky top-0 bg-surface-container-lowest">
              <h3 className="font-headline-md text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">layers</span>
                Map Layers &amp; Overlays
              </h3>
              <span className="text-[11px] font-mono text-on-surface-variant uppercase">7 Feeds</span>
            </div>

            <div className="p-3 space-y-2 text-xs">
              {/* Layer 1: Water Inundation */}
              <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={layers.waterLevels}
                  onChange={(e) => setLayers({ ...layers, waterLevels: e.target.checked })}
                  className="mt-0.5 rounded border-outline-variant text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <span className="font-semibold text-on-surface block">Water Inundation ({waterSpreadData.coveragePercentage}%)</span>
                  <span className="text-on-surface-variant text-[11px] block">Live flood extent boundaries</span>
                </div>
              </label>

              {/* Layer 2: Water Spread */}
              <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={layers.waterSpread}
                  onChange={(e) => setLayers({ ...layers, waterSpread: e.target.checked })}
                  className="mt-0.5 rounded border-outline-variant text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <span className="font-semibold text-on-surface block">Water Spread ({waterSpreadData.direction})</span>
                  <span className="text-on-surface-variant text-[11px] block">Trend: {waterSpreadData.trend} ({waterSpreadData.changeSincePreviousSurvey})</span>
                </div>
              </label>

              {/* Layer 3: Affected Settlements */}
              <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={layers.settlements}
                  onChange={(e) => setLayers({ ...layers, settlements: e.target.checked })}
                  className="mt-0.5 rounded border-outline-variant text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <span className="font-semibold text-on-surface block">Affected Settlements ({settlementsData.length})</span>
                  <span className="text-on-surface-variant text-[11px] block">Sector 12, Riverside, East Hamlet</span>
                </div>
              </label>

              {/* Layer 4: Road Accessibility */}
              <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={layers.roadStatus}
                  onChange={(e) => setLayers({ ...layers, roadStatus: e.target.checked })}
                  className="mt-0.5 rounded border-outline-variant text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <span className="font-semibold text-on-surface block">Road Status ({roadAccessibilityData.openRoads} Open / {roadAccessibilityData.submergedRoads} Submerged)</span>
                  <span className="text-on-surface-variant text-[11px] block">Clearance and route passability</span>
                </div>
              </label>

              {/* Layer 5: Critical Infrastructure */}
              <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={layers.infrastructure}
                  onChange={(e) => setLayers({ ...layers, infrastructure: e.target.checked })}
                  className="mt-0.5 rounded border-outline-variant text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <span className="font-semibold text-on-surface block">Critical Infrastructure ({infrastructureData.length})</span>
                  <span className="text-on-surface-variant text-[11px] block">Bridges, hospitals, power grid</span>
                </div>
              </label>

              {/* Layer 6: Safe Evacuation Routes */}
              <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={layers.safeRoutes}
                  onChange={(e) => setLayers({ ...layers, safeRoutes: e.target.checked })}
                  className="mt-0.5 rounded border-outline-variant text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <span className="font-semibold text-on-surface block">Safe Evacuation Corridors</span>
                  <span className="text-on-surface-variant text-[11px] block">North Ridge → Camp Alpha safe route</span>
                </div>
              </label>

              {/* Layer 7: Active Assets & Units */}
              <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={layers.activeAssets}
                  onChange={(e) => setLayers({ ...layers, activeAssets: e.target.checked })}
                  className="mt-0.5 rounded border-outline-variant text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <span className="font-semibold text-on-surface block">Active Units &amp; Relief Camps</span>
                  <span className="text-on-surface-variant text-[11px] block">Drones, NDRF boats, Camp Alpha</span>
                </div>
              </label>
            </div>
          </div>

          {/* Right Panel removed as requested for unobstructed full-screen map view */}
        </div>

        {/* Bottom Floating Status Bar */}
        <div className="pointer-events-auto self-center bg-surface-container-lowest/90 backdrop-blur-md rounded-full px-5 py-2 flex items-center gap-4 shadow-md border border-outline-variant text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono text-on-surface font-semibold">GIS INTELLIGENCE ACTIVE</span>
          </div>
          <div className="w-px h-3.5 bg-outline-variant"></div>
          <div className="font-mono text-on-surface-variant text-[11px]">
            KIIT Campus 6 · Water Spread: South-East (+13%) · 5 Settlements Monitored
          </div>
        </div>
      </div>
    </div>
  );
};
