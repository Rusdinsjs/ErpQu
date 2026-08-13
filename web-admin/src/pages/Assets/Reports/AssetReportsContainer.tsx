import React, { useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Download, Printer, Search, Filter, FileText,
    TrendingUp, DollarSign, Calendar, RefreshCw, Layers, CheckCircle2,
    AlertTriangle, ShieldAlert, BarChart3
} from 'lucide-react';
import { Button, Input, Select, Card, CardHeader, CardTitle, CardContent, useToast } from '../../../components/ui';
import { ASSET_REPORTS_CONFIG, type ReportDefinition, type ReportColumn } from './reportsConfig';

interface AssetReportsContainerProps {
    reportId?: string;
}

export default function AssetReportsContainer({ reportId: propReportId }: AssetReportsContainerProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { success } = useToast();

    // Determine current report key from prop, pathname, or fallback
    const currentReportKey = useMemo(() => {
        if (propReportId && ASSET_REPORTS_CONFIG[propReportId]) return propReportId;
        const pathParts = location.pathname.split('/');
        const lastPart = pathParts[pathParts.length - 1];
        if (ASSET_REPORTS_CONFIG[lastPart]) return lastPart;
        return 'depreciation-ledger';
    }, [propReportId, location.pathname]);

    const reportDef: ReportDefinition = ASSET_REPORTS_CONFIG[currentReportKey] || ASSET_REPORTS_CONFIG['depreciation-ledger'];

    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [dateRange, setDateRange] = useState<string>('2026-Q3');

    // Filter data
    const filteredData = useMemo(() => {
        return reportDef.sampleData.filter(item => {
            const matchesSearch = Object.values(item).some(val =>
                val !== null && val !== undefined && String(val).toLowerCase().includes(searchTerm.toLowerCase())
            );
            const matchesCategory = selectedCategory === 'all' || !item.category || item.category.toLowerCase().includes(selectedCategory.toLowerCase());
            return matchesSearch && matchesCategory;
        });
    }, [reportDef.sampleData, searchTerm, selectedCategory]);

    // KPI Metrics calculation
    const kpis = useMemo(() => {
        return reportDef.kpis(filteredData);
    }, [reportDef, filteredData]);

    // Export CSV handler
    const handleExportCsv = () => {
        if (!filteredData.length) return;
        const headers = reportDef.columns.map(c => c.label).join(',');
        const rows = filteredData.map(row =>
            reportDef.columns.map(c => {
                const val = row[c.key];
                return `"${String(val ?? '').replace(/"/g, '""')}"`;
            }).join(',')
        );
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `${reportDef.id}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        success('Export CSV Berhasil', `Laporan ${reportDef.title} berhasil diunduh.`);
    };

    // Print handler
    const handlePrint = () => {
        window.print();
    };

    // Format table cell values
    const formatCell = (val: any, format?: ReportColumn['format']) => {
        if (val === null || val === undefined || val === '') return '-';
        if (format === 'currency') {
            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(val));
        }
        if (format === 'date') {
            try {
                return new Date(val).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
            } catch { return String(val); }
        }
        if (format === 'percent') {
            return `${Number(val).toFixed(1)}%`;
        }
        if (format === 'status') {
            const strVal = String(val);
            let badgeStyle = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
            if (['Sangat Baik', 'Baik', 'Completed', 'Selesai', 'Sangat Tinggi', 'Tinggi', 'Sangat Hemat', 'Normal', 'Aman (> 60 Hari)', 'Efisien (< 10%)', 'Selesai (BAST OK)'].some(k => strVal.includes(k))) {
                badgeStyle = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            } else if (['Rusak Ringan', 'Dalam Perbaikan', 'In Progress', 'Moderat', 'Perlu Evaluasi', 'Peringatan (< 30 Hari)', 'Tinggi (> 12%)', 'Dalam Pengiriman'].some(k => strVal.includes(k))) {
                badgeStyle = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            } else if (['Rusak Berat', 'Scrap', 'Boros', 'Overdue (Kadaluarsa)', 'Perlu Replacement (> 20%)'].some(k => strVal.includes(k))) {
                badgeStyle = 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            }
            return (
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-block ${badgeStyle}`}>
                    {strVal}
                </span>
            );
        }
        return String(val);
    };

    return (
        <div className="p-6 space-y-6 bg-background min-h-screen">
            {/* Header Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/assets-workspace')}
                        className="p-2 rounded-xl bg-card border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                {reportDef.category}
                            </span>
                            <span className="text-xs text-muted-foreground">• EAM Analytics & Reports</span>
                        </div>
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 mt-0.5">
                            <BarChart3 className="text-primary" size={24} /> {reportDef.title}
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">{reportDef.description}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" onClick={handlePrint} className="rounded-xl text-xs">
                        <Printer size={15} className="mr-1.5" /> Cetak / PDF
                    </Button>
                    <Button variant="default" onClick={handleExportCsv} className="rounded-xl text-xs font-semibold">
                        <Download size={15} className="mr-1.5" /> Export CSV
                    </Button>
                </div>
            </div>

            {/* Quick Switcher Tabs (All 9 Reports) */}
            <div className="overflow-x-auto pb-1 scrollbar-thin">
                <div className="flex gap-2 min-w-max border-b border-border/60 pb-2">
                    {Object.values(ASSET_REPORTS_CONFIG).map(rep => (
                        <button
                            key={rep.id}
                            onClick={() => navigate(`/assets/reports/${rep.id}`)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${rep.id === reportDef.id
                                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                                    : 'bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:border-border'
                                }`}
                        >
                            <FileText size={13} />
                            {rep.title.replace('Asset ', '')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Executive KPI Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {kpis.map((kpi, idx) => (
                    <Card key={idx} className="rounded-2xl border-border/60 shadow-sm p-4 hover:border-primary/30 transition-colors">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
                            <div className={`w-8 h-8 rounded-xl ${kpi.color || 'text-primary bg-primary/10'} flex items-center justify-center`}>
                                <TrendingUp size={16} />
                            </div>
                        </div>
                        <div className="mt-3">
                            <h3 className="text-2xl font-bold text-foreground">{kpi.value}</h3>
                            {kpi.subtext && <p className="text-xs text-muted-foreground mt-1">{kpi.subtext}</p>}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Filters Bar & Table */}
            <Card className="rounded-2xl border-border/60 shadow-sm">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-muted-foreground" />
                        <CardTitle className="text-base font-bold">Filter & Detail Laporan</CardTitle>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search Input */}
                        <div className="relative w-full sm:w-64">
                            <Search size={15} className="absolute left-3 top-2.5 text-muted-foreground" />
                            <Input
                                placeholder="Cari kode, nama, atau lokasi..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-9 py-1.5 text-xs rounded-xl"
                            />
                        </div>

                        {/* Periode Select */}
                        <Select
                            value={dateRange}
                            onChange={val => setDateRange(val)}
                            className="py-1.5 px-3 text-xs rounded-xl w-36"
                        >
                            <option value="2026-Q3">Triwulan 3 (2026)</option>
                            <option value="2026-YTD">Tahun 2026 (YTD)</option>
                            <option value="2025-FULL">Tahun 2025 (Full)</option>
                        </Select>
                    </div>
                </CardHeader>

                <CardContent className="pt-4 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-muted/40 font-bold text-muted-foreground border-b border-border/60 uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3.5 w-12 text-center">#</th>
                                {reportDef.columns.map(col => (
                                    <th
                                        key={col.key}
                                        className={`px-4 py-3.5 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                                    >
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 bg-card">
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={reportDef.columns.length + 1} className="py-12 text-center text-muted-foreground">
                                        <FileText size={36} className="mx-auto mb-2 opacity-30" />
                                        <p className="text-sm font-medium">Tidak ada data laporan ditemukan</p>
                                        <p className="text-xs mt-1">Coba sesuaikan kata kunci pencarian atau filter Anda.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((row, idx) => (
                                    <tr key={row.id || idx} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-4 py-3 text-center text-muted-foreground font-mono">{idx + 1}</td>
                                        {reportDef.columns.map(col => (
                                            <td
                                                key={col.key}
                                                className={`px-4 py-3 ${col.align === 'right' ? 'text-right font-mono' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                                            >
                                                {formatCell(row[col.key], col.format)}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}
