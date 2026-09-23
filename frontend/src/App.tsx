import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './stores/authStore';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { CommandPalette } from './components/CommandPalette';
import { PageLoader } from './components/PageLoader';

// Lazy Loaded Pages for Optimized Performance & Code Splitting
const LandingPage = lazy(() => import('./pages/public/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./pages/public/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/public/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ApiDocsPage = lazy(() => import('./pages/public/ApiDocsPage').then(m => ({ default: m.ApiDocsPage })));
const HostedCheckout = lazy(() => import('./pages/HostedCheckout').then(m => ({ default: m.HostedCheckout })));

const DashboardOverview = lazy(() => import('./pages/merchant/DashboardOverview').then(m => ({ default: m.DashboardOverview })));
const PaymentsList = lazy(() => import('./pages/merchant/PaymentsList').then(m => ({ default: m.PaymentsList })));
const TransactionsLedger = lazy(() => import('./pages/merchant/TransactionsLedger').then(m => ({ default: m.TransactionsLedger })));
const CustomersView = lazy(() => import('./pages/merchant/CustomersView').then(m => ({ default: m.CustomersView })));
const InvoicesList = lazy(() => import('./pages/merchant/InvoicesList').then(m => ({ default: m.InvoicesList })));
const PaymentLinksView = lazy(() => import('./pages/merchant/PaymentLinksView').then(m => ({ default: m.PaymentLinksView })));
const DisputesList = lazy(() => import('./pages/merchant/DisputesList').then(m => ({ default: m.DisputesList })));
const SubscriptionsView = lazy(() => import('./pages/merchant/SubscriptionsView').then(m => ({ default: m.SubscriptionsView })));
const PayoutsView = lazy(() => import('./pages/merchant/PayoutsView').then(m => ({ default: m.PayoutsView })));
const CheckoutSessionsView = lazy(() => import('./pages/merchant/CheckoutSessionsView').then(m => ({ default: m.CheckoutSessionsView })));
const APIKeysView = lazy(() => import('./pages/merchant/APIKeysView').then(m => ({ default: m.APIKeysView })));
const WebhooksView = lazy(() => import('./pages/merchant/WebhooksView').then(m => ({ default: m.WebhooksView })));
const DeveloperSimulatorView = lazy(() => import('./pages/merchant/DeveloperSimulatorView').then(m => ({ default: m.DeveloperSimulatorView })));
const MerchantOnboardingView = lazy(() => import('./pages/merchant/MerchantOnboardingView').then(m => ({ default: m.MerchantOnboardingView })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

export const App: React.FC = () => {
  const { user, merchant, loading, login, logout, refreshMerchant } = useAuth();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  if (loading) {
    return <PageLoader text="Initializing PAYCORE financial stack..." />;
  }

  return (
    <Router>
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />

      <Suspense fallback={<PageLoader text="Loading interface module..." />}>
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
                <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
                  <Sidebar
                    role={user.role}
                    onboardingStep={merchant?.onboarding_step}
                    isOpen={isMobileSidebarOpen}
                    onClose={() => setIsMobileSidebarOpen(false)}
                  />
                  <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                    <Navbar
                      user={user}
                      merchant={merchant}
                      onLogout={logout}
                      onRefreshMerchant={refreshMerchant}
                      onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
                      onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
                    />
                    <main className="flex-1">
                      <Routes>
                        <Route path="/" element={<DashboardOverview />} />
                        <Route path="/overview" element={<DashboardOverview />} />
                        <Route path="/payments" element={<PaymentsList />} />
                        <Route path="/transactions" element={<TransactionsLedger />} />
                        <Route path="/balances" element={<TransactionsLedger />} />
                        <Route path="/customers" element={<CustomersView />} />
                        <Route path="/invoices" element={<InvoicesList />} />
                        <Route path="/payment-links" element={<PaymentLinksView />} />
                        <Route path="/disputes" element={<DisputesList />} />
                        <Route path="/subscriptions" element={<SubscriptionsView />} />
                        <Route path="/payouts" element={<PayoutsView />} />
                        <Route path="/refunds" element={<PaymentsList />} />
                        <Route path="/checkout-sessions" element={<CheckoutSessionsView />} />
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
                <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
                  <Sidebar
                    role="PLATFORM_ADMIN"
                    isOpen={isMobileSidebarOpen}
                    onClose={() => setIsMobileSidebarOpen(false)}
                  />
                  <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                    <Navbar
                      user={user}
                      merchant={merchant}
                      onLogout={logout}
                      onRefreshMerchant={refreshMerchant}
                      onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
                      onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
                    />
                    <main className="flex-1">
                      <Routes>
                        <Route path="/" element={<AdminDashboard />} />
                        <Route path="/disputes" element={<DisputesList />} />
                        <Route path="/payouts" element={<PayoutsView />} />
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
      </Suspense>
    </Router>
  );
};

export default App;
