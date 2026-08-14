import { useQuery } from '@tanstack/react-query';
import { financeApi } from '../../api/finance';
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableSkeleton } from '../../components/ui';
import { BarChart3, DollarSign, CheckCircle2, ShoppingCart } from 'lucide-react';
import { formatCurrencyIDR } from '../../utils/decimal';

export default function SalesReportsView() {
    const { data: salesOrders, isLoading: soLoading } = useQuery({
        queryKey: ['finance', 'sales-orders'],
        queryFn: financeApi.listSalesOrders,
    });

    const { data: salesInvoices } = useQuery({
        queryKey: ['finance', 'sales-invoices'],
        queryFn: financeApi.listSalesInvoices,
    });

    const orders = salesOrders?.data || salesOrders || [];
    const invoices = salesInvoices || [];

    const totalSOAmount = orders.reduce((sum: number, so: any) => sum + Number(so.total_amount || 0), 0);
    const totalInvoiced = invoices.reduce((sum: number, inv: any) => sum + Number(inv.total_amount || 0), 0);
    const totalCollected = invoices.reduce((sum: number, inv: any) => sum + Number(inv.amount_paid || 0), 0);

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                        <BarChart3 className="text-blue-500" size={32} />
                        Laporan & Analisis Penjualan (Sales Analytics)
                    </h1>
                    <p className="text-muted-foreground mt-1">Statistik performa penjualan, tren pemesanan (SO), pemenuhan pesanan & pendapatan real-time</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Sales Order (SO)</span>
                        <h3 className="text-2xl font-bold text-foreground mt-1">{formatCurrencyIDR(totalSOAmount.toString())}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{orders.length} Pesanan Penjualan Masuk</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <ShoppingCart size={24} />
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Faktur Diterbitkan</span>
                        <h3 className="text-2xl font-bold text-emerald-500 mt-1">{formatCurrencyIDR(totalInvoiced.toString())}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{invoices.length} Faktur Penjualan</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <DollarSign size={24} />
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Kas Masuk Terbayar</span>
                        <h3 className="text-2xl font-bold text-teal-500 mt-1">{formatCurrencyIDR(totalCollected.toString())}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {totalInvoiced > 0 ? ((totalCollected / totalInvoiced) * 100).toFixed(1) : '0'}% Pelunasan Piutang
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
                        <CheckCircle2 size={24} />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-border font-bold text-foreground">
                    Riwayat Transaksi Sales Order (SO)
                </div>
                {soLoading ? (
                    <TableSkeleton rows={5} cols={5} />
                ) : orders.length === 0 ? (
                    <div className="text-center py-16">
                        <ShoppingCart className="mx-auto text-muted-foreground mb-3" size={48} />
                        <h3 className="text-lg font-semibold text-foreground">Belum Ada Transaksi Sales Order</h3>
                        <p className="text-sm text-muted-foreground mt-1">Catat pesanan penjualan untuk menghasilkan grafik tren & analisis pendapatan.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow className="bg-muted/40">
                                <TableTh>No. Sales Order</TableTh>
                                <TableTh>Tanggal Order</TableTh>
                                <TableTh>Subjek / Pesanan</TableTh>
                                <TableTh align="right">Nilai Total (Rp)</TableTh>
                                <TableTh align="center">Status</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map((so: any) => (
                                <TableRow key={so.id} className="hover:bg-muted/30">
                                    <TableTd className="font-semibold text-foreground">{so.order_number}</TableTd>
                                    <TableTd className="text-muted-foreground">{so.date}</TableTd>
                                    <TableTd className="text-foreground">{so.subject || '-'}</TableTd>
                                    <TableTd align="right" className="font-bold text-foreground">{formatCurrencyIDR(Number(so.total_amount || 0).toString())}</TableTd>
                                    <TableTd align="center">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 inline-flex items-center gap-1">
                                            <CheckCircle2 size={12} /> {so.status || 'draft'}
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
