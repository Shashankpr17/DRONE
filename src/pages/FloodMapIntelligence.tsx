import React, { useState } from 'react';
import { settlementsData, infrastructureData, roadAccessibilityData, waterSpreadData as defaultWaterSpread } from '../data/mockData';
import { DisasterGoogleMap, type MapLayerState, type MapTargetLocation } from '../components/DisasterGoogleMap';
import { useDetectionData } from '../context/DetectionContext';
import { downloadJSON } from '../utils/exportUtils';

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

  const detection = useDetectionData();
  const effectiveWaterCoverage = detection.waterCoverage !== null ? detection.waterCoverage : 68;
  const waterSpreadData = {
    ...defaultWaterSpread,
    coveragePercentage: effectiveWaterCoverage,
  };

  const isLiveAI = detection.isLiveActive;
  const hasAIData = detection.waterCoverage !== null;

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

          {/* Right Panel: Sector 12 Intelligence Summary & Live AI HUD */}
          <div className="pointer-events-auto w-full sm:w-80 flex flex-col gap-3">
            {/* Live AI Detection HUD Card */}
            {(isLiveAI || hasAIData) && (
              <div className="bg-surface-container-lowest/95 backdrop-blur-md rounded-xl border border-primary/30 shadow-lg p-3 flex flex-col gap-2">
                <div className="flex justify-between items-center border-b border-outline-variant pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-base">psychology</span>
                    <span className="font-bold text-xs text-on-surface">Live AI Recon (YOLOv11)</span>
                  </div>
                  {isLiveAI ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 border border-red-500/30 animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span> LIVE
                    </span>
                  ) : (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      SCAN RESULT
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-surface-container-low rounded-lg p-1.5">
                    <div className="font-bold text-error text-sm">{detection.victimsCount}</div>
                    <div className="text-[10px] text-on-surface-variant">Victims</div>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-1.5">
                    <div className="font-bold text-blue-600 text-sm">{effectiveWaterCoverage}%</div>
                    <div className="text-[10px] text-on-surface-variant">Coverage</div>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-1.5">
                    <div className="font-bold text-amber-600 text-sm">{detection.vehiclesCount}</div>
                    <div className="text-[10px] text-on-surface-variant">Vehicles</div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-surface-container-lowest/95 backdrop-blur-md rounded-xl border border-outline-variant shadow-lg flex flex-col">
              <div className="p-3 border-b border-outline-variant bg-surface-bright/80 rounded-t-xl flex justify-between items-center">
                <div>
                  <h3 className="font-headline-md text-sm font-bold text-on-surface">Sector 12 Assessment</h3>
                  <p className="text-[11px] text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] text-emerald-600">sync</span> Real-Time Telemetry
                  </p>
                </div>
                <span className="px-2 py-0.5 bg-error/10 text-error border border-error/30 text-[10px] font-bold rounded">
                  CRITICAL
                </span>
              </div>

              <div className="p-3 grid grid-cols-2 gap-2 text-xs">
                {/* Metric 1 */}
                <div className="col-span-2 bg-surface-container-lowest rounded-lg border border-outline-variant p-2.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-blue-700 text-base">water</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase font-semibold">Water Spread</p>
                    <p className="text-base font-bold text-on-surface flex items-baseline gap-1">
                      {waterSpreadData.trend} · {waterSpreadData.direction}
                    </p>
                    <p className="text-[10px] text-error font-medium">Height: {waterSpreadData.peakHeight} ({waterSpreadData.changeSincePreviousSurvey})</p>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="col-span-1 bg-surface-container-lowest rounded-lg border border-outline-variant p-2.5 flex flex-col justify-between">
                  <p className="text-[10px] text-on-surface-variant uppercase font-semibold">Settlements</p>
                  <div className="mt-1">
                    <p className="text-base font-bold text-error">{settlementsData.length}</p>
                    <p className="text-[10px] text-error font-medium">{detection.victimsCount > 0 ? `${detection.victimsCount} Stranded` : '2 Submerged'}</p>
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="col-span-1 bg-surface-container-lowest rounded-lg border border-outline-variant p-2.5 flex flex-col justify-between">
                  <p className="text-[10px] text-on-surface-variant uppercase font-semibold">Road Access</p>
                  <div className="mt-1">
                    <p className="text-base font-bold text-on-surface">{roadAccessibilityData.overallPercentage}%</p>
                    <p className="text-[10px] text-[#f59e0b] font-medium">{roadAccessibilityData.blockedRoads} Blocked</p>
                  </div>
                </div>

                {/* Metric 4 */}
                <div className="col-span-2 bg-surface-container-lowest rounded-lg border border-outline-variant p-2.5 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase font-semibold">Bridge B-02 Status</p>
                    <p className="text-xs font-bold text-[#a33500]">Risk Detected (12k m³/s)</p>
                  </div>
                  <span className="px-2 py-0.5 bg-[#ffdbcf] text-[#a33500] text-[10px] font-bold rounded">
                    ALERT
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-3 pt-0 flex flex-col gap-2">
                <button
                  onClick={() => {
                    downloadJSON('flood_gis_geojson', {
                      type: 'FeatureCollection',
                      exportedAt: new Date().toISOString(),
                      waterCoverage: waterSpreadData,
                      settlements: settlementsData,
                      infrastructure: infrastructureData,
                      roads: roadAccessibilityData,
                    });
                  }}
                  className="w-full bg-surface-container-lowest border border-outline-variant text-primary py-2 rounded-lg font-bold text-xs uppercase hover:bg-surface-container-low transition-colors flex justify-center items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">download</span> Export GIS GeoJSON
                </button>
                <button
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent('map:flyTo', {
                        detail: { lat: 28.6141, lng: 77.2091, zoom: 15, label: 'Sector 12 Command' },
                      })
                    );
                  }}
                  className="w-full bg-primary text-on-primary py-2 rounded-lg font-bold text-xs uppercase hover:bg-primary/90 transition-colors flex justify-center items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">my_location</span> Center on Sector 12
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Floating Status Bar */}
        <div className="pointer-events-auto self-center bg-surface-container-lowest/90 backdrop-blur-md rounded-full px-5 py-2 flex items-center gap-4 shadow-md border border-outline-variant text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono text-on-surface font-semibold">GIS INTELLIGENCE ACTIVE</span>
          </div>
          <div className="w-px h-3.5 bg-outline-variant"></div>
          <div className="font-mono text-on-surface-variant text-[11px]">
            Sector 12 · Water Spread: South-East (+13%) · 5 Settlements Monitored
          </div>
        </div>
      </div>
    </div>
  );
};
