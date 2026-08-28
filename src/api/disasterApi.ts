import { fetchApi, API_BASE_URL } from './config';
import {
  settlementsData,
  infrastructureData,
  roadAccessibilityData,
  waterSpreadData,
  progressionTimeline,
} from '../data/mockData';
import type {
  WaterSpreadData,
  ProgressionStep,
} from '../data/mockData';

// 1. Dashboard Summary
export interface DashboardSummaryResponse {
  waterSpread: WaterSpreadData;
  settlements: {
    totalCount: number;
    inundatedCount: number;
    summaryList: Array<{ id: string; name: string; status: string }>;
  };
  roadAccessibility: {
    overallPercentage: number;
    totalTracked: number;
    openRoads: number;
    partiallyAffected: number;
    submergedRoads: number;
    blockedRoads: number;
  };
  infrastructureImpact: {
    totalTracked: number;
    atRisk: number;
    flooded: number;
    accessible: number;
  };
  dronesAvailable: {
    total: number;
    active: number;
    standby: number;
    fleet: Array<{ droneId: string; status: string; battery: number }>;
  };
  recentAlerts: Array<{
    id: string;
    title: string;
    severity: string;
    area: string;
    time: string;
    body: string;
  }>;
}

export async function getDashboardSummary(): Promise<DashboardSummaryResponse> {
  try {
    return await fetchApi<DashboardSummaryResponse>('/dashboard/summary');
  } catch (err) {
    // Graceful fallback to rich local state
    return {
      waterSpread: waterSpreadData,
      settlements: {
        totalCount: settlementsData.length,
        inundatedCount: settlementsData.filter((s) => s.status !== 'Safe').length,
        summaryList: settlementsData.map((s) => ({ id: s.id, name: s.name, status: s.status })),
      },
      roadAccessibility: {
        overallPercentage: roadAccessibilityData.overallPercentage,
        totalTracked: roadAccessibilityData.routes.length,
        openRoads: roadAccessibilityData.openRoads,
        partiallyAffected: roadAccessibilityData.partiallyAffected,
        submergedRoads: roadAccessibilityData.submergedRoads,
        blockedRoads: roadAccessibilityData.blockedRoads,
      },
      infrastructureImpact: {
        totalTracked: infrastructureData.length,
        atRisk: infrastructureData.filter((i) => i.status === 'Risk Detected').length,
        flooded: infrastructureData.filter((i) => i.status === 'Flood Affected').length,
        accessible: infrastructureData.filter((i) => i.status === 'Accessible').length,
      },
      dronesAvailable: {
        total: 2,
        active: 1,
        standby: 1,
        fleet: [
          { droneId: 'DRONE-001', status: 'Active', battery: 84 },
          { droneId: 'DRONE-002', status: 'Standby', battery: 98 },
        ],
      },
      recentAlerts: [
        {
          id: 'ALT-1092',
          title: 'CRITICAL ALERT',
          severity: 'Critical',
          area: 'Sector 12 Village',
          time: '14:32',
          body: 'NEW IMPACTED ZONE DETECTED. Loc: Sector 12 Village · Src: DRONE-001',
        },
        {
          id: 'ALT-1091',
          title: 'INFRASTRUCTURE RISK',
          severity: 'Warning',
          area: 'Bridge B-02',
          time: '14:20',
          body: 'Bridge B-02: Flow shear 12k m³/s exceeding baseline.',
        },
        {
          id: 'ALT-1090',
          title: 'ROAD ACCESS UPDATE',
          severity: 'Warning',
          area: 'Highway 4',
          time: '13:45',
          body: 'Highway 4 blocked by debris. North Ring Corridor open.',
        },
      ],
    };
  }
}

// 2. Water Coverage
export async function getWaterCoverageSummary() {
  try {
    return await fetchApi<any>('/water-coverage/summary');
  } catch {
    return {
      coveragePercentage: waterSpreadData.coveragePercentage,
      trend: waterSpreadData.trend,
      direction: waterSpreadData.direction,
      changeSincePreviousSurvey: waterSpreadData.changeSincePreviousSurvey,
      peakHeight: waterSpreadData.peakHeight,
      flowVelocity: waterSpreadData.flowVelocity,
      zonesCount: 5,
      criticalZonesCount: 2,
    };
  }
}

