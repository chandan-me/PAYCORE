import React, { useState } from 'react';
import { Copy, Check, Terminal, ShieldCheck } from 'lucide-react';

export const ApiDocsPage: React.FC = () => {
  const [copiedLang, setCopiedLang] = useState<string | null>(null);

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

  const copyCode = (code: string, lang: string) => {
    navigator.clipboard.writeText(code);
    setCopiedLang(lang);
    setTimeout(() => setCopiedLang(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 max-w-5xl mx-auto space-y-8 font-sans">
      <div>
        <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-bold uppercase mb-1">
          <Terminal className="w-4 h-4" />
          <span>Developer API Reference</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">PAYCORE REST API v1</h1>
        <p className="text-sm text-slate-400 mt-1">Integrate custom payment intents, checkout sessions, and webhooks in minutes.</p>
      </div>

      <div className="glass-card p-6 rounded-2xl border-indigo-500/30 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>Authentication</span>
        </h3>
        <p className="text-xs text-slate-300">
          Authenticate your API requests by including your secret API key in the <code className="text-indigo-300 font-mono">Authorization</code> HTTP header:
        </p>
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400">
          Authorization: Bearer sk_test_acmedemo987654321
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Create a Payment Intent</h2>
        <p className="text-xs text-slate-400">
          Amounts must always be specified as <strong>positive integer minor units</strong> (e.g. 149900 paise = ₹1,499.00 or 1099 cents = $10.99).
        </p>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-xs font-mono text-slate-400">
            <span>cURL Command</span>
            <button
              onClick={() => copyCode(curlSnippet, 'curl')}
              className="flex items-center gap-1 hover:text-white transition"
            >
              {copiedLang === 'curl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLang === 'curl' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-indigo-300 overflow-x-auto bg-slate-950">{curlSnippet}</pre>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-xs font-mono text-slate-400">
            <span>Python (requests)</span>
            <button
              onClick={() => copyCode(pythonSnippet, 'python')}
              className="flex items-center gap-1 hover:text-white transition"
            >
              {copiedLang === 'python' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLang === 'python' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto bg-slate-950">{pythonSnippet}</pre>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-xs font-mono text-slate-400">
            <span>Node.js / JavaScript (fetch)</span>
            <button
              onClick={() => copyCode(jsSnippet, 'js')}
              className="flex items-center gap-1 hover:text-white transition"
            >
              {copiedLang === 'js' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLang === 'js' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-purple-300 overflow-x-auto bg-slate-950">{jsSnippet}</pre>
        </div>
      </div>
    </div>
  );
};
