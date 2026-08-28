import React, { useState } from 'react';
import { downloadCSV } from '../utils/exportUtils';
import { useDetectionData } from '../context/DetectionContext';

interface SectorAssessment {
  id: string;
  name: string;
  coverage: number;
  direction: string;
  severity: 'Severe' | 'High' | 'Moderate' | 'Low';
  riskLevel: 'High' | 'Medium' | 'Low';
  lastUpdated: string;
}

export const WaterCoverage: React.FC = () => {
  const [search, setSearch] = useState('');
  const detection = useDetectionData();

  const liveCoverage = detection.waterCoverage !== null ? detection.waterCoverage : 68;
  const isLive = detection.isLiveActive;
  const hasAIData = detection.waterCoverage !== null || detection.lastUpdated !== null;

  const sectors: SectorAssessment[] = [
    {
      id: 'Z-01',
      name: 'KIIT Campus 6 & Patia Basin',
      coverage: liveCoverage,
      direction: 'South-East ↗',
      severity: liveCoverage >= 70 ? 'Severe' : liveCoverage >= 50 ? 'High' : 'Moderate',
      riskLevel: liveCoverage >= 60 ? 'High' : 'Medium',
      lastUpdated: detection.lastUpdated ? new Date(detection.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '02:00 PM',
    },
    {
      id: 'Z-02',
      name: 'Campus 6 Hostel & Student Housing',
      coverage: Math.min(100, Math.max(10, Math.round(liveCoverage * 1.05))),
      direction: 'South-East ↗',
      severity: 'High',
      riskLevel: 'High',
      lastUpdated: '02:00 PM',
    },
    {
      id: 'Z-03',
      name: 'Patia Square Residential Lowlands',
      coverage: Math.min(100, Math.max(10, Math.round(liveCoverage * 0.85))),
      direction: 'East →',
      severity: 'Moderate',
      riskLevel: 'Medium',
      lastUpdated: '02:00 PM',
    },
    {
      id: 'Z-04',
      name: 'Sikharchandi Foothills Basti',
      coverage: Math.min(100, Math.max(10, Math.round(liveCoverage * 0.65))),
      direction: 'South ↓',
      severity: 'Moderate',
      riskLevel: 'Medium',
      lastUpdated: '02:00 PM',
    },
    {
      id: 'Z-05',
      name: 'KIMS Medical Corridor High Ground',
      coverage: Math.min(100, Math.max(5, Math.round(liveCoverage * 0.3))),
      direction: 'South-East ↗',
      severity: 'Low',
      riskLevel: 'Low',
      lastUpdated: '02:00 PM',
    },
  ];

  const filteredSectors = sectors.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportHydrology = () => {
    downloadCSV('flood_spread_analysis_sectors', filteredSectors.length > 0 ? filteredSectors : sectors);
  };

  return (
    <div className="p-4 md:p-6 lg:p-xl w-full min-h-full flex flex-col gap-6 font-sans">
      {/* Header Row */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline-lg text-2xl md:text-headline-lg text-on-surface font-bold">
              Flood Spread Analysis
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
          <p className="text-xs text-on-surface-variant mt-0.5">
            Zone: KIIT University Campus 6 &amp; Patia Basin, Bhubaneswar
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-surface border border-outline-variant rounded-lg font-label-md text-xs font-semibold text-on-surface flex items-center gap-1.5 hover:bg-surface-container transition-colors shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">print</span>
            Print Survey
          </button>
          <button
            onClick={handleExportHydrology}
            className="px-3.5 py-2 bg-primary-container text-on-primary rounded-lg font-label-md text-xs font-semibold flex items-center gap-1.5 hover:bg-primary transition-colors shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">download</span>
            Export Hydrology Data
          </button>
        </div>
      </div>

      {/* 5 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: Flood Coverage */}
        <div className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-center gap-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Flood Coverage</span>
          <div className="text-3xl font-extrabold text-blue-600 tracking-tight">{liveCoverage}%</div>
        </div>

        {/* Card 2: Spread Trend */}
        <div className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-center gap-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Spread Trend</span>
          <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {liveCoverage >= 60 ? 'Increasing' : 'Stabilizing'}
          </div>
        </div>

        {/* Card 3: Spread Direction */}
        <div className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-center gap-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Spread Direction</span>
          <div className="text-3xl font-extrabold text-gray-900 tracking-tight">South-East</div>
        </div>

        {/* Card 4: High-Risk Sectors */}
        <div className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-center gap-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">High-Risk Sectors</span>
          <div className="text-3xl font-extrabold text-red-600 tracking-tight">
            {sectors.filter((s) => s.riskLevel === 'High').length}
          </div>
        </div>

        {/* Card 5: Surveyed Sectors */}
        <div className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-center gap-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Surveyed Sectors</span>
          <div className="text-3xl font-extrabold text-gray-900 tracking-tight">{sectors.length}</div>
        </div>
      </div>

      {/* Middle Card: Sector-wise Flood Coverage Assessment */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xs overflow-hidden">
        {/* Table Header / Title & Search */}
        <div className="p-4 border-b border-outline-variant bg-surface-container-low flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-headline-md text-sm font-bold text-on-surface tracking-tight">
            Sector-wise Flood Coverage Assessment
          </h2>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-on-surface-variant text-[16px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search sector..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-surface border border-outline-variant rounded-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary w-52"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-body-md">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container text-on-surface-variant font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-6">Zone ID</th>
                <th className="py-3 px-6">Sector Name</th>
                <th className="py-3 px-6">Flood Coverage</th>
                <th className="py-3 px-6">Spread Direction</th>
                <th className="py-3 px-6 text-center">Severity</th>
                <th className="py-3 px-6 text-center">Risk Level</th>
                <th className="py-3 px-6 text-right">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filteredSectors.map((sector) => (
                <tr key={sector.id} className="hover:bg-gray-50/70 transition-colors">
                  {/* Zone ID */}
                  <td className="py-3.5 px-6 font-bold text-blue-700">{sector.id}</td>

                  {/* Sector Name */}
                  <td className="py-3.5 px-6 font-semibold text-gray-800">{sector.name}</td>

                  {/* Flood Coverage Progress Bar + % */}
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-3 w-48">
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            sector.severity === 'Severe' || sector.riskLevel === 'High'
                              ? 'bg-red-500'
                              : sector.severity === 'High'
                              ? 'bg-orange-500'
                              : sector.severity === 'Moderate' || sector.riskLevel === 'Medium'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${sector.coverage}%` }}
                        />
                      </div>
                      <span className="font-semibold text-gray-800 text-xs w-8 text-right">
                        {sector.coverage}%
                      </span>
                    </div>
                  </td>

                  {/* Spread Direction */}
                  <td className="py-3.5 px-6 font-medium text-gray-700">{sector.direction}</td>

                  {/* Severity Badge */}
                  <td className="py-3.5 px-6 text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-md text-[11px] font-bold ${
                        sector.severity === 'Severe'
                          ? 'bg-red-50 text-red-600 border border-red-100'
                          : sector.severity === 'High'
                          ? 'bg-orange-50 text-orange-600 border border-orange-100'
                          : sector.severity === 'Moderate'
                          ? 'bg-amber-50 text-amber-600 border border-amber-100'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}
                    >
                      {sector.severity}
                    </span>
                  </td>

                  {/* Risk Level Badge */}
                  <td className="py-3.5 px-6 text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-md text-[11px] font-bold ${
                        sector.riskLevel === 'High'
                          ? 'bg-red-50 text-red-600 border border-red-100'
                          : sector.riskLevel === 'Medium'
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}
                    >
                      {sector.riskLevel}
                    </span>
                  </td>

                  {/* Last Updated */}
                  <td className="py-3.5 px-6 text-right text-gray-600 font-medium">
                    {sector.lastUpdated}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Notes */}
        <div className="px-6 py-3 border-t border-outline-variant flex flex-wrap justify-between items-center text-[11px] text-on-surface-variant bg-surface-container-low/50">
          <span>Note: Coverage and direction are estimated using ML model on drone imagery.</span>
          <span>* Severity is based on flood coverage %</span>
        </div>
      </div>

      {/* Bottom Card: Flood Progression (Coverage Over Time) */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-xs flex flex-col gap-5">
        <h2 className="text-base font-bold text-gray-900 tracking-tight">
          Flood Progression (Coverage Over Time)
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: SVG Line Chart (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center w-full">
            <div className="w-full relative h-64">
              <svg viewBox="0 0 540 240" className="w-full h-full overflow-visible">
                {/* Y-Axis Grid Lines & Labels */}
                {[
                  { val: 100, y: 30 },
                  { val: 75, y: 67.5 },
                  { val: 50, y: 105 },
                  { val: 25, y: 142.5 },
                  { val: 0, y: 180 },
                ].map((tick) => (
                  <g key={tick.val}>
                    <line
                      x1="60"
                      y1={tick.y}
                      x2="500"
                      y2={tick.y}
                      stroke="#f3f4f6"
                      strokeWidth="1"
                    />
                    <text
                      x="48"
                      y={tick.y + 4}
                      textAnchor="end"
                      fontSize="10"
                      fill="#9ca3af"
                      fontFamily="sans-serif"
                    >
                      {tick.val}
                    </text>
                  </g>
                ))}

                {/* Y-Axis Label */}
                <text
                  x="-105"
                  y="15"
                  transform="rotate(-90)"
                  textAnchor="middle"
                  fontSize="10"
                  fill="#6b7280"
                  fontFamily="sans-serif"
                >
                  Coverage (%)
                </text>

                {/* X-Axis Baseline */}
                <line x1="60" y1="180" x2="500" y2="180" stroke="#e5e7eb" strokeWidth="1.5" />

                {/* Data Line: Solid for 10:00 -> 12:00 -> 02:00 */}
                {/* Points: 10:00 (100, 117), 12:00 (220, 97.5), 02:00 (340, 78), Forecast (460, 69) */}
                <path
                  d="M 100,117 L 220,97.5 L 340,78"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Data Line: Dashed for 02:00 -> Forecast */}
                <path
                  d="M 340,78 L 460,69"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  strokeDasharray="6,5"
                  strokeLinecap="round"
                />

                {/* Data Points & Numbers */}
                {[
                  { x: 100, y: 117, label: '42%', xLabel: '10:00 AM' },
                  { x: 220, y: 97.5, label: '55%', xLabel: '12:00 PM' },
                  { x: 340, y: 78, label: '68%', xLabel: '02:00 PM' },
                  { x: 460, y: 69, label: '74%', xLabel: 'Forecast' },
                ].map((pt, i) => (
                  <g key={i}>
                    {/* Value Badge Text Above Dot */}
                    <text
                      x={pt.x}
                      y={pt.y - 12}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="bold"
                      fill="#1e3a8a"
                      fontFamily="sans-serif"
                    >
                      {pt.label}
                    </text>

                    {/* Circular Dot */}
                    <circle cx={pt.x} cy={pt.y} r="5" fill="#2563eb" />

                    {/* X-Axis Tick Label */}
                    <text
                      x={pt.x}
                      y="200"
                      textAnchor="middle"
                      fontSize="11"
                      fill="#4b5563"
                      fontWeight="500"
                      fontFamily="sans-serif"
                    >
                      {pt.xLabel}
                    </text>
                  </g>
                ))}

                {/* X-Axis Label */}
                <text
                  x="280"
                  y="225"
                  textAnchor="middle"
                  fontSize="11"
                  fill="#6b7280"
                  fontFamily="sans-serif"
                >
                  Time
                </text>
              </svg>
            </div>
          </div>

          {/* Right: Summary Stage Table (5 cols) */}
          <div className="lg:col-span-5 border border-gray-200/90 rounded-xl overflow-hidden bg-white shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-gray-700 font-bold">
                  <th className="py-3 px-4">Time / Stage</th>
                  <th className="py-3 px-4 text-right">Flood Coverage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* Row 1 */}
                <tr className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3.5 px-4 text-gray-800 font-medium">10:00 AM (Initial Survey)</td>
                  <td className="py-3.5 px-4 text-right font-semibold text-gray-800">42%</td>
                </tr>

                {/* Row 2 */}
                <tr className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3.5 px-4 text-gray-800 font-medium">12:00 PM (2nd Survey)</td>
                  <td className="py-3.5 px-4 text-right font-semibold text-gray-800">55%</td>
                </tr>

                {/* Row 3: Current Highlighted */}
                <tr className="bg-blue-50/30 hover:bg-blue-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-blue-700">02:00 PM (Current Survey)</td>
                  <td className="py-3.5 px-4 text-right font-bold text-blue-700">68%</td>
                </tr>

                {/* Row 4: Forecast */}
                <tr className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3.5 px-4 text-gray-800 font-medium">Forecast (Next 2–4 hrs)</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="font-semibold text-gray-800">74%</div>
                    <div className="text-[10px] text-gray-400 font-normal">(Estimated)</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaterCoverage;
