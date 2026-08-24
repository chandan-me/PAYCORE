import React, { useState } from 'react';
import { CheckCircle2, ChevronRight, Building2, ShieldCheck, CreditCard, Key, Rocket } from 'lucide-react';
import api from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';

interface Props {
  merchant: any;
  onRefresh: () => void;
}

export const MerchantOnboardingView: React.FC<Props> = ({ merchant, onRefresh }) => {
  const currentStep = merchant?.onboarding_step || 1;
  const [legalName, setLegalName] = useState(merchant?.legal_business_name || '');
  const [taxId, setTaxId] = useState(merchant?.tax_id || '');
  const [website, setWebsite] = useState(merchant?.website || '');
  const [loading, setLoading] = useState(false);

  const steps = [
    { num: 1, label: 'Account', desc: 'Owner registration & email verification', icon: Building2 },
    { num: 2, label: 'Business', desc: 'Legal entity details & business website', icon: Building2 },
    { num: 3, label: 'Verification', desc: 'Tax identification & KYC documents', icon: ShieldCheck },
    { num: 4, label: 'Settlement', desc: 'Bank account payouts configuration', icon: CreditCard },
    { num: 5, label: 'API Setup', desc: 'Developer keys & Webhook endpoints', icon: Key },
    { num: 6, label: 'Go Live', desc: 'Compliance signoff & production readiness', icon: Rocket },
  ];

  const handleAdvance = async (targetStep: number) => {
    setLoading(true);
    try {
      await api.post('/merchants/onboarding/step', {
        step: targetStep,
        status: targetStep === 6 ? 'VERIFIED' : 'UNDER_REVIEW',
        data: { legal_business_name: legalName, tax_id: taxId, website }
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white tracking-tight">Merchant Onboarding Wizard</h1>
          <StatusBadge status={merchant?.onboarding_status || 'PROFILE_INCOMPLETE'} />
        </div>
        <p className="text-xs text-slate-400 mt-0.5">Complete account verification to unlock production settlement capabilities</p>
      </div>

      {/* Progress Steps Header */}
      <div className="grid grid-cols-6 gap-2">
        {steps.map(s => {
          const isDone = s.num < currentStep;
          const isCurrent = s.num === currentStep;
          return (
            <div
              key={s.num}
              className={`p-3 rounded-xl border text-center transition-all ${
                isDone
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : isCurrent
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <div className="text-[10px] font-mono uppercase font-bold mb-1">Step {s.num}</div>
              <div className="text-xs font-bold truncate">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Step Content Card */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
            {currentStep}
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{steps[currentStep - 1]?.label} Verification</h3>
            <p className="text-xs text-slate-400">{steps[currentStep - 1]?.desc}</p>
          </div>
        </div>

        {currentStep <= 2 && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Legal Business Name</label>
              <input
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="Acme Technologies Pvt Ltd"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Business Website</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://acme.example.com"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Tax Identification Number (GSTIN / EIN / VAT)</label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="29ABCDE1234F1Z5"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
          </div>
        )}

        {currentStep >= 4 && (
          <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Sandbox verification automatically approved! Production settlement node ready for activation.</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          {currentStep < 6 ? (
            <button
              onClick={() => handleAdvance(currentStep + 1)}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition"
            >
              <span>Save & Continue to Step {currentStep + 1}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Merchant Onboarding Fully Complete & Verified!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
