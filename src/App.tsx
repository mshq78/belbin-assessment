import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AssessmentProvider, useAssessment } from './context/AssessmentContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PageShell } from './components/PageShell';
import { DevToolbar } from './components/DevToolbar';
import { LoadingSkeleton } from './components/StateViews';
import { auth } from './services/auth';

// Feature Views
import { StartScreen } from './features/start/StartScreen';
import { SectionAView } from './features/sectionA/SectionAView';
import { BreakScreen } from './features/break/BreakScreen';
import { SectionBView } from './features/sectionB/SectionBView';
import { SectionCView } from './features/sectionC/SectionCView';
import { ReviewScreen } from './features/review/ReviewScreen';
import { RevealScreen } from './features/reveal/RevealScreen';

// Lazy-loaded Views
const ReportView = lazy(() =>
  import('./features/report/ReportView').then((m) => ({ default: m.ReportView }))
);
const AdminView = lazy(() =>
  import('./features/admin/AdminView').then((m) => ({ default: m.AdminView }))
);

const AppRoutes: React.FC = () => {
  const location = useLocation();
  const { indexA, indexB, indexC } = useAssessment();
  const [loggedIn, setLoggedIn] = React.useState(!!auth.getUser());
  React.useEffect(() => auth.subscribe((u) => setLoggedIn(!!u)), []);

  // Everything except the login/start page and the admin panel requires a logged-in user
  if (!loggedIn && location.pathname !== '/' && location.pathname !== '/admin') {
    return <Navigate to="/" replace />;
  }

  // Determine current step index for the progress bar
  let currentStepIndex = 0;
  let showProgress = false;

  if (location.pathname === '/section-a') {
    showProgress = true;
    currentStepIndex = indexA;
  } else if (location.pathname === '/break') {
    showProgress = false;
    currentStepIndex = 18;
  } else if (location.pathname === '/section-b') {
    showProgress = true;
    currentStepIndex = 18 + indexB;
  } else if (location.pathname === '/section-c') {
    showProgress = true;
    currentStepIndex = 27 + indexC;
  }

  // Admin and reveal routes have special minimal shells
  if (location.pathname === '/reveal') {
    return <RevealScreen />;
  }

  return (
    <PageShell
      showProgress={showProgress}
      currentStepIndex={currentStepIndex}
      totalSteps={30}
      compactHeader={location.pathname === '/admin' || location.pathname === '/report'}
    >
      <Suspense fallback={<LoadingSkeleton lines={5} />}>
        <Routes>
          <Route path="/" element={<StartScreen />} />
          <Route path="/section-a" element={<SectionAView />} />
          <Route path="/break" element={<BreakScreen />} />
          <Route path="/section-b" element={<SectionBView />} />
          <Route path="/section-c" element={<SectionCView />} />
          <Route path="/review" element={<ReviewScreen />} />
          <Route path="/report" element={<ReportView />} />
          <Route path="/admin" element={<AdminView />} />
          <Route path="*" element={<StartScreen />} />
        </Routes>
      </Suspense>
      <DevToolbar />
    </PageShell>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <AssessmentProvider>
          <AppRoutes />
        </AssessmentProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}
