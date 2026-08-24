import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './stores/authStore';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { CommandPalette } from './components/CommandPalette';

import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { ApiDocsPage } from './pages/public/ApiDocsPage';
import { HostedCheckout } from './pages/HostedCheckout';

import { DashboardOverview } from './pages/merchant/DashboardOverview';
import { PaymentsList } from './pages/merchant/PaymentsList';
import { TransactionsLedger } from './pages/merchant/TransactionsLedger';
import { APIKeysView } from './pages/merchant/APIKeysView';
import { WebhooksView } from './pages/merchant/WebhooksView';
import { DeveloperSimulatorView } from './pages/merchant/DeveloperSimulatorView';
import { MerchantOnboardingView } from './pages/merchant/MerchantOnboardingView';
import { AdminDashboard } from './pages/admin/AdminDashboard';

export const App: React.FC = () => {
  const { user, merchant, loading, login, logout, refreshMerchant } = useAuth();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-sm">
        Initializing PAYCORE session...
      </div>
    );
  }

  return (
    <Router>
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage onLoginSuccess={login} />} />
        <Route path="/register" element={<RegisterPage onLoginSuccess={login} />} />
        <Route path="/docs/api" element={<ApiDocsPage />} />
        <Route path="/checkout/:sessionId" element={<HostedCheckout />} />

        {/* Dashboard Layout Routes */}
        <Route
          path="/dashboard/*"
          element={
            user ? (
              <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
                <Sidebar role={user.role} onboardingStep={merchant?.onboarding_step} />
                <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                  <Navbar
                    user={user}
                    merchant={merchant}
                    onLogout={logout}
                    onRefreshMerchant={refreshMerchant}
                    onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
                  />
                  <main className="flex-1">
                    <Routes>
                      <Route path="/" element={<DashboardOverview />} />
                      <Route path="/payments" element={<PaymentsList />} />
                      <Route path="/transactions" element={<TransactionsLedger />} />
                      <Route path="/balances" element={<TransactionsLedger />} />
                      <Route path="/refunds" element={<PaymentsList />} />
                      <Route path="/disputes" element={<PaymentsList />} />
                      <Route path="/invoices" element={<PaymentsList />} />
                      <Route path="/checkout-sessions" element={<PaymentsList />} />
                      <Route path="/customers" element={<PaymentsList />} />
                      <Route path="/api-keys" element={<APIKeysView />} />
                      <Route path="/webhooks" element={<WebhooksView />} />
                      <Route path="/simulator" element={<DeveloperSimulatorView />} />
                      <Route
                        path="/onboarding"
                        element={<MerchantOnboardingView merchant={merchant} onRefresh={refreshMerchant} />}
                      />
                    </Routes>
                  </main>
                </div>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Admin Layout Routes */}
        <Route
          path="/admin/*"
          element={
            user ? (
              <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
                <Sidebar role="PLATFORM_ADMIN" />
                <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                  <Navbar
                    user={user}
                    merchant={merchant}
                    onLogout={logout}
                    onRefreshMerchant={refreshMerchant}
                    onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
                  />
                  <main className="flex-1">
                    <Routes>
                      <Route path="/" element={<AdminDashboard />} />
                      <Route path="/audit-logs" element={<AdminDashboard />} />
                      <Route path="/reconciliation" element={<AdminDashboard />} />
                    </Routes>
                  </main>
                </div>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
