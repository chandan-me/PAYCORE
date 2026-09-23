import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { User, Mail, Lock, Phone, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import api from '../../services/api';

import { PaycoreLogo } from '../../components/PaycoreLogo';
import { useToast } from '../../context/ToastContext';

interface Props {
  onLoginSuccess: (token: string, user: any, merchantId?: string) => void;
}

const registerValidationSchema = Yup.object({
  fullName: Yup.string()
    .min(2, 'Full legal name must be at least 2 characters')
    .required('Full legal name is required'),
  email: Yup.string()
    .email('Please provide a valid business email')
    .required('Business email is required'),
  phone: Yup.string()
    .matches(/^\+?[0-9\s\-]{8,15}$/, 'Invalid phone number format (e.g. +91 9876543210)')
    .required('Phone number is required'),
  gstin: Yup.string()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format (e.g. 29ABCDE1234F1Z5)')
    .notRequired(),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least 1 uppercase letter (A-Z)')
    .matches(/[0-9]/, 'Password must contain at least 1 digit (0-9)')
    .required('Account password is required'),
});

export const RegisterPage: React.FC<Props> = ({ onLoginSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const notice = (location.state as any)?.notice;
  const initialGoogleToken = (location.state as any)?.google_token;
  const googleClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';

  // Display notice toast if redirected from login
  useEffect(() => {
    if (notice) {
      toast.info('Sign-Up Required', notice, 6000);
    }
  }, [notice]);

  const handleGoogleRegisterCredential = async (google_token: string) => {
    setLoading(true);
    setError('');

    try {
      const resp = await api.post('/auth/google', {
        google_token,
        mode: 'register'
      });
      const { access_token, user_id, role, merchant_id, email: userEmail } = resp.data;
      toast.success('Registration Succeeded!', `Welcome to PAYCORE, ${userEmail}! Merchant profile provisioned.`);
      onLoginSuccess(access_token, { id: user_id, email: userEmail, role }, merchant_id);
      navigate('/dashboard/onboarding');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const errMsg = typeof detail === 'string' ? detail : 'Google Sign-Up failed.';
      setError(errMsg);
      toast.error('Google Sign-Up Failed', errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialGoogleToken) {
      handleGoogleRegisterCredential(initialGoogleToken);
    }
  }, [initialGoogleToken]);

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
                handleGoogleRegisterCredential(response.credential);
              }
            }
          });

          const btnDiv = document.getElementById('googleSignUpBtnDiv');
          if (btnDiv) {
            (window as any).google.accounts.id.renderButton(btnDiv, {
              theme: 'outline',
              size: 'large',
              width: 380,
              shape: 'rectangular',
              text: 'signup_with'
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
      fullName: '',
      email: '',
      phone: '+91 ',
      gstin: '',
      password: ''
    },
    validationSchema: registerValidationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError('');

      try {
        const resp = await api.post('/auth/register', {
          email: values.email.trim(),
          password: values.password,
          full_name: values.fullName.trim(),
          phone_number: values.phone.trim(),
          gstin: values.gstin.trim() ? values.gstin.trim().toUpperCase() : undefined,
          role: 'MERCHANT_ADMIN'
        });
        const { access_token, user_id, role, merchant_id } = resp.data;
        toast.success(
          'Account Created Successfully!',
          `Merchant profile and ledger accounts initialized for ${values.fullName.trim()}.`
        );
        onLoginSuccess(access_token, { id: user_id, email: values.email, full_name: values.fullName, role }, merchant_id);
        navigate('/dashboard/onboarding');
      } catch (err: any) {
        const detail = err.response?.data?.detail;
        const errMsg = Array.isArray(detail) ? detail.map(d => d.msg).join(', ') : (detail || 'Registration failed. Please check inputs.');
        setError(errMsg);
        toast.error('Registration Failed', errMsg);
      } finally {
        setLoading(false);
      }
    }
  });

  const pwd = formik.values.password;
  const hasLength = pwd.length >= 8;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 py-12 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 space-y-6 shadow-xl animate-fade-in-up">
        <div className="flex items-center justify-between">
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

        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Merchant Account</h2>
          <p className="text-xs text-slate-500">Build your custom payment infrastructure in sandbox or live mode</p>
        </div>

        {notice && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{notice}</span>
          </div>
        )}

        {/* Official Google OAuth Button Container */}
        <div id="googleSignUpBtnDiv" className="w-full flex justify-center min-h-[44px]"></div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">OR REGISTER WITH EMAIL</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                name="fullName"
                value={formik.values.fullName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full bg-slate-50 border rounded-xl pl-9 pr-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none transition-all ${
                  formik.touched.fullName && formik.errors.fullName ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/10'
                }`}
                placeholder="John Doe"
              />
            </div>
            {formik.touched.fullName && formik.errors.fullName && (
              <p className="mt-1 text-[11px] text-rose-600 font-medium">{formik.errors.fullName}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Business Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                name="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full bg-slate-50 border rounded-xl pl-9 pr-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none transition-all ${
                  formik.touched.email && formik.errors.email ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/10'
                }`}
                placeholder="merchant@example.com"
              />
            </div>
            {formik.touched.email && formik.errors.email && (
              <p className="mt-1 text-[11px] text-rose-600 font-medium">{formik.errors.email}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  name="phone"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full bg-slate-50 border rounded-xl pl-9 pr-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none transition-all ${
                    formik.touched.phone && formik.errors.phone ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/10'
                  }`}
                  placeholder="+91 9876543210"
                />
              </div>
              {formik.touched.phone && formik.errors.phone && (
                <p className="mt-1 text-[11px] text-rose-600 font-medium">{formik.errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN (Optional)</label>
              <input
                type="text"
                name="gstin"
                value={formik.values.gstin}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none uppercase font-mono transition-all ${
                  formik.touched.gstin && formik.errors.gstin ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/10'
                }`}
                placeholder="29ABCDE1234F1Z5"
              />
              {formik.touched.gstin && formik.errors.gstin && (
                <p className="mt-1 text-[11px] text-rose-600 font-medium">{formik.errors.gstin}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Account Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full bg-slate-50 border rounded-xl pl-9 pr-10 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none transition-all ${
                  formik.touched.password && formik.errors.password ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/10'
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formik.touched.password && formik.errors.password && (
              <p className="mt-1 text-[11px] text-rose-600 font-medium">{formik.errors.password}</p>
            )}

            {/* Password Validation Checklist */}
            <div className="mt-2 space-y-1 text-[11px]">
              <div className={`flex items-center gap-1.5 ${hasLength ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>At least 8 characters long</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Contains at least 1 uppercase letter (A-Z)</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Contains at least 1 digit (0-9)</span>
              </div>
            </div>
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
            className="w-full py-3 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] font-bold text-white text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Get Started Free</span>}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Already registered?{' '}
          <button onClick={() => navigate('/login')} className="text-[#0066FF] font-bold hover:underline cursor-pointer">
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};