export async function getWaterCoverageZones(riskLevel?: string) {
  try {
    const q = riskLevel && riskLevel !== 'All' ? `?riskLevel=${riskLevel}` : '';
    return await fetchApi<any[]>(`/water-coverage/zones${q}`);
  } catch {
    return [
      { id: 'Z-01', name: 'Sector 12 Riverbank & Lower Embankment', waterDepth: '3.2m', coveragePct: 88, flowDirection: 'South-East (1.8 m/s)', status: 'Critical Rise', riskLevel: 'High', lastSurvey: '14:30 UTC' },
      { id: 'Z-02', name: 'Riverside Agricultural Basin', waterDepth: '2.1m', coveragePct: 74, flowDirection: 'South-East (1.4 m/s)', status: 'Critical Rise', riskLevel: 'High', lastSurvey: '14:25 UTC' },
      { id: 'Z-03', name: 'East Lowland Catchment Area', waterDepth: '1.4m', coveragePct: 62, flowDirection: 'East (0.9 m/s)', status: 'Elevated', riskLevel: 'Medium', lastSurvey: '14:15 UTC' },
      { id: 'Z-04', name: 'Old Market Central Basin', waterDepth: '0.8m', coveragePct: 45, flowDirection: 'South (0.6 m/s)', status: 'Elevated', riskLevel: 'Medium', lastSurvey: '14:10 UTC' },
      { id: 'Z-05', name: 'North-West Ridge Drainage Corridor', waterDepth: '0.3m', coveragePct: 22, flowDirection: 'South-East (1.1 m/s)', status: 'Stable', riskLevel: 'Low', lastSurvey: '13:50 UTC' },
    ];
  }
}

// 3. Settlements
export async function getSettlements(status?: string, search?: string) {
  try {
    const params = new URLSearchParams();
    if (status && status !== 'All') params.append('status', status);
    if (search) params.append('search', search);
    const q = params.toString() ? `?${params.toString()}` : '';
    return await fetchApi<{ settlements: any[]; metrics: any }>(`/settlements${q}`);
  } catch {
    return {
      settlements: [
        { id: 'SET-01', name: 'Sector 12 Village', location: 'Sector 12 North Riverbank', status: 'Flood Affected', population: 620, households: 140, waterDepth: '1.4m', evacuationPriority: 'Immediate', evacuatedPercentage: 65, nearestCamp: 'Sector 14 Shelter (1.8 km)', lastUpdated: '14:30 UTC' },
        { id: 'SET-02', name: 'Riverside Colony', location: 'Sector 12 South Embankment', status: 'Partially Submerged', population: 450, households: 95, waterDepth: '1.8m', evacuationPriority: 'Immediate', evacuatedPercentage: 80, nearestCamp: 'Riverside High School (1.2 km)', lastUpdated: '14:25 UTC' },
        { id: 'SET-03', name: 'East Hamlet', location: 'East Levee Approach', status: 'Flood Affected', population: 280, households: 60, waterDepth: '0.9m', evacuationPriority: 'High', evacuatedPercentage: 50, nearestCamp: 'Camp Bravo (3.1 km)', lastUpdated: '14:15 UTC' },
        { id: 'SET-04', name: 'Old Market Settlement', location: 'Central Sector 12', status: 'Partially Submerged', population: 510, households: 115, waterDepth: '0.7m', evacuationPriority: 'High', evacuatedPercentage: 40, nearestCamp: 'Sector 14 Shelter (2.4 km)', lastUpdated: '14:10 UTC' },
        { id: 'SET-05', name: 'Greenfields Basti', location: 'West Lowlands Catchment', status: 'Flood Affected', population: 340, households: 75, waterDepth: '1.1m', evacuationPriority: 'Immediate', evacuatedPercentage: 70, nearestCamp: 'South Hills Stadium (2.9 km)', lastUpdated: '13:55 UTC' },
      ],
      metrics: {
        totalSettlements: 5,
        totalPopulation: 2200,
        totalHouseholds: 485,
        immediateEvacuationCount: 3,
      },
    };
  }
}

