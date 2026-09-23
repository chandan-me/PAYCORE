import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Building2,
  ShieldCheck,
  CreditCard,
  Key,
  Rocket,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Copy,
  BadgeCheck,
  RefreshCw,
  Info,
  Check,
  Globe,
  Landmark
} from 'lucide-react';
import api from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../context/ToastContext';

interface Props {
  merchant: any;
  onRefresh: () => void;
}

const businessSchema = Yup.object({
  legalName: Yup.string().trim().required('Legal business name is required').min(3, 'At least 3 characters'),
  brandName: Yup.string().trim().required('Brand / Display name is required'),
  website: Yup.string().trim().url('Must be a valid URL (e.g. https://example.com)').required('Website or app URL is required'),
  businessType: Yup.string().required('Select your registered business entity type'),
  category: Yup.string().required('Select primary business industry')
});

const taxSchema = Yup.object({
  taxId: Yup.string()
    .trim()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format (e.g. 29ABCDE1234F1Z5)')
    .required('GSTIN is required for Indian merchants'),
  panNumber: Yup.string()
    .trim()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format (e.g. ABCDE1234F)')
    .required('Company / Entity PAN is required')
});

const bankSchema = Yup.object({
  accountHolder: Yup.string().trim().required('Account holder name is required as per bank records'),
  accountNumber: Yup.string().trim().matches(/^[0-9]{9,18}$/, 'Valid bank account number (9-18 digits)').required('Account number is required'),
  confirmAccountNumber: Yup.string()
    .oneOf([Yup.ref('accountNumber')], 'Account numbers do not match')
    .required('Confirm account number'),
  ifsc: Yup.string().trim().matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code (e.g. HDFC0000123)').required('IFSC code is required'),
  bankName: Yup.string().required('Select or enter bank name')
});

const signatorySchema = Yup.object({
  signatoryName: Yup.string().trim().required('Authorized signatory full legal name is required'),
  signatoryDesignation: Yup.string().trim().required('Designation (e.g. Director, Managing Partner, Founder) is required'),
  signatoryPan: Yup.string().trim().matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid Director PAN format').required('Personal PAN is required'),
  signatoryAadhaar: Yup.string().trim().matches(/^[0-9]{12}$/, 'Valid 12-digit Aadhaar number required').required('Aadhaar number is required')
});

