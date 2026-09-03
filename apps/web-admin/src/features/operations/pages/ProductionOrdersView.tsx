import React, { useState, useEffect } from 'react';
import { api } from '../../../api/http';
import { PageHeader, Card, Badge, LoadingSpinner } from '../../../components/ui';
import { CheckSquare, Play, CheckCircle2, RefreshCw, Clock, Search } from 'lucide-react';

interface ProductionOrder {
    id: string;
    production_order_number: string;
    bom_id: string;
    item_id: string;
    target_qty: string | number;
    produced_qty: string | number;
    warehouse_id: string;
    status: string;
    created_at: string;
}

export default function ProductionOrdersView() {
    const [orders, setOrders] = useState<ProductionOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await api.get('/manufacturing/production-orders');
            if (res.data?.success && res.data?.data) {
                setOrders(res.data.data);
            }
        } catch (error) {
            console.error('Failed to load production orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            await api.put(`/manufacturing/production-orders/${id}/status`, {
                status: newStatus,
            });
            fetchOrders();
        } catch (error) {
            console.error('Failed to update production order status:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status.toUpperCase()) {
            case 'COMPLETED':
                return <Badge variant="default" className="bg-emerald-600 text-white font-bold">SELESAI</Badge>;
            case 'IN_PROGRESS':
                return <Badge variant="default" className="bg-blue-600 text-white font-bold">PROSES</Badge>;
            case 'SUBMITTED':
                return <Badge variant="default" className="bg-amber-500 text-white font-bold">DIAJUKAN</Badge>;
            case 'CANCELLED':
                return <Badge variant="destructive">BATAL</Badge>;
            default:
                return <Badge variant="secondary">DRAFT</Badge>;
        }
    };

    const filteredOrders = orders.filter((o) =>
        o.production_order_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Surat Perintah Kerja Produksi (Production Orders)"
                subtitle="Pemantauan eksekusi manufaktur barang jadi dan progres penyelesaian kuantitas produksi"
            >
                <button
                    onClick={fetchOrders}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-xl hover:bg-muted border border-border transition-colors cursor-pointer"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </PageHeader>

            {loading ? (
                <div className="flex justify-center py-20">
                    <LoadingSpinner size="lg" />
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <input
                                type="text"
                                placeholder="Cari nomor SPK Produksi..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <span className="text-xs text-muted-foreground">
                            {filteredOrders.length} SPK Terdaftar
                        </span>
                    </div>

                    <Card className="overflow-hidden border-border bg-card/70">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-semibold border-b border-border">
                                    <tr>
                                        <th className="px-4 py-3">Nomor SPK</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">Target Kuantitas</th>
                                        <th className="px-4 py-3 text-right">Telah Selesai</th>
                                        <th className="px-4 py-3">Waktu Dibuat</th>
                                        <th className="px-4 py-3 text-center">Aksi Transisi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {filteredOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                                Belum ada Surat Perintah Kerja (Production Order).
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredOrders.map((order) => {
                                            const status = order.status.toUpperCase();
                                            return (
                                                <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-4 py-3 font-mono font-bold text-foreground">
                                                        {order.production_order_number}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {getStatusBadge(order.status)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                                                        {Number(order.target_qty).toLocaleString('id-ID')} unit
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                                                        {Number(order.produced_qty).toLocaleString('id-ID')} unit
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-muted-foreground">
                                                        {new Date(order.created_at).toLocaleDateString('id-ID')}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            {status === 'DRAFT' && (
                                                                <button
                                                                    onClick={() => handleUpdateStatus(order.id, 'SUBMITTED')}
                                                                    className="px-2.5 py-1 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-amber-500/20"
                                                                >
                                                                    Ajukan
                                                                </button>
                                                            )}
                                                            {status === 'SUBMITTED' && (
                                                                <button
                                                                    onClick={() => handleUpdateStatus(order.id, 'IN_PROGRESS')}
                                                                    className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-blue-500/20"
                                                                >
                                                                    <Play size={12} />
                                                                    Mulai
                                                                </button>
                                                            )}
                                                            {status === 'IN_PROGRESS' && (
                                                                <button
                                                                    onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                                                                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-emerald-500/20"
                                                                >
                                                                    <CheckCircle2 size={12} />
                                                                    Selesaikan
                                                                </button>
                                                            )}
                                                            {status === 'COMPLETED' && (
                                                                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                                                    <CheckCircle2 size={13} className="text-emerald-500" />
                                                                    Tuntas
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
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
