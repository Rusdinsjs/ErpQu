import React, { useState, useEffect } from 'react';
import { api } from '../../../api/http';
import { PageHeader, Card, LoadingSpinner, Progress } from '../../../components/ui';
import { Activity, Trophy, TrendingDown, DollarSign, RefreshCw, BarChart2 } from 'lucide-react';

interface WinLossReport {
    total_closed_deals: number;
    total_won_deals: number;
    total_lost_deals: number;
    win_rate_percentage: string | number;
    total_won_value: string | number;
    total_lost_value: string | number;
    average_won_deal_size: string | number;
}

export default function CrmAnalyticsView() {
    const [report, setReport] = useState<WinLossReport | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const res = await api.get('/crm/analytics/win-loss');
            if (res.data?.success && res.data?.data) {
                setReport(res.data.data);
            }
        } catch (error) {
            console.error('Failed to load CRM analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const formatRupiah = (val: string | number) => {
        const num = Number(val) || 0;
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(num);
    };

    const winRate = Number(report?.win_rate_percentage) || 0;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Analitik CRM: Rasio Kemenangan & Funnel Penjualan"
                subtitle="Evaluasi efektivitas konversi tim komersial dari seluruh transaksi yang telah ditutup (Won vs Lost)"
            >
                <button
                    onClick={fetchAnalytics}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-xl hover:bg-muted border border-border transition-colors cursor-pointer"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Perbarui Analitik
                </button>
            </PageHeader>

            {loading && !report ? (
                <div className="flex justify-center py-20">
                    <LoadingSpinner size="lg" />
                </div>
            ) : (
                <>
                    {/* Key Metrics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="p-5 border-emerald-500/30 bg-emerald-500/5 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Rasio Kemenangan (Win Rate)</span>
                                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-500">
                                    <Trophy size={18} />
                                </div>
                            </div>
                            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                                {winRate}%
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {report?.total_won_deals || 0} dari {report?.total_closed_deals || 0} deal tertutup
                            </p>
                        </Card>

                        <Card className="p-5 border-border bg-card/60 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Nilai Deal Won</span>
                                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                    <DollarSign size={18} />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-foreground">
                                {formatRupiah(report?.total_won_value || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Pendapatan yang berhasil dikonversi
                            </p>
                        </Card>

                        <Card className="p-5 border-border bg-card/60 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rata-rata Nilai Deal (Won)</span>
                                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                                    <BarChart2 size={18} />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-foreground">
                                {formatRupiah(report?.average_won_deal_size || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Per transaksi yang sukses
                            </p>
                        </Card>

                        <Card className="p-5 border-rose-500/30 bg-rose-500/5 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">Nilai Deal Lost</span>
                                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-500">
                                    <TrendingDown size={18} />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                                {formatRupiah(report?.total_lost_value || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {report?.total_lost_deals || 0} peluang transaksi gagal
                            </p>
                        </Card>
                    </div>

                    {/* Visual Comparison Breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="p-6 border-border bg-card/70">
                            <h3 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
                                <Activity size={18} className="text-primary" />
                                Perbandingan Hasil Penutupan Transaksi
                            </h3>
                            <p className="text-xs text-muted-foreground mb-6">
                                Rasio proporsional antara kesepakatan yang berhasil dimenangkan dan yang lepas ke kompetitor
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm font-semibold mb-1">
                                        <span className="text-emerald-600 flex items-center gap-1.5">
                                            <Trophy size={14} /> Berhasil Dimenangkan (Won)
                                        </span>
                                        <span>{report?.total_won_deals || 0} Transaksi ({winRate}%)</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                                        <div
                                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${winRate}%` }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-sm font-semibold mb-1">
                                        <span className="text-rose-600 flex items-center gap-1.5">
                                            <TrendingDown size={14} /> Gagal / Lepas (Lost)
                                        </span>
                                        <span>{report?.total_lost_deals || 0} Transaksi ({(100 - winRate).toFixed(2)}%)</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                                        <div
                                            className="bg-rose-500 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${Math.max(0, 100 - winRate)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6 border-border bg-card/70 flex flex-col justify-between">
                            <div>
                                <h3 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
                                    <BarChart2 size={18} className="text-primary" />
                                    Rekomendasi Strategi Penjualan
                                </h3>
                                <p className="text-xs text-muted-foreground mb-4">
                                    Insights berbasis data konversi peluang transaksi
                                </p>

                                <ul className="space-y-3 text-sm text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                                        <span>
                                            {winRate >= 70
                                                ? 'Tingkat konversi penjualan berada pada level sangat sehat (>70%). Pertahankan strategi kualifikasi prospek saat ini.'
                                                : 'Tingkat konversi di bawah 70%. Perlu evaluasi alasan kegagalan pada tahap Proposal dan negosiasi harga.'}
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                                        <span>
                                            Rata-rata transaksi dimenangkan sebesar {formatRupiah(report?.average_won_deal_size || 0)}. Alokasikan tenaga sales senior pada peluang di atas nilai rata-rata ini.
                                        </span>
                                    </li>
                                </ul>
                            </div>

                            <div className="mt-6 pt-4 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
                                <span>Status Pipeline: Aktif</span>
                                <span className="font-semibold text-foreground">Total Transaksi Selesai: {report?.total_closed_deals || 0}</span>
                            </div>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
