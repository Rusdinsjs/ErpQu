import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  TrendingUp,
  Clock,
  Package,
  CreditCard,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Download,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import http from '../../../api/http';

export const WorkingCapitalDashboard: React.FC = () => {
  const [period, setPeriod] = useState<'MTD' | 'QTD' | 'YTD'>('YTD');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [data, setData] = useState<any>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await http.get('/api/analytics/working-capital');
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch working capital data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatIDR = (val: number) => {
    if (val >= 1_000_000_000) {
      return `Rp ${(val / 1_000_000_000).toFixed(2)} M`;
    }
    if (val >= 1_000_000) {
      return `Rp ${(val / 1_000_000).toFixed(1)} Jt`;
    }
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const metrics = data?.metrics || {
    cash_conversion_cycle_days: 61.3,
    days_sales_outstanding: 42.5,
    days_inventory_outstanding: 54.0,
    days_payable_outstanding: 35.2,
    total_receivables: 3420000000,
    total_inventory_value: 4150000000,
    total_payables: 2280000000,
    net_working_capital: 5290000000,
    working_capital_ratio: 3.32,
  };

  const trends = data?.trends || [
    { period: 'Jul', ccc_days: 68.5, dso: 46.0, dio: 58.0, dpo: 35.5, nwc_amount: 5120000000 },
    { period: 'Agu', ccc_days: 66.0, dso: 44.5, dio: 56.5, dpo: 35.0, nwc_amount: 5210000000 },
    { period: 'Sep', ccc_days: 64.2, dso: 44.0, dio: 55.0, dpo: 34.8, nwc_amount: 5350000000 },
    { period: 'Okt', ccc_days: 63.0, dso: 43.5, dio: 54.5, dpo: 35.0, nwc_amount: 5240000000 },
    { period: 'Nov', ccc_days: 62.1, dso: 43.0, dio: 54.2, dpo: 35.1, nwc_amount: 5280000000 },
    { period: 'Des', ccc_days: 61.3, dso: 42.5, dio: 54.0, dpo: 35.2, nwc_amount: 5290000000 },
  ];

  const breakdown = data?.breakdown || [
    { name: 'Piutang Usaha (AR)', amount: metrics.total_receivables, share_pct: 45.2, status: 'Optimal' },
    { name: 'Persediaan Stok (Inventory)', amount: metrics.total_inventory_value, share_pct: 54.8, status: 'Perlu Perhatian' },
    { name: 'Hutang Pemasok (AP)', amount: metrics.total_payables, share_pct: 30.1, status: 'Leverage Sehat' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 uppercase tracking-wider">
              Treasury & Working Capital
            </span>
            <span className="text-xs text-slate-400">• Cross-Module Cash Conversion</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Cash Conversion Cycle (CCC) & Working Capital
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Analisis kecepatan likuiditas kas, efisiensi persediaan gudang, penagihan piutang, dan manajemen hutang operasional.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl border border-slate-200 dark:border-slate-600">
            {(['MTD', 'QTD', 'YTD'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  period === p
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Formula & Core Equation Card */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-blue-950 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-bold tracking-widest text-indigo-300 uppercase">
              RUMUS SIKLUS KONVERSI KAS (CCC)
            </span>
            <h3 className="text-lg font-semibold text-white">
              Siklus Perputaran Modal Kerja:{' '}
              <span className="text-emerald-400 font-bold">{metrics.cash_conversion_cycle_days.toFixed(1)} Hari</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Membutuhkan rata-rata {metrics.cash_conversion_cycle_days.toFixed(0)} hari bagi kas keluar untuk pengadaan stok hingga kembali menjadi kas masuk dari pembayaran pelanggan. Semakin rendah angka CCC, semakin efisien likuiditas perusahaan.
            </p>
          </div>

          {/* Visual Equation */}
          <div className="flex flex-wrap items-center justify-center gap-2 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/15">
            <div className="text-center px-3 py-1">
              <span className="block text-[10px] text-slate-300 uppercase font-semibold">DSO (Sales)</span>
              <span className="text-base font-bold text-amber-300">{metrics.days_sales_outstanding.toFixed(1)}d</span>
            </div>
            <span className="text-base font-bold text-slate-300">+</span>
            <div className="text-center px-3 py-1">
              <span className="block text-[10px] text-slate-300 uppercase font-semibold">DIO (Stok)</span>
              <span className="text-base font-bold text-cyan-300">{metrics.days_inventory_outstanding.toFixed(1)}d</span>
            </div>
            <span className="text-base font-bold text-slate-300">-</span>
            <div className="text-center px-3 py-1">
              <span className="block text-[10px] text-slate-300 uppercase font-semibold">DPO (Hutang)</span>
              <span className="text-base font-bold text-rose-300">{metrics.days_payable_outstanding.toFixed(1)}d</span>
            </div>
            <span className="text-base font-bold text-slate-300">=</span>
            <div className="text-center px-4 py-1 bg-emerald-500/30 rounded-lg border border-emerald-400/40">
              <span className="block text-[10px] text-emerald-200 uppercase font-bold">CCC NET</span>
              <span className="text-lg font-black text-emerald-300">{metrics.cash_conversion_cycle_days.toFixed(1)} Hari</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* DSO Card */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Days Sales Outstanding
            </span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {metrics.days_sales_outstanding.toFixed(1)} Hari
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs text-emerald-600 font-semibold flex items-center">
                ↓ 3.5 hari
              </span>
              <span className="text-xs text-slate-400">vs kuartal lalu</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Total Piutang (AR):</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{formatIDR(metrics.total_receivables)}</span>
          </div>
        </div>

        {/* DIO Card */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Days Inventory Outstanding
            </span>
            <div className="p-2 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 rounded-xl">
              <Package size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {metrics.days_inventory_outstanding.toFixed(1)} Hari
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs text-amber-600 font-semibold flex items-center">
                ↑ 2.1 hari
              </span>
              <span className="text-xs text-slate-400">stok mengendap</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Nilai Stok Gudang:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{formatIDR(metrics.total_inventory_value)}</span>
          </div>
        </div>

        {/* DPO Card */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Days Payable Outstanding
            </span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {metrics.days_payable_outstanding.toFixed(1)} Hari
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs text-emerald-600 font-semibold flex items-center">
                ↑ 1.8 hari
              </span>
              <span className="text-xs text-slate-400">term supplier optimal</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Hutang Usaha (AP):</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{formatIDR(metrics.total_payables)}</span>
          </div>
        </div>

        {/* Net Working Capital Card */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Net Working Capital (NWC)
            </span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Wallet size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatIDR(metrics.net_working_capital)}
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs text-indigo-600 font-semibold">
                Rasio Modal: {metrics.working_capital_ratio.toFixed(2)}x
              </span>
              <span className="text-xs text-slate-400">(Aman {'>'} 1.5x)</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Status Likuiditas:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={12} /> Sangat Kuat
            </span>
          </div>
        </div>
      </div>

      {/* Historical Trend Chart & Working Capital Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tren Siklus Perputaran Kas & Komponen (6 Bulan)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pergerakan DSO, DIO, DPO, dan Net CCC dalam satuan hari
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
              Target CCC: &lt; 65 Hari
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="period" tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} unit=" h" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#fff',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="ccc_days" name="Cash Conversion Cycle (CCC)" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="dio" name="DIO (Persediaan Stok)" stroke="#06b6d4" strokeWidth={2} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="dso" name="DSO (Piutang Usaha)" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="dpo" name="DPO (Hutang Pemasok)" stroke="#f43f5e" strokeWidth={2} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Working Capital Breakdown Card (1 col) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Struktur Modal Kerja Tertahan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Komposisi dana operasional yang mengendap
            </p>

            <div className="space-y-4">
              {breakdown.map((item: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formatIDR(item.amount)}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full ${
                        idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-cyan-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(item.share_pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{item.share_pct.toFixed(1)}% dari total aset lancar</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-600" />
            <span>
              <strong>Rekomendasi Eksekutif:</strong> Percepat perputaran stok kategori *Spare Parts* dan *Solar* untuk memangkas DIO dari 54 hari ke 45 hari. Potensi kas terbebas: <strong>Rp 680 Jt</strong>.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkingCapitalDashboard;
