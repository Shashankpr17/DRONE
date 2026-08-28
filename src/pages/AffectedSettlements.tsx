import React, { useState, useEffect } from 'react';
import { getSettlements } from '../api/disasterApi';
import { downloadCSV } from '../utils/exportUtils';
import { useDetectionData } from '../context/DetectionContext';

interface SettlementDetail {
  id: string;
  name: string;
  location: string;
  status: 'Flood Affected' | 'Partially Submerged' | 'Safe' | 'Submerged';
  waterDepth: string;
  population: number;
  households: number;
  evacuationPriority: 'Immediate' | 'High' | 'Medium' | 'Low';
  evacuatedPercentage: number;
  nearestCamp: string;
  lastUpdated?: string;
  lastSurvey?: string;
}

export const AffectedSettlements: React.FC = () => {
  const [filter, setFilter] = useState<'All' | 'Fully Flooded' | 'Partially Flooded'>('All');
  const [search, setSearch] = useState('');
  const [settlements, setSettlements] = useState<SettlementDetail[]>([]);
  const [, setMetrics] = useState<any>(null);
  const detection = useDetectionData();

  const isLive = detection.isLiveActive;
  const hasAIData = detection.waterCoverage !== null || detection.lastUpdated !== null;

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const res = await getSettlements(undefined, search);
        if (isMounted) {
          setSettlements(res.settlements);
          setMetrics(res.metrics);
        }
      } catch (err) {
        console.error('Failed to load settlements:', err);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [search]);

  const defaultMapped = [
    { id: 'SET-01', name: 'Campus 6 Hostel Block', status: 'Fully Flooded', coveragePct: 85, priority: 'High', lastSurvey: '02:00 PM, 28 Aug 2025' },
    { id: 'SET-02', name: 'Patia Square Residential', status: 'Fully Flooded', coveragePct: 78, priority: 'High', lastSurvey: '02:00 PM, 28 Aug 2025' },
    { id: 'SET-03', name: 'Sikharchandi Foothills', status: 'Partially Flooded', coveragePct: 55, priority: 'Medium', lastSurvey: '02:00 PM, 28 Aug 2025' },
    { id: 'SET-04', name: 'Infocity Colony', status: 'Partially Flooded', coveragePct: 42, priority: 'Medium', lastSurvey: '02:00 PM, 28 Aug 2025' },
    { id: 'SET-05', name: 'Nandankanan Enclave', status: 'Fully Flooded', coveragePct: 88, priority: 'High', lastSurvey: '02:00 PM, 28 Aug 2025' },
  ];

  const filteredSettlements = defaultMapped.filter((s) => {
    const matchesFilter = filter === 'All' || s.status === filter;
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleExportSettlements = () => {
    downloadCSV('affected_settlements_census', filteredSettlements.length > 0 ? filteredSettlements : defaultMapped);
  };

  return (
    <div className="p-4 md:p-6 lg:p-xl w-full min-h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline-lg text-2xl md:text-headline-lg text-on-surface font-bold">
              Affected Settlements
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
            Zone: KIIT University Campus 6, Patia &amp; Surrounding Settlements, Bhubaneswar
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-surface border border-outline-variant rounded-lg font-label-md text-xs font-semibold text-on-surface flex items-center gap-1.5 hover:bg-surface-container transition-colors shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">print</span>
            Print Census
          </button>
          <button
            onClick={handleExportSettlements}
            className="px-3.5 py-2 bg-primary-container text-on-primary rounded-lg font-label-md text-xs font-semibold flex items-center gap-1.5 hover:bg-primary transition-colors shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">download</span>
            Export Settlement Sitrep
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {/* Card 1: Affected Settlements */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-between min-h-[96px] shadow-xs">
          <span className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Affected Settlements
          </span>
          <div className="font-headline-lg text-3xl font-bold text-on-surface">
            {settlements.length > 0 ? settlements.length : 5}
          </div>
        </div>

        {/* Card 2: Fully Flooded */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-between min-h-[96px] shadow-xs">
          <span className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Fully Flooded
          </span>
          <div className="font-headline-lg text-3xl font-bold text-red-600">
            3
          </div>
        </div>

        {/* Card 3: Partially Flooded */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-between min-h-[96px] shadow-xs">
          <span className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Partially Flooded
          </span>
          <div className="font-headline-lg text-3xl font-bold text-amber-600">
            2
          </div>
        </div>

        {/* Card 4: High Priority Areas */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-between min-h-[96px] shadow-xs">
          <span className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            AI Detected Victims
          </span>
          <div className="font-headline-lg text-3xl font-bold text-red-600 flex items-center gap-1.5">
            {detection.victimsCount > 0 ? (
              <>
                <span>{detection.victimsCount}</span>
                <span className="text-[10px] font-mono text-red-500 font-normal">STRANDED</span>
              </>
            ) : (
              <span className="text-emerald-600">0</span>
            )}
          </div>
        </div>

        {/* Card 5: Surveyed Settlements */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col justify-between min-h-[96px] shadow-xs col-span-2 sm:col-span-1">
          <span className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Surveyed Settlements
          </span>
          <div className="font-headline-lg text-3xl font-bold text-on-surface">
            {defaultMapped.length}
          </div>
        </div>
      </div>

      {/* Settlements Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-xs">
        {/* Controls */}
        <div className="p-4 border-b border-outline-variant bg-surface-container-low flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-headline-md text-sm font-bold text-on-surface">
              Settlement Flood Status
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search settlement name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-surface border border-outline-variant rounded-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
              />
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant absolute left-2 top-2">
                search
              </span>
            </div>

            <div className="flex bg-surface border border-outline-variant rounded-lg p-0.5 text-xs font-semibold">
              {(['All', 'Fully Flooded', 'Partially Flooded'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilter(st)}
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
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Settlement Name</th>
                <th className="py-3 px-4">Flood Status</th>
                <th className="py-3 px-4">Flood Coverage (%)</th>
                <th className="py-3 px-4 text-center">Priority</th>
                <th className="py-3 px-4 text-right">Last Survey</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-on-surface">
              {filteredSettlements.map((s) => (
                <tr key={s.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-primary">{s.id}</td>
                  <td className="py-3.5 px-4 font-semibold text-on-surface">{s.name}</td>
                  
                  {/* Flood Status Badge */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-md text-[11px] font-bold ${
                        s.status === 'Fully Flooded'
                          ? 'bg-red-50 text-red-600 border border-red-100'
                          : 'bg-orange-50 text-orange-600 border border-orange-100'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>

                  {/* Flood Coverage with Progress Bar */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3 w-48">
                      <span className="font-semibold text-on-surface text-xs w-8">
                        {s.coveragePct}%
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            s.status === 'Fully Flooded' ? 'bg-red-500' : 'bg-orange-500'
                          }`}
                          style={{ width: `${s.coveragePct}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Priority Badge */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-md text-[11px] font-bold ${
                        s.priority === 'High'
                          ? 'bg-red-50 text-red-600 border border-red-100'
                          : 'bg-orange-50 text-orange-600 border border-orange-100'
                      }`}
                    >
                      {s.priority}
                    </span>
                  </td>

                  {/* Last Survey */}
                  <td className="py-3.5 px-4 text-right font-mono text-on-surface-variant">
                    {s.lastSurvey}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
