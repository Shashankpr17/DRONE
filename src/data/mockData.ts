export interface Settlement {
  id: string;
  name: string;
  location: string;
  status: 'Flood Affected' | 'Partially Submerged' | 'Safe' | 'Inaccessible';
  population: number;
  coordinates: { top: string; left: string };
}

export interface InfrastructureItem {
  id: string;
  name: string;
  type: 'Bridge' | 'Hospital' | 'Government Building' | 'Power Station' | 'Clinic';
  location: string;
  status: 'Safe' | 'Accessible' | 'Flood Affected' | 'Risk Detected' | 'Inaccessible';
  detail: string;
  coordinates: { top: string; left: string };
}

export interface RoadAccessibilityData {
  overallPercentage: number;
  openRoads: number;
  partiallyAffected: number;
  submergedRoads: number;
  blockedRoads: number;
  inaccessibleRoads: number;
  routes: Array<{
    id: string;
    name: string;
    status: 'Open' | 'Partially Affected' | 'Submerged' | 'Blocked' | 'Inaccessible';
    condition: string;
  }>;
}

export interface WaterSpreadData {
  coveragePercentage: number;
  trend: 'Increasing' | 'Decreasing' | 'Stable';
  direction: string;
  changeSincePreviousSurvey: string;
  peakHeight: string;
  flowVelocity: string;
}

export interface ProgressionStep {
  time: string;
  waterCoverage: number;
  spreadTrend: string;
  spreadDirection: string;
  changeRate: string;
  affectedSettlements: number;
  roadAccessibility: number;
  openRoads: number;
  submergedRoads: number;
}

export const settlementsData: Settlement[] = [
  {
    id: 'SET-01',
    name: 'Campus 6 Hostel Block',
    location: 'KIIT Campus 6 North',
    status: 'Flood Affected',
    population: 620,
    coordinates: { top: '34%', left: '46%' },
  },
  {
    id: 'SET-02',
    name: 'Patia Square Residential',
    location: 'Patia Junction East',
    status: 'Partially Submerged',
    population: 450,
    coordinates: { top: '56%', left: '50%' },
  },
  {
    id: 'SET-03',
    name: 'Sikharchandi Foothills',
    location: 'Sikharchandi Area',
    status: 'Flood Affected',
    population: 280,
    coordinates: { top: '42%', left: '68%' },
  },
  {
    id: 'SET-04',
    name: 'Infocity Colony',
    location: 'Infocity Avenue Sector',
    status: 'Partially Submerged',
    population: 510,
    coordinates: { top: '48%', left: '38%' },
  },
  {
    id: 'SET-05',
    name: 'Nandankanan Enclave',
    location: 'West Lowlands Basin',
    status: 'Flood Affected',
    population: 340,
    coordinates: { top: '65%', left: '32%' },
  },
];

export const infrastructureData: InfrastructureItem[] = [
  {
    id: 'B-02',
    name: 'Patia Railway Overbridge B-02',
    type: 'Bridge',
    location: 'Patia Station Crossing',
    status: 'Risk Detected',
    detail: 'High Water Level at Drainage Culverts · Flow Shear 12k m³/s',
    coordinates: { top: '40%', left: '45%' },
  },
  {
    id: 'H-01',
    name: 'KIMS Super Specialty Hospital',
    type: 'Hospital',
    location: 'KIMS Medical Campus',
    status: 'Accessible',
    detail: 'Fully Accessible · Primary Emergency & Trauma Hub',
    coordinates: { top: '30%', left: '72%' },
  },
  {
    id: 'G-03',
    name: 'KIIT Convention Center Relief Hub',
    type: 'Government Building',
    location: 'Campus 6 Central Complex',
    status: 'Flood Affected',
    detail: 'Relief Hub Operational · Ground Floor Sandbagged',
    coordinates: { top: '52%', left: '42%' },
  },
  {
    id: 'PS-01',
    name: 'KIIT Substation Sub-04',
    type: 'Power Station',
    location: 'Patia Power Grid',
    status: 'Risk Detected',
    detail: 'Substation Water Ingress · Emergency Drainage Active',
    coordinates: { top: '62%', left: '60%' },
  },
];

export const roadAccessibilityData: RoadAccessibilityData = {
  overallPercentage: 62,
  openRoads: 12,
  partiallyAffected: 4,
  submergedRoads: 3,
  blockedRoads: 2,
  inaccessibleRoads: 1,
  routes: [
    { id: 'R-01', name: 'Nandankanan Main Road', status: 'Blocked', condition: 'Waterlogged & Inaccessible (1.6m Water Depth)' },
    { id: 'R-02', name: 'Campus 6 Internal Link', status: 'Blocked', condition: 'Submerged road · Sandbag cordon active' },
    { id: 'R-03', name: 'Patia Square Intersection', status: 'Submerged', condition: 'Water depth >0.85m' },
    { id: 'R-04', name: 'Infocity Road Way', status: 'Submerged', condition: 'Water depth >1.1m' },
    { id: 'R-05', name: 'KIIT Road Arterial', status: 'Partially Affected', condition: 'Passable with high clearance rescue vehicles' },
    { id: 'R-06', name: 'Sikharchandi Evacuation Route', status: 'Open', condition: 'Designated primary safe evacuation route to high ground' },
  ],
};

export const waterSpreadData: WaterSpreadData = {
  coveragePercentage: 68,
  trend: 'Increasing',
  direction: 'South-East',
  changeSincePreviousSurvey: '+13%',
  peakHeight: '3.2m',
  flowVelocity: '1.8 m/s',
};

export const progressionTimeline: ProgressionStep[] = [
  {
    time: '10:00 AM',
    waterCoverage: 42,
    spreadTrend: 'Stable',
    spreadDirection: 'South-East',
    changeRate: '+4%',
    affectedSettlements: 2,
    roadAccessibility: 78,
    openRoads: 16,
    submergedRoads: 1,
  },
  {
    time: '12:00 PM',
    waterCoverage: 55,
    spreadTrend: 'Increasing',
    spreadDirection: 'South-East',
    changeRate: '+8%',
    affectedSettlements: 3,
    roadAccessibility: 70,
    openRoads: 14,
    submergedRoads: 2,
  },
  {
    time: '02:00 PM',
    waterCoverage: 68,
    spreadTrend: 'Increasing',
    spreadDirection: 'South-East',
    changeRate: '+13%',
    affectedSettlements: 5,
    roadAccessibility: 62,
    openRoads: 12,
    submergedRoads: 3,
  },
  {
    time: '04:00 PM (Forecast)',
    waterCoverage: 74,
    spreadTrend: 'Increasing',
    spreadDirection: 'South-East',
    changeRate: '+6%',
    affectedSettlements: 6,
    roadAccessibility: 54,
    openRoads: 10,
    submergedRoads: 5,
  },
];
