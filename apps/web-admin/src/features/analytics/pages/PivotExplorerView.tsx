import React, { useState, useEffect, useMemo } from 'react';
import {
  RefreshCw,
  Table,
  SlidersHorizontal,
  Download,
  BarChart3,
  Layers,
  Database,
  ArrowRight,
  Filter,
  Check,
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
} from 'recharts';
import http from '../../../api/http';
import { useToast } from '../../../components/ui';

interface PivotRecord {
  id: string;
  date: string;
  branch: string;
  category: string;
  entity: string;
  partner: string;
  status: string;
  payment_method: string;
  amount: number;
  count: number;
}

export const PivotExplorerView: React.FC = () => {
  const [dataset, setDataset] = useState<'sales' | 'procurement' | 'inventory'>('sales');
  const [rowDimension, setRowDimension] = useState<keyof PivotRecord>('branch');
  const [colDimension, setColDimension] = useState<keyof PivotRecord | 'none'>('status');
  const [metric, setMetric] = useState<'amount' | 'count'>('amount');
  const [records, setRecords] = useState<PivotRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { success } = useToast();

  const fetchDataset = async () => {
    setIsLoading(true);
    try {
      const res = await http.get(`/api/analytics/pivot-dataset?dataset=${dataset}`);
      setRecords(res.data.records || []);
    } catch (err) {
      console.error('Failed to load pivot dataset:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDataset();
  }, [dataset]);

  const formatValue = (val: number) => {
    if (metric === 'count') return Math.round(val).toString();
    if (val >= 1_000_000_000) {
      return `Rp ${(val / 1_000_000_000).toFixed(2)} M`;
    }
    if (val >= 1_000_000) {
      return `Rp ${(val / 1_000_000).toFixed(1)} Jt`;
    }
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  // Compute Pivot Table Data
  const pivotData = useMemo(() => {
    const rowKeys = Array.from(new Set(records.map((r) => String(r[rowDimension] || 'Unknown')))).sort();
    const colKeys = colDimension === 'none'
      ? ['Total']
      : Array.from(new Set(records.map((r) => String(r[colDimension] || 'Unknown')))).sort();

    const matrix: Record<string, Record<string, number>> = {};
    const rowTotals: Record<string, number> = {};
    const colTotals: Record<string, number> = {};
    let grandTotal = 0;

    rowKeys.forEach((rk) => {
      matrix[rk] = {};
      rowTotals[rk] = 0;
      colKeys.forEach((ck) => {
        matrix[rk][ck] = 0;
      });
    });

    colKeys.forEach((ck) => {
      colTotals[ck] = 0;
    });

    records.forEach((r) => {
      const rk = String(r[rowDimension] || 'Unknown');
      const ck = colDimension === 'none' ? 'Total' : String(r[colDimension] || 'Unknown');
      const val = metric === 'amount' ? Number(r.amount || 0) : Number(r.count || 1);

      if (matrix[rk] && matrix[rk][ck] !== undefined) {
        matrix[rk][ck] += val;
        rowTotals[rk] += val;
        colTotals[ck] += val;
        grandTotal += val;
      }
    });

    return { rowKeys, colKeys, matrix, rowTotals, colTotals, grandTotal };
  }, [records, rowDimension, colDimension, metric]);

  const chartData = useMemo(() => {
    return pivotData.rowKeys.map((rk) => {
      const entry: any = { name: rk };
      pivotData.colKeys.forEach((ck) => {
        const raw = pivotData.matrix[rk]?.[ck] || 0;
        entry[ck] = metric === 'amount' ? raw / 1_000_000_000 : raw;
      });
      return entry;
    });
  }, [pivotData, metric]);

  const handleExportCsv = () => {
    const headers = [String(rowDimension), ...pivotData.colKeys, 'Total'].join(',');
    const rows = pivotData.rowKeys.map((rk) => {
      const cols = pivotData.colKeys.map((ck) => pivotData.matrix[rk]?.[ck] || 0);
      return [rk, ...cols, pivotData.rowTotals[rk] || 0].join(',');
    });
    const footer = ['Total', ...pivotData.colKeys.map((ck) => pivotData.colTotals[ck] || 0), pivotData.grandTotal].join(',');
    const csvContent = [headers, ...rows, footer].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `pivot_${dataset}_${rowDimension}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Data Pivot berhasil diekspor ke CSV.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 border border-cyan-200/60 dark:border-cyan-800/40 uppercase tracking-wider">
              Self-Service Ad-Hoc Analytics
            </span>
            <span className="text-xs text-slate-400">• Multidimensional Pivot</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Interactive Pivot Explorer
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Eksplorasi data transaksi dinamis dengan drag & slice dimensi baris, kolom, dan metrik agregasi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors shadow-sm"
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            onClick={fetchDataset}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Muat Ulang
          </button>
        </div>
      </div>

      {/* Control Panel / Slice & Dice Configuration */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          <SlidersHorizontal size={14} className="text-indigo-500" />
          Konfigurasi Dimensi & Agregasi
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          {/* Dataset Selector */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Sumber Dataset</label>
            <select
              value={dataset}
              onChange={(e) => setDataset(e.target.value as any)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="sales">Faktur Penjualan (Sales Invoices)</option>
              <option value="procurement">Pesanan Pengadaan (Purchase Bills)</option>
              <option value="inventory">Pergerakan Stok Gudang (Inventory Movements)</option>
            </select>
          </div>

          {/* Row Dimension */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Dimensi Baris (Rows)</label>
            <select
              value={rowDimension}
              onChange={(e) => setRowDimension(e.target.value as any)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="branch">Cabang / Unit Bisnis</option>
              <option value="category">Kategori Produk / Layanan</option>
              <option value="partner">Pelanggan / Pemasok</option>
              <option value="status">Status Dokumen</option>
              <option value="payment_method">Metode Pembayaran</option>
            </select>
          </div>

          {/* Column Dimension */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Dimensi Kolom (Columns)</label>
            <select
              value={colDimension}
              onChange={(e) => setColDimension(e.target.value as any)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="status">Status Transaksi</option>
              <option value="payment_method">Metode Pembayaran</option>
              <option value="category">Kategori</option>
              <option value="branch">Cabang</option>
              <option value="none">Tanpa Kolom Tambahan (Ringkasan)</option>
            </select>
          </div>

          {/* Metric Aggregator */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Metrik Nilai (Value)</label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as any)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="amount">Total Nilai Finansial (Sum IDR)</option>
              <option value="count">Jumlah Frekuensi Transaksi (Count)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Visual Chart from Pivot */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Visualisasi Agregasi Pivot
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {metric === 'amount' ? 'Nilai dalam Miliar Rupiah (Rp M)' : 'Jumlah Transaksi'}
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium rounded-lg">
            Total Rekord: {records.length}
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} unit={metric === 'amount' ? ' M' : ''} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  color: '#fff',
                }}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
              {pivotData.colKeys.map((ck, idx) => {
                const colors = ['#4f46e5', '#10b981', '#06b6d4', '#f59e0b', '#f43f5e', '#8b5cf6'];
                return (
                  <Bar
                    key={ck}
                    dataKey={ck}
                    fill={colors[idx % colors.length]}
                    radius={[4, 4, 0, 0]}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pivot Table Output */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table size={16} className="text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Tabel Matriks Cross-Tabulation
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Grand Total: <strong className="text-slate-900 dark:text-white">{formatValue(pivotData.grandTotal)}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="p-4 border-r border-slate-200 dark:border-slate-700">{String(rowDimension)}</th>
                {pivotData.colKeys.map((ck) => (
                  <th key={ck} className="p-4 text-right border-r border-slate-200 dark:border-slate-700">{ck}</th>
                ))}
                <th className="p-4 text-right bg-slate-100 dark:bg-slate-700 font-bold text-slate-900 dark:text-white">
                  Total Baris
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
              {pivotData.rowKeys.map((rk) => (
                <tr key={rk} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                  <td className="p-4 font-semibold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700">
                    {rk}
                  </td>
                  {pivotData.colKeys.map((ck) => {
                    const val = pivotData.matrix[rk]?.[ck] || 0;
                    return (
                      <td key={ck} className="p-4 text-right border-r border-slate-100 dark:border-slate-700 font-mono">
                        {formatValue(val)}
                      </td>
                    );
                  })}
                  <td className="p-4 text-right font-bold text-indigo-600 dark:text-indigo-400 bg-slate-50/60 dark:bg-slate-700/30 font-mono">
                    {formatValue(pivotData.rowTotals[rk] || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 dark:bg-slate-700/80 font-bold border-t-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                <td className="p-4 border-r border-slate-200 dark:border-slate-700">TOTAL KOLOM</td>
                {pivotData.colKeys.map((ck) => (
                  <td key={ck} className="p-4 text-right border-r border-slate-200 dark:border-slate-700 font-mono">
                    {formatValue(pivotData.colTotals[ck] || 0)}
                  </td>
                ))}
                <td className="p-4 text-right text-indigo-600 dark:text-indigo-400 font-black bg-indigo-50 dark:bg-indigo-950/40 font-mono text-sm">
                  {formatValue(pivotData.grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PivotExplorerView;
