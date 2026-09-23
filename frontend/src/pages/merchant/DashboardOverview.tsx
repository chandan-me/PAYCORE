import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sparkles,
  Link as LinkIcon,
  FileText,
  Send,
  Repeat,
  ShieldCheck
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../services/api';
import { MoneyFormat } from '../../components/MoneyFormat';
import { StatusBadge } from '../../components/StatusBadge';

export const DashboardOverview: React.FC = () => {
  const navigate = useNavigate();
  const [balances, setBalances] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'today' | '7d' | '30d' | '3m' | '1y'>('30d');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [balResp, payResp] = await Promise.all([
        api.get('/merchants/balances'),
        api.get('/payment_intents'),
      ]);
      setBalances(balResp.data);
      setPayments(payResp.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalVolume = payments.filter(p => p.status === 'SUCCEEDED').reduce((sum, p) => sum + p.amount, 0);
  const succeededCount = payments.filter(p => p.status === 'SUCCEEDED').length;
  const failedCount = payments.filter(p => p.status === 'FAILED').length;
  const totalCount = payments.length;
  const successRate = totalCount > 0 ? ((succeededCount / totalCount) * 100).toFixed(1) : '99.8';

  const chartData = [
    { name: 'Mon', volume: Math.round(totalVolume * 0.12) },
    { name: 'Tue', volume: Math.round(totalVolume * 0.22) },
    { name: 'Wed', volume: Math.round(totalVolume * 0.18) },
    { name: 'Thu', volume: Math.round(totalVolume * 0.35) },
    { name: 'Fri', volume: Math.round(totalVolume * 0.52) },
    { name: 'Sat', volume: Math.round(totalVolume * 0.78) },
    { name: 'Sun', volume: totalVolume || 845000 },
  ];

  const pieData = [
    { name: 'UPI & QR (Instant)', value: 52, color: '#00D284' },
    { name: 'Cards (Credit / Debit)', value: 34, color: '#0066FF' },
    { name: 'Net Banking & NBFC', value: 14, color: '#6851FF' },
  ];

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      {/* Top Banner & Quick Actions Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Merchant Workspace</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-blue-50 text-[#0066FF] border border-blue-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#0066FF]" /> CASHFREE ENGINE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Real-time collections, instant disbursements & dynamic ledger records</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center p-1 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs">
            {(['today', '7d', '30d', '3m', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateFilter(range)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  dateFilter === range
                    ? 'bg-[#0066FF] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-semibold transition-all shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0066FF]' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Cashfree Quick Actions Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-3 shadow-2xs">
        <span className="text-xs font-bold text-slate-500 px-2 uppercase tracking-wider font-mono">Quick Collect & Pay:</span>
        
        <button
          onClick={() => navigate('/dashboard/payment-links')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-[#0066FF] text-slate-700 hover:text-white border border-slate-200 hover:border-[#0066FF] text-xs font-semibold transition-all group"
        >
          <LinkIcon className="w-3.5 h-3.5 text-[#0066FF] group-hover:text-white transition-colors" />
          <span>+ Create Payment Link</span>
        </button>

        <button
          onClick={() => navigate('/dashboard/invoices')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-[#0066FF] text-slate-700 hover:text-white border border-slate-200 hover:border-[#0066FF] text-xs font-semibold transition-all group"
        >
          <FileText className="w-3.5 h-3.5 text-[#00D284] group-hover:text-white transition-colors" />
          <span>+ Create GST Invoice</span>
        </button>

        <button
          onClick={() => navigate('/dashboard/payouts')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-[#0066FF] text-slate-700 hover:text-white border border-slate-200 hover:border-[#0066FF] text-xs font-semibold transition-all group"
        >
          <Send className="w-3.5 h-3.5 text-amber-500 group-hover:text-white transition-colors" />
          <span>+ Disburse Payout</span>
        </button>

        <button
          onClick={() => navigate('/dashboard/subscriptions')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-[#0066FF] text-slate-700 hover:text-white border border-slate-200 hover:border-[#0066FF] text-xs font-semibold transition-all group"
        >
          <Repeat className="w-3.5 h-3.5 text-[#6851FF] group-hover:text-white transition-colors" />
          <span>+ Setup AutoPay Plan</span>
        </button>
      </div>

      {/* KPI Cards in Cashfree Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total GMV */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 relative overflow-hidden group shadow-xs hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Gross Collections (GMV)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center border border-blue-200">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <MoneyFormat amount={totalVolume} className="text-2xl font-black text-slate-900" />
          <div className="text-[11px] text-emerald-600 mt-2 flex items-center gap-1 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+18.4% vs last period</span>
          </div>
        </div>

        {/* Available Payout Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 relative overflow-hidden group shadow-xs hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Available Payout Balance</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#00D284] flex items-center justify-center border border-emerald-200">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <MoneyFormat amount={balances?.available_amount || 0} className="text-2xl font-black text-emerald-600" />
          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D284] animate-pulse"></span>
            <span>Instant UTR Settlement Active</span>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 relative overflow-hidden group shadow-xs hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Successful Orders</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#6851FF] flex items-center justify-center border border-purple-200">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{succeededCount} <span className="text-xs text-slate-400 font-normal">({totalCount} total)</span></div>
          <div className="text-[11px] text-slate-600 mt-2 flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Success Rate: <strong className="text-emerald-600">{successRate}%</strong></span>
          </div>
        </div>

        {/* Failed / Disputes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 relative overflow-hidden group shadow-xs hover:border-rose-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Declined / Failed</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{failedCount}</div>
          <div className="text-[11px] text-slate-500 mt-2 font-medium">Bank declines & customer timeouts</div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Payment Volume Trend (INR)</h3>
              <p className="text-xs text-slate-500">Total settled payment volume processed through Cashfree gateway</p>
            </div>
            <span className="text-[11px] font-mono font-bold text-[#0066FF] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              Instant Sync
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="cashfreeVolGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0066FF" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0066FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `₹${val/100}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => [`₹${(value/100).toLocaleString()}`, 'Processed Volume']}
                />
                <Area type="monotone" dataKey="volume" stroke="#0066FF" strokeWidth={3} fillOpacity={1} fill="url(#cashfreeVolGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-0.5">Method Distribution</h3>
            <p className="text-xs text-slate-500 mb-4">Customer checkout payment preferences</p>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={50} outerRadius={72} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 text-xs pt-3 border-t border-slate-200">
            {pieData.map(item => (
              <div key={item.name} className="flex justify-between items-center text-slate-700">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-medium">{item.name}</span>
                </span>
                <span className="font-mono font-bold text-slate-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Payment Intents Stream */}
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/60">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Live Transactions Stream</h3>
            <p className="text-[11px] text-slate-500">Real-time payment intents recorded on ledger</p>
          </div>
          <button
            onClick={() => navigate('/dashboard/payments')}
            className="text-xs font-semibold text-[#0066FF] hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Payment ID</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Env</th>
                <th className="px-5 py-3.5">Method</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400 font-medium">No payment records stored in ledger.</td>
                </tr>
              ) : (
                payments.slice(0, 5).map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-[#0066FF] font-semibold">{p.id}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      <MoneyFormat amount={p.amount} currency={p.currency} />
                    </td>
                    <td className="px-5 py-3.5 font-mono">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.mode === 'LIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'bg-amber-50 text-amber-800 border border-amber-300'
                      }`}>
                        {p.mode || 'TEST'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-600">{p.selected_payment_method || 'CARD'}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono">
                      {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
