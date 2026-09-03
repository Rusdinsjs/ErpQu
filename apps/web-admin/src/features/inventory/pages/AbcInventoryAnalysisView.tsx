import React, { useState, useEffect } from 'react';
import { api } from '../../../api/http';
import { PageHeader, Card, Badge, LoadingSpinner } from '../../../components/ui';
import { BarChart2, CheckCircle2, AlertTriangle, ShieldCheck, Search, RefreshCw } from 'lucide-react';

interface AbcItemEntry {
    item_id: string;
    sku: string;
    name: string;
    current_quantity: string | number;
    average_cost: string | number;
    total_valuation: string | number;
    cumulative_value: string | number;
    cumulative_percentage: string | number;
    class: 'A' | 'B' | 'C';
}

interface AbcAnalysisReport {
    total_items: number;
    total_inventory_valuation: string | number;
    class_a_items_count: number;
    class_a_valuation: string | number;
    class_a_percentage_of_value: string | number;
    class_b_items_count: number;
    class_b_valuation: string | number;
    class_b_percentage_of_value: string | number;
    class_c_items_count: number;
    class_c_valuation: string | number;
    class_c_percentage_of_value: string | number;
    items: AbcItemEntry[];
    generated_at: string;
}

export default function AbcInventoryAnalysisView() {
    const [report, setReport] = useState<AbcAnalysisReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterClass, setFilterClass] = useState<'ALL' | 'A' | 'B' | 'C'>('ALL');

    const fetchReport = async () => {
        try {
            setLoading(true);
            const res = await api.get('/inventory/analytics/abc');
            if (res.data?.success && res.data?.data) {
                setReport(res.data.data);
            }
        } catch (error) {
            console.error('Failed to load ABC inventory analysis:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const formatRupiah = (val: string | number) => {
        const num = Number(val) || 0;
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(num);
    };

    const filteredItems = (report?.items || []).filter((item) => {
        const matchSearch =
            item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchClass = filterClass === 'ALL' || item.class === filterClass;
        return matchSearch && matchClass;
    });

    return (
        <div className="space-y-6">
            <PageHeader
                title="Analisis Persediaan ABC (Metode Pareto)"
                subtitle="Klasifikasi portofolio modal kerja stok berdasarkan kontribusi valuasi 80/20 untuk efisiensi audit siklus"
            >
                <button
                    onClick={fetchReport}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-xl hover:bg-muted border border-border transition-colors cursor-pointer"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh Data
                </button>
            </PageHeader>

            {loading && !report ? (
                <div className="flex justify-center py-20">
                    <LoadingSpinner size="lg" />
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="p-5 border-border bg-card/60 backdrop-blur shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Valuasi Stok</span>
                                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                                    <BarChart2 size={18} />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-foreground">
                                {formatRupiah(report?.total_inventory_valuation || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Total {report?.total_items || 0} SKU item terdaftar
                            </p>
                        </Card>

                        <Card className="p-5 border-emerald-500/30 bg-emerald-500/5 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Kelas A (Prioritas Utama)</span>
                                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-500">
                                    <ShieldCheck size={18} />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {report?.class_a_percentage_of_value || 0}%
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {report?.class_a_items_count || 0} SKU ({formatRupiah(report?.class_a_valuation || 0)})
                            </p>
                            <span className="text-[11px] font-medium text-emerald-600/80 mt-2 block">Audit: Mingguan / Ketat</span>
                        </Card>

                        <Card className="p-5 border-amber-500/30 bg-amber-500/5 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Kelas B (Prioritas Menengah)</span>
                                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500">
                                    <CheckCircle2 size={18} />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                {report?.class_b_percentage_of_value || 0}%
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {report?.class_b_items_count || 0} SKU ({formatRupiah(report?.class_b_valuation || 0)})
                            </p>
                            <span className="text-[11px] font-medium text-amber-600/80 mt-2 block">Audit: Bulanan / Moderat</span>
                        </Card>

                        <Card className="p-5 border-border bg-card/60 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kelas C (Stok Massal)</span>
                                <div className="p-2 rounded-xl bg-muted text-muted-foreground">
                                    <AlertTriangle size={18} />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-foreground">
                                {report?.class_c_percentage_of_value || 0}%
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {report?.class_c_items_count || 0} SKU ({formatRupiah(report?.class_c_valuation || 0)})
                            </p>
                            <span className="text-[11px] font-medium text-muted-foreground mt-2 block">Audit: Per Semester / Bulk</span>
                        </Card>
                    </div>

                    {/* Table Filters */}
                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <input
                                type="text"
                                placeholder="Cari SKU atau nama item..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            {(['ALL', 'A', 'B', 'C'] as const).map((cls) => (
                                <button
                                    key={cls}
                                    onClick={() => setFilterClass(cls)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${filterClass === cls
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {cls === 'ALL' ? 'Semua Kelas' : `Kelas ${cls}`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Data Table */}
                    <Card className="overflow-hidden border-border bg-card/70">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-semibold border-b border-border">
                                    <tr>
                                        <th className="px-4 py-3">Kelas</th>
                                        <th className="px-4 py-3">SKU</th>
                                        <th className="px-4 py-3">Nama Barang</th>
                                        <th className="px-4 py-3 text-right">Kuantitas</th>
                                        <th className="px-4 py-3 text-right">Biaya Rata-rata</th>
                                        <th className="px-4 py-3 text-right">Total Valuasi</th>
                                        <th className="px-4 py-3 text-right">% Kumulatif</th>
                                        <th className="px-4 py-3">Rekomendasi Audit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {filteredItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                                                Tidak ada data item yang cocok dengan kriteria filter.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredItems.map((item) => (
                                            <tr key={item.item_id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3">
                                                    {item.class === 'A' && (
                                                        <Badge variant="default" className="bg-emerald-600 text-white font-bold">Kelas A</Badge>
                                                    )}
                                                    {item.class === 'B' && (
                                                        <Badge variant="default" className="bg-amber-500 text-white font-bold">Kelas B</Badge>
                                                    )}
                                                    {item.class === 'C' && (
                                                        <Badge variant="secondary" className="font-bold">Kelas C</Badge>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 font-mono font-medium text-foreground">{item.sku}</td>
                                                <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                                                <td className="px-4 py-3 text-right font-mono">{Number(item.current_quantity).toLocaleString('id-ID')}</td>
                                                <td className="px-4 py-3 text-right font-mono text-muted-foreground">{formatRupiah(item.average_cost)}</td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-foreground">{formatRupiah(item.total_valuation)}</td>
                                                <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">{Number(item.cumulative_percentage).toFixed(2)}%</td>
                                                <td className="px-4 py-3 text-xs">
                                                    {item.class === 'A' && <span className="text-emerald-600 font-medium">Cycle Count Mingguan</span>}
                                                    {item.class === 'B' && <span className="text-amber-600 font-medium">Cycle Count Bulanan</span>}
                                                    {item.class === 'C' && <span className="text-muted-foreground">Bulk Reorder / Semesteran</span>}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
}
