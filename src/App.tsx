import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { applyTheme, useUI } from '@/stores/ui'
import { useSession } from '@/stores/session'
import { useData } from '@/stores/data'
import { useConsumer } from '@/stores/consumer'
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
import { ConsumerAuth } from '@/features/pet/ConsumerAuth'
import { ConsumerHome } from '@/features/pet/ConsumerHome'
import { Discover } from '@/features/pet/Discover'
import { StoreDetail } from '@/features/pet/StoreDetail'
import { MyBookings } from '@/features/pet/MyBookings'
import { ConsumerMore } from '@/features/pet/ConsumerMore'

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

  // Restore Supabase session once on load (operator + consumer).
  const initSession = useSession((s) => s.init)
  const initConsumer = useConsumer((s) => s.init)
  useEffect(() => {
    void initSession()
    void initConsumer()
  }, [initSession, initConsumer])

  // Hydrate the store from Supabase for the signed-in store; reset on logout.
  const storeId = useSession((s) => s.user?.storeId)
  useEffect(() => {
    if (storeId) void useData.getState().hydrate(storeId)
    else useData.getState().reset()
  }, [storeId])

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

          {/* Consumer (보호자) marketplace */}
          <Route path="/pet/login" element={<ConsumerAuth />} />
          <Route path="/pet" element={<PetShell />}>
            <Route index element={<ConsumerHome />} />
            <Route path="discover" element={<Discover />} />
            <Route path="store/:id" element={<StoreDetail />} />
            <Route path="bookings" element={<MyBookings />} />
            <Route path="more" element={<ConsumerMore />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
