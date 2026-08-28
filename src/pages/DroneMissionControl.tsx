import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSocket } from '../api/socketClient';
import {
  createDroneMission,
  getDroneMissions,
  updateDroneMission,
  deleteDroneMission,
  getMediaFiles,
  deleteMediaFile,
  type MediaItem,
  type DroneMissionItem,
} from '../api/disasterApi';
import { API_BASE_URL } from '../api/config';

export const DroneMissionControl: React.FC = () => {
  const [activeMediaTab, setActiveMediaTab] = useState<'all' | 'images' | 'videos' | 'live'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingMission, setEditingMission] = useState<DroneMissionItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingMissionId, setDeletingMissionId] = useState<string | null>(null);

  // Modal Form State
  const [targetArea, setTargetArea] = useState('Sector 12 Riverbend Recon');
  const [droneId, setDroneId] = useState('DRONE-002');
  const [flightMode, setFlightMode] = useState('AUTONOMOUS RECON');
  const [assignedAltitude, setAssignedAltitude] = useState(120);
  const [missionStatus, setMissionStatus] = useState('Active');

  // Real Local Missions State
  const [missions, setMissions] = useState<DroneMissionItem[]>([]);
  const [loadingMissions, setLoadingMissions] = useState(true);

  // Real Local Media State
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [telemetry, setTelemetry] = useState<any>({
    battery: 0,
    altitude: 0.0,
    speed: 0.0,
    coordinates: { lat: 0.0, lng: 0.0 },
    signalQuality: 0,
    lat: 0.0,
    lng: 0.0,
    distToWP: 0.0,
    yaw: 0.0,
    verticalSpeed: 0.0,
    distToMAV: 0.0,
    isMavlinkLive: false,
  });

  const backendHost = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

  useEffect(() => {
    let isMounted = true;
    const socket = getSocket();

    socket.on('telemetry:update', (data) => {
      if (isMounted && data) {
        const item = Array.isArray(data) ? data[0] : data;
        setTelemetry((prev: any) => ({
          ...prev,
          battery: item.batteryPct ?? item.battery ?? prev.battery,
          altitude: item.altitudeM ?? item.altitude ?? prev.altitude,
          speed: item.speedKmh ?? item.speed ?? prev.speed,
          coordinates: item.latitude && item.longitude ? { lat: item.latitude, lng: item.longitude } : item.coordinates ?? prev.coordinates,
          signalQuality: item.signalQuality ?? prev.signalQuality,
        }));
      }
    });

    socket.on('telemetry:mavlink', (data) => {
      if (isMounted && data) {
        setTelemetry((prev: any) => ({
          ...prev,
          lat: typeof data.lat === 'number' ? data.lat : prev.lat,
          lng: typeof data.lng === 'number' ? data.lng : prev.lng,
          coordinates: {
            lat: typeof data.lat === 'number' ? data.lat : prev.coordinates.lat,
            lng: typeof data.lng === 'number' ? data.lng : prev.coordinates.lng,
          },
          yaw: typeof data.yaw === 'number' ? data.yaw : prev.yaw,
          distToWP: typeof data.distToWP === 'number' ? data.distToWP : prev.distToWP,
          verticalSpeed: typeof data.verticalSpeed === 'number' ? data.verticalSpeed : prev.verticalSpeed,
          distToMAV: typeof data.distToMAV === 'number' ? data.distToMAV : prev.distToMAV,
          altitude: typeof data.altitude === 'number' ? data.altitude : prev.altitude,
          battery: typeof data.battery === 'number' ? data.battery : prev.battery,
          speed: typeof data.speed === 'number' ? data.speed : prev.speed,
          isMavlinkLive: true,
        }));
      }
    });

    async function loadInitialData() {
      try {
        const [items, missionList] = await Promise.all([
          getMediaFiles(),
          getDroneMissions(),
        ]);
        if (isMounted) {
          setMediaItems(items);
          setMissions(missionList);
        }
      } catch (err) {
        console.warn('Failed to load initial data:', err);
      } finally {
        if (isMounted) {
          setLoadingMedia(false);
          setLoadingMissions(false);
        }
      }
    }
    loadInitialData();

    // High reliability polling (every 1s) to guarantee continuous live updates
    const pollInterval = setInterval(async () => {
      try {
        let data: any = null;
        const now = Date.now();

        // 1. Fetch from local backend
        try {
          const res = await fetch(`${API_BASE_URL}/telemetry/mavlink?_t=${now}`, { cache: 'no-store' });
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data?.receivedAt) {
              data = json.data;
            }
          }
        } catch (e) {}

        // 2. Fetch from cloud Render backend and take whichever is newer
        try {
          const cloudRes = await fetch(`https://drone-backend-c1j9.onrender.com/api/v1/telemetry/mavlink?_t=${now}`, { cache: 'no-store' });
          if (cloudRes.ok) {
            const cloudJson = await cloudRes.json();
            if (cloudJson.success && cloudJson.data?.receivedAt) {
              if (!data || new Date(cloudJson.data.receivedAt).getTime() > new Date(data.receivedAt).getTime()) {
                data = cloudJson.data;
              }
            }
          }
        } catch (e) {}

        if (isMounted && data) {
          setTelemetry((prev: any) => ({
            ...prev,
            lat: typeof data.lat === 'number' ? data.lat : prev.lat,
            lng: typeof data.lng === 'number' ? data.lng : prev.lng,
            coordinates: {
              lat: typeof data.lat === 'number' ? data.lat : prev.coordinates.lat,
              lng: typeof data.lng === 'number' ? data.lng : prev.coordinates.lng,
            },
            yaw: typeof data.yaw === 'number' ? data.yaw : prev.yaw,
            distToWP: typeof data.distToWP === 'number' ? data.distToWP : prev.distToWP,
            verticalSpeed: typeof data.verticalSpeed === 'number' ? data.verticalSpeed : prev.verticalSpeed,
            distToMAV: typeof data.distToMAV === 'number' ? data.distToMAV : prev.distToMAV,
            altitude: typeof data.altitude === 'number' ? data.altitude : prev.altitude,
            battery: typeof data.battery === 'number' ? data.battery : prev.battery,
            speed: typeof data.speed === 'number' ? data.speed : prev.speed,
            isMavlinkLive: true,
          }));
        }
      } catch (err) {
        // Silently skip if network error
      }
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      socket.off('telemetry:update');
      socket.off('telemetry:mavlink');
    };
  }, []);

  const handleOpenNewMission = () => {
    setEditingMission(null);
    setDroneId('DRONE-002');
    setTargetArea('Sector 14 Grid Recon');
    setFlightMode('AUTONOMOUS RECON');
    setAssignedAltitude(120);
    setMissionStatus('Active');
    setShowModal(true);
  };

  const handleOpenEditMission = (m: DroneMissionItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingMission(m);
    setDroneId(m.droneId);
    setTargetArea(m.targetArea);
    setFlightMode(m.flightMode || 'AUTONOMOUS RECON');
    setAssignedAltitude(m.altitudeM || 120);
    setMissionStatus(m.status || 'Active');
    setShowModal(true);
  };

  const handleDeleteMission = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this drone mission?')) {
      return;
    }
    setDeletingMissionId(id);
    try {
      await deleteDroneMission(id);
      setMissions((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      alert('Failed to delete mission: ' + (err as Error).message);
    } finally {
      setDeletingMissionId(null);
    }
  };

  const handleDeleteMedia = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this file permanently from local storage (backend/data/uploads)?')) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteMediaFile(id);
      setMediaItems((prev) => prev.filter((item) => item.id !== id));
      if (previewMedia?.id === id) {
        setPreviewMedia(null);
      }
    } catch (err) {
      alert('Failed to delete file from disk: ' + (err as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveMission = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingMission) {
        // Update existing mission
        const updated = await updateDroneMission(editingMission.id, {
          droneId,
          targetArea,
          altitudeM: Number(assignedAltitude),
          flightMode,
          status: missionStatus,
        });
        setMissions((prev) =>
          prev.map((m) => (m.id === editingMission.id ? { ...m, ...updated, droneId, targetArea, altitudeM: Number(assignedAltitude), flightMode, status: missionStatus } : m))
        );
      } else {
        // Create new mission
        const created = await createDroneMission({
          droneId,
          targetArea,
          altitudeM: Number(assignedAltitude),
          flightMode,
          status: missionStatus,
        });
        setMissions((prev) => [created, ...prev]);
      }
      setShowModal(false);
      setEditingMission(null);
    } catch (err) {
      console.error('Failed to save mission:', err);
      alert('Failed to save mission: ' + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMedia = mediaItems.filter((item) => {
    if (activeMediaTab === 'images') return item.mediaType === 'image';
    if (activeMediaTab === 'videos') return item.mediaType === 'video';
    return true;
  });

  const imagesCount = mediaItems.filter((i) => i.mediaType === 'image').length;
  const videosCount = mediaItems.filter((i) => i.mediaType === 'video').length;

  return (
    <div className="p-4 md:p-6 lg:p-xl w-full min-h-full flex flex-col gap-6">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Mission Command</h1>
        </div>
        <button
          onClick={handleOpenNewMission}
          className="bg-primary-container text-on-primary px-lg py-sm rounded-lg font-label-md text-label-md flex items-center gap-sm hover:bg-primary transition-colors shadow-xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Mission
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Mission Details, Telemetry, Captured Media */}
        <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
          {/* Status Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col gap-6 shadow-xs">
            <div className="flex flex-wrap justify-between items-start border-b border-outline-variant pb-md gap-4">
              <div>
                <div className="flex items-center gap-md mb-xs">
                  <h3 className="font-headline-md text-headline-md text-on-surface">MISSION-DRONE-001</h3>
                  <span className="bg-primary-fixed text-primary px-sm py-xs rounded-full font-label-md text-label-md border border-primary-fixed-dim">
                    Active Mission
                  </span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Target Area: Riverbend District • Assigned: 13:45 UTC
                </p>
              </div>
              <div className="bg-[#e6f4ea] border border-[#34a853] text-[#137333] px-md py-sm rounded-lg font-label-md text-label-md flex items-center gap-sm shadow-xs">
                <span className="material-symbols-outlined text-[16px] fill">check_circle</span>
                Analysis Completed
              </div>
            </div>

            {/* Mission Planner MAVLink Live Telemetry Grid */}
            <div className="bg-[#181a20] border border-slate-700/80 rounded-xl p-4 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-2 mb-3">
                <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${telemetry.isMavlinkLive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                  MISSION PLANNER LIVE TELEMETRY
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  MAVLink · USB Serial
                </span>
              </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {/* Latitude (dd) */}
                  <div className="bg-[#121418] border border-slate-800 rounded-lg p-3 flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">Latitude (dd)</span>
                    <span className="font-mono text-lg font-bold text-[#b4a0ff]">
                      {telemetry.lat && telemetry.lat !== 0 ? Number(telemetry.lat).toFixed(6) : "0.00"}
                    </span>
                  </div>

                  {/* Longitude (dd) */}
                  <div className="bg-[#121418] border border-slate-800 rounded-lg p-3 flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">Longitude (dd)</span>
                    <span className="font-mono text-lg font-bold text-[#ffb07c]">
                      {telemetry.lng && telemetry.lng !== 0 ? Number(telemetry.lng).toFixed(6) : "0.00"}
                    </span>
                  </div>

                  {/* Altitude (m) */}
                  <div className="bg-[#121418] border border-slate-800 rounded-lg p-3 flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">Altitude (m)</span>
                    <span className="font-mono text-lg font-bold text-[#7fe6ff]">
                      {telemetry.altitude !== undefined && telemetry.altitude !== null ? Number(telemetry.altitude).toFixed(1) : "0.0"}
                    </span>
                  </div>

                  {/* Yaw (deg) */}
                  <div className="bg-[#121418] border border-slate-800 rounded-lg p-3 flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">Yaw (deg)</span>
                    <span className="font-mono text-lg font-bold text-[#6eed9d]">
                      {Number(telemetry.yaw || 0).toFixed(2)}
                    </span>
                  </div>

                  {/* Vertical Speed (m/s) */}
                  <div className="bg-[#121418] border border-slate-800 rounded-lg p-3 flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">Vertical Speed (m/s)</span>
                    <span className="font-mono text-lg font-bold text-[#ffe67b]">
                      {Number(telemetry.verticalSpeed || 0).toFixed(2)}
                    </span>
                  </div>

                  {/* Battery (%) */}
                  <div className="bg-[#121418] border border-slate-800 rounded-lg p-3 flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">Battery (%)</span>
                    <span className="font-mono text-lg font-bold text-[#38ef7d]">
                      {telemetry.battery !== undefined && telemetry.battery !== null ? Number(telemetry.battery).toFixed(0) + "%" : "0%"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          {/* Captured Media Gallery */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col gap-4 shadow-xs">
            <div className="flex flex-wrap justify-between items-center border-b border-outline-variant pb-3 gap-2">
              <h4 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                Mission Footage &amp; Recorded Media
              </h4>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setActiveMediaTab('all')}
                  className={`font-label-md text-xs px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    activeMediaTab === 'all' ? 'bg-primary text-white font-bold' : 'text-primary hover:bg-primary-fixed'
                  }`}
                >
                  All ({mediaItems.length})
                </button>
                <button
                  onClick={() => setActiveMediaTab('images')}
                  className={`font-label-md text-xs px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    activeMediaTab === 'images' ? 'bg-primary text-white font-bold' : 'text-primary hover:bg-primary-fixed'
                  }`}
                >
                  Images ({imagesCount})
                </button>
                <button
                  onClick={() => setActiveMediaTab('videos')}
                  className={`font-label-md text-xs px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    activeMediaTab === 'videos' ? 'bg-primary text-white font-bold' : 'text-primary hover:bg-primary-fixed'
                  }`}
                >
                  Recordings ({videosCount})
                </button>
                <button
                  onClick={() => setActiveMediaTab('live')}
                  className={`font-label-md text-xs px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeMediaTab === 'live' ? 'bg-error text-white font-bold' : 'text-error hover:bg-error/10'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current animate-ping" />
                  Live Drone Cam
                </button>
              </div>
            </div>

            {/* LIVE DRONE CAM FEED VIEW */}
            {activeMediaTab === 'live' && (
              <div className="flex flex-col gap-3">
                <div className="relative bg-inverse-surface rounded-xl overflow-hidden min-h-[380px] flex flex-col justify-between border border-outline-variant">
                  {/* Top Feed Header */}
                  <div className="p-3 bg-black/60 backdrop-blur-xs flex justify-between items-center z-10">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-mono text-xs text-white font-bold">DRONE-001 OPTICAL RECON CAM (SECTOR 12)</span>
                    </div>
                    <span className="bg-red-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                      LIVE STREAM · 1080P 60FPS
                    </span>
                  </div>

                  {/* Feed Screen Body */}
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-white/90">
                    <span className="material-symbols-outlined text-5xl text-primary animate-pulse mb-3">
                      videocam
                    </span>
                    <h5 className="font-headline-md text-base font-bold">Live Aerial Surveillance Active</h5>
                    <p className="text-xs text-white/70 max-w-md mt-1">
                      Real-time optics feed connected to Sector 12 levee perimeter and river crossing.
                    </p>
                    <Link
                      to="/detection-analysis"
                      className="mt-4 px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors shadow-md flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-base">psychology</span>
                      Open AI Detection &amp; Analysis Workspace
                    </Link>
                  </div>

                  {/* Bottom Telemetry HUD Bar */}
                  <div className="p-2.5 bg-black/80 backdrop-blur-xs border-t border-white/10 flex flex-wrap justify-between items-center text-[11px] font-mono text-white/90 gap-2">
                    <span>WATER COVERAGE: <strong className="text-cyan-400">68%</strong></span>
                    <span>VICTIMS DETECTED: <strong className="text-red-400">7</strong></span>
                    <span>SURVEY: <strong>SECTOR 12</strong></span>
                    <span>AI INFERENCE: <strong className="text-emerald-400">ONLINE (YOLOv11)</strong></span>
                  </div>
                </div>
              </div>
            )}

            {/* RECORDED / UPLOADED MEDIA GRID */}
            {activeMediaTab !== 'live' && (
              <>
                {loadingMedia ? (
                  <div className="p-8 text-center text-xs text-on-surface-variant flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-primary">sync</span>
                    Loading local media library...
                  </div>
                ) : filteredMedia.length === 0 ? (
                  <div className="p-8 border border-dashed border-outline-variant rounded-xl text-center flex flex-col items-center justify-center gap-3 bg-surface-container-low/40">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant">
                      photo_library
                    </span>
                    <div>
                      <h5 className="font-headline-md text-sm font-bold text-on-surface">No local media stored yet</h5>
                      <p className="text-xs text-on-surface-variant max-w-sm mt-1">
                        Images and videos uploaded or analyzed in <strong>Detection &amp; Analysis</strong> will automatically be saved to your local storage (<code className="text-[11px] bg-surface-container px-1 rounded">backend/data/uploads</code>) and displayed here.
                      </p>
                    </div>
                    <Link
                      to="/detection-analysis"
                      className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 mt-1"
                    >
                      <span className="material-symbols-outlined text-base">upload_file</span>
                      Upload in Detection &amp; Analysis
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredMedia.map((item) => {
                      const fileSrc = item.url.startsWith('http') ? item.url : `${backendHost}${item.url}`;
                      const isVid = item.mediaType === 'video';
                      const sizeMb = (item.fileSize / (1024 * 1024)).toFixed(1);

                      return (
                        <div
                          key={item.id}
                          onClick={() => setPreviewMedia(item)}
                          className="relative group rounded-lg overflow-hidden border border-outline-variant h-56 bg-surface-container cursor-pointer shadow-xs hover:border-primary transition-all"
                        >
                          {isVid ? (
                            <div className="w-full h-full bg-slate-950 flex items-center justify-center relative">
                              <video
                                src={fileSrc}
                                className="w-full h-full object-cover"
                                muted
                                preload="metadata"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                                <div className="bg-on-surface/70 group-hover:bg-primary rounded-full w-12 h-12 flex items-center justify-center backdrop-blur-sm transition-all group-hover:scale-110 shadow-lg">
                                  <span className="material-symbols-outlined text-white text-2xl fill">play_arrow</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <img
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              src={fileSrc}
                              alt={item.originalName}
                            />
                          )}

                          {/* Top Badges & Delete Button */}
                          <div className="absolute top-2 left-2 right-2 flex justify-between items-center z-10">
                            <span className="bg-surface-container-lowest/90 backdrop-blur-xs px-2 py-0.5 rounded flex items-center gap-1 text-[10px] font-bold text-on-surface shadow-xs">
                              <span className="material-symbols-outlined text-[13px] text-primary">
                                {isVid ? 'videocam' : 'photo_camera'}
                              </span>
                              {isVid ? 'RECORDED' : 'SURVEY IMG'}
                            </span>

                            {/* DELETE BUTTON */}
                            <button
                              onClick={(e) => handleDeleteMedia(item.id, e)}
                              disabled={deletingId === item.id}
                              title="Delete file permanently from disk"
                              className="p-1.5 bg-error/90 hover:bg-error text-white rounded-md shadow-md transition-colors cursor-pointer flex items-center justify-center"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                {deletingId === item.id ? 'sync' : 'delete'}
                              </span>
                            </button>
                          </div>

                          {/* Bottom Info Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-on-surface/95 via-on-surface/30 to-transparent opacity-95 transition-opacity flex flex-col justify-end p-3 pointer-events-none">
                            <span className="text-white font-semibold text-xs truncate">
                              {item.originalName || item.filename}
                            </span>
                            <div className="flex justify-between items-center text-white/80 font-mono text-[10px] mt-0.5">
                              <span>{item.sector} · {new Date(item.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <span>{sizeMb} MB</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Column: Flight Path Tracking Map & Mission Queue */}
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">

          {/* Mission Queue */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col overflow-hidden shadow-xs">
            <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
              <h4 className="font-label-md text-xs text-on-surface-variant uppercase tracking-wider font-bold">
                Mission Queue
              </h4>
              <span className="text-[11px] font-semibold text-primary">
                {missions.length} Registered / Active
              </span>
            </div>

            <div className="flex flex-col divide-y divide-outline-variant">
              {loadingMissions ? (
                <div className="p-6 text-center text-xs text-on-surface-variant flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined animate-spin text-primary">sync</span>
                  Loading mission queue...
                </div>
              ) : missions.length === 0 ? (
                <div className="p-6 text-center text-xs text-on-surface-variant flex flex-col items-center gap-2">
                  <p>No drone missions scheduled.</p>
                  <button
                    onClick={handleOpenNewMission}
                    className="px-3 py-1 bg-primary text-on-primary rounded text-xs font-semibold cursor-pointer hover:bg-primary/90"
                  >
                    + Add New Mission
                  </button>
                </div>
              ) : (
                missions.map((m) => {
                  const isActive = m.status === 'Active';
                  const isStandby = m.status === 'Standby';

                  return (
                    <div
                      key={m.id}
                      className="p-3.5 hover:bg-surface-container-low transition-colors flex items-center justify-between group"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h5 className="font-bold text-xs text-on-surface truncate font-mono">
                            {m.droneId} ({m.id})
                          </h5>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : isStandby
                                ? 'bg-amber-50 text-amber-700 border-amber-300'
                                : 'bg-surface-variant text-on-surface-variant border-outline-variant'
                            }`}
                          >
                            {m.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant truncate">
                          {m.targetArea} • {m.flightMode} ({m.altitudeM || 120}m)
                        </p>
                      </div>

                      {/* EDIT AND DELETE BUTTONS */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleOpenEditMission(m, e)}
                          title="Edit Mission"
                          className="p-1.5 rounded-md hover:bg-primary-fixed text-primary transition-colors cursor-pointer flex items-center justify-center"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button
                          onClick={(e) => handleDeleteMission(m.id, e)}
                          disabled={deletingMissionId === m.id}
                          title="Delete Mission"
                          className="p-1.5 rounded-md hover:bg-error/10 text-error transition-colors cursor-pointer flex items-center justify-center"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {deletingMissionId === m.id ? 'sync' : 'delete'}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Media Preview Modal */}
      {previewMedia && (
        <div
          onClick={() => setPreviewMedia(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface border border-outline-variant rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
              <div>
                <h4 className="font-bold text-sm text-on-surface">{previewMedia.originalName || previewMedia.filename}</h4>
                <p className="text-xs text-on-surface-variant">{previewMedia.sector} · Uploaded {new Date(previewMedia.uploadedAt).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setPreviewMedia(null)}
                className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-black max-h-[70vh]">
              {previewMedia.mediaType === 'video' ? (
                <video
                  src={previewMedia.url.startsWith('http') ? previewMedia.url : `${backendHost}${previewMedia.url}`}
                  controls
                  autoPlay
                  className="max-w-full max-h-[60vh] rounded-lg"
                />
              ) : (
                <img
                  src={previewMedia.url.startsWith('http') ? previewMedia.url : `${backendHost}${previewMedia.url}`}
                  alt={previewMedia.originalName}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* New / Edit Mission Dispatch Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-surface border border-outline-variant rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-4 text-xs">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">
                  {editingMission ? 'edit_note' : 'precision_manufacturing'}
                </span>
                <h3 className="font-headline-md text-base font-bold text-on-surface">
                  {editingMission ? `Edit Mission (${editingMission.id})` : 'Dispatch New Drone Mission'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingMission(null);
                }}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveMission} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-on-surface">Assign Drone Asset</label>
                <input
                  type="text"
                  required
                  list="drone-assets-list"
                  value={droneId}
                  onChange={(e) => setDroneId(e.target.value)}
                  placeholder="Type any drone name/ID (e.g., DRONE-001, Matrice 300, Custom Quad...)"
                  className="bg-surface-container-lowest border border-outline-variant rounded-lg p-2 text-xs focus:border-primary outline-none"
                />
                <datalist id="drone-assets-list">
                  <option value="DRONE-001 (Matrice 300 RTK - Active)" />
                  <option value="DRONE-002 (Inspire 3 - Standby 98% Batt)" />
                  <option value="DRONE-003 (Mavic 3 Thermal - Standby 100%)" />
                  <option value="DRONE-004 (Matrice 350 RTK - Ready)" />
                </datalist>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-on-surface">Target Sector / Recon Area</label>
                <input
                  type="text"
                  required
                  value={targetArea}
                  onChange={(e) => setTargetArea(e.target.value)}
                  placeholder="Type any custom location or recon zone (e.g., Sector 14 Grid Recon)"
                  className="bg-surface-container-lowest border border-outline-variant rounded-lg p-2 text-xs focus:border-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-on-surface">Assigned Altitude (AGL in meters)</label>
                  <input
                    type="number"
                    value={assignedAltitude}
                    onChange={(e) => setAssignedAltitude(Number(e.target.value))}
                    placeholder="e.g. 110"
                    className="bg-surface-container-lowest border border-outline-variant rounded-lg p-2 text-xs focus:border-primary outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-on-surface">Mission Status</label>
                  <input
                    type="text"
                    list="status-options-list"
                    value={missionStatus}
                    onChange={(e) => setMissionStatus(e.target.value)}
                    placeholder="e.g. Active, Standby, Custom..."
                    className="bg-surface-container-lowest border border-outline-variant rounded-lg p-2 text-xs focus:border-primary outline-none"
                  />
                  <datalist id="status-options-list">
                    <option value="Active" />
                    <option value="Standby" />
                    <option value="Completed" />
                    <option value="Aborted" />
                  </datalist>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-on-surface">Flight Mode</label>
                <input
                  type="text"
                  list="flight-mode-options-list"
                  value={flightMode}
                  onChange={(e) => setFlightMode(e.target.value)}
                  placeholder="Type any custom flight mode (e.g., AUTONOMOUS RECON, LIDAR SCAN...)"
                  className="bg-surface-container-lowest border border-outline-variant rounded-lg p-2 text-xs focus:border-primary outline-none"
                />
                <datalist id="flight-mode-options-list">
                  <option value="AUTONOMOUS RECON" />
                  <option value="THERMAL SEARCH & RESCUE" />
                  <option value="FLOOD DEPTH LIDAR MAPPING" />
                  <option value="MANUAL PILOT OVERRIDE" />
                </datalist>
              </div>

              <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingMission(null);
                  }}
                  className="px-4 py-2 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary hover:bg-primary/90 text-on-primary font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting
                    ? 'Saving...'
                    : editingMission
                    ? 'Save Mission Changes'
                    : 'Initialize & Launch Mission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
