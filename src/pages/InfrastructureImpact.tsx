import React, { useState } from 'react';
import { downloadCSV } from '../utils/exportUtils';
import { useDetectionData } from '../context/DetectionContext';

interface InfrastructureAsset {
  id: string;
  type: string;
  icon: string;
  sector: string;
  subLocation?: string;
  floodStatus: 'Flood Affected' | 'Partially Affected';
  waterCoveragePct: number;
  accessibility: 'Restricted' | 'Accessible';
  priority: 'High' | 'Medium' | 'Low';
  lastSurvey: string;
}

const allAssets: InfrastructureAsset[] = [
  {
    id: 'INF-01',
    type: 'Bridge',
    icon: 'account_tree',
    sector: 'KIIT Campus 6',
    subLocation: 'Patia Railway Overbridge B-02',
    floodStatus: 'Flood Affected',
    waterCoveragePct: 80,
    accessibility: 'Restricted',
    priority: 'High',
    lastSurvey: '02:00 PM, 28 Aug 2025',
  },
  {
    id: 'INF-02',
    type: 'Hospital',
    icon: 'local_hospital',
    sector: 'KIMS Medical Sector',
    subLocation: 'Emergency Trauma Hub',
    floodStatus: 'Partially Affected',
    waterCoveragePct: 20,
    accessibility: 'Accessible',
    priority: 'High',
    lastSurvey: '02:00 PM, 28 Aug 2025',
  },
  {
    id: 'INF-03',
    type: 'Electrical Substation',
    icon: 'bolt',
    sector: 'Patia Power Grid',
    subLocation: 'KIIT Substation Sub-04',
    floodStatus: 'Flood Affected',
    waterCoveragePct: 75,
    accessibility: 'Restricted',
    priority: 'High',
    lastSurvey: '02:00 PM, 28 Aug 2025',
  },
  {
    id: 'INF-04',
    type: 'Government Building',
    icon: 'account_balance',
    sector: 'Campus 6 Central',
    subLocation: 'KIIT Convention Center Relief Hub',
    floodStatus: 'Partially Affected',
    waterCoveragePct: 30,
    accessibility: 'Accessible',
    priority: 'Low',
    lastSurvey: '02:00 PM, 28 Aug 2025',
  },
  {
    id: 'INF-05',
    type: 'Health Centre',
    icon: 'medical_services',
    sector: 'Campus 6 Hostels',
    subLocation: 'Student Health & First Aid Clinic',
    floodStatus: 'Flood Affected',
    waterCoveragePct: 50,
    accessibility: 'Accessible',
    priority: 'Medium',
    lastSurvey: '02:00 PM, 28 Aug 2025',
  },
  {
    id: 'INF-06',
    type: 'Water Utility',
    icon: 'water_damage',
    sector: 'Patia North',
    subLocation: 'Patia Water Treatment & Pump Facility',
    floodStatus: 'Flood Affected',
    waterCoveragePct: 60,
    accessibility: 'Restricted',
    priority: 'Medium',
    lastSurvey: '02:00 PM, 28 Aug 2025',
  },
  {
    id: 'INF-07',
    type: 'Culvert',
    icon: 'fence',
    sector: 'Sikharchandi Road',
    subLocation: 'High Ground Drainage Culvert',
    floodStatus: 'Flood Affected',
    waterCoveragePct: 65,
    accessibility: 'Restricted',
    priority: 'High',
    lastSurvey: '02:00 PM, 28 Aug 2025',
  },
  {
    id: 'INF-08',
    type: 'Community Hall',
    icon: 'home',
    sector: 'Campus 6 Auditorium',
    subLocation: 'Designated Indoor Evacuation Shelter',
    floodStatus: 'Partially Affected',
    waterCoveragePct: 15,
    accessibility: 'Accessible',
    priority: 'Low',
    lastSurvey: '02:00 PM, 28 Aug 2025',
  },
  {
    id: 'INF-10',
    type: 'Telecom Tower',
    icon: 'cell_tower',
    sector: 'Sector 14 Ridge',
    floodStatus: 'Partially Affected',
    waterCoveragePct: 10,
    accessibility: 'Accessible',
    priority: 'Medium',
    lastSurvey: '02:00 PM, 28 Aug 2025',
  },
  {
    id: 'INF-11',
    type: 'Drainage Pumping Station',
    icon: 'water_voc',
    sector: 'Sector 12 Lowlands',
    floodStatus: 'Flood Affected',
    waterCoveragePct: 75,
    accessibility: 'Restricted',
    priority: 'High',
    lastSurvey: '02:00 PM, 28 Aug 2025',
  },
  {
    id: 'INF-12',
    type: 'Police Post',
    icon: 'local_police',
    sector: 'Sector 9 Junction',
    floodStatus: 'Partially Affected',
    waterCoveragePct: 20,
    accessibility: 'Accessible',
    priority: 'Low',
    lastSurvey: '02:00 PM, 28 Aug 2025',
  },
];

