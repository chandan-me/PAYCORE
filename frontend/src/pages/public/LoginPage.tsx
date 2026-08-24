import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertCircle, ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { GoogleAccountChooserModal } from '../../components/GoogleAccountChooserModal';

interface Props {
  onLoginSuccess: (token: string, user: any, merchantId?: string) => void;
}

const formatErrorDetail = (detail: any): string => {
  if (!detail) return 'An error occurred. Please try again.';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d: any) => (typeof d === 'string' ? d : d.msg || JSON.stringify(d))).join(', ');
  }
  if (typeof detail === 'object' && detail.msg) return detail.msg;
  return JSON.stringify(detail);
};

export const LoginPage: React.FC<Props> = ({ onLoginSuccess }) => {
  const [smartInput, setSmartInput] = useState('');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordStep, setShowPasswordStep] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Google Modal State
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpMsg, setOtpMsg] = useState('');

  const navigate = useNavigate();

  const isEmail = smartInput.includes('@');
  const isPhone = /^\+?[0-9\s\-]{8,15}$/.test(smartInput.trim()) && !isEmail;

  useEffect(() => {
    try {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    } catch (e) {
      console.warn('Google GIS script load warning:', e);
    }
  }, []);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartInput.trim()) {
      setError('Please enter a valid email address or mobile phone number.');
      return;
    }
    setError('');

    if (isPhone) {
      handleSendOtp();
    } else {
      setShowPasswordStep(true);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const resp = await api.post('/auth/login', {
        email: smartInput.trim() || 'demo@paycore.io',
        password
      });
      const { access_token, user_id, role, merchant_id } = resp.data;
      onLoginSuccess(access_token, { id: user_id, email: smartInput || 'demo@paycore.io', role }, merchant_id);
      navigate('/dashboard/overview');
    } catch (err: any) {
      setError(formatErrorDetail(err.response?.data?.detail) || 'Invalid login credentials. Please check your password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGoogleAccount = async (account: { name: string; email: string; google_token?: string }) => {
    setShowGoogleModal(false);
    setLoading(true);
    setError('');

    try {
      const resp = await api.post('/auth/google', {
        email: account.email,
        full_name: account.name,
        google_token: account.google_token
      });
      const { access_token, user_id, role, merchant_id } = resp.data;
      // Instant login & redirect to dashboard for Google accounts (no password step needed!)
      onLoginSuccess(access_token, { id: user_id, email: account.email, role }, merchant_id);
      navigate('/dashboard/overview');
    } catch (err: any) {
      console.error('Google Auth backend error:', err);
      setError(formatErrorDetail(err.response?.data?.detail) || 'Google Sign-In failed to connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setError('');
    try {
      const resp = await api.post('/auth/otp/request', { phone_number: smartInput.trim() });
      setOtpMsg(resp.data.message || `6-digit OTP code sent to ${smartInput.trim()}`);
      setShowOtpModal(true);
    } catch (err: any) {
      setError(formatErrorDetail(err.response?.data?.detail) || 'Failed to send OTP code.');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setOtpMsg('Please enter a valid 6-digit OTP code.');
      return;
    }
    try {
      await api.post('/auth/otp/verify', { phone_number: smartInput.trim(), otp_code: otpCode });
      setShowOtpModal(false);
      handleSelectGoogleAccount({ name: 'Phone User', email: `${smartInput.trim().replace(/\s+/g, '')}@phone.paycore.io` });
    } catch (err: any) {
      setOtpMsg(formatErrorDetail(err.response?.data?.detail) || 'Invalid 6-digit OTP code.');
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex relative overflow-hidden font-sans">
      {/* Top Ribbon */}
      <div className="absolute top-4 right-[-35px] rotate-45 bg-indigo-600 text-white text-[11px] font-bold px-12 py-1 shadow-lg z-30 pointer-events-none">
        0%* Platform Fees
      </div>

      {/* LEFT HERO SECTION (Razorpay Style) */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-gradient-to-br from-[#0c101c] via-[#0f172a] to-[#1e1b4b] relative border-r border-slate-800/80">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-indigo-500/30">
            P
          </div>
          <span className="font-bold text-xl tracking-tight text-white font-mono">PAYCORE</span>
        </div>

        <div className="space-y-6 max-w-xl relative z-10 my-auto">
          <h1 className="text-4xl font-black text-white tracking-tight leading-tight">
            Join 8 Million Businesses that use <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              PAYCORE to Supercharge their Business
            </span>
          </h1>

          <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-300 pt-2">
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/80">
              <span className="text-indigo-400">✦</span> 100+ Payment Methods
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/80">
              <span className="text-indigo-400">✦</span> Easy Integration
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/80">
              <span className="text-emerald-400">✦</span> Sandbox Simulator Included
            </span>
          </div>
        </div>

        <div className="text-xs text-slate-500 relative z-10">
          © 2026 PAYCORE Payment Platform Inc. All rights reserved.
        </div>
      </div>

      {/* RIGHT LOGIN FORM SECTION */}
      <div className="w-full lg:w-[500px] flex flex-col justify-between p-8 sm:p-12 bg-[#090d16] z-10">
        <div className="max-w-sm w-full mx-auto my-auto space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-white text-2xl shadow-xl shadow-indigo-500/25 mb-2">
            P
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white tracking-tight">Get started with your email or phone number</h2>
            <p className="text-xs text-slate-400">Welcome to PAYCORE Platform</p>
          </div>

          {loading ? (
            <div className="p-8 glass-card rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <div className="text-xs font-mono text-slate-300">Authenticating & Redirecting to Dashboard...</div>
            </div>
          ) : !showPasswordStep ? (
            <form onSubmit={handleContinue} className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  value={smartInput}
                  onChange={(e) => setSmartInput(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition font-mono"
                  placeholder="Enter your email or phone number"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/50 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
              >
                <span>Continue</span>
              </button>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-xs text-slate-500 font-medium">or</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>

              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={() => setShowGoogleModal(true)}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800/90 text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.27v3.15C3.25 21.3 7.31 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.27C.46 8.23 0 10.06 0 12s.46 3.77 1.27 5.39l4.01-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.61l4.01 3.15c.95-2.85 3.6-4.96 6.72-4.96z"/>
                </svg>
                <span>Continue with Google</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
                  <span>Signing in as:</span>
                  <button
                    type="button"
                    onClick={() => setShowPasswordStep(false)}
                    className="text-indigo-400 hover:underline font-medium"
                  >
                    Change
                  </button>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white font-bold">
                  {smartInput}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Enter Account Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/50 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-sm shadow-lg shadow-indigo-500/25 transition flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <p className="text-[11px] text-slate-500 leading-relaxed">
            By continuing you agree to our <a href="#" className="text-indigo-400 hover:underline">privacy policy</a> & <a href="#" className="text-indigo-400 hover:underline">terms of use</a>. *Limited period offer, terms and conditions apply.
          </p>

          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl text-xs space-y-1">
            <div className="text-slate-300 font-medium">Helping Clients with PAYCORE Solutions?</div>
            <a href="#" className="text-indigo-400 hover:underline font-bold inline-flex items-center gap-1">
              <span>Become PAYCORE Partner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 pt-6">
          Need an account?{' '}
          <button onClick={() => navigate('/register')} className="text-indigo-400 font-semibold hover:underline">
            Create Free Merchant Account
          </button>
        </div>
      </div>

      <GoogleAccountChooserModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSelectAccount={handleSelectGoogleAccount}
      />

      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>Verify 6-Digit Mobile OTP</span>
            </div>
            <p className="text-xs text-slate-300">
              We sent a verification code to <strong className="text-white font-mono">{smartInput}</strong>. (Sandbox code: <code className="text-emerald-400 font-bold">123456</code>).
            </p>
            <div>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-center text-xl font-mono text-white tracking-widest focus:border-indigo-500"
                placeholder="123456"
              />
            </div>
            {otpMsg && <p className="text-[11px] text-rose-400 text-center font-mono font-semibold">{otpMsg}</p>}
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowOtpModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyOtp}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                Verify & Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
