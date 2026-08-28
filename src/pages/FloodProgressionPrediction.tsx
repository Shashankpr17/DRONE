import React, { useState, useEffect } from 'react';
import { getFloodProgressionTimeline, getWaterCoverageSummary } from '../api/disasterApi';
import { useDetectionData } from '../context/DetectionContext';
import type { ProgressionStep } from '../data/mockData';
import { downloadCSV } from '../utils/exportUtils';

export const FloodProgressionPrediction: React.FC = () => {
  const [timeline, setTimeline] = useState<ProgressionStep[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const detection = useDetectionData();

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [tl, sum] = await Promise.all([
          getFloodProgressionTimeline(),
          getWaterCoverageSummary(),
        ]);
        if (isMounted) {
          setTimeline(tl);
          setSummary(sum);
        }
      } catch (err) {
        console.error('Failed to load progression data:', err);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  const effectiveCoverage = detection.waterCoverage !== null ? detection.waterCoverage : (summary?.coveragePercentage ?? 68);

  const calculatedPassability = detection.waterCoverage !== null
    ? Math.max(15, Math.min(95, Math.round(100 - effectiveCoverage * 0.75)))
    : 62;

  const calculatedSettlements = detection.waterCoverage !== null
    ? Math.max(1, Math.min(8, Math.round(effectiveCoverage / 14)))
    : 5;

  const waterSpreadData = {
    coveragePercentage: effectiveCoverage,
    trend: summary?.trend || (effectiveCoverage > 65 ? 'Increasing' : 'Stable'),
    direction: summary?.direction || (effectiveCoverage > 60 ? 'South-East' : 'South-East'),
    changeSincePreviousSurvey: summary?.changeSincePreviousSurvey || '+13%',
  };

  const handleExportData = () => {
    if (timeline && timeline.length > 0) {
      downloadCSV('flood_impact_progression_analysis', timeline);
    } else {
      downloadCSV('flood_impact_progression_analysis', [
        {
          surveyTimestamp: new Date().toISOString(),
          waterCoveragePercentage: waterSpreadData.coveragePercentage,
          spreadTrend: waterSpreadData.trend,
          spreadDirection: waterSpreadData.direction,
          changeRate: waterSpreadData.changeSincePreviousSurvey,
          affectedSettlements: calculatedSettlements,
          roadAccessibilityPercentage: calculatedPassability,
        },
      ]);
    }
  };

  // Dynamically evaluate severity for each sector based on live AI water inundation
  const getSectorSeverity = (multiplier: number): 'High' | 'Medium' | 'Low' => {
    const sectorInundation = effectiveCoverage * multiplier;
    if (sectorInundation >= 60) return 'High';
    if (sectorInundation >= 30) return 'Medium';
    return 'Low';
  };

  const severityIndexData = [
    { area: 'Sector A (Riverbank Basin)', severity: getSectorSeverity(1.35) },
    { area: 'Sector B (East Hamlet Lowlands)', severity: getSectorSeverity(1.15) },
    { area: 'Sector C (Downtown Corridor)', severity: getSectorSeverity(0.85) },
    { area: 'Sector D (Industrial Estate)', severity: getSectorSeverity(0.65) },
    { area: 'Sector E (North Ridge)', severity: getSectorSeverity(0.35) },
    { area: 'Sector F (Command Outpost)', severity: getSectorSeverity(0.18) },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-xl w-full min-h-full flex flex-col gap-6">
      {/* Header & Actions */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="font-display-lg text-2xl md:text-display-lg text-on-surface font-bold">
            Flood Impact Analysis
          </h1>
          <p className="font-body-lg text-sm md:text-body-lg text-on-surface-variant mt-1">
            Real-time water level regression analysis, water spread dynamics, and accessibility evolution.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportData}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface-container-high rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-variant transition-colors text-xs font-semibold shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Export Data</span>
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary-container text-on-primary rounded-lg hover:bg-primary transition-colors text-xs font-bold shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            <span>Refresh Models</span>
          </button>
        </div>
      </div>

      {/* Dynamic Summary Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat Card 1: Water Coverage */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-between min-h-[96px] shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Water Coverage
            </span>
            {detection.isLiveActive ? (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 border border-red-500/30 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                LIVE AI
              </span>
            ) : detection.lastUpdated ? (
              <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                AI SCAN
              </span>
            ) : null}
          </div>
          <div className="font-headline-lg text-3xl font-bold text-on-surface">
            {waterSpreadData.coveragePercentage}%
          </div>
        </div>

        {/* Stat Card 2: Road Accessibility */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-between min-h-[96px] shadow-xs">
          <span className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Road Accessibility
          </span>
          <div className="font-headline-lg text-3xl font-bold text-on-surface">
            {calculatedPassability}%
          </div>
        </div>

        {/* Stat Card 3: Affected Settlements */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-between min-h-[96px] shadow-xs">
          <span className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Affected Settlements
          </span>
          <div className="font-headline-lg text-3xl font-bold text-on-surface">
            {calculatedSettlements}
          </div>
        </div>

        {/* Stat Card 4: Spread Direction */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-between min-h-[96px] shadow-xs">
          <span className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Spread Direction
          </span>
          <div className="font-headline-lg text-3xl font-bold text-on-surface truncate">
            {waterSpreadData.direction || 'South-East'}
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col gap-6 w-full">
        {/* Flood Severity Index Table */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-xs">
          <div className="mb-4 pb-2 border-b border-outline-variant">
            <h3 className="text-base font-semibold text-on-surface">
              Flood Severity Index
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Sector-wise vulnerability classification
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-outline-variant text-on-surface-variant font-semibold">
                  <th className="py-2.5 px-3">Area</th>
                  <th className="py-2.5 px-3">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {severityIndexData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-surface-container-low/50">
                    <td className="py-3 px-3 text-on-surface font-normal">
                      {item.area}
                    </td>
                    <td className="py-3 px-3 text-on-surface font-medium">
                      {item.severity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
