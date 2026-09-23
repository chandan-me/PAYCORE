import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Copy,
  Check,
  Terminal,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { PaycoreLogo } from '../../components/PaycoreLogo';

export const ApiDocsPage: React.FC = () => {
  const navigate = useNavigate();
  const [copiedLang, setCopiedLang] = useState<string | null>(null);
  const [activeEndpoint, setActiveEndpoint] = useState<'intents' | 'sessions' | 'payouts' | 'webhooks'>('intents');

  const curlSnippet = `curl -X POST http://localhost:8000/v1/payment_intents \\
  -H "Authorization: Bearer sk_test_acmedemo987654321" \\
  -H "Idempotency-Key: order_10001" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 149900,
    "currency": "INR",
    "description": "Pro Annual Plan Subscription"
  }'`;

  const pythonSnippet = `import requests

url = "http://localhost:8000/v1/payment_intents"
headers = {
    "Authorization": "Bearer sk_test_acmedemo987654321",
    "Idempotency-Key": "order_10001",
    "Content-Type": "application/json"
}
payload = {
    "amount": 149900,  # ₹1,499.00 in integer minor units (paise)
    "currency": "INR",
    "description": "Pro Annual Plan Subscription"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;

  const jsSnippet = `const response = await fetch('http://localhost:8000/v1/payment_intents', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_test_acmedemo987654321',
    'Idempotency-Key': 'order_10001',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 149900, // ₹1,499.00 in integer minor units
    currency: 'INR',
    description: 'Pro Annual Plan Subscription'
  })
});

