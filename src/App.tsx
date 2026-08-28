import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { DetectionProvider } from './context/DetectionContext';
import { AuthModal } from './components/AuthModal';

import { Layout } from './components/Layout';
import { OperationalDashboard } from './pages/OperationalDashboard';
import { FloodMapIntelligence } from './pages/FloodMapIntelligence';
import { DroneMissionControl } from './pages/DroneMissionControl';
import { DetectionAnalysisWorkspace } from './pages/DetectionAnalysisWorkspace';
import { FloodReport } from './pages/FloodReport';

import { WaterCoverage } from './pages/WaterCoverage';
import { AffectedSettlements } from './pages/AffectedSettlements';
import { RoadAccessibility } from './pages/RoadAccessibility';
import { InfrastructureImpact } from './pages/InfrastructureImpact';

// Google OAuth Client ID
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '999459573398-1o578t19cv5vq9unfv15pr3f9vgpn4i4.apps.googleusercontent.com';

export const App: React.FC = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <DetectionProvider>
          <Router>
            <AuthModal />
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<OperationalDashboard />} />
                <Route path="water-coverage" element={<WaterCoverage />} />
                <Route path="affected-settlements" element={<AffectedSettlements />} />
                <Route path="road-accessibility" element={<RoadAccessibility />} />
                <Route path="infrastructure-impact" element={<InfrastructureImpact />} />
                <Route path="flood-map" element={<FloodMapIntelligence />} />
                <Route path="drone-missions" element={<DroneMissionControl />} />
                <Route path="detection-analysis" element={<DetectionAnalysisWorkspace />} />
                <Route path="flood-report" element={<FloodReport />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Routes>
          </Router>
        </DetectionProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