// 4. Roads
export async function getRoads(status?: string, search?: string) {
  try {
    const params = new URLSearchParams();
    if (status && status !== 'All') params.append('status', status);
    if (search) params.append('search', search);
    const q = params.toString() ? `?${params.toString()}` : '';
    return await fetchApi<{ routes: any[]; metrics: any }>(`/roads${q}`);
  } catch {
    return {
      routes: [
        { id: 'R-01', name: 'Highway 4 Overpass', category: 'Arterial Highway', status: 'Blocked', waterDepth: '1.2m', clearance: 'Impassable', condition: 'Heavy debris accumulation & 1.2m standing water surge', alternativeRoute: 'Northern Ridge Bypass Corridor', lastSurvey: '14:25 UTC' },
        { id: 'R-02', name: 'Bridge Road Crossing', category: 'Bridge Crossing', status: 'Blocked', waterDepth: '1.5m', clearance: 'Impassable', condition: 'Structural safety cordon active due to high river shear flow', alternativeRoute: 'East Levee Causeway', lastSurvey: '14:20 UTC' },
        { id: 'R-03', name: 'Main Street & Sector 12 Junction', category: 'Secondary Road', status: 'Submerged', waterDepth: '0.85m', clearance: 'Impassable', condition: 'Water depth exceeding safe vehicular limit', alternativeRoute: 'Market Link Bypass', lastSurvey: '14:15 UTC' },
        { id: 'R-04', name: 'River Access Way', category: 'Local Street', status: 'Submerged', waterDepth: '1.1m', clearance: 'Impassable', condition: 'Direct overflow from levee embankment breach', alternativeRoute: 'None (Boat extraction active)', lastSurvey: '14:10 UTC' },
        { id: 'R-05', name: 'Sector 14 Arterial Corridor', category: 'Arterial Highway', status: 'Partially Affected', waterDepth: '0.3m', clearance: 'High Clearance (>4x4)', condition: 'Single lane open with police escort; shoulder inundated', alternativeRoute: 'Direct arterial transit', lastSurvey: '13:55 UTC' },
        { id: 'R-06', name: 'North Ring Corridor', category: 'Evacuation Corridor', status: 'Open', waterDepth: '0.0m', clearance: 'All Vehicles', condition: 'Fully dry & clear; designated Primary Safe Evacuation Route', alternativeRoute: 'Primary corridor', lastSurvey: '14:30 UTC' },
      ],
      metrics: {
        overallPercentage: roadAccessibilityData.overallPercentage,
        totalTracked: 6,
        openRoads: roadAccessibilityData.openRoads,
        partiallyAffected: roadAccessibilityData.partiallyAffected,
        submergedRoads: roadAccessibilityData.submergedRoads,
        blockedRoads: roadAccessibilityData.blockedRoads,
      },
    };
  }
}

// 5. Infrastructure
export async function getInfrastructure(status?: string, search?: string) {
  try {
    const params = new URLSearchParams();
    if (status && status !== 'All') params.append('status', status);
    if (search) params.append('search', search);
    const q = params.toString() ? `?${params.toString()}` : '';
    return await fetchApi<{ facilities: any[]; metrics: any }>(`/infrastructure${q}`);
  } catch {
    return {
      facilities: [
        { id: 'B-02', name: 'Bridge B-02 River Crossing', type: 'Bridge', location: 'Sector 12 River Crossing', status: 'Risk Detected', structuralIntegrity: 'Critical (60%)', waterLevel: '1.8m (Pier Submerged)', backupPower: 'Solar Active', detail: 'Structural Risk Detected · Flow Shear 12,000 m³/s impacting central pier foundation', actionTaken: 'Vehicular traffic cordoned; drone structural sensor active', lastInspection: '14:25 UTC' },
        { id: 'H-01', name: 'Hospital H-01 Regional Center', type: 'Hospital', location: 'Sector 12 East Medical Corridor', status: 'Accessible', structuralIntegrity: 'Nominal (100%)', waterLevel: '0.0m (Dry perimeter)', backupPower: 'Grid Online', detail: 'Fully Accessible · 120 Bed Trauma Care & ICU completely operational', actionTaken: 'Designated primary casualty intake facility', lastInspection: '14:30 UTC' },
        { id: 'G-03', name: 'Government Building G-03', type: 'Government Building', location: 'Civic Administrative Center', status: 'Flood Affected', structuralIntegrity: 'Monitored (85%)', waterLevel: '0.4m Ingress', backupPower: 'Generator 100%', detail: 'Ground Floor Water Ingress (0.4m); records moved to upper floors', actionTaken: 'Temporary field ops shifted to Sector 14 HQ', lastInspection: '14:15 UTC' },
        { id: 'PS-01', name: 'Substation Sub-04 Grid', type: 'Power Station', location: 'Sector 14 Grid Corridor', status: 'Risk Detected', structuralIntegrity: 'Monitored (85%)', waterLevel: '0.5m Perimeter', backupPower: 'Battery Offline', detail: 'Telemetry offline · Flood barrier sandbags deployed around transformer bays', actionTaken: 'Power diverted via Sector 10 redundancy feeder', lastInspection: '14:00 UTC' },
      ],
      metrics: {
        totalTracked: 4,
        accessibleCount: 1,
        riskCount: 2,
        floodedCount: 1,
      },
    };
  }
}

