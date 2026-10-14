import { TooltipProvider } from '@/components/ui/tooltip'
import DashboardPage from '@/pages/dashboard'

function App() {
  return (
    <TooltipProvider>
      <DashboardPage />
    </TooltipProvider>
  )
}

export default App
