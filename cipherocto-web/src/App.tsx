import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { RequireAuth } from '@/components/auth/require-auth'
import { RequirePermission } from '@/components/auth/require-permission'
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
                  <Route element={<RequirePermission permission="dashboard:read" />}>
                    <Route index element={<DashboardPage />} />
                  </Route>
                  <Route element={<RequirePermission permission="apps:read" />}>
                    <Route path="apps" element={<AppsPage />} />
                    <Route path="apps/:appId" element={<AppDetailPage />} />
                  </Route>
                  <Route element={<RequirePermission permission="apps:write" />}>
                    <Route path="apps/new" element={<RegisterAppPage />} />
                  </Route>
                  <Route element={<RequirePermission permission="config:read" />}>
                    <Route path="remote-config" element={<RemoteConfigPage />} />
                  </Route>
                  <Route element={<RequirePermission permission="subscriptions:read" />}>
                    <Route path="subscriptions" element={<SubscriptionsPage />} />
                  </Route>
                  <Route element={<RequirePermission permission="finance:read" />}>
                    <Route path="finance" element={<FinancePage />} />
                  </Route>
                  <Route element={<RequirePermission permission="analytics:read" />}>
                    <Route path="analytics" element={<AnalyticsPage />} />
                  </Route>
                  <Route element={<RequirePermission permission="projects:read" />}>
                    <Route path="projects" element={<ProjectsPage />} />
                  </Route>
                  <Route element={<RequirePermission permission="team:read" />}>
                    <Route path="team" element={<TeamPage />} />
                  </Route>
                  <Route element={<RequirePermission permission="releases:read" />}>
                    <Route path="releases" element={<ReleasesPage />} />
                  </Route>
                  <Route element={<RequirePermission permission="integrations:read" />}>
                    <Route path="integrations" element={<IntegrationsPage />} />
                  </Route>
                  <Route element={<RequirePermission permission="settings:manage" />}>
                    <Route path="settings" element={<PlaceholderPage />} />
                  </Route>
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
