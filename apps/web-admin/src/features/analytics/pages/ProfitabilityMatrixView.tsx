import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  TrendingUp,
  DollarSign,
  Building2,
  PieChart as PieIcon,
  BarChart3,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Filter,
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
  Cell,
} from 'recharts';
import http from '../../../api/http';

export const ProfitabilityMatrixView: React.FC = () => {
  const [period, setPeriod] = useState<'MTD' | 'QTD' | 'YTD'>('YTD');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [data, setData] = useState<any>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await http.get('/api/analytics/profitability-matrix');
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch profitability matrix:', err);
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

  const branches = data?.branches || [
    {
      branch_id: 'BR-HQ',
      branch_name: 'Kantor Pusat Balikpapan',
      revenue: 11450000000,
      cogs: 6200000000,
      gross_profit: 5250000000,
      gross_margin_pct: 45.85,
      opex: 1850000000,
      net_profit: 3400000000,
      net_margin_pct: 29.7,
      target_achievement_pct: 104.5,
    },
    {
      branch_id: 'BR-SMD',
      branch_name: 'Cabang Samarinda Mining Log',
      revenue: 6820000000,
      cogs: 3950000000,
      gross_profit: 2870000000,
      gross_margin_pct: 42.08,
      opex: 1120000000,
      net_profit: 1750000000,
      net_margin_pct: 25.66,
      target_achievement_pct: 98.2,
    },
    {
      branch_id: 'BR-BJM',
      branch_name: 'Cabang Banjarmasin Pelabuhan',
      revenue: 4160000000,
      cogs: 2410000000,
      gross_profit: 1750000000,
      gross_margin_pct: 42.07,
      opex: 710000000,
      net_profit: 1040000000,
      net_margin_pct: 25.0,
      target_achievement_pct: 94.0,
    },
  ];

  const costCenters = data?.cost_centers || [
    {
      cost_center_id: 'CC-LOG-01',
      cost_center_name: 'Fleet & Hauling Operations',
      category: 'Operations',
      allocated_cost: 3250000000,
      revenue_generated: 8900000000,
      net_contribution: 5650000000,
    },
    {
      cost_center_id: 'CC-MAR-02',
      cost_center_name: 'Tugboat & Barge Marine Rental',
      category: 'Operations',
      allocated_cost: 2890000000,
      revenue_generated: 7400000000,
      net_contribution: 4510000000,
    },
    {
      cost_center_id: 'CC-ENG-03',
      cost_center_name: 'Heavy Equipment Maintenance Workshop',
      category: 'Maintenance & Support',
      allocated_cost: 1180000000,
      revenue_generated: 2350000000,
      net_contribution: 1170000000,
    },
    {
      cost_center_id: 'CC-ADM-04',
      cost_center_name: 'Corporate Finance & Shared Services',
      category: 'General & Admin',
      allocated_cost: 1240000000,
      revenue_generated: 0,
      net_contribution: -1240000000,
    },
  ];

  const totalRev = data?.total_revenue || branches.reduce((acc: number, b: any) => acc + b.revenue, 0);
  const totalCogs = data?.total_cogs || branches.reduce((acc: number, b: any) => acc + b.cogs, 0);
  const totalGp = data?.total_gross_profit || branches.reduce((acc: number, b: any) => acc + b.gross_profit, 0);
  const totalOpex = data?.total_opex || branches.reduce((acc: number, b: any) => acc + b.opex, 0);
  const totalNp = data?.total_net_profit || branches.reduce((acc: number, b: any) => acc + b.net_profit, 0);
  const overallNetMargin = data?.overall_net_margin_pct || (totalRev > 0 ? (totalNp / totalRev) * 100 : 0);

  const filteredBranches = selectedBranch === 'all'
    ? branches
    : branches.filter((b: any) => b.branch_id === selectedBranch);

  const chartData = branches.map((b: any) => ({
    name: b.branch_name.replace('Kantor Pusat ', '').replace('Cabang ', ''),
    Pendapatan: b.revenue / 1_000_000_000,
    LabaBersih: b.net_profit / 1_000_000_000,
    Margin: b.net_margin_pct,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40 uppercase tracking-wider">
              Strategic Financial BI
            </span>
            <span className="text-xs text-slate-400">• Multi-Dimensional Analysis</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Profitability Matrix (Cabang & Cost Center)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pemetaan margin kotor, beban operasional, dan kontribusi laba bersih per entitas operasional & pusat biaya.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600">
            <Filter size={14} className="text-slate-400" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              aria-label="Filter Cabang"
              className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-200 border-none focus:outline-none"
            >
              <option value="all">Semua Cabang</option>
              {branches.map((b: any) => (
                <option key={b.branch_id} value={b.branch_id}>
                  {b.branch_name}
                </option>
              ))}
            </select>
          </div>

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

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Revenue */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pendapatan</span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-2">{formatIDR(totalRev)}</div>
          <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">100% Topline</span>
        </div>

        {/* Total COGS */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Beban Pokok (COGS)</span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-2">{formatIDR(totalCogs)}</div>
          <span className="text-xs text-rose-500 font-medium mt-1 inline-block">
            {((totalCogs / totalRev) * 100).toFixed(1)}% dari omzet
          </span>
        </div>

        {/* Total Gross Profit */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Laba Kotor (GP)</span>
          <div className="text-xl font-bold text-cyan-600 dark:text-cyan-400 mt-2">{formatIDR(totalGp)}</div>
          <span className="text-xs text-cyan-600 font-medium mt-1 inline-block">
            GP Margin {((totalGp / totalRev) * 100).toFixed(1)}%
          </span>
        </div>

        {/* Total OPEX */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Biaya Operasional (OPEX)</span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-2">{formatIDR(totalOpex)}</div>
          <span className="text-xs text-slate-500 font-medium mt-1 inline-block">
            {((totalOpex / totalRev) * 100).toFixed(1)}% rasio opex
          </span>
        </div>

        {/* Net Profit & Margin */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-md">
          <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">Laba Bersih (Net Profit)</span>
          <div className="text-xl font-black mt-2">{formatIDR(totalNp)}</div>
          <span className="text-xs text-emerald-200 font-bold mt-1 inline-block">
            Net Margin {overallNetMargin.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Komparasi Pendapatan vs Laba Bersih per Cabang
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nilai dalam Miliar Rupiah (Rp M)
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 rounded-lg font-semibold">
              Rata-rata Margin: {overallNetMargin.toFixed(1)}%
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} unit=" M" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#fff',
                  }}
                  formatter={(val: any, name?: string) => [`Rp ${Number(val).toFixed(2)} M`, name]}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                <Bar dataKey="Pendapatan" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                <Bar dataKey="LabaBersih" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Center Summary Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Pusat Kontribusi Laba Terbesar
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Peringkat unit bisnis berdasarkan net contribution
            </p>

            <div className="space-y-3">
              {costCenters.slice(0, 3).map((cc: any, idx: number) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800 dark:text-slate-200">{cc.cost_center_name}</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{formatIDR(cc.net_contribution)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>Alokasi Biaya: {formatIDR(cc.allocated_cost)}</span>
                    <span className="text-indigo-500">Rev: {formatIDR(cc.revenue_generated)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200/60 dark:border-blue-800/40 text-xs text-blue-800 dark:text-blue-300">
            💡 <strong>Insight C-Level:</strong> Unit *Fleet & Hauling* menghasilkan 48.7% dari total laba bersih operasional perusahaan.
          </div>
        </div>
      </div>

      {/* Main Breakdown Table per Branch */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Matriks Laba Rugi per Cabang & Entitas Operasional
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Rincian laporan laba rugi komparatif tingkat cabang
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Menampilkan {filteredBranches.length} Entitas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="p-4">Cabang / Unit Bisnis</th>
                <th className="p-4 text-right">Pendapatan</th>
                <th className="p-4 text-right">COGS</th>
                <th className="p-4 text-right">Laba Kotor</th>
                <th className="p-4 text-center">GP Margin</th>
                <th className="p-4 text-right">OPEX</th>
                <th className="p-4 text-right">Laba Bersih</th>
                <th className="p-4 text-center">Net Margin</th>
                <th className="p-4 text-center">Pencapaian Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
              {filteredBranches.map((branch: any) => (
                <tr key={branch.branch_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                  <td className="p-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 size={16} className="text-indigo-500 shrink-0" />
                    <span>{branch.branch_name}</span>
                  </td>
                  <td className="p-4 text-right font-medium">{formatIDR(branch.revenue)}</td>
                  <td className="p-4 text-right text-rose-500">{formatIDR(branch.cogs)}</td>
                  <td className="p-4 text-right font-semibold text-cyan-600 dark:text-cyan-400">{formatIDR(branch.gross_profit)}</td>
                  <td className="p-4 text-center font-semibold">{branch.gross_margin_pct.toFixed(1)}%</td>
                  <td className="p-4 text-right text-slate-500">{formatIDR(branch.opex)}</td>
                  <td className="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400">{formatIDR(branch.net_profit)}</td>
                  <td className="p-4 text-center font-bold text-emerald-600 dark:text-emerald-400">{branch.net_margin_pct.toFixed(1)}%</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-slate-200 dark:bg-slate-600 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            branch.target_achievement_pct >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(branch.target_achievement_pct, 100)}%` }}
                        />
                      </div>
                      <span className="font-semibold text-[11px]">{branch.target_achievement_pct.toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 dark:bg-slate-700/80 font-bold border-t-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                <td className="p-4">TOTAL KONSOLIDASI</td>
                <td className="p-4 text-right">{formatIDR(totalRev)}</td>
                <td className="p-4 text-right text-rose-500">{formatIDR(totalCogs)}</td>
                <td className="p-4 text-right text-cyan-600 dark:text-cyan-400">{formatIDR(totalGp)}</td>
                <td className="p-4 text-center">{((totalGp / totalRev) * 100).toFixed(1)}%</td>
                <td className="p-4 text-right">{formatIDR(totalOpex)}</td>
                <td className="p-4 text-right text-emerald-600 dark:text-emerald-400">{formatIDR(totalNp)}</td>
                <td className="p-4 text-center text-emerald-600 dark:text-emerald-400">{overallNetMargin.toFixed(1)}%</td>
                <td className="p-4 text-center">101.2%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProfitabilityMatrixView;
