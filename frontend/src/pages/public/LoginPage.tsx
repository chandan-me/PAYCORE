import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { ArrowRight, AlertCircle, ShieldCheck, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import api from '../../services/api';

import { PaycoreLogo } from '../../components/PaycoreLogo';
import { useToast } from '../../context/ToastContext';
import { LoginSkeleton } from '../../components/SkeletonLoader';

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

const getLoginValidationSchema = (showPasswordStep: boolean) =>
  Yup.object({
    identifier: Yup.string().required('Please enter your email or phone number'),
    password: showPasswordStep
      ? Yup.string().required('Password is required')
      : Yup.string().notRequired()
  });

export const LoginPage: React.FC<Props> = ({ onLoginSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordStep, setShowPasswordStep] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialMounting, setInitialMounting] = useState(true);

  // Smooth initial skeleton transition
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialMounting(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpMsg, setOtpMsg] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const registrationNotice = (location.state as any)?.notice;
  const googleClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';

  const handleGoogleCredential = async (google_token: string) => {
    setLoading(true);
    setError('');

    try {
      const resp = await api.post('/auth/google', {
        google_token,
        mode: 'login'
      });
      const { access_token, user_id, role, merchant_id, email } = resp.data;
      toast.success('Welcome Back!', `Signed in successfully with Google (${email})`);
      onLoginSuccess(access_token, { id: user_id, email, role }, merchant_id);
      if (role === 'PLATFORM_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      if (status === 404) {
        // Redirect to registration page if account doesn't exist
        const noticeMsg = typeof detail === 'string' ? detail : 'No account found with this Google email. Please register your merchant profile.';
        toast.warning(
          'Account Not Found',
          'No existing merchant account associated with this Google email. Redirecting to Registration...',
          6000
        );
        navigate('/register', {
          state: {
            notice: noticeMsg,
            google_token
          }
        });
      } else {
        const errMsg = formatErrorDetail(detail) || 'Google Sign-In failed.';
        setError(errMsg);
        toast.error('Google Sign-In Failed', errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (googleClientId && (window as any).google?.accounts?.id) {
          (window as any).google.accounts.id.initialize({
            client_id: googleClientId,
            callback: (response: any) => {
              if (response?.credential) {
                handleGoogleCredential(response.credential);
              }
            }
          });

          // Render official Google button
          const btnDiv = document.getElementById('googleSignInBtnDiv');
          if (btnDiv) {
            (window as any).google.accounts.id.renderButton(btnDiv, {
              theme: 'filled_black',
              size: 'large',
              width: 380,
              shape: 'rectangular',
              text: 'continue_with'
            });
          }
        }
      };
      document.body.appendChild(script);
    } catch (e) {
      console.warn('Google GIS script load warning:', e);
    }
  }, [googleClientId]);

  const formik = useFormik({
    initialValues: {
      identifier: '',
      password: ''
    },
    validationSchema: getLoginValidationSchema(showPasswordStep),
    onSubmit: async (values) => {
      const isEmail = values.identifier.includes('@');
      const isPhone = /^\+?[0-9\s\-]{8,15}$/.test(values.identifier.trim()) && !isEmail;

      if (!showPasswordStep) {
        if (isPhone) {
          handleSendOtp(values.identifier);
        } else {
          setShowPasswordStep(true);
        }
        return;
      }

      setLoading(true);
      setError('');

      try {
        const resp = await api.post('/auth/login', {
          email: values.identifier.trim(),
          password: values.password
        });
        const { access_token, user_id, role, merchant_id } = resp.data;
        toast.success('Welcome Back!', `Signed in successfully as ${values.identifier.trim()}`);
        onLoginSuccess(access_token, { id: user_id, email: values.identifier, role }, merchant_id);
        if (role === 'PLATFORM_ADMIN') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } catch (err: any) {
        const errMsg = formatErrorDetail(err.response?.data?.detail) || 'Invalid login credentials. Please check your password.';
        setError(errMsg);
        toast.error('Authentication Failed', errMsg);
      } finally {
        setLoading(false);
      }
    }
  });

  const handleSendOtp = async (phone: string) => {
    setError('');
    try {
      const resp = await api.post('/auth/otp/request', { phone_number: phone.trim() });
      const msg = resp.data.message || `6-digit OTP code sent to ${phone.trim()}`;
      setOtpMsg(msg);
      toast.info('OTP Sent', `A verification code was dispatched to ${phone.trim()}`);
      setShowOtpModal(true);
    } catch (err: any) {
      const errMsg = formatErrorDetail(err.response?.data?.detail) || 'Failed to send OTP code.';
      setError(errMsg);
      toast.error('OTP Request Failed', errMsg);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setOtpMsg('Please enter a valid 6-digit OTP code.');
      toast.warning('Invalid OTP', 'Please enter a valid 6-digit numeric verification code.');
      return;
    }
    try {
      await api.post('/auth/otp/verify', { phone_number: formik.values.identifier.trim(), otp_code: otpCode });
      setShowOtpModal(false);
      const resp = await api.post('/auth/login', {
        email: formik.values.identifier.trim(),
        password: 'phone_otp_verified'
      });
      const { access_token, user_id, role, merchant_id } = resp.data;
      toast.success('OTP Verified', `Signed in successfully with phone verification.`);
      onLoginSuccess(access_token, { id: user_id, email: formik.values.identifier.trim(), role }, merchant_id);
      navigate('/dashboard');
    } catch (err: any) {
      const errMsg = formatErrorDetail(err.response?.data?.detail) || 'Invalid 6-digit OTP code.';
      setOtpMsg(errMsg);
      toast.error('Verification Failed', errMsg);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex relative overflow-hidden font-sans">
      {/* Top Ribbon */}
      <div className="absolute top-4 right-[-35px] rotate-45 bg-[#0066FF] text-white text-[11px] font-bold px-12 py-1 shadow-md z-30 pointer-events-none font-mono">
        MYSQL 8.0 READY
      </div>

      {/* Left Promotional Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-blue-50/80 via-white to-slate-100 border-r border-slate-200 relative">
        <div className="cursor-pointer" onClick={() => navigate('/')}>
          <PaycoreLogo size="md" />
        </div>

        <div className="space-y-6 max-w-lg animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-[#0066FF] text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Enterprise Payment Orchestration
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 leading-tight">
            Single integration. <br />
            <span className="bg-gradient-to-r from-[#0066FF] to-[#6851FF] bg-clip-text text-transparent">
              All payment gateways.
            </span>
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Orchestrate cards, UPI, net banking, and payouts across Razorpay, Stripe, PayU, and Cashfree with zero code changes.
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>PAYCORE Engine • v1.0.0</span>
          <button
            onClick={() => navigate('/')}
            className="text-slate-600 hover:text-[#0066FF] transition font-sans font-bold flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
        </div>
      </div>

      {/* Right Login Action Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10 bg-gradient-to-b from-slate-50/50 via-white to-blue-50/30">
        {/* Ambient Glassmorphism Glow Orbs */}
        <div className="absolute top-10 right-10 w-72 h-72 bg-[#0066FF]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {initialMounting ? (
          <div className="w-full max-w-md animate-fade-in flex justify-center">
            <LoginSkeleton />
          </div>
        ) : (
          <div className="w-full max-w-md space-y-6 bg-white/85 backdrop-blur-2xl p-8 rounded-3xl border border-slate-200/80 shadow-[0_20px_60px_rgba(0,102,255,0.06)] animate-fade-in relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="cursor-pointer" onClick={() => navigate('/')}>
                <PaycoreLogo size="md" />
              </div>
              <button
                onClick={() => navigate('/')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-[#0066FF] hover:bg-blue-50 transition cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Home</span>
              </button>
            </div>
            <div className="space-y-1.5 text-center lg:text-left">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sign in to your account</h2>
              <p className="text-xs text-slate-500">
                Access your merchant analytics, double-entry ledger, and payment tools
              </p>
            </div>

          {registrationNotice && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{registrationNotice}</span>
            </div>
          )}

          <form onSubmit={formik.handleSubmit} className="space-y-4">
            {!showPasswordStep ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email or Phone Number
                  </label>
                  <input
                    type="text"
                    name="identifier"
                    value={formik.values.identifier}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none font-mono transition-all ${
                      formik.touched.identifier && formik.errors.identifier ? 'border-rose-400' : 'border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/10'
                    }`}
                    placeholder="merchant@paycore.dev or +91 9876543210"
                  />
                  {formik.touched.identifier && formik.errors.identifier && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium">{formik.errors.identifier}</p>
                  )}
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] font-bold text-white text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400 font-medium">or continue with</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* Official Google OAuth Button Container */}
                <div id="googleSignInBtnDiv" className="w-full flex justify-center min-h-[44px]"></div>
              </>
            ) : (
              <>
                <div>
                  <div className="text-xs text-slate-600 mb-1 flex items-center justify-between">
                    <span>Signing in as:</span>
                    <button
                      type="button"
                      onClick={() => setShowPasswordStep(false)}
                      className="text-[#0066FF] hover:underline font-semibold cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 font-bold">
                    {formik.values.identifier}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Enter Account Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none transition-all ${
                        formik.touched.password && formik.errors.password ? 'border-rose-400' : 'border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/10'
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formik.touched.password && formik.errors.password && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium">{formik.errors.password}</p>
                  )}
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] font-bold text-white text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign In</span>}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </form>

          <div className="text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-[#0066FF] font-bold hover:underline cursor-pointer"
            >
              Register here
            </button>
          </div>
        </div>
        )}
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Verify Phone Number</h3>
            <p className="text-xs text-slate-500">{otpMsg}</p>
            <input
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-full text-center tracking-widest text-lg font-mono bg-slate-50 border border-slate-300 rounded-xl py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0066FF]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="w-1/2 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyOtp}
                className="w-1/2 py-2 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-semibold cursor-pointer shadow-md shadow-blue-500/20 transition"
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
