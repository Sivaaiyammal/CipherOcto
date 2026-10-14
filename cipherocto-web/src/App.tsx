import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AppLayout } from '@/components/layout/app-layout'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppsProvider } from '@/data/apps-provider'
import AppDetailPage from '@/pages/apps/app-detail'
import AppsPage from '@/pages/apps'
import DashboardPage from '@/pages/dashboard'
import PlaceholderPage from '@/pages/placeholder'

function App() {
  return (
    <TooltipProvider>
      <AppsProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="apps" element={<AppsPage />} />
              <Route path="apps/:appId" element={<AppDetailPage />} />
              <Route path="*" element={<PlaceholderPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppsProvider>
    </TooltipProvider>
  )
}

export default App
