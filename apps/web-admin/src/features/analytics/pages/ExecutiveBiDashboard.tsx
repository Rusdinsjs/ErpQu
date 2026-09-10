import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  Wallet,
  Building2,
  Calendar,
  Download,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  Printer,
  ChevronRight,
  Activity,
  Truck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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
import { useNavigate } from 'react-router-dom';

export const ExecutiveBiDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<'MTD' | 'QTD' | 'YTD'>('YTD');
  const [selectedEntity, setSelectedEntity] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [data, setData] = useState<any>(null);

  const fetchBiSummary = async () => {
    setIsLoading(true);
    try {
      const res = await http.get('/api/analytics/executive-bi');
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch executive BI data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBiSummary();
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

  const kpis = data?.kpis || {
    net_revenue_ytd: 22430000000,
    revenue_growth_pct: 16.8,
    net_profit_ytd: 6540000000,
    net_profit_margin_pct: 29.16,
    operating_cash_balance: 4850000000,
    current_ratio: 2.65,
    quick_ratio: 2.1,
    fleet_utilization_pct: 88.4,
  };

  const monthlyTrends = data?.monthly_trends || [
    { month: 'Jan', revenue: 1250000000, cogs: 720000000, opex: 210000000, net_profit: 320000000 },
    { month: 'Feb', revenue: 1380000000, cogs: 790000000, opex: 225000000, net_profit: 365000000 },
    { month: 'Mar', revenue: 1540000000, cogs: 880000000, opex: 240000000, net_profit: 420000000 },
    { month: 'Apr', revenue: 1490000000, cogs: 860000000, opex: 235000000, net_profit: 395000000 },
    { month: 'Mei', revenue: 1680000000, cogs: 970000000, opex: 255000000, net_profit: 455000000 },
    { month: 'Jun', revenue: 1850000000, cogs: 1060000000, opex: 270000000, net_profit: 520000000 },
    { month: 'Jul', revenue: 1980000000, cogs: 1140000000, opex: 285000000, net_profit: 555000000 },
    { month: 'Agu', revenue: 2150000000, cogs: 1230000000, opex: 300000000, net_profit: 620000000 },
    { month: 'Sep', revenue: 2290000000, cogs: 1310000000, opex: 315000000, net_profit: 665000000 },
    { month: 'Okt', revenue: 2210000000, cogs: 1280000000, opex: 310000000, net_profit: 620000000 },
    { month: 'Nov', revenue: 2380000000, cogs: 1360000000, opex: 330000000, net_profit: 690000000 },
    { month: 'Des', revenue: 2530000000, cogs: 1440000000, opex: 350000000, net_profit: 740000000 },
  ];

  const cashFlows = data?.cash_flow_dynamics || [
    { month: 'Jul', cash_inflow: 1920000000, cash_outflow: 1380000000, net_cash: 540000000 },
    { month: 'Agu', cash_inflow: 2100000000, cash_outflow: 1490000000, net_cash: 610000000 },
    { month: 'Sep', cash_inflow: 2260000000, cash_outflow: 1580000000, net_cash: 680000000 },
    { month: 'Okt', cash_inflow: 2190000000, cash_outflow: 1550000000, net_cash: 640000000 },
    { month: 'Nov', cash_inflow: 2340000000, cash_outflow: 1640000000, net_cash: 700000000 },
    { month: 'Des', cash_inflow: 2510000000, cash_outflow: 1720000000, net_cash: 790000000 },
  ];

  const entityContributions = data?.entity_contributions || [
    { entity_name: 'PT Samudra Jaya Selaras (Marine & Rental)', revenue: 12850000000, profit: 3820000000, share_pct: 57.3, color: '#4f46e5' },
    { entity_name: 'SJS Mining Logistics (Transport & Hauling)', revenue: 6480000000, profit: 1890000000, share_pct: 28.9, color: '#06b6d4' },
    { entity_name: 'PT SJS Konstruksi & Infrastruktur', revenue: 3100000000, profit: 830000000, share_pct: 13.8, color: '#10b981' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 uppercase tracking-wider">
              Executive Board & C-Level
            </span>
            <span className="text-xs text-slate-400">• Real-time Financial BI</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-indigo-600" />
            Executive BI & Financial Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Dasbor eksekutif konsolidasi kinerja finansial, dinamika arus kas, profitabilitas unit bisnis, dan rasio likuiditas.
          </p>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Entity Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Building2 className="w-4 h-4 text-slate-500" />
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">Konsolidasi Seluruh Entitas</option>
              <option value="sjs-marine">PT Samudra Jaya Selaras</option>
              <option value="sjs-mining">SJS Mining Logistics</option>
              <option value="sjs-konstruksi">PT SJS Konstruksi</option>
            </select>
          </div>

          {/* Period Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            {(['MTD', 'QTD', 'YTD'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  period === p ? 'bg-white text-indigo-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Refresh & Print */}
          <button
            onClick={fetchBiSummary}
            disabled={isLoading}
            className="p-2 text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            title="Segarkan Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> Cetak Board Report
          </button>
        </div>
      </div>

      {/* Sub-module Navigation Pills */}
      <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-xs font-semibold">
        <span className="px-3 py-1 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
          Modul Insights:
        </span>
        <button
          onClick={() => navigate('/insights/executive-cockpit')}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white shadow-sm flex items-center gap-1.5"
        >
          <BarChart3 className="w-3.5 h-3.5" /> Executive Cockpit
        </button>
        <button
          onClick={() => navigate('/insights/working-capital')}
          className="px-3.5 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5"
        >
          <Activity className="w-3.5 h-3.5 text-emerald-500" /> Working Capital & CCC
        </button>
        <button
          onClick={() => navigate('/insights/profitability-matrix')}
          className="px-3.5 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5"
        >
          <TrendingUp className="w-3.5 h-3.5 text-blue-500" /> Profitability Matrix
        </button>
        <button
          onClick={() => navigate('/insights/central-reports')}
          className="px-3.5 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5"
        >
          <Layers className="w-3.5 h-3.5 text-purple-500" /> Central Report Hub
        </button>
        <button
          onClick={() => navigate('/insights/pivot-explorer')}
          className="px-3.5 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5"
        >
          <ChevronRight className="w-3.5 h-3.5 text-cyan-500" /> Pivot Explorer
        </button>
      </div>

      {/* 5 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Net Revenue */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pendapatan Bersih (YTD)</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900">{formatIDR(kpis.net_revenue_ytd)}</div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +{kpis.revenue_growth_pct}% MoM Growth
            </div>
          </div>
        </div>

        {/* KPI 2: Net Profit */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Laba Bersih / Margin</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900">{formatIDR(kpis.net_profit_ytd)}</div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              Net Margin: <span className="font-bold text-emerald-600">{kpis.net_profit_margin_pct}%</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Operating Cash */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kas Operasional</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900">{formatIDR(kpis.operating_cash_balance)}</div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              Status: <span className="font-semibold text-blue-600">Likuiditas Sangat Kuat</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Current Ratio */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rasio Lancar (CR)</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900">{kpis.current_ratio}x</div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              Quick Ratio: <span className="font-bold text-slate-700">{kpis.quick_ratio}x</span> (Aman &gt; 1.5x)
            </div>
          </div>
        </div>

        {/* KPI 5: Fleet Utilization */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Utilisasi Armada Sewa</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900">{kpis.fleet_utilization_pct}%</div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              Produktivitas: <span className="font-bold text-emerald-600">High Optimal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: 12-Month Revenue, COGS, and Net Profit (Span 2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Tren Pendapatan, Beban Pokok & Laba Bersih (12 Bulan)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Perbandingan Omzet Pendapatan vs Beban Pokok (HPP) vs Laba Bersih dalam skala Rupiah.
              </p>
            </div>
            <span className="text-xs font-medium bg-slate-100 px-2.5 py-1 rounded-lg text-slate-600">
              Audited Data
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `Rp ${(val / 1_000_000_000).toFixed(1)}M`}
                />
                <Tooltip
                  formatter={(val: any) => formatIDR(Number(val))}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="revenue" name="Pendapatan (Revenue)" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cogs" name="Beban Pokok (HPP)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net_profit" name="Laba Bersih (Net)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Multi-Entity Revenue & Profit Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-indigo-600" />
              Kontribusi Laba per Entitas
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pangsa laba operasional antar anak perusahaan di SJS Group.
            </p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={entityContributions}
                  dataKey="share_pct"
                  nameKey="entity_name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {entityContributions.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => `${val}% Pangsa`}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Entity Legend List */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            {entityContributions.map((item: any) => (
              <div key={item.entity_name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate pr-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="font-medium text-slate-700 truncate">{item.entity_name}</span>
                </div>
                <div className="font-bold text-slate-900">{item.share_pct}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Cash Flow Dynamics & Financial Health Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Inflow vs Outflow Area Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-indigo-600" />
                Dinamika Arus Kas (Inflow vs Outflow)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Penerimaan penagihan invoice AR pelanggan vs pengeluaran operasional &amp; vendor AP.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              Surplus Arus Kas
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `Rp ${(val / 1_000_000_000).toFixed(1)}M`}
                />
                <Tooltip
                  formatter={(val: any) => formatIDR(Number(val))}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="cash_inflow" name="Kas Masuk (Inflow)" stroke="#10b981" fillOpacity={1} fill="url(#colorInflow)" strokeWidth={2} />
                <Area type="monotone" dataKey="cash_outflow" name="Kas Keluar (Outflow)" stroke="#ef4444" fillOpacity={1} fill="url(#colorOutflow)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Solvency & Working Capital Watchlist */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            Pengawasan Solvabilitas &amp; Manajemen Risiko
          </h3>
          <p className="text-xs text-slate-500">
            Metrik kepatuhan perbankan (*covenants*), struktur modal kerja, dan risiko piutang.
          </p>

          <div className="space-y-3 pt-2">
            {/* Metric 1: Debt to Equity */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-800">Rasio Hutang terhadap Ekuitas (DER)</div>
                <div className="text-[11px] text-slate-500">Batas aman perbankan: &lt; 1.50x</div>
              </div>
              <div className="text-right">
                <span className="text-sm font-extrabold text-emerald-600">0.38x</span>
                <span className="block text-[10px] text-emerald-700 font-semibold bg-emerald-100/60 px-1.5 py-0.5 rounded">Sangat Sehat</span>
              </div>
            </div>

            {/* Metric 2: AR Aging Over 60 Days */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-800">Piutang Macet / Lewat 60 Hari</div>
                <div className="text-[11px] text-slate-500">Persentase total piutang invoice AR</div>
              </div>
              <div className="text-right">
                <span className="text-sm font-extrabold text-emerald-600">2.14%</span>
                <span className="block text-[10px] text-emerald-700 font-semibold bg-emerald-100/60 px-1.5 py-0.5 rounded">Terkendali &lt; 5%</span>
              </div>
            </div>

            {/* Metric 3: Working Capital Turnover */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-800">Perputaran Modal Kerja (WCT)</div>
                <div className="text-[11px] text-slate-500">Efisiensi konversi modal kerja menjadi omzet</div>
              </div>
              <div className="text-right">
                <span className="text-sm font-extrabold text-indigo-600">4.82x</span>
                <span className="block text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">Siklus Cepat</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveBiDashboard;
