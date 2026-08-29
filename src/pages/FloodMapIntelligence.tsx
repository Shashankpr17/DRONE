import React, { useState } from 'react';
import { settlementsData, infrastructureData, waterSpreadData as defaultWaterSpread } from '../data/mockData';
import { DisasterGoogleMap, type MapLayerState, type MapTargetLocation } from '../components/DisasterGoogleMap';

export const FloodMapIntelligence: React.FC = () => {
  const [layers, setLayers] = useState<MapLayerState>({
    waterLevels: true,
    waterSpread: false,
    settlements: true,
    roadStatus: false,
    infrastructure: true,
    activeAssets: true,
    safeRoutes: false,
  });

  const [targetLocation] = useState<MapTargetLocation | null>(null);
  const [isLayersOpen, setIsLayersOpen] = useState(false);
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

      {/* Floating Layer Toggle Button & Collapsible Panel */}
      <div className="relative z-20 p-4 pointer-events-none flex flex-col items-start gap-2">
        <button
          onClick={() => setIsLayersOpen(!isLayersOpen)}
          className="pointer-events-auto flex items-center gap-2 px-3.5 py-2 bg-surface-container-lowest/95 backdrop-blur-md hover:bg-surface-container-lowest text-on-surface rounded-xl border border-outline-variant shadow-md text-xs font-bold transition-all cursor-pointer"
          title="Toggle GIS Layers"
        >
          <span className="material-symbols-outlined text-primary text-base">layers</span>
          <span>{isLayersOpen ? 'Hide Map Layers' : 'Map Layers (4)'}</span>
        </button>

        {/* Collapsible Map Layer Controls */}
        {isLayersOpen && (
          <div className="pointer-events-auto w-full sm:w-80 bg-surface-container-lowest/95 backdrop-blur-md rounded-xl border border-outline-variant shadow-xl flex flex-col max-h-[70vh] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-3 border-b border-outline-variant bg-surface-bright/80 rounded-t-xl flex justify-between items-center sticky top-0 bg-surface-container-lowest">
              <h3 className="font-headline-md text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">layers</span>
                Map Layers &amp; Overlays
              </h3>
              <button
                onClick={() => setIsLayersOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
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

              {/* Layer 2: Affected Settlements */}
              <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={layers.settlements}
                  onChange={(e) => setLayers({ ...layers, settlements: e.target.checked })}
                  className="mt-0.5 rounded border-outline-variant text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <span className="font-semibold text-on-surface block">Affected Settlements ({settlementsData.length})</span>
                  <span className="text-on-surface-variant text-[11px] block">KIIT Campus 6, Patia, Sikharchandi</span>
                </div>
              </label>

              {/* Layer 3: Critical Infrastructure */}
              <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={layers.infrastructure}
                  onChange={(e) => setLayers({ ...layers, infrastructure: e.target.checked })}
                  className="mt-0.5 rounded border-outline-variant text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <span className="font-semibold text-on-surface block">Critical Infrastructure ({infrastructureData.length})</span>
                  <span className="text-on-surface-variant text-[11px] block">KIMS Hospital, Patia Bridge, Substation</span>
                </div>
              </label>

              {/* Layer 4: Active Assets & Units */}
              <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={layers.activeAssets}
                  onChange={(e) => setLayers({ ...layers, activeAssets: e.target.checked })}
                  className="mt-0.5 rounded border-outline-variant text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <span className="font-semibold text-on-surface block">Active Units &amp; Relief Camps</span>
                  <span className="text-on-surface-variant text-[11px] block">DRONE-001, NDRF boats, KIIT Camp</span>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
