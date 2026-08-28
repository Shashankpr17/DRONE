import React, { useState, useEffect } from 'react';
import { getAssessmentReportCurrent } from '../api/disasterApi';
import { useDetectionData } from '../context/DetectionContext';

export const FloodReport: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const detection = useDetectionData();

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAssessmentReportCurrent();
      setReport(data);
    } catch (err) {
      console.error('Failed to load assessment report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const hasAIData = detection.waterCoverage !== null || detection.lastUpdated !== null;
  const isLive = detection.isLiveActive;

  const effectiveWaterCoverage = detection.waterCoverage !== null ? detection.waterCoverage : 68;
  const effectiveVictims = detection.victimsCount;
  const effectiveVehicles = detection.vehiclesCount;
  const effectiveBoats = detection.boatsCount;
  const effectivePassability = Math.max(15, Math.min(95, Math.round(100 - effectiveWaterCoverage * 0.75)));

  const parameters = [
    { name: 'Survey Sector', value: report?.sector || 'KIIT University Campus 6 & Patia Basin, Bhubaneswar' },
    {
      name: 'Water Inundation Coverage',
      value: `${effectiveWaterCoverage}% (${effectiveWaterCoverage > 65 ? 'Critical Flood Extent' : 'Elevated'})`,
      highlight: hasAIData,
    },
    {
      name: 'Water Spread Trend',
      value: `${effectiveWaterCoverage > 65 ? 'Increasing Rapidly (South towards Patia Lowlands)' : 'Stabilizing (Drainage Active)'}`,
    },
    {
      name: 'Victims Identified / Stranded',
      value: `${effectiveVictims} Stranded Victims Detected by Optical AI`,
      highlight: effectiveVictims > 0,
      isDanger: effectiveVictims > 0,
    },
    {
      name: 'Submerged Vehicles / Obstacles',
      value: `${effectiveVehicles} Vehicles Inundated on Transit Corridors`,
      highlight: effectiveVehicles > 0,
    },
    {
      name: 'Active Rescue Boats / Craft',
      value: `${effectiveBoats} Swiftwater Boats Deployed in Sector`,
    },
    { name: 'Affected Settlements', value: '5 Inundated Areas (Campus 6 Hostels, Patia Square, Sikharchandi Foothills, Infocity Colony, Nandankanan Enclave)' },
    { name: 'Road Blockages', value: '2 Major Corridors Blocked (Nandankanan Main Road, Patia Overbridge Approach)' },
    { name: 'Submerged Intersections', value: '3 Submerged Routes (Campus 6 Link, Patia Intersection, Infocity Gateway)' },
    {
      name: 'Overall Road Accessibility',
      value: `${effectivePassability}% Passable Network`,
    },
    { name: 'Infrastructure Assets Monitored', value: '8 Critical Civil Facilities (KIMS Hospital, KIIT Substation, Convention Relief Hub)' },
    { name: 'High Risk Facilities', value: '2 Facilities at Structural Risk (Patia Overbridge B-02, Substation Sub-04)' },
  ];

  const generatedTime = detection.lastUpdated
    ? new Date(detection.lastUpdated).toUTCString()
    : report?.generatedAt || new Date().toUTCString();

  return (
    <div className="p-4 md:p-6 lg:p-xl max-w-5xl mx-auto w-full min-h-full flex flex-col gap-6">
      {/* Report Container */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-md overflow-hidden">
        {/* Report Header */}
        <div className="bg-surface-container py-4 px-6 border-b border-outline-variant flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-headline-lg text-xl md:text-2xl font-bold text-on-surface">
                ASSESSMENT REPORT - {report?.sector || 'Sector 12'}
              </h1>
              {isLive ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-600 border border-red-500/30 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-600"></span>
                  LIVE AI SYNCED
                </span>
              ) : hasAIData ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  AI SCAN DATA
                </span>
              ) : null}
            </div>
            <p className="font-body-md text-xs md:text-sm text-on-surface-variant">
              Generated: {generatedTime} · Source: {hasAIData ? 'Client YOLOv11 Neural Optical Stream & GIS Telemetry' : (report?.source || 'Drone Telemetry & GIS Mesh')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              title="Refresh from backend"
              className="font-label-md text-xs font-semibold bg-surface border border-outline-variant text-on-surface hover:bg-surface-container px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin' : ''}`}>sync</span>
              Refresh
            </button>
            <button
              onClick={() => window.print()}
              className="font-label-md text-xs font-semibold bg-surface border border-outline-variant text-on-surface hover:bg-surface-container px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">print</span>
              Print
            </button>
            <button
              onClick={() => {
                const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://drone-backend-c1j9.onrender.com/api/v1';
                window.open(`${apiBase}/report/download`, '_blank');
              }}
              className="font-label-md text-xs font-semibold bg-primary text-on-primary hover:bg-primary/90 px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">download</span>
              Export PDF
            </button>
          </div>
        </div>

        {/* Report Body Table */}
        <div className="p-4 md:p-6">
          <div className="overflow-x-auto rounded-lg border border-outline-variant">
            <table className="w-full text-left border-collapse font-body-md text-sm">
              <thead>
                <tr className="border-b-2 border-outline-variant bg-surface-container-low text-primary font-bold uppercase tracking-wider text-xs">
                  <th className="py-3.5 px-4 w-1/2">ASSESSMENT PARAMETER</th>
                  <th className="py-3.5 px-4 w-1/2">STATUS / VALUE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50 text-on-surface">
                {parameters.map((param: any, idx: number) => (
                  <tr key={idx} className="hover:bg-surface-container-low/40 transition-colors">
                    <td className="py-3.5 px-4 font-medium flex items-center gap-2">
                      {param.name}
                      {param.highlight && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                          AI
                        </span>
                      )}
                    </td>
                    <td className={`py-3.5 px-4 ${param.isDanger ? 'text-error font-bold' : ''}`}>
                      {param.value}
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
