import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getIncidents } from '../api/disasterApi';

interface IncidentRecord {
  id: string;
  date: string;
  sector: string;
  type: string;
  severity: 'Critical' | 'Warning' | 'Moderate';
  victims: number;
  status: 'Resolved' | 'Under Action' | 'Archived';
}

export const IncidentRecords: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [records, setRecords] = useState<IncidentRecord[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const res = await getIncidents(searchTerm);
        if (isMounted) {
          setRecords(res.incidents);
        }
      } catch (err) {
        console.error('Failed to load incidents:', err);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [searchTerm]);

  const filtered = records.filter(
    (r) =>
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 lg:p-xl w-full min-h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="font-display-lg text-2xl md:text-display-lg text-on-surface font-bold">
            Incident Records & Historical Logs
          </h1>
          <p className="font-body-md text-sm md:text-body-md text-on-surface-variant mt-1">
            Archived situation reports, automated telemetry events, and emergency intervention logs.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/flood-report"
            className="bg-primary text-on-primary font-label-md text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 hover:bg-primary/90 transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-base">description</span>
            View Assessment Report
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-surface border border-outline-variant rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center bg-surface-container-low rounded-lg px-3 py-1.5 w-full max-w-md border border-outline-variant focus-within:border-primary">
          <span className="material-symbols-outlined text-on-surface-variant text-base mr-2">search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search incident ID, sector, or event type..."
            className="bg-transparent border-none outline-none w-full text-xs text-on-surface placeholder:text-on-surface-variant"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span>Showing <strong>{filtered.length}</strong> records</span>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low text-on-surface-variant font-bold">
                <th className="p-3.5">Incident ID</th>
                <th className="p-3.5">Timestamp (UTC)</th>
                <th className="p-3.5">Sector / Location</th>
                <th className="p-3.5">Incident Nature</th>
                <th className="p-3.5">Severity</th>
                <th className="p-3.5">Victims</th>
                <th className="p-3.5">Resolution</th>
                <th className="p-3.5 text-right">SitRep Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filtered.map((record) => (
                <tr key={record.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-primary">{record.id}</td>
                  <td className="p-3.5 font-mono text-on-surface-variant text-xs">{record.date}</td>
                  <td className="p-3.5 font-semibold text-on-surface">{record.sector}</td>
                  <td className="p-3.5 text-on-surface">{record.type}</td>
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        record.severity === 'Critical'
                          ? 'bg-error-container text-error border border-error/30'
                          : record.severity === 'Warning'
                          ? 'bg-[#ffdbcf] text-[#7b2600] border border-[#a33500]/30'
                          : 'bg-primary-container/10 text-primary border border-primary/20'
                      }`}
                    >
                      {record.severity}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono font-bold text-on-surface">{record.victims}</td>
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        record.status === 'Resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : record.status === 'Under Action'
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : 'bg-surface-variant text-on-surface-variant'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      {record.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <Link
                      to="/flood-report"
                      className="text-primary hover:underline font-bold text-xs inline-flex items-center gap-1"
                    >
                      <span>Report</span>
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    </Link>
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
