import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldCheck, Lock, CreditCard, Smartphone, Building2, CheckCircle2, XCircle, Loader2, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { MoneyFormat } from '../components/MoneyFormat';

export const HostedCheckout: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState<'CARD' | 'UPI' | 'NET_BANKING'>('CARD');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expDate, setExpDate] = useState('12/30');
  const [cvv, setCvv] = useState('123');
  const [cardHolder, setCardHolder] = useState('Sarah Connor');
  const [upiVpa, setUpiVpa] = useState('sarah@okicici');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

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

  const handlePayment = async (scenarioCard?: string) => {
    if (!data) return;
    setProcessing(true);
    setError('');

    const targetCard = scenarioCard || cardNumber;
    const paymentDetails = activeTab === 'CARD'
      ? { card_number: targetCard, exp_date: expDate, cvv, card_holder: cardHolder }
      : { upi_vpa: upiVpa, bank: selectedBank };

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
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
        <span className="text-sm font-medium">Securing payment connection...</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card p-6 rounded-2xl text-center">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-100 mb-1">Checkout Unavailable</h2>
          <p className="text-sm text-slate-400 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  const { session, merchant, payment_intent } = data;

  if (paymentResult?.status === 'SUCCEEDED') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card p-8 rounded-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Payment Successful</h2>
            <p className="text-xs text-slate-400 mt-1">Transaction confirmed & posted to ledger</p>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-xl text-left space-y-2 border border-slate-800 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Amount Paid</span>
              <MoneyFormat amount={session.amount} currency={session.currency} className="font-bold text-white" />
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Payment ID</span>
              <span className="font-mono text-slate-300">{payment_intent.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Merchant</span>
              <span className="text-slate-200">{merchant.business_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status</span>
              <span className="text-emerald-400 font-semibold">SUCCEEDED</span>
            </div>
          </div>

          <a
            href={session.success_url}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-500/20"
          >
            <span>Return to Merchant</span>
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg mb-3 flex items-center justify-between text-xs text-slate-400 px-1">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>PAYCORE Encrypted Checkout</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-700 text-amber-400 font-mono text-[10px] font-bold">
          SANDBOX TEST MODE
        </span>
      </div>

      <div className="w-full max-w-lg glass-card rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
        <div className="p-6 border-b border-slate-800/80 bg-gradient-to-br from-slate-900 to-indigo-950/40">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-indigo-400 tracking-wide uppercase">Merchant</span>
              <h1 className="text-xl font-bold text-white">{merchant.business_name}</h1>
              <p className="text-xs text-slate-400 mt-0.5">{session.description || 'Order #1001'}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Total Amount</span>
              <MoneyFormat amount={session.amount} currency={session.currency} className="text-2xl font-black text-white" />
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('CARD')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'CARD' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Card</span>
            </button>
            <button
              onClick={() => setActiveTab('UPI')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'UPI' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>UPI</span>
            </button>
            <button
              onClick={() => setActiveTab('NET_BANKING')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'NET_BANKING' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Net Banking</span>
            </button>
          </div>

          {activeTab === 'CARD' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                  placeholder="4242 4242 4242 4242"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Expiry Date</label>
                  <input
                    type="text"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                    placeholder="MM/YY"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">CVV</label>
                  <input
                    type="password"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                    placeholder="123"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Cardholder Name</label>
                <input
                  type="text"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'UPI' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">UPI ID / VPA</label>
              <input
                type="text"
                value={upiVpa}
                onChange={(e) => setUpiVpa(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                placeholder="username@bank"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">Enter any VPA. Use 'fail@upi' to simulate failed UPI payment.</p>
            </div>
          )}

          {activeTab === 'NET_BANKING' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Select Bank</label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="HDFC Bank">HDFC Bank</option>
                <option value="ICICI Bank">ICICI Bank</option>
                <option value="State Bank of India">State Bank of India</option>
                <option value="Axis Bank">Axis Bank</option>
              </select>
            </div>
          )}

          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Sandbox Test Triggers</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handlePayment('4242424242424242')}
                className="py-1.5 px-2 bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 rounded-lg hover:bg-emerald-900/50 transition text-left"
              >
                ✓ Success (4242)
              </button>
              <button
                type="button"
                onClick={() => handlePayment('4000000000000002')}
                className="py-1.5 px-2 bg-rose-950/60 text-rose-400 border border-rose-800/50 rounded-lg hover:bg-rose-900/50 transition text-left"
              >
                ✗ Insufficient Funds (0002)
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/50 text-rose-400 text-xs flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={() => handlePayment()}
            disabled={processing}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 font-bold text-white text-sm transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Pay <MoneyFormat amount={session.amount} currency={session.currency} /></span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