// 6. Map Layers
export async function getMapLayers() {
  try {
    return await fetchApi<any>('/map/layers');
  } catch {
    return null;
  }
}

// 7. Missions
export async function getMissions() {
  try {
    return await fetchApi<any[]>('/missions');
  } catch {
    return [
      { id: 'MISSION-DRONE-001', droneId: 'DRONE-001', targetArea: 'KIIT Campus 6 & Patia Basin', status: 'Active', batteryPct: 84, altitudeM: 120, speedKmh: 45, latitude: 20.3529, longitude: 85.8202, signalQuality: 92, flightMode: 'AUTONOMOUS RECON' },
      { id: 'MISSION-DRONE-002', droneId: 'DRONE-002', targetArea: 'Sikharchandi Grid', status: 'Standby', batteryPct: 98, altitudeM: 0, speedKmh: 0, latitude: 20.3570, longitude: 85.8235, signalQuality: 98, flightMode: 'READY FOR DISPATCH' },
    ];
  }
}

// 8. Detections & Live Video Stream
export async function getLatestDetections() {
  try {
    return await fetchApi<any>('/detections/latest');
  } catch {
    return null;
  }
}

export async function triggerAiInference(payload?: { missionId?: string; scanType?: string }) {
  return await fetchApi<any>('/detections/analyze', {
    method: 'POST',
    body: JSON.stringify(payload || { missionId: 'MISSION-DRONE-001' }),
  });
}

export async function analyzeFrame(imageBase64: string) {
  return await fetchApi<any>('/analysis/frame', {
    method: 'POST',
    body: JSON.stringify({ imageBase64 }),
  });
}

export async function processVideoFile(file: File) {
  const formData = new FormData();
  formData.append('video', file);

  const cleanEndpoint = '/analysis/process-video';
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    let errMsg = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson?.error) errMsg = errJson.error;
    } catch {}
    throw new Error(errMsg);
  }

  const json = await res.json();
  return json.data;
}

export async function startVideoStream(videoPath?: string) {
  return await fetchApi<any>('/stream/start', {
    method: 'POST',
    body: JSON.stringify({ videoPath }),
  });
}

export async function uploadAndStartStream(file: File) {
  const formData = new FormData();
  formData.append('video', file);

  const cleanEndpoint = '/stream/upload';
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    let errMsg = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson?.error) errMsg = errJson.error;
    } catch {}
    throw new Error(errMsg);
  }

  const json = await res.json();
  return json.data;
}

export async function stopVideoStream() {
  return await fetchApi<any>('/stream/stop', {
    method: 'DELETE',
  });
}

export async function getStreamStatus() {
  try {
    return await fetchApi<any>('/stream/status');
  } catch {
    return { active: false };
  }
}

// 9. Field Units
export async function getFieldUnits() {
  try {
    return await fetchApi<{ units: any[]; activeDeployed: number }>('/units');
  } catch {
    return {
      units: [
        { id: 'U-01', name: 'NDRF Team Alpha', type: 'Special Rescue Squad', location: 'Sector 12 (North)', status: 'En Route', personnel: 8 },
        { id: 'U-02', name: 'Boat Unit 03', type: 'Zodiac Swiftwater', location: 'Riverbend District', status: 'On Site', personnel: 4 },
        { id: 'U-03', name: 'Medical Response 1', type: 'Paramedic Mobile', location: 'Camp Bravo Base', status: 'Available', personnel: 6 },
        { id: 'U-04', name: 'Air Recon Wing 2', type: 'Drone & Helicopter Hub', location: 'Sector 4 Airfield', status: 'On Site', personnel: 5 },
      ],
      activeDeployed: 4,
    };
  }
}

