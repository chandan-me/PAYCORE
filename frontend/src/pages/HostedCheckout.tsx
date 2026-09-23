import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Lock,
  CreditCard,
  Smartphone,
  Building2,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import api from '../services/api';
import { MoneyFormat } from '../components/MoneyFormat';
import { PaycoreLogo } from '../components/PaycoreLogo';

const getCheckoutValidationSchema = (activeTab: string) =>
  Yup.object({
    cardNumber:
      activeTab === 'CARD'
        ? Yup.string()
            .required('Card number is required')
            .matches(/^[0-9\s]{13,19}$/, 'Enter a valid 16-digit card number')
        : Yup.string().notRequired(),
    expDate:
      activeTab === 'CARD'
        ? Yup.string()
            .required('Expiry date is required')
            .matches(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/, 'Format must be MM/YY')
        : Yup.string().notRequired(),
    cvv:
      activeTab === 'CARD'
        ? Yup.string()
            .required('CVV is required')
            .matches(/^[0-9]{3,4}$/, 'CVV must be 3 or 4 digits')
        : Yup.string().notRequired(),
    cardHolder:
      activeTab === 'CARD'
        ? Yup.string()
            .required('Cardholder name is required')
            .min(2, 'Name must be at least 2 characters')
        : Yup.string().notRequired(),
    upiVpa:
      activeTab === 'UPI'
        ? Yup.string()
            .required('UPI ID is required')
            .matches(/^[\w.-]+@[\w.-]+$/, 'Enter a valid UPI ID (e.g. name@bank)')
        : Yup.string().notRequired(),
    selectedBank: Yup.string()
  });

