import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { RequireAuth } from '@/components/auth/require-auth'
import { AppLayout } from '@/components/layout/app-layout'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppsProvider } from '@/data/apps-provider'
import { AuthProvider } from '@/data/auth-provider'
import AppDetailPage from '@/pages/apps/app-detail'
import AppsPage from '@/pages/apps'
import RegisterAppPage from '@/pages/apps/register'
import DashboardPage from '@/pages/dashboard'
import LoginPage from '@/pages/login'
import PlaceholderPage from '@/pages/placeholder'

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
