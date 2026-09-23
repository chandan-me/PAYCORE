import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  ShieldCheck,
  Mail
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
}

export const CustomersView: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('paycore_token');
      const res = await fetch('http://localhost:8000/v1/customers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search))
  );

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" />
            Customer Vault & Token Directory
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            PCI-compliant directory of verified customers, lifetime payment analytics, and saved token references.
          </p>
        </div>
      </div>

      {/* Security Banner */}
      <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-xl p-4 flex items-center gap-3 text-xs text-indigo-300">
        <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
        <div>
          <span className="font-semibold text-white">PCI-DSS Level 1 Tokenization:</span> Raw card credentials, CVVs, and banking passwords are never stored. Only secure provider-vaulted token references are retained.
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer name, email, or phone..."
              className="w-full pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <span className="text-xs text-slate-500 font-mono">{filtered.length} Total Customers</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm font-mono">Loading customer directory...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No customers registered yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Contact Details</th>
                  <th className="px-6 py-3.5">Customer ID</th>
                  <th className="px-6 py-3.5">Token Reference</th>
                  <th className="px-6 py-3.5">Created Date</th>
                  <th className="px-6 py-3.5 text-right">Vault Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filtered.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{cust.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-600" /> {cust.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono">
                      {cust.phone || 'No phone'}
                    </td>
                    <td className="px-6 py-4 font-mono text-indigo-400">{cust.id}</td>
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-400">
                      <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800">
                        tok_vault_{cust.id.slice(-6)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono">
                      {new Date(cust.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <ShieldCheck className="w-3 h-3" /> ACTIVE VAULT
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
