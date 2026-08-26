import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { financeApi } from'../api/finance';
import { Card, TableSkeleton } from'../../../components/ui';
import { Activity, TrendingUp, ArrowDownLeft, ArrowUpRight, DollarSign, RefreshCw } from 'lucide-react';
import { formatCurrencyIDR } from'../../../utils/decimal';

export default function CashFlowReport() {
    const { data: report, isLoading, refetch } = useQuery({
        queryKey: ['finance', 'cash-flow-report'],
        queryFn: financeApi.getCashFlowStatement,
    });

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                        <Activity className="text-emerald-500" size={32} />
                        Laporan Arus Kas (Cash Flow Statement)
                    </h1>
                    <p className="text-muted-foreground mt-1">Pergerakan arus kas masuk dan keluar dari aktivitas operasi, investasi, dan pendanaan</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-3 py-1.5 rounded-xl border border-border">
                        Periode: {report?.period || 'Bulan Berjalan'}
                    </span>
                    <button onClick={() => refetch()} className="p-2 bg-card border border-border rounded-xl hover:bg-muted text-muted-foreground transition-colors">
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {isLoading ? (
                <TableSkeleton rows={6} cols={2} />
            ) : (
                <div className="space-y-6">
                    {/* KPI Balance Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Saldo Kas Awal</span>
                            <h3 className="text-2xl font-bold text-foreground mt-1">{formatCurrencyIDR(String(report?.beginning_cash_balance || 0))}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Posisi kas di awal periode</p>
                        </div>
                        <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Perubahan Kas Bersih</span>
                            <h3 className={`text-2xl font-bold mt-1 ${(report?.net_cash_change || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {formatCurrencyIDR(String(report?.net_cash_change || 0))}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Surplus / (Defisit) kas periode ini</p>
                        </div>
                        <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Saldo Kas Akhir</span>
                            <h3 className="text-2xl font-bold text-blue-500 mt-1">{formatCurrencyIDR(String(report?.ending_cash_balance || 0))}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Total likuiditas kas & bank saat ini</p>
                        </div>
                    </div>

                    {/* Detailed Statement Table */}
                    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm p-6 space-y-8">
                        {/* 1. Aktivitas Operasi */}
                        <div>
                            <div className="flex justify-between items-center pb-3 border-b border-border font-bold text-base text-foreground">
                                <span className="flex items-center gap-2">
                                    <ArrowDownLeft className="text-emerald-500" size={18} />
                                    1. Arus Kas dari Aktivitas Operasi
                                </span>
                                <span className="text-emerald-600">{formatCurrencyIDR(String(report?.operating_activities.total || 0))}</span>
                            </div>
                            <div className="divide-y divide-border/40 text-sm">
                                {report?.operating_activities.items.map((item, idx) => (
                                    <div key={idx} className="py-2.5 px-4 flex justify-between items-center text-muted-foreground">
                                        <span>{item.title}</span>
                                        <span className={`font-mono font-medium ${item.amount >= 0 ? 'text-foreground' : 'text-rose-500'}`}>
                                            {formatCurrencyIDR(String(item.amount))}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. Aktivitas Investasi */}
                        <div>
                            <div className="flex justify-between items-center pb-3 border-b border-border font-bold text-base text-foreground">
                                <span className="flex items-center gap-2">
                                    <ArrowUpRight className="text-amber-500" size={18} />
                                    2. Arus Kas dari Aktivitas Investasi
                                </span>
                                <span className="text-amber-600">{formatCurrencyIDR(String(report?.investing_activities.total || 0))}</span>
                            </div>
                            <div className="divide-y divide-border/40 text-sm">
                                {report?.investing_activities.items.map((item, idx) => (
                                    <div key={idx} className="py-2.5 px-4 flex justify-between items-center text-muted-foreground">
                                        <span>{item.title}</span>
                                        <span className={`font-mono font-medium ${item.amount >= 0 ? 'text-foreground' : 'text-rose-500'}`}>
                                            {formatCurrencyIDR(String(item.amount))}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. Aktivitas Pendanaan */}
                        <div>
                            <div className="flex justify-between items-center pb-3 border-b border-border font-bold text-base text-foreground">
                                <span className="flex items-center gap-2">
                                    <DollarSign className="text-blue-500" size={18} />
                                    3. Arus Kas dari Aktivitas Pendanaan
                                </span>
                                <span className="text-blue-600">{formatCurrencyIDR(String(report?.financing_activities.total || 0))}</span>
                            </div>
                            <div className="divide-y divide-border/40 text-sm">
                                {report?.financing_activities.items.map((item, idx) => (
                                    <div key={idx} className="py-2.5 px-4 flex justify-between items-center text-muted-foreground">
                                        <span>{item.title}</span>
                                        <span className="font-mono font-medium text-foreground">
                                            {formatCurrencyIDR(String(item.amount))}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