const intent = await response.json();
console.log(intent.client_secret);`;

  const payoutsSnippet = `curl -X POST http://localhost:8000/v1/payouts \\
  -H "Authorization: Bearer sk_test_acmedemo987654321" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 4500000,
    "currency": "INR",
    "beneficiary_name": "Acme Global Corp",
    "account_number": "918237461234",
    "ifsc": "HDFC0000123",
    "transfer_mode": "IMPS"
  }'`;

  const webhookSnippet = `// Node.js Express Webhook Handler with HMAC SHA-256 Signature Verification
import crypto from 'crypto';

app.post('/paycore-webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-paycore-signature'];
  const webhookSecret = process.env.PAYCORE_WEBHOOK_SECRET;

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(req.body)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(400).send('Invalid signature');
  }

  const event = JSON.parse(req.body);
  if (event.event_type === 'payment.succeeded') {
    // Fulfill customer order in database
    fulfillOrder(event.data.payment_intent_id);
  }

  res.json({ received: true });
});`;

  const copyCode = (code: string, lang: string) => {
    navigator.clipboard.writeText(code);
    setCopiedLang(lang);
    setTimeout(() => setCopiedLang(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col selection:bg-[#0066FF] selection:text-white">
      {/* Top Navbar */}
      <header className="h-20 border-b border-slate-200 px-4 sm:px-6 lg:px-12 flex items-center justify-between max-w-7xl w-full mx-auto sticky top-0 bg-white/95 backdrop-blur-md z-40">
        <div className="flex items-center gap-6">
          <div className="cursor-pointer" onClick={() => navigate('/')}>
            <PaycoreLogo size="md" subtitle="API DOCUMENTATION" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-[#0066FF] hover:bg-blue-50 transition cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
          <button
            onClick={() => navigate('/login')}
            className="hidden sm:inline-flex px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold text-white bg-[#0066FF] hover:bg-[#0052cc] shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-1.5 hover-lift"
          >
            <span>Get Sandbox Keys</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Documentation Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-12 py-8 space-y-8">
        {/* Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4 animate-fade-in-up">
          <div className="flex items-center gap-2 text-[#0066FF] font-mono text-xs font-bold uppercase">
            <Terminal className="w-4 h-4 text-[#0066FF]" />
            <span>Developer API Reference v1.0</span>
          </div>
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">PAYCORE REST API Engine</h1>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                Integrate payment intents, instant payouts, UPI AutoPay mandates, and webhooks with standard HTTP Bearer tokens and idempotency guarantees.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>API Status: Operational</span>
              </span>
            </div>
          </div>
        </div>

        {/* Authentication Box */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 animate-fade-in-up">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#0066FF]" />
            <span>Authentication Header</span>
          </h3>
          <p className="text-xs text-slate-600">
            Authenticate all requests by including your secret API key in the <code className="text-[#0066FF] bg-blue-50 px-1.5 py-0.5 rounded font-mono font-bold">Authorization</code> HTTP header:
          </p>
          <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 flex items-center justify-between overflow-x-auto">
            <span>Authorization: Bearer sk_test_acmedemo987654321</span>
            <button
              onClick={() => copyCode('Authorization: Bearer sk_test_acmedemo987654321', 'auth')}
              className="text-slate-400 hover:text-white p-1 rounded transition ml-4 cursor-pointer"
            >
              {copiedLang === 'auth' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* API Interactive Explorer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-3 bg-white p-3 rounded-2xl border border-slate-200 space-y-1 shadow-sm">
            <div className="text-[11px] font-mono text-slate-400 uppercase font-bold px-3 py-2">ENDPOINTS</div>
            <button
              onClick={() => setActiveEndpoint('intents')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                activeEndpoint === 'intents' ? 'bg-[#0066FF] text-white shadow-xs' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>Payment Intents</span>
              <span className="font-mono text-[10px] opacity-80">POST /v1</span>
            </button>
            <button
              onClick={() => setActiveEndpoint('sessions')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                activeEndpoint === 'sessions' ? 'bg-[#0066FF] text-white shadow-xs' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>Checkout Sessions</span>
              <span className="font-mono text-[10px] opacity-80">POST /v1</span>
            </button>
            <button
              onClick={() => setActiveEndpoint('payouts')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                activeEndpoint === 'payouts' ? 'bg-[#0066FF] text-white shadow-xs' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>Instant Payouts</span>
              <span className="font-mono text-[10px] opacity-80">POST /v1</span>
            </button>
            <button
              onClick={() => setActiveEndpoint('webhooks')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                activeEndpoint === 'webhooks' ? 'bg-[#0066FF] text-white shadow-xs' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>Webhook Signing</span>
              <span className="font-mono text-[10px] opacity-80">HMAC-256</span>
            </button>
          </div>

          {/* Code Viewer Panel */}
          <div className="lg:col-span-9 space-y-6">
            {activeEndpoint === 'intents' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-[#0066FF] font-mono text-xs font-bold">POST</span>
                    <span className="font-mono text-xs text-slate-800 font-bold">/v1/payment_intents</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Creates a new payment intent with automatic state transitions and minor unit integer calculations.
                  </p>
                </div>

                {/* cURL */}
                <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-md">
                  <div className="p-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-xs font-mono text-slate-400">
                    <span className="text-blue-400 font-bold">cURL Request</span>
                    <button
                      onClick={() => copyCode(curlSnippet, 'curl')}
                      className="flex items-center gap-1.5 hover:text-white transition cursor-pointer"
                    >
                      {copiedLang === 'curl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLang === 'curl' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-blue-200 overflow-x-auto">{curlSnippet}</pre>
                </div>

                {/* Python */}
                <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-md">
                  <div className="p-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-xs font-mono text-slate-400">
                    <span className="text-emerald-400 font-bold">Python SDK</span>
                    <button
                      onClick={() => copyCode(pythonSnippet, 'python')}
                      className="flex items-center gap-1.5 hover:text-white transition cursor-pointer"
                    >
                      {copiedLang === 'python' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLang === 'python' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto">{pythonSnippet}</pre>
                </div>

                {/* Node.js */}
                <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-md">
                  <div className="p-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-xs font-mono text-slate-400">
                    <span className="text-purple-400 font-bold">Node.js Fetch</span>
                    <button
                      onClick={() => copyCode(jsSnippet, 'js')}
                      className="flex items-center gap-1.5 hover:text-white transition cursor-pointer"
                    >
                      {copiedLang === 'js' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLang === 'js' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-purple-200 overflow-x-auto">{jsSnippet}</pre>
                </div>
              </div>
            )}

            {activeEndpoint === 'sessions' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-[#0066FF] font-mono text-xs font-bold">POST</span>
                    <span className="font-mono text-xs text-slate-800 font-bold">/v1/checkout/sessions</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Generates a hosted checkout URL for customers with full support for UPI QR, Cards, and Net Banking.
                  </p>
                </div>

                <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-md">
                  <div className="p-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-xs font-mono text-slate-400">
                    <span className="text-blue-400 font-bold">Hosted Checkout Session Creation</span>
                    <button
                      onClick={() => copyCode(curlSnippet, 'session-curl')}
                      className="flex items-center gap-1.5 hover:text-white transition cursor-pointer"
                    >
                      {copiedLang === 'session-curl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLang === 'session-curl' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-blue-200 overflow-x-auto">{`curl -X POST http://localhost:8000/v1/checkout/sessions \\
  -H "Authorization: Bearer sk_test_acmedemo987654321" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 249900,
    "currency": "INR",
    "customer_email": "buyer@example.com",
    "success_url": "https://yoursite.com/orders/success?session_id={CHECKOUT_SESSION_ID}",
    "cancel_url": "https://yoursite.com/cart"
  }'`}</pre>
                </div>
              </div>
            )}

            {activeEndpoint === 'payouts' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-mono text-xs font-bold">POST</span>
                    <span className="font-mono text-xs text-slate-800 font-bold">/v1/payouts</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Disburse instant bank transfers 24x7 via IMPS, NEFT, or RTGS with automatic double-entry balance locks.
                  </p>
                </div>

                <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-md">
                  <div className="p-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-xs font-mono text-slate-400">
                    <span className="text-emerald-400 font-bold">Instant Disbursal Request</span>
                    <button
                      onClick={() => copyCode(payoutsSnippet, 'payout')}
                      className="flex items-center gap-1.5 hover:text-white transition cursor-pointer"
                    >
                      {copiedLang === 'payout' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLang === 'payout' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto">{payoutsSnippet}</pre>
                </div>
              </div>
            )}

            {activeEndpoint === 'webhooks' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-[#6851FF] font-mono text-xs font-bold">HMAC</span>
                    <span className="font-mono text-xs text-slate-800 font-bold">X-Paycore-Signature</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Every webhook payload is cryptographically signed using your merchant webhook secret and HMAC-SHA256.
                  </p>
                </div>

                <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-md">
                  <div className="p-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-xs font-mono text-slate-400">
                    <span className="text-purple-400 font-bold">Webhook Verifier (Node.js)</span>
                    <button
                      onClick={() => copyCode(webhookSnippet, 'webhook')}
                      className="flex items-center gap-1.5 hover:text-white transition cursor-pointer"
                    >
                      {copiedLang === 'webhook' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLang === 'webhook' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-purple-200 overflow-x-auto">{webhookSnippet}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 px-4 sm:px-6 lg:px-12 max-w-7xl w-full mx-auto text-xs text-slate-500 space-y-4 bg-white mt-12">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="cursor-pointer" onClick={() => navigate('/')}>
            <PaycoreLogo size="sm" subtitle="DEVELOPER HUB" />
          </div>
          <div className="flex gap-4">
            <button onClick={() => navigate('/')} className="hover:text-[#0066FF] cursor-pointer">Home</button>
            <button onClick={() => navigate('/login')} className="hover:text-[#0066FF] cursor-pointer">Sign In</button>
            <button onClick={() => navigate('/register')} className="hover:text-[#0066FF] cursor-pointer">Sandbox Console</button>
          </div>
        </div>
        <div className="text-center text-[11px] text-slate-400">
          © 2026 PAYCORE Technologies Inc. Powered by Cashfree Architecture & RESTful API Engine.
        </div>
      </footer>
    </div>
  );
};

