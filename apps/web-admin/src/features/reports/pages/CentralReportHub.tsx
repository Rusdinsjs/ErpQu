import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Download,
  Filter,
  ArrowUpRight,
  BarChart2,
  DollarSign,
  Package,
  Truck,
  Users,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';
import { useToast } from '../../../components/ui';

interface ReportCatalogItem {
  id: string;
  title: string;
  description: string;
  category: 'finance' | 'sales' | 'procurement' | 'inventory' | 'assets' | 'hr';
  categoryLabel: string;
  frequency: 'Harian' | 'Mingguan' | 'Bulanan' | 'Tahunan' | 'Ad-Hoc';
  route: string;
  icon: any;
  formats: string[];
  popular?: boolean;
}

const REPORT_CATALOG: ReportCatalogItem[] = [
  // Finance
  {
    id: 'balance-sheet',
    title: 'Balance Sheet (Neraca Keuangan)',
    description: 'Posisi aset lancar, aset tetap, kewajiban hutang, dan ekuitas modal entitas.',
    category: 'finance',
    categoryLabel: 'Keuangan & Akuntansi',
    frequency: 'Bulanan',
    route: '/finance/balance-sheet',
    icon: DollarSign,
    formats: ['PDF', 'Excel'],
    popular: true,
  },
  {
    id: 'profit-loss',
    title: 'Profit & Loss Statement (Laba Rugi)',
    description: 'Laporan pendapatan usaha, HPP, beban operasional, dan laba bersih berjalan.',
    category: 'finance',
    categoryLabel: 'Keuangan & Akuntansi',
    frequency: 'Bulanan',
    route: '/finance/profit-loss',
    icon: DollarSign,
    formats: ['PDF', 'Excel'],
    popular: true,
  },
  {
    id: 'cash-flow',
    title: 'Cash Flow Statement (Arus Kas)',
    description: 'Arus kas dari aktivitas operasi, investasi aset, dan pendanaan modal.',
    category: 'finance',
    categoryLabel: 'Keuangan & Akuntansi',
    frequency: 'Bulanan',
    route: '/finance/cash-flow',
    icon: DollarSign,
    formats: ['PDF', 'Excel'],
  },
  {
    id: 'ar-aging',
    title: 'AR Aging Report (Umur Piutang)',
    description: 'Analisis umur tagihan piutang pelanggan (Current, 1-30, 31-60, 61-90, >90 hari).',
    category: 'finance',
    categoryLabel: 'Keuangan & Akuntansi',
    frequency: 'Mingguan',
    route: '/finance/ar-aging',
    icon: Clock,
    formats: ['PDF', 'Excel'],
    popular: true,
  },
  {
    id: 'ap-aging',
    title: 'AP Aging Report (Umur Hutang)',
    description: 'Jadwal jatuh tempo hutang tagihan kepada vendor dan pemasok barang/jasa.',
    category: 'finance',
    categoryLabel: 'Keuangan & Akuntansi',
    frequency: 'Mingguan',
    route: '/finance/ap-aging',
    icon: Clock,
    formats: ['PDF', 'Excel'],
  },
  {
    id: 'general-ledger-report',
    title: 'General Ledger Report (Buku Besar)',
    description: 'Mutasi debit/kredit seluruh akun buku besar beserta rincian nomor voucher.',
    category: 'finance',
    categoryLabel: 'Keuangan & Akuntansi',
    frequency: 'Bulanan',
    route: '/finance/general-ledger-report',
    icon: FileText,
    formats: ['PDF', 'Excel'],
  },

  // Sales
  {
    id: 'sales-analytics',
    title: 'Sales Performance & Target Analytics',
    description: 'Analisis pencapaian omzet penjualan, tren bulanan, dan ranking per sales person.',
    category: 'sales',
    categoryLabel: 'Penjualan & Komersial',
    frequency: 'Harian',
    route: '/selling/reports?tab=sales-analytics',
    icon: BarChart2,
    formats: ['PDF', 'Excel'],
    popular: true,
  },
  {
    id: 'sales-funnel',
    title: 'Sales Pipeline & Funnel Conversion',
    description: 'Konversi tahapan prospek dari Quotation, Sales Order hingga Faktur Penjualan.',
    category: 'sales',
    categoryLabel: 'Penjualan & Komersial',
    frequency: 'Mingguan',
    route: '/selling/reports?tab=sales-funnel',
    icon: BarChart2,
    formats: ['PDF', 'Excel'],
  },
  {
    id: 'customer-credit-balance',
    title: 'Customer Credit Limit & Outstanding',
    description: 'Monitoring sisa plafon kredit pelanggan dan riwayat limit piutang berjalan.',
    category: 'sales',
    categoryLabel: 'Penjualan & Komersial',
    frequency: 'Harian',
    route: '/selling/reports?tab=customer-credit-balance',
    icon: DollarSign,
    formats: ['PDF', 'Excel'],
  },

  // Procurement
  {
    id: 'purchase-analytics',
    title: 'Procurement Spend & Vendor Analytics',
    description: 'Distribusi belanja pengadaan barang/jasa, ranking vendor, dan tren harga beli.',
    category: 'procurement',
    categoryLabel: 'Pengadaan & Pembelian',
    frequency: 'Bulanan',
    route: '/buying/reports?tab=purchase-analytics',
    icon: Truck,
    formats: ['PDF', 'Excel'],
    popular: true,
  },
  {
    id: 'procurement-tracker',
    title: 'Purchase Order Fulfillment Tracker',
    description: 'Pelacakan status PO terbuka, pengiriman barang tertunda, dan penerimaan parsial.',
    category: 'procurement',
    categoryLabel: 'Pengadaan & Pembelian',
    frequency: 'Harian',
    route: '/buying/reports?tab=procurement-tracker',
    icon: Truck,
    formats: ['PDF', 'Excel'],
  },

  // Inventory
  {
    id: 'inventory-abc',
    title: 'ABC Inventory Classification Analysis',
    description: 'Klasifikasi nilai valuasi stok pareto Kelas A (vital), B (moderat), C (rendah).',
    category: 'inventory',
    categoryLabel: 'Persediaan & Gudang',
    frequency: 'Bulanan',
    route: '/stock/inventory-abc',
    icon: Package,
    formats: ['PDF', 'Excel'],
    popular: true,
  },
  {
    id: 'inventory-alerts',
    title: 'Low Stock & Reorder Point Alerts',
    description: 'Daftar item persediaan yang berada di bawah ambang batas minimum order.',
    category: 'inventory',
    categoryLabel: 'Persediaan & Gudang',
    frequency: 'Harian',
    route: '/stock/inventory-alerts',
    icon: Package,
    formats: ['PDF', 'Excel'],
  },

  // Assets
  {
    id: 'depreciation-ledger',
    title: 'Asset Depreciation & Valuation Ledger',
    description: 'Akumulasi penyusutan aset tetap, nilai buku sisa, dan metode depresiasi.',
    category: 'assets',
    categoryLabel: 'Aset & Pemeliharaan',
    frequency: 'Bulanan',
    route: '/assets/reports/depreciation-ledger',
    icon: Building2,
    formats: ['PDF', 'Excel'],
    popular: true,
  },
  {
    id: 'cost-analysis',
    title: 'Asset Total Cost of Ownership (TCO)',
    description: 'Analisis biaya siklus hidup aset (Akuisisi, Maintenance, Bahan Bakar, Pajak).',
    category: 'assets',
    categoryLabel: 'Aset & Pemeliharaan',
    frequency: 'Bulanan',
    route: '/assets/reports/cost-analysis',
    icon: DollarSign,
    formats: ['PDF', 'Excel'],
  },
  {
    id: 'fuel-consumption',
    title: 'Fleet Fuel Consumption & Efficiency',
    description: 'Monitoring konsumsi solar alat berat dan armada logistik per jam kerja / KM.',
    category: 'assets',
    categoryLabel: 'Aset & Pemeliharaan',
    frequency: 'Mingguan',
    route: '/assets/reports/fuel-consumption',
    icon: Truck,
    formats: ['PDF', 'Excel'],
  },

  // HR
  {
    id: 'attendance-logs',
    title: 'Rekap Kehadiran & Lembur (SPKL)',
    description: 'Log presensi biometrik, keterlambatan, ketidakhadiran, dan total jam lembur.',
    category: 'hr',
    categoryLabel: 'SDM & Penggajian',
    frequency: 'Bulanan',
    route: '/hr/attendance-logs',
    icon: Users,
    formats: ['PDF', 'Excel'],
  },
  {
    id: 'salary-slips',
    title: 'Payroll Summary & Tax 21 Register',
    description: 'Rekapitulasi total beban gaji karyawan, potongan BPJS, dan PPh Pasal 21.',
    category: 'hr',
    categoryLabel: 'SDM & Penggajian',
    frequency: 'Bulanan',
    route: '/hr/salary-slips',
    icon: Users,
    formats: ['PDF', 'Excel'],
    popular: true,
  },
];

