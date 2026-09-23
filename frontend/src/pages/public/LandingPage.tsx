import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Zap,
  ArrowRight,
  CreditCard,
  Smartphone,
  Building2,
  RefreshCw,
  FileText,
  Link as LinkIcon,
  CheckCircle2,
  Copy,
  ChevronDown,
  Lock,
  Check,
  Calculator,
  Star
} from 'lucide-react';
import { PaycoreLogo } from '../../components/PaycoreLogo';
import { Fintech3DHero } from '../../components/Fintech3DHero';
import { StylishLandingNavbar } from '../../components/StylishLandingNavbar';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'collect' | 'payouts' | 'subs' | 'links'>('collect');
  const [codeLang, setCodeLang] = useState<'curl' | 'node' | 'python' | 'php' | 'go'>('curl');
  const [copiedCode, setCopiedCode] = useState(false);
  
  // Interactive Volume Savings Calculator
  const [monthlyVolume, setMonthlyVolume] = useState<number>(2500000); // 25 Lakhs
  const traditionalFees = Math.round(monthlyVolume * 0.02);
  const paycoreFees = Math.round(monthlyVolume * 0.015);
  const monthlySavings = traditionalFees - paycoreFees;
  const annualSavings = monthlySavings * 12;

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const codeSnippets = {
    curl: `curl -X POST https://api.paycore.dev/v1/payment-intents \\
  -H "Authorization: Bearer sk_test_987654321" \\
  -H "Idempotency-Key: order_tx_88921" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 249900,
    "currency": "INR",
    "customer": { "email": "sarah@acmecorp.com" },
    "payment_methods": ["card", "upi", "netbanking"]
  }'`,
    node: `import Paycore from '@paycore/node';

const paycore = new Paycore('sk_test_987654321');

const intent = await paycore.paymentIntents.create({
  amount: 249900, // INR 2,499.00
  currency: 'INR',
  customer: { email: 'sarah@acmecorp.com' },
  allowed_methods: ['CARD', 'UPI', 'NETBANKING'],
  idempotency_key: 'order_tx_88921'
});`,
    python: `import paycore

paycore.api_key = "sk_test_987654321"

intent = paycore.PaymentIntent.create(
    amount=249900,  # INR 2,499.00 in integer minor units
    currency="INR",
    customer={"email": "sarah@acmecorp.com"},
    payment_methods=["CARD", "UPI", "NETBANKING"],
    idempotency_key="order_tx_88921"
)`,
    php: `<?php
$paycore = new \\Paycore\\Client('sk_test_987654321');

$intent = $paycore->paymentIntents->create([
  'amount' => 249900,
  'currency' => 'INR',
  'customer' => ['email' => 'sarah@acmecorp.com'],
  'payment_methods' => ['CARD', 'UPI', 'NETBANKING']
]);`,
    go: `package main

import (
    "github.com/paycore/paycore-go"
)

func main() {
    client := paycore.NewClient("sk_test_987654321")
    intent, err := client.PaymentIntents.Create(&paycore.PaymentIntentParams{
        Amount:   249900,
        Currency: "INR",
        Customer: paycore.CustomerParams{Email: "sarah@acmecorp.com"},
    })
}`
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[codeLang]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const faqs = [
    {
      q: 'How fast can our team go live with PAYCORE?',
      a: 'You can generate sandbox API keys instantly upon registration. Once your digital KYC is verified, you can switch from Test to Live mode and accept production payments within 24 hours.'
    },
    {
      q: 'How does PAYCORE Instant Payouts work?',
      a: 'Payouts are executed directly via IMPS and UPI bank rails 24x7, even on bank holidays. Disbursals complete in sub-2-second latency with real-time UTR tracking and automated double-entry ledger debiting.'
    },
    {
      q: 'Is PAYCORE compliant with RBI UPI AutoPay 2.0 regulations?',
      a: 'Yes. PAYCORE is fully compliant with RBI e-mandate guidelines, featuring automated pre-debit notifications (24h prior), customer mandate management, and flexible billing cycles (daily, weekly, monthly, annual).'
    },
    {
      q: 'What is the pricing model?',
      a: 'PAYCORE offers transparent pricing: 0% fee on UPI QR, 1.5% on standard debit/credit cards and net banking, with volume discounts for enterprise merchants processing over ₹10 Lakhs monthly.'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-[#0066FF] selection:text-white">
      {/* Ultra-Stylish Mega Navbar */}
      <StylishLandingNavbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 lg:py-20 space-y-20 sm:space-y-28">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#0066FF] text-xs font-semibold shadow-xs">
              <Zap className="w-3.5 h-3.5 text-[#0066FF] animate-pulse" />
              <span>Full-Stack Payment & API Banking Infrastructure</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
              Built for businesses that{' '}
              <span className="bg-gradient-to-r from-[#0066FF] via-blue-600 to-[#6851FF] bg-clip-text text-transparent">
                scale fast.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
              Accept payments across 120+ modes, disburse instant bank payouts 24x7, collect recurring subscriptions via UPI AutoPay, and automate double-entry ledger reconciliation.
            </p>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
              <button
                onClick={() => navigate('/register')}
                className="px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] font-bold text-white text-sm shadow-md shadow-blue-600/25 flex items-center gap-2 transition cursor-pointer hover-lift"
              >
                <span>Get Started Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/docs/api')}
                className="px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-800 font-bold text-sm transition cursor-pointer shadow-xs hover-lift"
              >
                Explore API Docs
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>PCI-DSS Level 1 Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>99.99% Gateway Uptime</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero Latency Ledger</span>
              </div>
            </div>
          </div>

          {/* Hero Right: 3D Holographic Fintech Visualizer */}
          <div className="lg:col-span-5 animate-scale-in flex items-center justify-center">
            <Fintech3DHero />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-y border-slate-200 bg-slate-50/70 rounded-2xl animate-fade-in-up">
          <div className="p-4 text-center hover-lift">
            <div className="text-2xl sm:text-4xl font-black text-slate-900">₹1,50,000+ Cr</div>
            <div className="text-xs text-slate-500 mt-1 font-semibold">Processed Annually</div>
          </div>
          <div className="p-4 text-center hover-lift">
            <div className="text-2xl sm:text-4xl font-black text-[#0066FF]">120+</div>
            <div className="text-xs text-slate-500 mt-1 font-semibold">Payment Modes Supported</div>
          </div>
          <div className="p-4 text-center hover-lift">
            <div className="text-2xl sm:text-4xl font-black text-emerald-600">99.99%</div>
            <div className="text-xs text-slate-500 mt-1 font-semibold">Uptime Guarantee</div>
          </div>
          <div className="p-4 text-center hover-lift">
            <div className="text-2xl sm:text-4xl font-black text-[#6851FF]">&lt; 100ms</div>
            <div className="text-xs text-slate-500 mt-1 font-semibold">API Response Latency</div>
          </div>
        </div>

        {/* Live Interactive Cashfree Sandbox Simulator */}
        <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50/40 rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-6 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="text-[11px] font-mono text-[#0066FF] font-bold uppercase tracking-wider">INTERACTIVE SIMULATION</div>
              <h2 className="text-2xl font-black text-slate-900 mt-0.5">Live Checkout & Disbursals Sandbox</h2>
            </div>
            <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>TESTNET v2.0 CONNECTED</span>
            </span>
          </div>

          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-xl relative hover:border-blue-300 transition-all">
            {/* Interactive Tabs */}
            <div className="grid grid-cols-4 gap-1.5 mb-5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setActiveTab('collect')}
                className={`py-2 text-center rounded-lg font-bold transition cursor-pointer ${
                  activeTab === 'collect' ? 'bg-[#0066FF] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Collect
              </button>
              <button
                onClick={() => setActiveTab('payouts')}
                className={`py-2 text-center rounded-lg font-bold transition cursor-pointer ${
                  activeTab === 'payouts' ? 'bg-[#0066FF] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Payouts
              </button>
              <button
                onClick={() => setActiveTab('subs')}
                className={`py-2 text-center rounded-lg font-bold transition cursor-pointer ${
                  activeTab === 'subs' ? 'bg-[#0066FF] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                AutoPay
              </button>
              <button
                onClick={() => setActiveTab('links')}
                className={`py-2 text-center rounded-lg font-bold transition cursor-pointer ${
                  activeTab === 'links' ? 'bg-[#0066FF] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Links
              </button>
            </div>

            {/* Tab Content Display */}
            {activeTab === 'collect' && (
              <div className="space-y-3 animate-fade-in">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Order Amount</span>
                  <span className="text-lg font-black text-slate-900">₹2,499.00</span>
                </div>

                <div className="space-y-2">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900 hover-lift">
                    <div className="flex items-center gap-2.5">
                      <Smartphone className="w-4 h-4 text-[#0066FF]" />
                      <span className="font-semibold">UPI QR & Apps (GPay, PhonePe, Paytm)</span>
                    </div>
                    <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono">0% FEE</span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-700 hover-lift">
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="w-4 h-4 text-indigo-500" />
                      <span className="font-medium">Credit / Debit Cards (Visa, RuPay, MC)</span>
                    </div>
                    <span className="text-slate-400 text-[10px] font-mono">Instant</span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-700 hover-lift">
                    <div className="flex items-center gap-2.5">
                      <Building2 className="w-4 h-4 text-purple-500" />
                      <span className="font-medium">Net Banking (50+ Indian Banks)</span>
                    </div>
                    <span className="text-slate-400 text-[10px] font-mono">Instant</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/register')}
                  className="w-full py-3.5 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition cursor-pointer hover-lift"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Test Instant Checkout in Sandbox</span>
                </button>
              </div>
            )}

            {activeTab === 'payouts' && (
              <div className="space-y-3 text-xs animate-fade-in">
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-emerald-800 font-bold">24x7 INSTANT DISBURSAL</div>
                    <div className="text-base font-black text-slate-900 mt-0.5">₹45,000.00</div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                    UTR: 908123476
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Beneficiary</span>
                    <span className="text-slate-900 font-bold">Acme Global Ltd</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Method</span>
                    <span className="text-emerald-700 font-mono font-bold">IMPS Transfer</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Status</span>
                    <span className="text-emerald-700 font-bold">POSTED TO LEDGER</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/register')}
                  className="w-full py-3.5 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition cursor-pointer hover-lift"
                >
                  <span>Try Payouts API in Sandbox</span>
                </button>
              </div>
            )}

            {activeTab === 'subs' && (
              <div className="space-y-3 text-xs animate-fade-in">
                <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-indigo-800 font-bold">UPI AUTOPAY MANDATE</div>
                    <div className="text-base font-black text-slate-900 mt-0.5">₹999.00 / month</div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-indigo-100 text-indigo-800 font-mono text-[10px] font-bold">
                    ACTIVE
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="text-slate-600 flex justify-between">
                    <span>Protocol</span>
                    <span className="text-slate-900 font-mono font-semibold">UPI-AUTOPAY-V2</span>
                  </div>
                  <div className="text-slate-600 flex justify-between">
                    <span>Next Cycle</span>
                    <span className="text-slate-800 font-medium">1st of every month</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/register')}
                  className="w-full py-3.5 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition cursor-pointer hover-lift"
                >
                  <span>Create Recurring Plan</span>
                </button>
              </div>
            )}

            {activeTab === 'links' && (
              <div className="space-y-3 text-xs animate-fade-in">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-slate-600 flex items-center justify-between">
                    <span>Payment Link Generated</span>
                    <span className="text-emerald-700 font-mono text-[11px] font-bold">ACTIVE</span>
                  </div>
                  <div className="p-2.5 bg-white border border-slate-200 rounded font-mono text-[11px] text-[#0066FF] truncate">
                    https://paycore.dev/pay/plink_998124
                  </div>
                </div>

                <button
                  onClick={() => navigate('/register')}
                  className="w-full py-3.5 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition cursor-pointer hover-lift"
                >
                  <span>Create Free Payment Link</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-y border-slate-200 bg-slate-50/70 rounded-2xl animate-fade-in-up">
          <div className="p-4 text-center hover-lift">
            <div className="text-2xl sm:text-4xl font-black text-slate-900">₹1,50,000+ Cr</div>
            <div className="text-xs text-slate-500 mt-1 font-semibold">Processed Annually</div>
          </div>
          <div className="p-4 text-center hover-lift">
            <div className="text-2xl sm:text-4xl font-black text-[#0066FF]">120+</div>
            <div className="text-xs text-slate-500 mt-1 font-semibold">Payment Modes Supported</div>
          </div>
          <div className="p-4 text-center hover-lift">
            <div className="text-2xl sm:text-4xl font-black text-emerald-600">99.99%</div>
            <div className="text-xs text-slate-500 mt-1 font-semibold">Uptime Guarantee</div>
          </div>
          <div className="p-4 text-center hover-lift">
            <div className="text-2xl sm:text-4xl font-black text-[#6851FF]">&lt; 100ms</div>
            <div className="text-xs text-slate-500 mt-1 font-semibold">API Response Latency</div>
          </div>
        </div>

        {/* Product Suite Matrix */}
        <div id="products" className="space-y-8 animate-fade-in-up">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">The Complete Cashfree Product Suite</h2>
            <p className="text-xs sm:text-sm text-slate-500">Modular payment infrastructure engineered for high-throughput enterprises.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl space-y-3 border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all hover-lift">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center border border-blue-200">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Payment Gateway</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Accept credit cards, debit cards, UPI QR, net banking, and wallets with auto-retry and intelligent smart routing.
              </p>
            </div>

            <div id="payouts" className="bg-white p-6 rounded-2xl space-y-3 border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all hover-lift">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#00D284] flex items-center justify-center border border-emerald-200">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Instant Payouts 24x7</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Disburse vendor payments, payroll, refunds, and partner payouts instantly across IMPS, NEFT, RTGS, and UPI.
              </p>
            </div>

            <div id="subscriptions" className="bg-white p-6 rounded-2xl space-y-3 border border-slate-200 shadow-xs hover:shadow-md hover:border-purple-300 transition-all hover-lift">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#6851FF] flex items-center justify-center border border-purple-200">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Subscriptions & AutoPay</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automate recurring billing cycles with RBI-compliant UPI AutoPay, e-NACH mandates, and card subscriptions.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl space-y-3 border border-slate-200 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all hover-lift">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
                <LinkIcon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Shareable Payment Links</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generate branded hosted payment links in one click and share via WhatsApp, SMS, or Email with zero code needed.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl space-y-3 border border-slate-200 shadow-xs hover:shadow-md hover:border-cyan-300 transition-all hover-lift">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-200">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">GST Invoices & Billing</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Itemized GST compliance billing supporting CGST, SGST, and IGST with dynamic downloadable PDF invoices.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl space-y-3 border border-slate-200 shadow-xs hover:shadow-md hover:border-rose-300 transition-all hover-lift">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Dispute & Chargeback Shield</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Streamline bank rebuttal evidence submission, track chargeback deadlines, and defend transactions effortlessly.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Fee Savings / ROI Calculator */}
        <div id="calculator" className="bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/50 rounded-3xl p-6 sm:p-10 border border-blue-200 shadow-sm space-y-8 animate-fade-in-up">
          <div className="max-w-xl mx-auto text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-[#0066FF] text-xs font-bold font-mono">
              <Calculator className="w-3.5 h-3.5" />
              <span>SAVINGS CALCULATOR</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Calculate Your Processing Savings</h2>
            <p className="text-xs sm:text-sm text-slate-600">See how much your business saves every year with PAYCORE's zero hidden charges.</p>
          </div>

          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex justify-between items-center text-sm font-bold text-slate-800">
                <span>Monthly Transaction Volume</span>
                <span className="font-mono text-base text-[#0066FF]">₹{(monthlyVolume / 100000).toFixed(1)} Lakhs</span>
              </div>
              <input
                type="range"
                min="500000"
                max="50000000"
                step="500000"
                value={monthlyVolume}
                onChange={(e) => setMonthlyVolume(Number(e.target.value))}
                className="w-full accent-[#0066FF] cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>₹5 Lakhs</span>
                <span>₹25 Lakhs</span>
                <span>₹5 Crores</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center space-y-1">
                <div className="text-xs text-slate-500 font-semibold">Traditional Aggregators (2.0%)</div>
                <div className="text-xl font-bold text-slate-500">₹{traditionalFees.toLocaleString('en-IN')}/mo</div>
              </div>
              <div className="bg-blue-50 border border-blue-300 p-5 rounded-2xl text-center space-y-1">
                <div className="text-xs text-[#0066FF] font-bold">PAYCORE Optimized (1.5%)</div>
                <div className="text-2xl font-black text-[#0066FF]">₹{paycoreFees.toLocaleString('en-IN')}/mo</div>
                <div className="text-[11px] font-bold text-emerald-700 bg-emerald-100 py-0.5 px-2 rounded-full inline-block">
                  Save ₹{annualSavings.toLocaleString('en-IN')}/year
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Why PAYCORE Comparison Matrix */}
        <div id="comparison" className="space-y-6 animate-fade-in-up">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Why Businesses Choose PAYCORE</h2>
            <p className="text-xs sm:text-sm text-slate-500">Compare our next-generation architecture with legacy Indian aggregators.</p>
          </div>

          <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono text-[11px]">
                <tr>
                  <th className="p-4 sm:p-5">Feature</th>
                  <th className="p-4 sm:p-5 text-[#0066FF] font-bold">PAYCORE Engine</th>
                  <th className="p-4 sm:p-5 text-slate-500">Legacy Aggregators</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-slate-900">Multi-Gateway Smart Routing</td>
                  <td className="p-4 sm:p-5 text-emerald-600 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Real-time Health Switching (0 Failures)</span>
                  </td>
                  <td className="p-4 sm:p-5 text-slate-400">Single point of failure</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-slate-900">Instant Disbursals Latency</td>
                  <td className="p-4 sm:p-5 text-emerald-600 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>&lt; 2 Seconds (24x7 IMPS/UPI)</span>
                  </td>
                  <td className="p-4 sm:p-5 text-slate-400">T+1 or T+2 batch delays</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-slate-900">UPI AutoPay 2.0 Mandates</td>
                  <td className="p-4 sm:p-5 text-emerald-600 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Native RBI e-Mandate Framework</span>
                  </td>
                  <td className="p-4 sm:p-5 text-slate-400">Complex third-party add-ons</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-slate-900">Double-Entry Ledger</td>
                  <td className="p-4 sm:p-5 text-emerald-600 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Automated Zero-Latency Ledger</span>
                  </td>
                  <td className="p-4 sm:p-5 text-slate-400">Manual spreadsheet reconciliations</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Developer Integration Section */}
        <div id="developers" className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 lg:p-12 border border-slate-800 space-y-8 shadow-xl animate-fade-in-up">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
            <div>
              <div className="text-xs font-mono text-[#0066FF] font-bold uppercase tracking-wider">DEVELOPER-FIRST API</div>
              <h2 className="text-2xl lg:text-3xl font-black text-white mt-1">Integrate in minutes, not months</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-lg">
                RESTful APIs, idiomatic client SDKs, idempotency keys, and real-time HMAC SHA-256 signed webhooks.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setCodeLang('curl')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  codeLang === 'curl' ? 'bg-[#0066FF] text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                cURL
              </button>
              <button
                onClick={() => setCodeLang('node')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  codeLang === 'node' ? 'bg-[#0066FF] text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Node.js
              </button>
              <button
                onClick={() => setCodeLang('python')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  codeLang === 'python' ? 'bg-[#0066FF] text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Python
              </button>
              <button
                onClick={() => setCodeLang('php')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  codeLang === 'php' ? 'bg-[#0066FF] text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                PHP
              </button>
              <button
                onClick={() => setCodeLang('go')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  codeLang === 'go' ? 'bg-[#0066FF] text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Go
              </button>
            </div>
          </div>

          <div className="relative bg-slate-950 rounded-2xl p-5 border border-slate-800 font-mono text-xs overflow-x-auto text-slate-300">
            <button
              onClick={handleCopyCode}
              className="absolute top-4 right-4 p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>
            <pre className="pr-16">{codeSnippets[codeLang]}</pre>
          </div>
        </div>

        {/* Customer Testimonials */}
        <div className="space-y-6 animate-fade-in-up">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Loved by FinTech Leaders</h2>
            <p className="text-xs sm:text-sm text-slate-500">Trusted by fast-growing startups and enterprises across India.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover-lift">
              <div className="flex text-amber-400 gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "Switching our vendor payouts to PAYCORE reduced disbursal failures to virtually 0%. The ledger reconciliation is completely automated."
              </p>
              <div>
                <div className="font-bold text-xs text-slate-900">Vikramaditya Sharma</div>
                <div className="text-[11px] text-slate-400">CTO, QuickKart Hyperlocal</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover-lift">
              <div className="flex text-amber-400 gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "The UPI AutoPay mandate integration took us less than 2 hours with the Python SDK. Our recurring SaaS collections grew by 38%."
              </p>
              <div>
                <div className="font-bold text-xs text-slate-900">Ananya Sen</div>
                <div className="text-[11px] text-slate-400">Head of Engineering, CloudScale</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover-lift">
              <div className="flex text-amber-400 gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "Their dispute handling portal saved us lakhs in chargebacks with automated bank evidence generation."
              </p>
              <div>
                <div className="font-bold text-xs text-slate-900">Rohan Mehta</div>
                <div className="text-[11px] text-slate-400">Founder, StyleVogue D2C</div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div id="faq" className="space-y-6 max-w-3xl mx-auto animate-fade-in-up">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Frequently Asked Questions</h2>
            <p className="text-xs sm:text-sm text-slate-500">Everything you need to know about PAYCORE API banking.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between font-bold text-xs sm:text-sm text-slate-800 hover:text-[#0066FF] transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${openFaq === idx ? 'rotate-180 text-[#0066FF]' : 'text-slate-400'}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Banner */}
        <div className="bg-gradient-to-r from-[#0066FF] via-blue-600 to-[#6851FF] rounded-3xl p-6 sm:p-8 lg:p-14 text-center space-y-6 shadow-xl relative overflow-hidden animate-fade-in-up">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Ready to modernize your payment stack?
            </h2>
            <p className="text-xs sm:text-sm text-blue-100">
              Join thousands of businesses scaling their financial infrastructure with PAYCORE.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => navigate('/register')}
                className="px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl bg-white text-slate-900 font-black text-sm hover:bg-slate-50 shadow-md transition cursor-pointer inline-flex items-center gap-2 hover-lift"
              >
                <span>Create Free Account</span>
                <ArrowRight className="w-4 h-4 text-[#0066FF]" />
              </button>
              <button
                onClick={() => navigate('/docs/api')}
                className="px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl bg-blue-700/50 hover:bg-blue-700 text-white font-bold text-sm border border-blue-400/30 transition cursor-pointer hover-lift"
              >
                Read API Reference
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-10 px-4 sm:px-6 lg:px-12 max-w-7xl w-full mx-auto text-xs text-slate-500 space-y-6 bg-white">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="cursor-pointer" onClick={() => navigate('/')}>
            <PaycoreLogo size="sm" subtitle="CASHFREE PAYMENTS ENGINE" />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 font-medium">
            <a href="#products" className="hover:text-[#0066FF] transition">Payment Gateway</a>
            <a href="#calculator" className="hover:text-[#0066FF] transition">Pricing & Savings</a>
            <a href="#comparison" className="hover:text-[#0066FF] transition">Why PAYCORE</a>
            <a href="#developers" className="hover:text-[#0066FF] transition">SDKs</a>
            <button onClick={() => navigate('/docs/api')} className="hover:text-[#0066FF] transition cursor-pointer">API Docs</button>
            <button onClick={() => navigate('/login')} className="hover:text-[#0066FF] transition cursor-pointer">Merchant Login</button>
          </div>
        </div>
        <div className="text-center text-[11px] text-slate-400">
          © 2026 PAYCORE Technologies Inc. Powered by Cashfree Architecture & MySQL 8.0 Engine. All rights reserved.
        </div>
      </footer>
    </div>
  );
};