// 10. Incidents
export async function getIncidents(search?: string, severity?: string, status?: string) {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (severity && severity !== 'All') params.append('severity', severity);
    if (status && status !== 'All') params.append('status', status);
    const q = params.toString() ? `?${params.toString()}` : '';
    return await fetchApi<{ incidents: any[]; pagination: any; metrics: any }>(`/incidents${q}`);
  } catch {
    return {
      incidents: [
        { id: 'INC-2023-1027-01', date: '2023-10-27 14:45 UTC', sector: 'Sector 12 (North Riverbank)', type: 'Flash Flood & Breach', severity: 'Critical', victims: 7, status: 'Under Action' },
        { id: 'INC-2023-1027-02', date: '2023-10-27 12:15 UTC', sector: 'Highway 4 Overpass', type: 'Submerged Arterial Road', severity: 'Warning', victims: 0, status: 'Under Action' },
        { id: 'INC-2023-1026-08', date: '2023-10-26 19:30 UTC', sector: 'Sector 14 Residential Block', type: 'Power Grid Failure & Flooding', severity: 'Warning', victims: 12, status: 'Resolved' },
        { id: 'INC-2023-1026-05', date: '2023-10-26 10:00 UTC', sector: 'East River Dam Approach', type: 'Levee Seepage Risk', severity: 'Moderate', victims: 0, status: 'Archived' },
      ],
      pagination: { total: 4, page: 1, totalPages: 1 },
      metrics: { activeUnderAction: 2, criticalSeverity: 1 },
    };
  }
}

// 11. Relief Camps
export async function getReliefCamps(search?: string, status?: string) {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status && status !== 'all') params.append('status', status);
    const q = params.toString() ? `?${params.toString()}` : '';
    return await fetchApi<{ camps: any[]; metrics: any }>(`/camps${q}`);
  } catch {
    return {
      camps: [
        { id: 'camp-1', name: 'Sector 14 Shelter', location: 'North District School', status: 'Critical', occupancy: 950, capacity: 1000, foodDays: '1 Day', foodCritical: true, waterDays: '2 Days', waterCritical: true, medsStatus: 'Low', personnel: 24 },
        { id: 'camp-2', name: 'Riverside High School', location: 'West Bank Zone', status: 'Warning', occupancy: 410, capacity: 500, foodDays: '5 Days', waterDays: '4 Days', medsStatus: 'Ok', personnel: 12 },
        { id: 'camp-3', name: 'Camp Bravo', location: 'South Hills Stadium', status: 'Stable', occupancy: 450, capacity: 1000, foodDays: '10+ Days', waterDays: '10+ Days', medsStatus: 'Ok', personnel: 30 },
      ],
      metrics: { totalCamps: 3, totalOccupancy: 1810, totalCapacity: 2500, capacityUtilizationPct: 72, criticalCampsCount: 1 },
    };
  }
}

// 12. Alerts
export async function getAlerts(severity?: string) {
  try {
    const q = severity && severity !== 'all' ? `?severity=${severity}` : '';
    return await fetchApi<{ alerts: any[]; activeCritical: number }>(`/alerts${q}`);
  } catch {
    return {
      alerts: [
        { id: 'ALT-1092', title: 'Flash Flood Warning - Evacuate Zone 4', severity: 'Critical', area: 'Lower Basin / Sectors 11-14', time: '14:15 UTC', reach: '12,450 / 15,000 Recipients', body: 'Immediate evacuation order issued for all residents within 500m of Lower Basin Riverbank due to rapid water surge.' },
        { id: 'ALT-1091', title: 'Road Inundation Advisory', severity: 'Warning', area: 'Sector 4 Highway Overpass', time: '13:40 UTC', reach: '3,200 / 3,500 Recipients', body: 'Highway 4 impassable due to 1.2m water level. Heavy vehicular traffic diverted to Northern Ridge Bypass.' },
        { id: 'ALT-1090', title: 'Water & Ration Supply Restored', severity: 'Info', area: 'Camp Alpha Primary Shelter', time: '11:20 UTC', reach: '800 / 800 Recipients', body: 'Fresh potable drinking water and emergency ration distribution is now active at Sector 14 Shelter.' },
      ],
      activeCritical: 1,
    };
  }
}