export const CentralReportHub: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isExportingBatch, setIsExportingBatch] = useState(false);
  const { success } = useToast();

  const categories = [
    { id: 'all', label: 'Semua Laporan', count: REPORT_CATALOG.length },
    { id: 'finance', label: 'Keuangan & Akuntansi', count: REPORT_CATALOG.filter(r => r.category === 'finance').length },
    { id: 'sales', label: 'Penjualan & Komersial', count: REPORT_CATALOG.filter(r => r.category === 'sales').length },
    { id: 'procurement', label: 'Pengadaan (Buying)', count: REPORT_CATALOG.filter(r => r.category === 'procurement').length },
    { id: 'inventory', label: 'Stok & Logistik', count: REPORT_CATALOG.filter(r => r.category === 'inventory').length },
    { id: 'assets', label: 'Aset & Armada', count: REPORT_CATALOG.filter(r => r.category === 'assets').length },
    { id: 'hr', label: 'SDM & Payroll', count: REPORT_CATALOG.filter(r => r.category === 'hr').length },
  ];

  const filteredReports = useMemo(() => {
    return REPORT_CATALOG.filter((item) => {
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.categoryLabel.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [searchTerm, selectedCategory]);

  const handleOpenReport = (route: string) => {
    window.location.href = route;
  };

  const handleBatchExport = () => {
    setIsExportingBatch(true);
    setTimeout(() => {
      setIsExportingBatch(false);
      success('Paket Laporan Eksekutif Bulanan (PDF & Excel) siap diunduh.');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/40 uppercase tracking-wider">
              One-Stop Enterprise Catalog
            </span>
            <span className="text-xs text-slate-400">• Direktori Seluruh Laporan ERP</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Central Report Hub
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Satu pintu akses untuk seluruh laporan operasional, finansial, inventaris, pengadaan, dan ketenagakerjaan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleBatchExport}
            disabled={isExportingBatch}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            <Download size={14} className={isExportingBatch ? 'animate-spin' : ''} />
            {isExportingBatch ? 'Menyiapkan Paket...' : 'Download Paket Direksi (Batch)'}
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama laporan, kata kunci, modul..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Categories Tab Pill */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredReports.map((report) => {
          const IconComp = report.icon;
          return (
            <div
              key={report.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 transition-colors">
                    <IconComp size={20} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {report.popular && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-md border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                        <Sparkles size={10} /> Populer
                      </span>
                    )}
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md">
                      {report.frequency}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    {report.categoryLabel}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {report.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {report.description}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {report.formats.map((fmt) => (
                    <span
                      key={fmt}
                      className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 rounded"
                    >
                      {fmt}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => handleOpenReport(report.route)}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 group-hover:translate-x-0.5 transition-all"
                >
                  Buka Laporan
                  <ArrowUpRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredReports.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
          <FileText size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">Tidak ada laporan yang cocok</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Coba ubah kata kunci pencarian atau pilih kategori lain.
          </p>
        </div>
      )}
    </div>
  );
};

export default CentralReportHub;
