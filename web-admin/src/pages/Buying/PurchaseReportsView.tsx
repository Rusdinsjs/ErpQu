import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { financeApi } from '../../api/finance';
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableSkeleton, Button } from '../../components/ui';
import { BarChart3, TrendingUp, ShoppingBag, Download, Clock, CheckCircle2 } from 'lucide-react';
import { formatCurrencyIDR } from '../../utils/decimal';

export default function PurchaseReportsView() {
    const [reportType, setReportType] = useState<'analytics' | 'trends' | 'tracker'>('analytics');

    const { data: purchaseOrders, isLoading: poLoading } = useQuery({
        queryKey: ['finance', 'purchase-orders'],
        queryFn: financeApi.listPurchaseOrders,
    });

    const { data: purchaseBills, isLoading: pbLoading } = useQuery({
        queryKey: ['finance', 'purchase-bills'],
        queryFn: financeApi.listPurchaseBills,
    });

    const orders = purchaseOrders?.data || purchaseOrders || [];
    const bills = purchaseBills || [];

    const totalPOAmount = orders.reduce((sum: number, po: any) => sum + Number(po.total_amount || 0), 0);
    const totalBillAmount = bills.reduce((sum: number, pb: any) => sum + Number(pb.total_amount || 0), 0);
    const completedOrders = orders.filter((o: any) => o.status === 'completed' || o.status === 'confirmed').length;

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                        <BarChart3 className="text-rose-500" size={32} />
                        Laporan & Analisis Pengadaan (Purchase Analytics)
                    </h1>
                    <p className="text-muted-foreground mt-1">Pemantauan siklus belanja, realisasi pesanan pembelian (PO), dan pelacakan pengadaan</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Nilai Purchase Order</span>
                        <h3 className="text-2xl font-bold text-foreground mt-1">{formatCurrencyIDR(totalPOAmount)}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{orders.length} Dokumen PO Diterbitkan</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                        <ShoppingBag size={24} />
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Tagihan Masuk (AP)</span>
                        <h3 className="text-2xl font-bold text-amber-500 mt-1">{formatCurrencyIDR(totalBillAmount)}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{bills.length} Faktur Supplier</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <TrendingUp size={24} />
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">PO Terkonfirmasi & Selesai</span>
                        <h3 className="text-2xl font-bold text-emerald-500 mt-1">{completedOrders} Order</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Siklus pengadaan tuntas</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <CheckCircle2 size={24} />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-border font-bold text-foreground">
                    Riwayat Dokumen Purchase Order & Pengadaan
                </div>
                {poLoading ? (
                    <TableSkeleton rows={5} cols={6} />
                ) : orders.length === 0 ? (
                    <div className="text-center py-16">
                        <ShoppingBag className="mx-auto text-muted-foreground mb-3" size={48} />
                        <h3 className="text-lg font-semibold text-foreground">Belum Ada Transaksi PO</h3>
                        <p className="text-sm text-muted-foreground mt-1">Terbitkan Purchase Order untuk memantau analisis belanja.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow className="bg-muted/40">
                                <TableTh>No. Purchase Order</TableTh>
                                <TableTh>Tanggal Order</TableTh>
                                <TableTh>Subjek / Deskripsi</TableTh>
                                <TableTh align="right">Nilai Total (Rp)</TableTh>
                                <TableTh align="center">Status</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map((po: any) => (
                                <TableRow key={po.id} className="hover:bg-muted/30">
                                    <TableTd className="font-semibold text-foreground">{po.order_number}</TableTd>
                                    <TableTd className="text-muted-foreground">{po.date}</TableTd>
                                    <TableTd className="text-foreground">{po.subject || '-'}</TableTd>
                                    <TableTd align="right" className="font-bold text-foreground">{formatCurrencyIDR(Number(po.total_amount || 0))}</TableTd>
                                    <TableTd align="center">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 inline-flex items-center gap-1">
                                            <CheckCircle2 size={12} /> {po.status || 'draft'}
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
