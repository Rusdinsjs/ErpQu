import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { financeApi, type AgingReportItem } from '../../api/finance';
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableSkeleton, Button } from '../../components/ui';
import { Clock, Download, ArrowDownLeft, ArrowUpRight, Search, FileText } from 'lucide-react';
import { formatCurrencyIDR } from '../../utils/decimal';

export default function AgingReports() {
    const [tab, setTab] = useState<'ar' | 'ap'>('ar');
    const [searchTerm, setSearchTerm] = useState('');

    const { data: arData, isLoading: arLoading } = useQuery({
        queryKey: ['finance', 'ar-aging'],
        queryFn: financeApi.getArAging,
        enabled: tab === 'ar',
    });

    const { data: apData, isLoading: apLoading } = useQuery({
        queryKey: ['finance', 'ap-aging'],
        queryFn: financeApi.getApAging,
        enabled: tab === 'ap',
    });

    const currentData = tab === 'ar' ? (arData || []) : (apData || []);
    const isLoading = tab === 'ar' ? arLoading : apLoading;

    const filtered = currentData.filter(item => 
        (item.party_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalOutstanding = currentData.reduce((sum, i) => sum + i.total_outstanding, 0);
    const totalCurrent = currentData.reduce((sum, i) => sum + i.current_not_due, 0);
    const total1to30 = currentData.reduce((sum, i) => sum + i.days_1_30, 0);
    const total31to60 = currentData.reduce((sum, i) => sum + i.days_31_60, 0);
    const total61to90 = currentData.reduce((sum, i) => sum + i.days_61_90, 0);
    const totalOver90 = currentData.reduce((sum, i) => sum + i.days_over_90, 0);

    const exportCSV = () => {
        const headers = ['Pihak / Mitra', 'Total Tagihan', 'Belum Jatuh Tempo', '1 - 30 Hari', '31 - 60 Hari', '61 - 90 Hari', '> 90 Hari', 'Jml Faktur'];
        const rows = filtered.map(r => [
            `"${r.party_name}"`,
            r.total_outstanding,
            r.current_not_due,
            r.days_1_30,
            r.days_31_60,
            r.days_61_90,
            r.days_over_90,
            r.invoice_count
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `${tab === 'ar' ? 'AR_Aging_Piutang' : 'AP_Aging_Hutang'}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                        <Clock className="text-amber-500" size={32} />
                        Laporan Umur Tagihan (Aging Reports)
                    </h1>
                    <p className="text-muted-foreground mt-1">Analisis jatuh tempo & mitigasi risiko kredit piutang (AR) dan hutang supplier (AP)</p>
                </div>
                <Button onClick={exportCSV} variant="outline" className="gap-2 rounded-xl">
                    <Download size={16} />
                    Ekspor CSV
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex bg-muted p-1 rounded-xl w-fit border border-border">
                <button
                    onClick={() => setTab('ar')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'ar' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <ArrowDownLeft size={16} className="text-emerald-500" />
                    AR Aging (Piutang Pelanggan)
                </button>
                <button
                    onClick={() => setTab('ap')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'ap' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <ArrowUpRight size={16} className="text-amber-500" />
                    AP Aging (Hutang Pemasok)
                </button>
            </div>

            {/* Aging Buckets KPI Summary */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-sm">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Tagihan</span>
                    <h4 className="text-lg font-bold text-foreground mt-1">{formatCurrencyIDR(totalOutstanding)}</h4>
                </div>
                <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-sm">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-500">Belum Jatuh Tempo</span>
                    <h4 className="text-lg font-bold text-emerald-500 mt-1">{formatCurrencyIDR(totalCurrent)}</h4>
                </div>
                <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-sm">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-500">1 - 30 Hari</span>
                    <h4 className="text-lg font-bold text-blue-500 mt-1">{formatCurrencyIDR(total1to30)}</h4>
                </div>
                <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-sm">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-500">31 - 60 Hari</span>
                    <h4 className="text-lg font-bold text-amber-500 mt-1">{formatCurrencyIDR(total31to60)}</h4>
                </div>
                <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-sm">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-orange-500">61 - 90 Hari</span>
                    <h4 className="text-lg font-bold text-orange-500 mt-1">{formatCurrencyIDR(total61to90)}</h4>
                </div>
                <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-sm">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-500">&gt; 90 Hari (Overdue)</span>
                    <h4 className="text-lg font-bold text-rose-500 mt-1">{formatCurrencyIDR(totalOver90)}</h4>
                </div>
            </div>

            {/* Table */}
            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={`Cari nama ${tab === 'ar' ? 'pelanggan' : 'pemasok'}...`}
                            className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                        />
                    </div>
                </div>

                {isLoading ? (
                    <TableSkeleton rows={5} cols={8} />
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <FileText className="mx-auto text-muted-foreground mb-3" size={48} />
                        <h3 className="text-lg font-semibold text-foreground">Tidak Ada Data Tagihan</h3>
                        <p className="text-sm text-muted-foreground mt-1">Seluruh tagihan telah lunas atau belum ada faktur yang dicatat.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow className="bg-muted/40">
                                <TableTh>{tab === 'ar' ? 'Pelanggan (Customer)' : 'Pemasok (Vendor)'}</TableTh>
                                <TableTh align="right">Total Tagihan</TableTh>
                                <TableTh align="right">Belum Jatuh Tempo</TableTh>
                                <TableTh align="right">1 - 30 Hari</TableTh>
                                <TableTh align="right">31 - 60 Hari</TableTh>
                                <TableTh align="right">61 - 90 Hari</TableTh>
                                <TableTh align="right">&gt; 90 Hari</TableTh>
                                <TableTh align="center">Jml Faktur</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.map(row => (
                                <TableRow key={row.party_id} className="hover:bg-muted/30">
                                    <TableTd className="font-semibold text-foreground">{row.party_name}</TableTd>
                                    <TableTd align="right" className="font-bold text-foreground">{formatCurrencyIDR(row.total_outstanding)}</TableTd>
                                    <TableTd align="right" className="text-emerald-500 font-medium">{formatCurrencyIDR(row.current_not_due)}</TableTd>
                                    <TableTd align="right" className="text-blue-500 font-medium">{formatCurrencyIDR(row.days_1_30)}</TableTd>
                                    <TableTd align="right" className="text-amber-500 font-medium">{formatCurrencyIDR(row.days_31_60)}</TableTd>
                                    <TableTd align="right" className="text-orange-500 font-medium">{formatCurrencyIDR(row.days_61_90)}</TableTd>
                                    <TableTd align="right" className="text-rose-500 font-bold">{formatCurrencyIDR(row.days_over_90)}</TableTd>
                                    <TableTd align="center">
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
                                            {row.invoice_count}
                                        </span>
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    );
}
