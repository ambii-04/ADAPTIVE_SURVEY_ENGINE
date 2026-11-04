import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ApiConfigProvider } from './context/ApiConfigContext';
import { ToastProvider } from './lib/toast';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { ResearchListPage } from './pages/ResearchListPage';
import { CreateResearchPage } from './pages/CreateResearchPage';
import { ResearchOverviewPage } from './pages/ResearchOverviewPage';
import { SurveySetupPage } from './pages/SurveySetupPage';
import { ResearchAnalyticsPage } from './pages/ResearchAnalyticsPage';
import { SessionReportPage } from './pages/SessionReportPage';
import { SessionInsightsPage } from './pages/SessionInsightsPage';
import { RespondentFramePage } from './pages/RespondentFramePage';
import { SignInPage } from './pages/SignInPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ApiConfigProvider>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Respondent Survey (No Admin Layout, No Login Required) */}
                <Route path="/s/:researchId" element={<RespondentFramePage />} />

                {/* Authentication Page */}
                <Route path="/signin" element={<SignInPage />} />

                {/* Private Owner Interface (Protected by Route Guard) */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="research" element={<ResearchListPage />} />
                  <Route path="research/new" element={<CreateResearchPage />} />
                  <Route path="research/:researchId" element={<ResearchOverviewPage />} />
                  <Route path="research/:researchId/survey" element={<SurveySetupPage />} />
                  <Route path="research/:researchId/analytics" element={<ResearchAnalyticsPage />} />
                  <Route path="research/:researchId/sessions/:sessionId" element={<SessionReportPage />} />
                  <Route path="research/:researchId/sessions/:sessionId/insights" element={<SessionInsightsPage />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </ApiConfigProvider>
    </QueryClientProvider>
  );
}
