import React, { useState, useEffect } from 'react';
import { getAlerts, broadcastAlert } from '../api/disasterApi';
import { getSocket } from '../api/socketClient';

interface AlertItem {
  id: string;
  title: string;
  severity: 'Critical' | 'Warning' | 'Info';
  area: string;
  time: string;
  reach: string;
  body: string;
}

export const EmergencyAlertManagement: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'warning'>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newSeverity, setNewSeverity] = useState('Critical (Red)');
  const [newArea, setNewArea] = useState('Lower Basin (All Sectors)');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const res = await getAlerts(activeFilter);
        if (isMounted && res.alerts) {
          setAlerts(res.alerts);
          if (!selectedAlert && res.alerts.length > 0) {
            setSelectedAlert(res.alerts[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load alerts:', err);
      }
    }
    loadData();

    // Listen to real-time broadcasts
    const socket = getSocket();
    socket.on('alert:new', (newAlert) => {
      if (isMounted) {
        setAlerts((prev) => [newAlert, ...prev]);
        setSelectedAlert(newAlert);
      }
    });

    return () => {
      isMounted = false;
      socket.off('alert:new');
    };
  }, [activeFilter]);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;

    setSending(true);
    try {
      const severity = newSeverity.includes('Critical') ? 'Critical' : newSeverity.includes('Warning') ? 'Warning' : 'Info';
      await broadcastAlert({
        title: newTitle,
        severity,
        area: newArea,
        body: newBody,
      });
      setNewTitle('');
      setNewBody('');
    } catch (err) {
      console.error('Failed to broadcast alert:', err);
    } finally {
      setSending(false);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (activeFilter === 'critical') return a.severity === 'Critical';
    if (activeFilter === 'warning') return a.severity === 'Warning';
    return true;
  });

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-64px)] w-full overflow-hidden bg-background">
      {/* Left Pane: Alert History */}
      <div className="w-full lg:w-[380px] xl:w-[440px] flex flex-col bg-surface-bright border-r border-outline-variant shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface sticky top-0 z-10">
          <div>
            <h2 className="font-headline-md text-base font-bold text-on-surface">Emergency Broadcasts</h2>
            <p className="text-xs text-on-surface-variant">Public Warning & Alert System</p>
          </div>
          <span className="px-2 py-0.5 bg-error-container text-error text-[11px] font-bold rounded">
            {alerts.length} Active
          </span>
        </div>

        {/* Filter Chips */}
        <div className="p-3 border-b border-outline-variant flex gap-2 bg-surface-container-low/50">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              activeFilter === 'all'
                ? 'bg-primary text-white'
                : 'bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            All Broadcasts
          </button>
          <button
            onClick={() => setActiveFilter('critical')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              activeFilter === 'critical'
                ? 'bg-error text-white'
                : 'bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            Critical
          </button>
          <button
            onClick={() => setActiveFilter('warning')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              activeFilter === 'warning'
                ? 'bg-[#a33500] text-white'
                : 'bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            Warnings
          </button>
        </div>

        {/* Alert List */}
        <div className="divide-y divide-outline-variant">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              onClick={() => setSelectedAlert(alert)}
              className={`p-4 cursor-pointer transition-colors relative ${
                selectedAlert?.id === alert.id ? 'bg-surface-container-low' : 'hover:bg-surface-container-low/50'
              }`}
            >
              {selectedAlert?.id === alert.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
              )}
              <div className="flex justify-between items-start mb-1">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    alert.severity === 'Critical'
                      ? 'bg-error-container text-error'
                      : alert.severity === 'Warning'
                      ? 'bg-[#ffdbcf] text-[#7b2600]'
                      : 'bg-primary-fixed text-primary'
                  }`}
                >
                  {alert.severity}
                </span>
                <span className="font-mono text-[11px] text-on-surface-variant">{alert.time}</span>
              </div>
              <h3 className="font-bold text-xs text-on-surface line-clamp-1">{alert.title}</h3>
              <p className="text-[11px] text-on-surface-variant mt-1 line-clamp-2">{alert.body}</p>
              <div className="mt-2 flex items-center justify-between text-[11px] text-on-surface-variant font-mono">
                <span>{alert.id}</span>
                <span>{alert.reach}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Pane: Alert Details & Broadcast Dispatch */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
        {/* Selected Alert Breakdown Card */}
        {selectedAlert ? (
          <section className="bg-surface border border-outline-variant rounded-xl p-5 shadow-xs">
            <div className="flex flex-wrap justify-between items-start border-b border-outline-variant pb-3 gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded ${
                      selectedAlert.severity === 'Critical'
                        ? 'bg-error text-white'
                        : selectedAlert.severity === 'Warning'
                        ? 'bg-[#a33500] text-white'
                        : 'bg-primary text-white'
                    }`}
                  >
                    {selectedAlert.severity.toUpperCase()}
                  </span>
                  <span className="font-mono text-xs text-on-surface-variant">{selectedAlert.id}</span>
                </div>
                <h2 className="font-headline-md text-lg font-bold text-on-surface">{selectedAlert.title}</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">Target Area: {selectedAlert.area}</p>
              </div>

              <div className="text-right">
                <span className="text-xs font-semibold text-on-surface-variant block">Broadcast Status</span>
                <span className="font-mono text-sm font-bold text-emerald-700">● Active Live</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-surface-container-low rounded-lg border border-outline-variant">
              <p className="text-xs font-mono text-on-surface whitespace-pre-wrap">{selectedAlert.body}</p>
            </div>
          </section>
        ) : null}

        {/* Issue New Emergency Alert Form */}
        <section className="bg-surface border border-outline-variant rounded-xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4 border-b border-outline-variant pb-3">
            <span className="material-symbols-outlined text-error text-xl">campaign</span>
            <h3 className="font-headline-md text-base font-bold text-on-surface">Dispatch New Emergency Alert</h3>
          </div>

          <form className="flex flex-col gap-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-on-surface">Severity Level</label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value)}
                  className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 focus:border-primary focus:ring-1 focus:ring-primary h-9 text-xs"
                >
                  <option>Critical (Red)</option>
                  <option>Warning (Orange)</option>
                  <option>Info (Blue)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-on-surface">Target Area Group</label>
                <select
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 focus:border-primary focus:ring-1 focus:ring-primary h-9 text-xs"
                >
                  <option>Lower Basin (All Sectors)</option>
                  <option>Upper Ridge Sector 4</option>
                  <option>Central District Metro</option>
                  <option>Custom Polygon Area...</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-on-surface">Alert Headline</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Mandatory Evacuation Order for Sector 12"
                className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 focus:border-primary focus:ring-1 focus:ring-primary text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-on-surface">Message Instructions / Advisory Body</label>
              <textarea
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="Enter clear, actionable evacuation instructions, muster points, and safety routes..."
                rows={4}
                className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 font-mono focus:border-primary focus:ring-1 focus:ring-primary resize-none text-xs"
              />
              <span className="text-[10px] text-on-surface-variant self-end font-mono">
                {newBody.length} / 160 chars
              </span>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-2">
              <button
                type="button"
                className="px-4 py-2 border border-outline-variant bg-surface text-on-surface font-bold rounded-lg hover:bg-surface-container transition-colors"
              >
                Draft / Simulate
              </button>
              <button
                type="button"
                onClick={handleBroadcast}
                disabled={sending}
                className="px-5 py-2 bg-error text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">cell_tower</span>
                {sending ? 'Broadcasting Live...' : 'Broadcast Immediate Warning'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};
