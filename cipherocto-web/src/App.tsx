import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { RequireAuth } from '@/components/auth/require-auth'
import { AppLayout } from '@/components/layout/app-layout'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppsProvider } from '@/data/apps-provider'
import { AuthProvider } from '@/data/auth-provider'
import AnalyticsPage from '@/pages/analytics'
import AppDetailPage from '@/pages/apps/app-detail'
import AppsPage from '@/pages/apps'
import RegisterAppPage from '@/pages/apps/register'
import ProjectsPage from '@/pages/projects'
import DashboardPage from '@/pages/dashboard'
import FinancePage from '@/pages/finance'
import IntegrationsPage from '@/pages/integrations'
import LoginPage from '@/pages/login'
import PlaceholderPage from '@/pages/placeholder'
import ReleasesPage from '@/pages/releases'
import RemoteConfigPage from '@/pages/remote-config'
import TeamPage from '@/pages/team'
import SubscriptionsPage from '@/pages/subscriptions'

function App() {
  return (
    <TooltipProvider>
      <AuthProvider>
        <AppsProvider>
          <BrowserRouter>
            <Routes>
              <Route path="login" element={<LoginPage />} />
              <Route element={<RequireAuth />}>
                <Route element={<AppLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="apps" element={<AppsPage />} />
                  <Route path="apps/new" element={<RegisterAppPage />} />
                  <Route path="apps/:appId" element={<AppDetailPage />} />
                  <Route path="remote-config" element={<RemoteConfigPage />} />
                  <Route path="subscriptions" element={<SubscriptionsPage />} />
                  <Route path="finance" element={<FinancePage />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="projects" element={<ProjectsPage />} />
                  <Route path="team" element={<TeamPage />} />
                  <Route path="releases" element={<ReleasesPage />} />
                  <Route path="integrations" element={<IntegrationsPage />} />
                  <Route path="*" element={<PlaceholderPage />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </AppsProvider>
      </AuthProvider>
    </TooltipProvider>
  )
}

export default App
