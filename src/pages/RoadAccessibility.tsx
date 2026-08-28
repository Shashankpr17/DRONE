import React, { useState } from 'react';
import { downloadCSV } from '../utils/exportUtils';
import { useDetectionData } from '../context/DetectionContext';

interface RoadAssessment {
  id: string;
  name: string;
  sector: string;
  subSector: string;
  status: 'Blocked' | 'Partially Accessible' | 'Accessible';
  blockageReason: string;
  accessibilityPct: number;
  priority: 'High' | 'Medium' | 'Low';
  lastSurvey: string;
}

const allRoads: RoadAssessment[] = [
  {
    id: 'RD-01',
    name: 'Nandankanan Main Road',
    sector: 'KIIT Campus 6',
    subSector: 'Patia Square – Nandankanan Corridor',
    status: 'Blocked',
    blockageReason: 'Flooded (1.6m Water Depth)',
    accessibilityPct: 0,
    priority: 'High',
    lastSurvey: '02:00 PM, 28 Aug 2025',
  },
  {
    id: 'RD-02',
    name: 'Campus 6 Internal Link',
    sector: 'KIIT Campus 6',
    subSector: 'Campus 6 Hostels – Academic Block',
    status: 'Partially Accessible',
    blockageReason: 'Water on Road (0.4m)',
    accessibilityPct: 50,
    priority: 'High',
    lastSurvey: '02:00 PM, 28 Aug 2025',
  },
  {
    id: 'RD-03',
    name: 'Sikharchandi High Ground Bypass',
    sector: 'Sikharchandi',
    subSector: 'Sikharchandi – North Evacuation Route',
    status: 'Accessible',
    blockageReason: '–',
    accessibilityPct: 100,
    priority: 'Medium',
    lastSurvey: '02:00 PM, 28 Aug 2025',
  },
  {
    id: 'RD-04',
    name: 'Patia Square Intersection',
    sector: 'Patia',
    subSector: 'Patia Junction – Main Market',
    status: 'Partially Accessible',
    blockageReason: 'Waterlogged',
    accessibilityPct: 40,
    priority: 'Medium',
    lastSurvey: '02:00 PM, 28 Aug 2025',
  },
  {
    id: 'RD-05',
    name: 'Infocity Avenue Lowlands Approach',
    sector: 'Infocity',
    subSector: 'Campus 6 East – Infocity Gateway',
    status: 'Blocked',
    blockageReason: 'Submerged',
    accessibilityPct: 0,
    priority: 'High',
    lastSurvey: '02:00 PM, 28 Aug 2025',
  },
  {
    id: 'RD-06',
    name: 'KIMS Hospital Emergency Link Road',
    sector: 'KIMS Medical',
    subSector: 'KIMS Trauma Center – High Ground Corridor',
    status: 'Accessible',
    blockageReason: '–',
    accessibilityPct: 100,
    priority: 'Low',
    lastSurvey: '02:00 PM, 28 Aug 2025',
  },
  {
    id: 'RD-07',
    name: 'Patia Railway Station Road',
    sector: 'Patia Station',
    subSector: 'Patia Station – Relief Camp Access',
    status: 'Partially Accessible',
    blockageReason: 'Water on Road',
    accessibilityPct: 60,
    priority: 'Medium',
    lastSurvey: '02:00 PM, 28 Aug 2025',
  },
  {
    id: 'RD-08',
    name: 'Patia Overbridge B-02 Approach',
    sector: 'Patia Grid',
    subSector: 'Overbridge – River Drainage',
    status: 'Blocked',
    blockageReason: 'Culvert Water Surge',
    accessibilityPct: 0,
    priority: 'High',
    lastSurvey: '02:00 PM, 28 Aug 2025',
  },
];