export const HostedCheckout: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState<'CARD' | 'UPI' | 'NET_BANKING'>('CARD');
  const [processing, setProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const resp = await api.get(`/checkout/sessions/${sessionId}`);
        setData(resp.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load checkout session.');
      } finally {
        setLoading(false);
      }
    };
    if (sessionId) fetchSession();
  }, [sessionId]);

  const formik = useFormik({
    initialValues: {
      cardNumber: '4242 4242 4242 4242',
      expDate: '12/30',
      cvv: '123',
      cardHolder: 'Sarah Connor',
      upiVpa: 'sarah@okicici',
      selectedBank: 'HDFC Bank'
    },
    validationSchema: getCheckoutValidationSchema(activeTab),
    onSubmit: async (values) => {
      if (!data) return;
      setProcessing(true);
      setError('');

      const paymentDetails = activeTab === 'CARD'
        ? {
            card_number: values.cardNumber.replace(/\s+/g, ''),
            exp_date: values.expDate,
            cvv: values.cvv,
            card_holder: values.cardHolder
          }
        : {
            upi_vpa: values.upiVpa,
            bank: values.selectedBank
          };

      try {
        const resp = await api.post(`/payment_intents/${data.payment_intent.id}/confirm`, {
          payment_method_type: activeTab,
          payment_details: paymentDetails,
        });
        setPaymentResult(resp.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Payment processing failed.');
      } finally {
        setProcessing(false);
      }
    }
  });

  const handleTestCardClick = (cardNumberValue: string) => {
    formik.setFieldValue('cardNumber', cardNumberValue);
    setActiveTab('CARD');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-600 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-[#0066FF] mb-3" />
        <span className="text-sm font-bold">Securing 256-bit encrypted checkout...</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200 p-8 rounded-2xl text-center space-y-4 shadow-xl">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Checkout Unavailable</h2>
          <p className="text-sm text-slate-600">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  const { session, merchant, payment_intent } = data;

  if (paymentResult?.status === 'SUCCEEDED') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200 p-8 rounded-2xl text-center space-y-6 shadow-xl animate-scale-in">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Payment Successful</h2>
            <p className="text-xs text-slate-500 mt-1">Transaction confirmed & posted to merchant ledger</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl text-left space-y-2 border border-slate-200 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Amount Paid</span>
              <MoneyFormat amount={session.amount} currency={session.currency} className="font-black text-slate-900" />
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Intent</span>
              <span className="font-mono text-slate-700">{payment_intent.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Merchant</span>
              <span className="text-slate-800 font-semibold">{merchant.business_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status</span>
              <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-mono font-bold">SUCCEEDED</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <a
              href={session.success_url}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-sm transition-all shadow-md shadow-blue-600/20"
            >
              <span>Return to Merchant</span>
              <ChevronRight className="w-4 h-4" />
            </a>
            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Go to PAYCORE Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-lg mb-3 flex items-center justify-between text-xs text-slate-500 px-1">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <PaycoreLogo size="sm" />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="text-slate-600 hover:text-[#0066FF] font-bold text-xs flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
          <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-[#0066FF] font-mono text-[10px] font-bold">
            SANDBOX MODE
          </span>
        </div>
      </div>

      <div className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-200 animate-fade-in-up">
        <div className="p-6 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#0066FF] tracking-wider uppercase">MERCHANT ORDER</span>
              <h1 className="text-xl font-black text-slate-900">{merchant.business_name}</h1>
              <p className="text-xs text-slate-500 mt-0.5">{session.description || 'Order #1001'}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block font-medium">Total Amount</span>
              <MoneyFormat amount={session.amount} currency={session.currency} className="text-2xl font-black text-slate-900" />
            </div>
          </div>
        </div>

        <form onSubmit={formik.handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('CARD')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'CARD' ? 'bg-[#0066FF] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Card</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('UPI')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'UPI' ? 'bg-[#0066FF] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>UPI</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('NET_BANKING')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'NET_BANKING' ? 'bg-[#0066FF] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Net Banking</span>
            </button>
          </div>

          {activeTab === 'CARD' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Card Number *</label>
                <input
                  type="text"
                  name="cardNumber"
                  value={formik.values.cardNumber}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:bg-white focus:outline-none transition-all ${
                    formik.touched.cardNumber && formik.errors.cardNumber
                      ? 'border-rose-400 focus:border-rose-500'
                      : 'border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/10'
                  }`}
                  placeholder="4242 4242 4242 4242"
                />
                {formik.touched.cardNumber && formik.errors.cardNumber && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">{formik.errors.cardNumber}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date *</label>
                  <input
                    type="text"
                    name="expDate"
                    value={formik.values.expDate}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:bg-white focus:outline-none transition-all ${
                      formik.touched.expDate && formik.errors.expDate
                        ? 'border-rose-400 focus:border-rose-500'
                        : 'border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/10'
                    }`}
                    placeholder="MM/YY"
                  />
                  {formik.touched.expDate && formik.errors.expDate && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium">{formik.errors.expDate}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">CVV *</label>
                  <input
                    type="password"
                    name="cvv"
                    value={formik.values.cvv}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:bg-white focus:outline-none transition-all ${
                      formik.touched.cvv && formik.errors.cvv
                        ? 'border-rose-400 focus:border-rose-500'
                        : 'border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/10'
                    }`}
                    placeholder="123"
                  />
                  {formik.touched.cvv && formik.errors.cvv && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium">{formik.errors.cvv}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cardholder Name *</label>
                <input
                  type="text"
                  name="cardHolder"
                  value={formik.values.cardHolder}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none transition-all ${
                    formik.touched.cardHolder && formik.errors.cardHolder
                      ? 'border-rose-400 focus:border-rose-500'
                      : 'border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/10'
                  }`}
                />
                {formik.touched.cardHolder && formik.errors.cardHolder && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">{formik.errors.cardHolder}</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'UPI' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">UPI ID / VPA *</label>
              <input
                type="text"
                name="upiVpa"
                value={formik.values.upiVpa}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:bg-white focus:outline-none transition-all ${
                  formik.touched.upiVpa && formik.errors.upiVpa
                    ? 'border-rose-400 focus:border-rose-500'
                    : 'border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/10'
                }`}
                placeholder="username@bank"
              />
              {formik.touched.upiVpa && formik.errors.upiVpa && (
                <p className="mt-1 text-[11px] text-rose-600 font-medium">{formik.errors.upiVpa}</p>
              )}
              <p className="text-[11px] text-slate-500 mt-1.5">Enter any VPA (e.g. name@okhdfcbank, name@upi). Use 'fail@upi' to test failure.</p>
            </div>
          )}

          {activeTab === 'NET_BANKING' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Bank</label>
              <select
                name="selectedBank"
                value={formik.values.selectedBank}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:border-[#0066FF] focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="HDFC Bank">HDFC Bank</option>
                <option value="ICICI Bank">ICICI Bank</option>
                <option value="State Bank of India">State Bank of India</option>
                <option value="Axis Bank">Axis Bank</option>
                <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
              </select>
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Sandbox Test Triggers</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleTestCardClick('4242 4242 4242 4242')}
                className="py-1.5 px-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition text-left cursor-pointer font-medium"
              >
                ✓ Success (4242)
              </button>
              <button
                type="button"
                onClick={() => handleTestCardClick('4000 0000 0000 0002')}
                className="py-1.5 px-2 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg hover:bg-rose-100 transition text-left cursor-pointer font-medium"
              >
                ✗ Decline (0002)
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={processing}
            className="w-full py-3.5 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] active:scale-95 font-bold text-white text-sm transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer hover-lift"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Pay <MoneyFormat amount={session.amount} currency={session.currency} /></span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