export const InfrastructureImpact: React.FC = () => {
  const [filter, setFilter] = useState<'All' | 'Flood Affected' | 'Partially Affected'>('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 8;
  const detection = useDetectionData();

  const isLive = detection.isLiveActive;
  const hasAIData = detection.waterCoverage !== null || detection.lastUpdated !== null;
  const liveCoverage = detection.waterCoverage !== null ? detection.waterCoverage : 68;

  const filteredAssets = allAssets.filter((a) => {
    const matchesFilter = filter === 'All' || a.floodStatus === filter;
    const matchesSearch =
      a.type.toLowerCase().includes(search.toLowerCase()) ||
      a.id.toLowerCase().includes(search.toLowerCase()) ||
      a.sector.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.ceil(filteredAssets.length / pageSize) || 1;
  const paginatedAssets = filteredAssets.slice((page - 1) * pageSize, page * pageSize);

  const handleExport = () => {
    downloadCSV('infrastructure_asset_assessment', filteredAssets.length > 0 ? filteredAssets : allAssets);
  };

  return (
    <div className="p-4 md:p-6 lg:p-xl w-full min-h-full flex flex-col gap-6 font-sans">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline-lg text-2xl md:text-headline-lg text-on-surface font-bold">
              Infrastructure Impact
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
            Key Civil Assets: KIIT University Campus 6, KIMS Hospital &amp; Patia Facilities
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-surface border border-outline-variant rounded-lg font-label-md text-xs font-semibold text-on-surface flex items-center gap-1.5 hover:bg-surface-container transition-colors shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">print</span>
            Print Sitrep
          </button>
          <button
            onClick={handleExport}
            className="px-3.5 py-2 bg-primary-container text-on-primary rounded-lg font-label-md text-xs font-semibold flex items-center gap-1.5 hover:bg-primary transition-colors shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">download</span>
            Export Infrastructure Report
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {/* Card 1: Assets Monitored */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-between min-h-[96px] shadow-xs">
          <span className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Assets Monitored
          </span>
          <div className="font-headline-lg text-3xl font-bold text-on-surface">
            {allAssets.length}
          </div>
        </div>

        {/* Card 2: High Risk Facilities */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-between min-h-[96px] shadow-xs">
          <span className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            High Risk
          </span>
          <div className="font-headline-lg text-3xl font-bold text-red-600">
            {allAssets.filter((a) => a.priority === 'High').length}
          </div>
        </div>

        {/* Card 3: Restricted Access */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-between min-h-[96px] shadow-xs">
          <span className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Restricted Access
          </span>
          <div className="font-headline-lg text-3xl font-bold text-amber-600">
            {allAssets.filter((a) => a.accessibility === 'Restricted').length}
          </div>
        </div>

        {/* Card 4: Fully Accessible */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-between min-h-[96px] shadow-xs">
          <span className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Fully Accessible
          </span>
          <div className="font-headline-lg text-3xl font-bold text-emerald-600">
            {allAssets.filter((a) => a.accessibility === 'Accessible').length}
          </div>
        </div>

        {/* Card 5: Flood Extent */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-between min-h-[96px] shadow-xs col-span-2 sm:col-span-1">
          <span className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Flood Extent
          </span>
          <div className="font-headline-lg text-3xl font-bold text-blue-600">
            {liveCoverage}%
          </div>
        </div>
      </div>

      {/* Facilities Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-xs">
        {/* Controls */}
        <div className="p-4 border-b border-outline-variant bg-surface-container-low flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-headline-md text-sm font-bold text-on-surface">
              Critical Infrastructure Status
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search asset or sector..."
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
              {(['All', 'Flood Affected', 'Partially Affected'] as const).map((st) => (
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
                <th className="py-3 px-6">Asset ID</th>
                <th className="py-3 px-6">Asset Type</th>
                <th className="py-3 px-6">Location / Sector</th>
                <th className="py-3 px-6">Flood Status</th>
                <th className="py-3 px-6">Water Coverage (%)</th>
                <th className="py-3 px-6">Accessibility</th>
                <th className="py-3 px-6 text-center">Priority Level</th>
                <th className="py-3 px-6 text-right">Last Survey</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-on-surface">
              {paginatedAssets.map((a) => (
                <tr key={a.id} className="hover:bg-surface-container-low/50 transition-colors">
                  {/* Asset ID */}
                  <td className="py-3.5 px-6 font-mono font-bold text-primary">{a.id}</td>

                  {/* Asset Type */}
                  <td className="py-3.5 px-6 font-semibold text-on-surface">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-on-surface-variant">
                        {a.icon}
                      </span>
                      <span>{a.type}</span>
                    </div>
                  </td>

                  {/* Location / Sector */}
                  <td className="py-3.5 px-6">
                    <div className="font-semibold text-on-surface">{a.sector}</div>
                    {a.subLocation && (
                      <div className="text-on-surface-variant text-[11px] mt-0.5">{a.subLocation}</div>
                    )}
                  </td>

                  {/* Flood Status */}
                  <td className="py-3.5 px-6">
                    <span
                      className={`inline-block px-3 py-1 rounded-md text-[11px] font-bold ${
                        a.floodStatus === 'Flood Affected'
                          ? 'bg-red-50 text-red-600 border border-red-100'
                          : 'bg-orange-50 text-orange-600 border border-orange-100'
                      }`}
                    >
                      {a.floodStatus}
                    </span>
                  </td>

                  {/* Water Coverage (%) with Progress Bar */}
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-3 w-40">
                      <span className="font-semibold text-on-surface text-xs w-8">
                        {a.waterCoveragePct}%
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            a.floodStatus === 'Flood Affected' ? 'bg-red-500' : 'bg-orange-500'
                          }`}
                          style={{ width: `${a.waterCoveragePct}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Accessibility Badge */}
                  <td className="py-3.5 px-6">
                    <span
                      className={`inline-block px-3 py-1 rounded-md text-[11px] font-bold ${
                        a.accessibility === 'Restricted'
                          ? 'bg-orange-50 text-orange-600 border border-orange-100'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}
                    >
                      {a.accessibility}
                    </span>
                  </td>

                  {/* Priority Level Badge */}
                  <td className="py-3.5 px-6 text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-md text-[11px] font-bold ${
                        a.priority === 'High'
                          ? 'bg-red-50 text-red-600 border border-red-100'
                          : a.priority === 'Medium'
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}
                    >
                      {a.priority}
                    </span>
                  </td>

                  {/* Last Survey */}
                  <td className="py-3.5 px-6 text-right font-mono text-on-surface-variant">
                    {a.lastSurvey}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
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
            Showing {Math.min((page - 1) * pageSize + 1, filteredAssets.length)} to{' '}
            {Math.min(page * pageSize, filteredAssets.length)} of {filteredAssets.length} assets
          </span>
        </div>
      </div>
    </div>
  );
};