export async function broadcastAlert(data: { title: string; severity: string; area: string; body: string }) {
  return await fetchApi<any>('/alerts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createReliefCamp(data: {
  name: string;
  location: string;
  capacity: number;
  occupancy?: number;
  foodDays?: string;
  waterDays?: string;
  medsStatus?: string;
  personnel?: number;
}) {
  return await fetchApi<any>('/camps', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateReliefCamp(id: string, data: any) {
  return await fetchApi<any>(`/camps/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deployFieldUnit(data: {
  name: string;
  type: string;
  location: string;
  personnel: number;
  status?: string;
  assignedIncidentId?: string;
}) {
  return await fetchApi<any>('/units', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateFieldUnitStatus(id: string, data: { status?: string; location?: string }) {
  return await fetchApi<any>(`/units/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export interface DroneMissionItem {
  id: string;
  createdAt: string | Date;
  droneId: string;
  targetArea: string;
  status: string;
  batteryPct: number;
  altitudeM: number;
  speedKmh: number;
  latitude: number;
  longitude: number;
  signalQuality: number;
  flightMode: string;
}

export async function getDroneMissions(): Promise<DroneMissionItem[]> {
  try {
    return await fetchApi<DroneMissionItem[]>('/missions');
  } catch (err) {
    console.warn('Failed to fetch missions:', err);
    return [];
  }
}

export async function createDroneMission(data: {
  droneId: string;
  targetArea: string;
  altitudeM?: number;
  speedKmh?: number;
  flightMode?: string;
  status?: string;
}) {
  return await fetchApi<DroneMissionItem>('/missions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateDroneMission(id: string, data: Partial<DroneMissionItem>): Promise<DroneMissionItem> {
  return await fetchApi<DroneMissionItem>(`/missions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteDroneMission(id: string): Promise<boolean> {
  await fetchApi<any>(`/missions/${id}`, {
    method: 'DELETE',
  });
  return true;
}

export async function createIncident(data: {
  sector: string;
  type: string;
  severity: string;
  victims?: number;
  status?: string;
}) {
  return await fetchApi<any>('/incidents', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// 13. Flood Progression Timeline
export async function getFloodProgressionTimeline(): Promise<ProgressionStep[]> {
  try {
    return await fetchApi<ProgressionStep[]>('/flood-analysis/timeline');
  } catch {
    return progressionTimeline;
  }
}
// 14. Assessment Report
export async function getAssessmentReportCurrent() {
  try {
    return await fetchApi<any>('/report/current');
  } catch {
    return {
      sector: 'Sector 12',
      generatedAt: '2023-10-27 14:45 UTC',
      source: 'Aerial Drone Telemetry & GIS Mesh',
      parameters: [
        { name: 'Area', value: 'Sector 12' },
        { name: 'Water Coverage', value: '68%' },
        { name: 'Water Spread', value: 'Increasing (South-East, +13%)' },
        { name: 'Affected Settlements', value: '5 Settlements Inundated' },
        { name: 'Victims Detected', value: '7' },
        { name: 'Road Blockage', value: '2 Major Routes (Highway 4, Bridge Rd)' },
        { name: 'Submerged Roads', value: '3 Intersections (>0.8m Depth)' },
        { name: 'Road Accessibility', value: '62% Passable (12 Open)' },
        { name: 'Infrastructure Impact', value: '4 Monitored Facilities' },
        { name: 'Bridge Status', value: 'Risk Detected (Bridge B-02)' },
        { name: 'Nearest Relief Camp', value: 'Camp A (2.4 km)' },
        { name: 'Boats Available', value: '2 Active Units Ready for Dispatch' },
      ],
    };
  }
}

// 15. Local Media Library (Photos & Videos)
export interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  mediaType: 'image' | 'video';
  fileSize: number;
  filePath: string;
  url: string;
  uploadedAt: string | Date;
  sector: string;
  waterCoverage?: number;
  victimsCount?: number;
}

export async function uploadMediaFile(
  file: File,
  meta?: { sector?: string; waterCoverage?: number; victimsCount?: number }
): Promise<MediaItem> {
  const formData = new FormData();
  formData.append('file', file);
  if (meta?.sector) formData.append('sector', meta.sector);
  if (meta?.waterCoverage !== undefined) formData.append('waterCoverage', String(meta.waterCoverage));
  if (meta?.victimsCount !== undefined) formData.append('victimsCount', String(meta.victimsCount));

  const res = await fetch(`${API_BASE_URL}/media/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Media upload failed with status ${res.status}`);
  }

  const json = await res.json();
  return json.data;
}

export async function getMediaFiles(): Promise<MediaItem[]> {
  try {
    const res = await fetchApi<MediaItem[]>('/media');
    return res;
  } catch (err) {
    console.warn('Failed to fetch media from backend:', err);
    return [];
  }
}

export async function deleteMediaFile(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/media/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(`Failed to delete media with status ${res.status}`);
  }
  return true;
}