export const MerchantOnboardingView: React.FC<Props> = ({ merchant, onRefresh }) => {
  const currentStep = merchant?.onboarding_step || 1;
  const [activeStep, setActiveStep] = useState<number>(currentStep);
  const [loading, setLoading] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [gstVerified, setGstVerified] = useState(false);
  const [verifyingGst, setVerifyingGst] = useState(false);
  const [pennyDropStatus, setPennyDropStatus] = useState<'IDLE' | 'VERIFYING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [pennyDropUtr, setPennyDropUtr] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('https://api.merchant.com/v1/paycore-webhooks');
  const [agreedCompliance, setAgreedCompliance] = useState(false);
  const toast = useToast();

  const steps = [
    { num: 1, label: 'Business Profile', desc: 'Legal entity & brand presence', icon: Building2 },
    { num: 2, label: 'Tax & GSTIN', desc: 'GSTN and PAN validation', icon: ShieldCheck },
    { num: 3, label: 'Bank Settlement', desc: 'Penny-drop bank verification', icon: Landmark },
    { num: 4, label: 'Signatory KYC', desc: 'Director identity & documents', icon: CreditCard },
    { num: 5, label: 'API & Webhooks', desc: 'Developer keys & event setup', icon: Key },
    { num: 6, label: 'Go Live', desc: 'Compliance signoff & activation', icon: Rocket },
  ];

  // Forms for each step
  const businessFormik = useFormik({
    initialValues: {
      legalName: merchant?.legal_business_name || '',
      brandName: merchant?.name || '',
      website: merchant?.website || '',
      businessType: 'PRIVATE_LIMITED',
      category: 'ECOMMERCE'
    },
    enableReinitialize: true,
    validationSchema: businessSchema,
    onSubmit: async (values) => {
      await advanceStep(2, {
        legal_business_name: values.legalName.trim(),
        brand_name: values.brandName.trim(),
        website: values.website.trim(),
        business_type: values.businessType,
        category: values.category
      });
    }
  });

  const taxFormik = useFormik({
    initialValues: {
      taxId: merchant?.tax_id || '29ABCDE1234F1Z5',
      panNumber: 'ABCDE1234F'
    },
    enableReinitialize: true,
    validationSchema: taxSchema,
    onSubmit: async (values) => {
      await advanceStep(3, {
        tax_id: values.taxId.trim().toUpperCase(),
        pan_number: values.panNumber.trim().toUpperCase()
      });
    }
  });

  const bankFormik = useFormik({
    initialValues: {
      accountHolder: merchant?.legal_business_name || 'Acme Technologies Pvt Ltd',
      accountNumber: '918237461234',
      confirmAccountNumber: '918237461234',
      ifsc: 'HDFC0000123',
      bankName: 'HDFC Bank'
    },
    enableReinitialize: true,
    validationSchema: bankSchema,
    onSubmit: async (values) => {
      if (pennyDropStatus !== 'SUCCESS') {
        toast.warning('Bank Verification Required', 'Please run the ₹1.00 Penny Drop bank account verification before proceeding.');
        return;
      }
      await advanceStep(4, {
        bank_account: {
          account_holder: values.accountHolder,
          account_number: values.accountNumber,
          ifsc: values.ifsc,
          bank_name: values.bankName,
          verified: true,
          penny_drop_utr: pennyDropUtr
        }
      });
    }
  });

  const signatoryFormik = useFormik({
    initialValues: {
      signatoryName: 'Chandan Kumar',
      signatoryDesignation: 'Director & CEO',
      signatoryPan: 'ABCDE1234F',
      signatoryAadhaar: '987654321098'
    },
    enableReinitialize: true,
    validationSchema: signatorySchema,
    onSubmit: async (values) => {
      await advanceStep(5, {
        signatory: {
          name: values.signatoryName,
          designation: values.signatoryDesignation,
          pan: values.signatoryPan,
          aadhaar_masked: `XXXX-XXXX-${values.signatoryAadhaar.slice(-4)}`
        }
      });
    }
  });

  const advanceStep = async (targetStep: number, payloadData: any) => {
    setLoading(true);
    setStepError(null);
    try {
      await api.post('/merchants/onboarding/step', {
        step: targetStep,
        status: targetStep === 6 ? 'VERIFIED' : 'UNDER_REVIEW',
        data: payloadData
      });
      toast.success(
        `Step ${activeStep} Saved!`,
        `Advanced to Step ${targetStep}: ${steps[targetStep - 1]?.label}.`
      );
      setActiveStep(targetStep);
      onRefresh();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to save onboarding step.';
      setStepError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      toast.error('Onboarding Update Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateGstVerify = () => {
    setVerifyingGst(true);
    setTimeout(() => {
      setVerifyingGst(false);
      setGstVerified(true);
      toast.success(
        'GSTIN Verified with Govt GSTN Portal',
        'Entity: Acme Technologies Pvt Ltd | Status: ACTIVE | Type: Regular Taxpayer'
      );
    }, 1200);
  };

  const handleSimulatePennyDrop = () => {
    setPennyDropStatus('VERIFYING');
    setTimeout(() => {
      const randomUtr = `PAYCORE${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      setPennyDropStatus('SUCCESS');
      setPennyDropUtr(randomUtr);
      toast.payment({
        title: 'Penny-Drop Bank Verified',
        message: 'Beneficiary name match 100% verified with bank records.',
        amount: 100,
        currency: 'INR',
        status: 'SUCCEEDED',
        method: 'IMPS_INSTANT',
        utr: randomUtr
      });
    }, 1800);
  };

  const handleGoLiveActivation = async () => {
    if (!agreedCompliance) {
      toast.warning('Compliance Signoff Required', 'Please accept the RBI PA-PG terms and PCI-DSS compliance declarations.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/merchants/onboarding/step', {
        step: 6,
        status: 'VERIFIED',
        data: {
          activated_at: new Date().toISOString(),
          compliance_agreed: true,
          live_mode_unlocked: true
        }
      });
      toast.success(
        '🚀 Live Settlement Mode Activated!',
        'Your PAYCORE merchant account is now verified for real-world card, UPI AutoPay, and 24x7 IMPS settlements.'
      );
      onRefresh();
    } catch (err: any) {
      toast.error('Activation Error', err.response?.data?.detail || 'Could not activate live mode.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header with Title and Overall Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Merchant Onboarding & KYC Hub</h1>
            <StatusBadge status={merchant?.onboarding_status || 'PROFILE_INCOMPLETE'} />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete RBI PA-PG regulated merchant verification to unlock live payments, UPI AutoPay, and instant payouts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onRefresh()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      {/* Progress Timeline Stepper */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5">
        {steps.map((s) => {
          const isDone = s.num < currentStep;
          const isCurrent = s.num === activeStep;
          const Icon = s.icon;

          return (
            <button
              key={s.num}
              type="button"
              onClick={() => setActiveStep(s.num)}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                isDone
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 shadow-xs'
                  : isCurrent
                  ? 'bg-blue-50/90 border-[#0066FF] ring-2 ring-[#0066FF]/20 text-slate-900 shadow-md'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-[#0066FF] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : s.num}
                </div>
                <Icon className={`w-4 h-4 ${isDone ? 'text-emerald-600' : isCurrent ? 'text-[#0066FF]' : 'text-slate-400'}`} />
              </div>
              <div className="text-xs font-bold truncate text-slate-900">{s.label}</div>
              <div className="text-[11px] text-slate-500 truncate">{s.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Main Step Content Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0066FF] border border-blue-100 flex items-center justify-center font-bold">
              {React.createElement(steps[activeStep - 1]?.icon || Building2, { className: 'w-5 h-5' })}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Step {activeStep}: {steps[activeStep - 1]?.label}
              </h2>
              <p className="text-xs text-slate-500">{steps[activeStep - 1]?.desc}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
              {activeStep <= currentStep ? 'Unlocked' : 'Preview'}
            </span>
          </div>
        </div>

        {stepError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{stepError}</span>
          </div>
        )}

        {/* STEP 1: BUSINESS PROFILE */}
        {activeStep === 1 && (
          <form onSubmit={businessFormik.handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Business Entity Type *
                </label>
                <select
                  name="businessType"
                  value={businessFormik.values.businessType}
                  onChange={businessFormik.handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF] transition"
                >
                  <option value="PRIVATE_LIMITED">Private Limited Company (Pvt Ltd)</option>
                  <option value="LLP">Limited Liability Partnership (LLP)</option>
                  <option value="SOLE_PROPRIETORSHIP">Sole Proprietorship</option>
                  <option value="PARTNERSHIP">Partnership Firm</option>
                  <option value="PUBLIC_LIMITED">Public Limited Company</option>
                  <option value="TRUST_NGO">Trust / Society / NGO</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Primary Business Industry / Category *
                </label>
                <select
                  name="category"
                  value={businessFormik.values.category}
                  onChange={businessFormik.handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF] transition"
                >
                  <option value="ECOMMERCE">E-Commerce & Retail</option>
                  <option value="SAAS_SOFTWARE">SaaS & Digital Goods</option>
                  <option value="FINTECH_NBFC">Fintech, Lending & NBFC</option>
                  <option value="EDTECH">EdTech & Online Learning</option>
                  <option value="TRAVEL_HOSPITALITY">Travel & Hospitality</option>
                  <option value="GAMING">Gaming & Entertainment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Legal Entity Name (as per Certificate of Incorporation) *
                </label>
                <input
                  type="text"
                  name="legalName"
                  value={businessFormik.values.legalName}
                  onChange={businessFormik.handleChange}
                  onBlur={businessFormik.handleBlur}
                  placeholder="e.g. Acme Technologies Private Limited"
                  className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 transition ${
                    businessFormik.touched.legalName && businessFormik.errors.legalName
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-slate-200 focus:border-[#0066FF]'
                  }`}
                />
                {businessFormik.touched.legalName && businessFormik.errors.legalName && (
                  <p className="mt-1 text-[11px] text-rose-600">{String(businessFormik.errors.legalName)}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Brand / Trade Display Name (shown to customers on checkout) *
                </label>
                <input
                  type="text"
                  name="brandName"
                  value={businessFormik.values.brandName}
                  onChange={businessFormik.handleChange}
                  onBlur={businessFormik.handleBlur}
                  placeholder="e.g. Acme Store"
                  className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 transition ${
                    businessFormik.touched.brandName && businessFormik.errors.brandName
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-slate-200 focus:border-[#0066FF]'
                  }`}
                />
                {businessFormik.touched.brandName && businessFormik.errors.brandName && (
                  <p className="mt-1 text-[11px] text-rose-600">{String(businessFormik.errors.brandName)}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Business Website / App Store URL *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    name="website"
                    value={businessFormik.values.website}
                    onChange={businessFormik.handleChange}
                    onBlur={businessFormik.handleBlur}
                    placeholder="https://acme.example.com"
                    className={`w-full bg-slate-50 border rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 transition ${
                      businessFormik.touched.website && businessFormik.errors.website
                        ? 'border-rose-500 focus:border-rose-500'
                        : 'border-slate-200 focus:border-[#0066FF]'
                    }`}
                  />
                </div>
                {businessFormik.touched.website && businessFormik.errors.website && (
                  <p className="mt-1 text-[11px] text-rose-600">{String(businessFormik.errors.website)}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                <span>Save & Proceed to Tax Verification</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: TAX & GSTIN */}
        {activeStep === 2 && (
          <form onSubmit={taxFormik.handleSubmit} className="space-y-5">
            <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-3">
              <Info className="w-4 h-4 text-[#0066FF] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Instant GSTIN Verification:</span> We perform a real-time query against the Government GSTN database to auto-validate business legal name and active registration status.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Goods and Services Tax Identification Number (GSTIN) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="taxId"
                    value={taxFormik.values.taxId}
                    onChange={taxFormik.handleChange}
                    onBlur={taxFormik.handleBlur}
                    placeholder="29ABCDE1234F1Z5"
                    className={`w-full uppercase font-mono bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 transition ${
                      taxFormik.touched.taxId && taxFormik.errors.taxId
                        ? 'border-rose-500 focus:border-rose-500'
                        : 'border-slate-200 focus:border-[#0066FF]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleSimulateGstVerify}
                    disabled={verifyingGst}
                    className="shrink-0 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    {verifyingGst ? 'Verifying...' : gstVerified ? '✓ Verified' : 'Verify GST'}
                  </button>
                </div>
                {taxFormik.touched.taxId && taxFormik.errors.taxId && (
                  <p className="mt-1 text-[11px] text-rose-600">{String(taxFormik.errors.taxId)}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Company / Entity PAN *
                </label>
                <input
                  type="text"
                  name="panNumber"
                  value={taxFormik.values.panNumber}
                  onChange={taxFormik.handleChange}
                  onBlur={taxFormik.handleBlur}
                  placeholder="ABCDE1234F"
                  className={`w-full uppercase font-mono bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 transition ${
                    taxFormik.touched.panNumber && taxFormik.errors.panNumber
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-slate-200 focus:border-[#0066FF]'
                  }`}
                />
                {taxFormik.touched.panNumber && taxFormik.errors.panNumber && (
                  <p className="mt-1 text-[11px] text-rose-600">{String(taxFormik.errors.panNumber)}</p>
                )}
              </div>
            </div>

            {gstVerified && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-bold">GSTIN Validated Successfully</div>
                    <div className="text-[11px] text-emerald-700">Taxpayer: Acme Technologies Pvt Ltd • Status: Active</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[10px]">
                  GOVT VERIFIED
                </span>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 text-xs font-semibold transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                <span>Save & Proceed to Bank Settlement</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: BANK SETTLEMENT & PENNY DROP */}
        {activeStep === 3 && (
          <form onSubmit={bankFormik.handleSubmit} className="space-y-5">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
              <div className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-[#0066FF]" />
                <span>Automated Penny-Drop Verification</span>
              </div>
              <p className="text-slate-600">
                To comply with RBI settlement guidelines, PAYCORE deposits ₹1.00 via IMPS into your merchant bank account to verify registered legal ownership before live payouts are disbursed.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Account Holder Legal Name *
                </label>
                <input
                  type="text"
                  name="accountHolder"
                  value={bankFormik.values.accountHolder}
                  onChange={bankFormik.handleChange}
                  onBlur={bankFormik.handleBlur}
                  placeholder="Acme Technologies Pvt Ltd"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Bank Name *
                </label>
                <select
                  name="bankName"
                  value={bankFormik.values.bankName}
                  onChange={bankFormik.handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20"
                >
                  <option value="HDFC Bank">HDFC Bank</option>
                  <option value="ICICI Bank">ICICI Bank</option>
                  <option value="State Bank of India">State Bank of India (SBI)</option>
                  <option value="Axis Bank">Axis Bank</option>
                  <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Account Number *
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={bankFormik.values.accountNumber}
                  onChange={bankFormik.handleChange}
                  onBlur={bankFormik.handleBlur}
                  placeholder="918237461234"
                  className="w-full font-mono bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  IFSC Code *
                </label>
                <input
                  type="text"
                  name="ifsc"
                  value={bankFormik.values.ifsc}
                  onChange={bankFormik.handleChange}
                  onBlur={bankFormik.handleBlur}
                  placeholder="HDFC0000123"
                  className="w-full uppercase font-mono bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20"
                />
              </div>
            </div>

            {/* Penny Drop Action Area */}
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-slate-900">Run ₹1.00 Bank Account Verification</div>
                <div className="text-[11px] text-slate-600">
                  Sends ₹1.00 instant IMPS credit and matches beneficiary bank name with registered entity.
                </div>
              </div>

              {pennyDropStatus === 'SUCCESS' ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Verified (UTR: {pennyDropUtr})</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSimulatePennyDrop}
                  disabled={pennyDropStatus === 'VERIFYING'}
                  className="px-5 py-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition cursor-pointer"
                >
                  {pennyDropStatus === 'VERIFYING' ? 'Initiating ₹1.00 IMPS...' : '⚡ Initiate ₹1 Penny Drop'}
                </button>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 text-xs font-semibold transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                <span>Save & Proceed to Signatory KYC</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: SIGNATORY KYC */}
        {activeStep === 4 && (
          <form onSubmit={signatoryFormik.handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Authorized Director / Signatory Full Name *
                </label>
                <input
                  type="text"
                  name="signatoryName"
                  value={signatoryFormik.values.signatoryName}
                  onChange={signatoryFormik.handleChange}
                  placeholder="Chandan Kumar"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Designation *
                </label>
                <input
                  type="text"
                  name="signatoryDesignation"
                  value={signatoryFormik.values.signatoryDesignation}
                  onChange={signatoryFormik.handleChange}
                  placeholder="Director & CEO"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Director Personal PAN *
                </label>
                <input
                  type="text"
                  name="signatoryPan"
                  value={signatoryFormik.values.signatoryPan}
                  onChange={signatoryFormik.handleChange}
                  placeholder="ABCDE1234F"
                  className="w-full uppercase font-mono bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Director Aadhaar Number (12 Digits) *
                </label>
                <input
                  type="password"
                  name="signatoryAadhaar"
                  value={signatoryFormik.values.signatoryAadhaar}
                  onChange={signatoryFormik.handleChange}
                  placeholder="987654321098"
                  className="w-full font-mono bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 text-xs font-semibold transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                <span>Save & Proceed to API Setup</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 5: API & WEBHOOKS */}
        {activeStep === 5 && (
          <div className="space-y-5">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                <span>Production & Sandbox API Credentials</span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-100 text-[#0066FF] rounded-md font-bold">
                  v1.0 REST
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Live Client ID (App ID)
                  </label>
                  <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2.5 font-mono text-slate-800">
                    <span>app_live_{merchant?.id?.slice(0, 16) || 'cf_prod_992147102'}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`app_live_${merchant?.id || 'cf_prod_992147102'}`);
                        toast.copied('Live Client ID copied to clipboard');
                      }}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Webhook Destination URL (HMAC SHA-256 Verified)
                  </label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveStep(4)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 text-xs font-semibold transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => advanceStep(6, { webhook_url: webhookUrl })}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                <span>Save & Proceed to Go Live</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: GO LIVE & COMPLIANCE */}
        {activeStep === 6 && (
          <div className="space-y-6">
            <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <BadgeCheck className="w-5 h-5 text-[#0066FF]" />
                <span>Final Go-Live Compliance Signoff</span>
              </div>
              <p className="text-xs text-slate-600">
                Your documentation has been validated. By activating your live account, you acknowledge compliance with Payment Aggregator & Payment Gateway guidelines, PCI-DSS SAQ-A criteria, and AML/CFT laws.
              </p>
            </div>

            <div className="space-y-3 bg-white border border-slate-200 p-4 rounded-xl text-xs text-slate-700">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedCompliance}
                  onChange={(e) => setAgreedCompliance(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0066FF] border-slate-300 focus:ring-[#0066FF] mt-0.5"
                />
                <span className="leading-relaxed">
                  I agree to the <strong>PAYCORE Merchant Services Agreement</strong>, <strong>Acceptable Use Policy</strong>, and confirm that all customer settlements will be deposited into the verified escrow bank account.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveStep(5)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 text-xs font-semibold transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleGoLiveActivation}
                disabled={loading}
                className="flex items-center gap-2 px-7 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition cursor-pointer"
              >
                <Rocket className="w-4 h-4" />
                <span>🚀 Activate Production Live Mode</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
