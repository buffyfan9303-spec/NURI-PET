import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { applyTheme, useUI } from '@/stores/ui'
import { Landing } from '@/app/Landing'
import { OperatorShell } from '@/app/operator/OperatorShell'
import { PetShell } from '@/app/pet/PetShell'
import { CommandPalette } from '@/components/CommandPalette/CommandPalette'
import { LoginPage } from '@/features/auth/LoginPage'
import { RequireAuth, RequireOwner } from '@/features/auth/guards'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { CalendarPage } from '@/features/appointments/CalendarPage'
import { CustomersPage } from '@/features/customers/CustomersPage'
import { PaymentsPage } from '@/features/payments/PaymentsPage'
import { BoardingPage } from '@/features/boarding/BoardingPage'
import { StaffPage } from '@/features/staff/StaffPage'
import { MessagesPage } from '@/features/messages/MessagesPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { PetHome } from '@/features/pet/PetHome'
import { PetTrend } from '@/features/pet/PetTrend'
import { PetCare } from '@/features/pet/PetCare'
import { PetMore } from '@/features/pet/PetMore'

const queryClient = new QueryClient()

export default function App() {
  useEffect(() => {
    applyTheme(useUI.getState().theme)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (useUI.getState().theme === 'system') applyTheme('system')
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <CommandPalette />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginPage />} />

          {/* PC operator OS — auth required */}
          <Route element={<RequireAuth />}>
            <Route path="/app" element={<OperatorShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="appointments" element={<CalendarPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="boarding" element={<BoardingPage />} />
              <Route path="messages" element={<MessagesPage />} />
              {/* owner-only */}
              <Route element={<RequireOwner />}>
                <Route path="staff" element={<StaffPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Route>
          </Route>

          {/* Mobile owner app */}
          <Route path="/pet" element={<PetShell />}>
            <Route index element={<PetHome />} />
            <Route path="trend" element={<PetTrend />} />
            <Route path="care" element={<PetCare />} />
            <Route path="more" element={<PetMore />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
