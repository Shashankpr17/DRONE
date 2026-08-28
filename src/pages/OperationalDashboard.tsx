import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardSummary } from '../api/disasterApi';
import type { DashboardSummaryResponse } from '../api/disasterApi';
import { getSocket } from '../api/socketClient';
import { DisasterGoogleMap } from '../components/DisasterGoogleMap';
import { useDetectionData } from '../context/DetectionContext';

export const OperationalDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const detection = useDetectionData();

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const summary = await getDashboardSummary();
        if (isMounted) {
          setData(summary);
        }
      } catch (err) {
        console.error('Failed to load dashboard summary:', err);
      }
    }

    loadData();

    // Subscribe to live telemetry and alerts
    const socket = getSocket();

    socket.on('alert:new', (newAlert) => {
      if (isMounted) {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            recentAlerts: [newAlert, ...prev.recentAlerts.slice(0, 2)],
          };
        });
      }
    });

    socket.on('detection:new', (frame) => {
      if (isMounted && frame?.waterCoverage !== undefined) {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            waterSpread: {
              ...prev.waterSpread,
              coveragePercentage: frame.waterCoverage,
            },
          };
        });
      }
    });

    return () => {
      isMounted = false;
      socket.off('telemetry:update');
      socket.off('alert:new');
      socket.off('detection:new');
    };
  }, []);

  const effectiveCoverage = detection.waterCoverage !== null ? detection.waterCoverage : (data?.waterSpread?.coveragePercentage || 68);

  const waterSpread = {
    coveragePercentage: effectiveCoverage,
    trend: effectiveCoverage >= 60 ? 'Increasing' : 'Stabilizing',
    direction: 'South towards Patia Lowlands',
    changeSincePreviousSurvey: '+13%',
  };

  const settlements = data?.settlements || { totalCount: 5, inundatedCount: 5 };
  const roadAccessibility = data?.roadAccessibility || {
    overallPercentage: Math.max(10, Math.min(95, Math.round(100 - effectiveCoverage * 0.6))),
    openRoads: 12,
    blockedRoads: 2,
    submergedRoads: 3,
  };
  const infrastructureImpact = data?.infrastructureImpact || { totalTracked: 8, atRisk: 2, flooded: 2, accessible: 4 };
  const dronesAvailable = data?.dronesAvailable || { active: 1, standby: 1, total: 2 };

  return (
    <div className="p-4 md:p-6 lg:p-gutter w-full h-full flex flex-col xl:flex-row gap-gutter">
      {/* Left / Center Section */}
      <div className="flex-1 flex flex-col gap-gutter min-w-0">
        {/* Stats Row - 5 Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-gutter">
          {/* Stat Card 1: Water Coverage & Spread */}
          <Link
            to="/water-coverage"
            className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-between min-h-[96px] shadow-xs hover:border-primary transition-all cursor-pointer"
          >
            <span className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Water Coverage
            </span>
            <div className="font-headline-lg text-3xl font-bold text-on-surface">
              {waterSpread.coveragePercentage}%
            </div>
          </Link>

          {/* Stat Card 2: Affected Settlements */}
          <Link
            to="/affected-settlements"
            className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-between min-h-[96px] shadow-xs hover:border-error transition-all cursor-pointer"
          >
            <span className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Affected Settlements
            </span>
            <div className="font-headline-lg text-3xl font-bold text-on-surface">
              {settlements.totalCount}
            </div>
          </Link>

          {/* Stat Card 3: Road Accessibility */}
          <Link
            to="/road-accessibility"
            className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-between min-h-[96px] shadow-xs hover:border-[#f59e0b] transition-all cursor-pointer"
          >
            <span className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Road Accessibility
            </span>
            <div className="font-headline-lg text-3xl font-bold text-on-surface">
              {roadAccessibility.overallPercentage}%
            </div>
          </Link>

          {/* Stat Card 4: Infrastructure Impact */}
          <Link
            to="/infrastructure-impact"
            className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-between min-h-[96px] shadow-xs hover:border-primary transition-all cursor-pointer"
          >
            <span className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Damaged Infrastructure
            </span>
            <div className="font-headline-lg text-3xl font-bold text-on-surface">
              {infrastructureImpact.totalTracked}
            </div>
          </Link>

          {/* Stat Card 5: Drones Available */}
          <Link
            to="/drone-missions"
            className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-between min-h-[96px] shadow-xs col-span-2 sm:col-span-1 hover:border-[#10b981] transition-all cursor-pointer"
          >
            <span className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Drones Available
            </span>
            <div className="font-headline-lg text-3xl font-bold text-on-surface">
              {dronesAvailable.active + dronesAvailable.standby}
            </div>
          </Link>
        </div>

        {/* Main Map Area */}
        <div className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden relative flex flex-col min-h-[420px]">
          <div className="p-sm md:p-md border-b border-outline-variant flex flex-wrap justify-between items-center bg-surface-bright gap-2">
            <h2 className="font-headline-md text-headline-md text-on-surface">Live GIS Map</h2>
            <div className="flex flex-wrap gap-sm">
              <span className="flex items-center gap-base px-sm py-1 rounded bg-error/10 border border-error text-error font-label-md text-label-md">
                <span className="w-2 h-2 rounded-full bg-error"></span> Settlements
              </span>
              <span className="flex items-center gap-base px-sm py-1 rounded bg-primary-container/10 border border-primary-container text-primary-container font-label-md text-label-md">
                <span className="w-2 h-2 rounded-full bg-primary-container"></span> Water Spread
              </span>
              <span className="flex items-center gap-base px-sm py-1 rounded bg-[#f59e0b]/10 border border-[#f59e0b] text-[#f59e0b] font-label-md text-label-md">
                <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span> Road Alerts
              </span>
              <span className="flex items-center gap-base px-sm py-1 rounded bg-emerald-600/10 border border-emerald-600 text-emerald-700 font-label-md text-label-md">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Infra Monitored
              </span>
            </div>
          </div>

          <div className="flex-1 relative min-h-[460px] overflow-hidden rounded-b-lg" data-location="Sector 12">
            <DisasterGoogleMap
              layers={{
                waterLevels: true,
                waterSpread: true,
                settlements: true,
                roadStatus: true,
                infrastructure: true,
                activeAssets: true,
                safeRoutes: true,
              }}
              className="w-full h-full min-h-[460px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