export const RoadAccessibility: React.FC = () => {
  const [filter, setFilter] = useState<'All' | 'Accessible' | 'Partially Accessible' | 'Blocked'>('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 8;
  const detection = useDetectionData();

  const isLive = detection.isLiveActive;
  const hasAIData = detection.waterCoverage !== null || detection.lastUpdated !== null;
  const liveCoverage = detection.waterCoverage !== null ? detection.waterCoverage : 68;
  const networkPassability = Math.max(10, Math.min(95, Math.round(100 - liveCoverage * 0.6)));

  const filteredRoads = allRoads.filter((r) => {
    const matchesFilter = filter === 'All' || r.status === filter;
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.sector.toLowerCase().includes(search.toLowerCase()) ||
      r.subSector.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.ceil(filteredRoads.length / pageSize) || 1;
  const paginatedRoads = filteredRoads.slice((page - 1) * pageSize, page * pageSize);

  const handleExportRoutes = () => {
    downloadCSV('road_accessibility_assessment', filteredRoads.length > 0 ? filteredRoads : allRoads);
  };

  return (
    <div className="p-4 md:p-6 lg:p-xl w-full min-h-full flex flex-col gap-6 font-sans">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline-lg text-2xl md:text-headline-lg text-on-surface font-bold">
              Road Accessibility
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
            Corridors: KIIT Campus 6, Patia Square, Nandankanan Road &amp; Sikharchandi
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-surface border border-outline-variant rounded-lg font-label-md text-xs font-semibold text-on-surface flex items-center gap-1.5 hover:bg-surface-container transition-colors shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">print</span>
            Print Transport Sitrep
          </button>
          <button
            onClick={handleExportRoutes}
            className="px-3.5 py-2 bg-primary-container text-on-primary rounded-lg font-label-md text-xs font-semibold flex items-center gap-1.5 hover:bg-primary transition-colors shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">download</span>
            Export Routing Data
          </button>
        </div>
      </div>

      {/* Primary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Card 1: Roads Surveyed */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-between min-h-[96px] shadow-xs">
          <span className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Roads Surveyed
          </span>
          <div className="font-headline-lg text-3xl font-bold text-on-surface">
            {allRoads.length}
          </div>
        </div>

        {/* Card 2: Fully Accessible */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-between min-h-[96px] shadow-xs">
          <span className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Fully Accessible
          </span>
          <div className="font-headline-lg text-3xl font-bold text-emerald-600">
            {allRoads.filter((r) => r.status === 'Accessible').length}
          </div>
        </div>

        {/* Card 3: Network Passability */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-between min-h-[96px] shadow-xs">
          <span className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Network Passability
          </span>
          <div className="font-headline-lg text-3xl font-bold text-blue-600">
            {networkPassability}%
          </div>
        </div>

        {/* Card 4: Inundated Vehicles Detected */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-between min-h-[96px] shadow-xs">
          <span className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            AI Detected Vehicles
          </span>
          <div className="font-headline-lg text-3xl font-bold text-amber-600 flex items-center gap-1">
            {detection.vehiclesCount > 0 ? (
              <>
                <span>{detection.vehiclesCount}</span>
                <span className="text-[10px] font-mono font-normal">ON ROADS</span>
              </>
            ) : (
              <span>0</span>
            )}
          </div>
        </div>

        {/* Card 5: Blocked Routes */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-between min-h-[96px] shadow-xs col-span-2 sm:col-span-1">
          <span className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Blocked Routes
          </span>
          <div className="font-headline-lg text-3xl font-bold text-red-600">
            {allRoads.filter((r) => r.status === 'Blocked').length}
          </div>
        </div>
      </div>

      {/* Routes Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-xs">
        {/* Controls */}
        <div className="p-4 border-b border-outline-variant bg-surface-container-low flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-headline-md text-sm font-bold text-on-surface">
              Road Accessibility Status
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search route or sector..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-8 pr-3 py-1.5 text-xs bg-surface border border-outline-variant rounded-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary w-52"
              />
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant absolute left-2 top-2">
                search
              </span>
            </div>

            <div className="flex bg-surface border border-outline-variant rounded-lg p-0.5 text-xs font-semibold">
              {(['All', 'Accessible', 'Partially Accessible', 'Blocked'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setFilter(st);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filter === st ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-body-md">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container text-on-surface-variant font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-6">Road ID</th>
                <th className="py-3 px-6">Road Name</th>
                <th className="py-3 px-6">Sector / From – To</th>
                <th className="py-3 px-6">Road Status</th>
                <th className="py-3 px-6">Blockage Reason</th>
                <th className="py-3 px-6">Accessibility</th>
                <th className="py-3 px-6 text-center">Priority</th>
                <th className="py-3 px-6 text-right">Last Survey</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-on-surface">
              {paginatedRoads.map((r) => (
                <tr key={r.id} className="hover:bg-surface-container-low/50 transition-colors">
                  {/* Road ID */}
                  <td className="py-3.5 px-6 font-mono font-bold text-primary">{r.id}</td>

                  {/* Road Name */}
                  <td className="py-3.5 px-6 font-semibold text-on-surface">{r.name}</td>

                  {/* Sector / From - To */}
                  <td className="py-3.5 px-6">
                    <div className="font-semibold text-on-surface">{r.sector}</div>
                    <div className="text-on-surface-variant text-[11px] mt-0.5">{r.subSector}</div>
                  </td>

                  {/* Road Status */}
                  <td className="py-3.5 px-6">
                    <span
                      className={`inline-block px-3 py-1 rounded-md text-[11px] font-bold ${
                        r.status === 'Blocked'
                          ? 'bg-red-50 text-red-600 border border-red-100'
                          : r.status === 'Partially Accessible'
                          ? 'bg-orange-50 text-orange-600 border border-orange-100'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>

                  {/* Blockage Reason */}
                  <td className="py-3.5 px-6 text-on-surface font-medium">{r.blockageReason}</td>

                  {/* Accessibility % with Progress Bar */}
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-3 w-40">
                      <span className="font-semibold text-on-surface text-xs w-8">
                        {r.accessibilityPct}%
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            r.status === 'Blocked'
                              ? 'bg-red-500'
                              : r.status === 'Partially Accessible'
                              ? 'bg-orange-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${r.accessibilityPct}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Priority Badge */}
                  <td className="py-3.5 px-6 text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-md text-[11px] font-bold ${
                        r.priority === 'High'
                          ? 'bg-red-50 text-red-600 border border-red-100'
                          : r.priority === 'Medium'
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}
                    >
                      {r.priority}
                    </span>
                  </td>

                  {/* Last Survey */}
                  <td className="py-3.5 px-6 text-right font-mono text-on-surface-variant">
                    {r.lastSurvey}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls Matching Image */}
        <div className="p-4 border-t border-outline-variant bg-surface-container-low/50 flex flex-wrap items-center justify-between gap-3 text-xs text-on-surface-variant">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-7 h-7 rounded border border-outline-variant flex items-center justify-center hover:bg-surface disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => setPage(num)}
                className={`w-7 h-7 rounded text-xs font-bold transition-colors ${
                  page === num
                    ? 'bg-primary text-on-primary'
                    : 'border border-outline-variant hover:bg-surface text-on-surface'
                }`}
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-7 h-7 rounded border border-outline-variant flex items-center justify-center hover:bg-surface disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>

          <span className="text-[11px] text-on-surface-variant font-medium">
            Showing {Math.min((page - 1) * pageSize + 1, filteredRoads.length)} to{' '}
            {Math.min(page * pageSize, filteredRoads.length)} of {filteredRoads.length} roads
          </span>
        </div>
      </div>
    </div>
  );
};
