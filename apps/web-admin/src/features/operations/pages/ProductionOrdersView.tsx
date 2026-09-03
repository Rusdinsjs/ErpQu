import React, { useState, useEffect } from 'react';
import { api } from '../../../api/http';
import { inventoryApi, type InventoryItem, type Warehouse } from '../../inventory/api/inventory';
import { useAuthStore } from '../../../store/useAuthStore';
import { PageHeader, Card, Badge, LoadingSpinner, Modal, Button, Input, Select } from '../../../components/ui';
import { CheckSquare, Play, CheckCircle2, RefreshCw, Clock, Search, Plus, Layers, Warehouse as WarehouseIcon } from 'lucide-react';
import { toast } from 'sonner';

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

interface BomOption {
    id: string;
    bom_number: string;
    bom_name?: string;
    item_id: string;
    quantity?: number;
}

export default function ProductionOrdersView() {
    const activeCompanyId = useAuthStore(s => s.activeCompanyId) || 'c0000000-0000-0000-0000-000000000001';
    const [orders, setOrders] = useState<ProductionOrder[]>([]);
    const [boms, setBoms] = useState<BomOption[]>([]);
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Create Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [formOrderNumber, setFormOrderNumber] = useState(`PROD-${Date.now().toString().slice(-6)}`);
    const [formBomId, setFormBomId] = useState('');
    const [formTargetQty, setFormTargetQty] = useState('100');
    const [formWarehouseId, setFormWarehouseId] = useState('');

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [ordersRes, bomsRes, itemsRes, whRes] = await Promise.all([
                api.get('/manufacturing/production-orders'),
                api.get('/manufacturing/boms'),
                inventoryApi.listItems(),
                inventoryApi.listWarehouses()
            ]);
            if (ordersRes.data?.success && ordersRes.data?.data) {
                setOrders(ordersRes.data.data);
            }
            if (bomsRes.data?.success && bomsRes.data?.data) {
                setBoms(bomsRes.data.data);
            }
            if (Array.isArray(itemsRes)) {
                setItems(itemsRes);
            }
            if (Array.isArray(whRes)) {
                setWarehouses(whRes);
                if (whRes.length > 0 && !formWarehouseId) {
                    setFormWarehouseId(whRes[0].id);
                }
            }
        } catch (error) {
            console.error('Failed to load manufacturing data:', error);
            toast.error('Gagal memuat data SPK Produksi.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        const selectedBom = boms.find(b => b.id === formBomId);
        if (!selectedBom) {
            toast.error('Pilih Master Formula BOM terlebih dahulu.');
            return;
        }
        if (!formWarehouseId) {
            toast.error('Pilih gudang target penerimaan hasil produksi.');
            return;
        }

        try {
            setCreateLoading(true);
            const payload = {
                company_id: activeCompanyId,
                production_order_number: formOrderNumber.trim() || `PROD-${Date.now().toString().slice(-6)}`,
                bom_id: selectedBom.id,
                item_id: selectedBom.item_id,
                target_qty: parseFloat(formTargetQty) || 1,
                warehouse_id: formWarehouseId,
                wip_account_id: null,
            };

            const res = await api.post('/manufacturing/production-orders', payload);
            if (res.data?.success || res.status === 200 || res.status === 201) {
                toast.success('Surat Perintah Kerja Produksi (SPK) berhasil diterbitkan!');
                setIsCreateOpen(false);
                setFormOrderNumber(`PROD-${Date.now().toString().slice(-6)}`);
                setFormBomId('');
                setFormTargetQty('100');
                fetchAllData();
            }
        } catch (error: any) {
            console.error('Failed to create production order:', error);
            toast.error(error.response?.data?.error || 'Gagal menerbitkan SPK Produksi.');
        } finally {
            setCreateLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            await api.put(`/manufacturing/production-orders/${id}/status`, {
                status: newStatus,
            });
            toast.success(`Status SPK berhasil diperbarui menjadi ${newStatus}.`);
            fetchAllData();
        } catch (error: any) {
            console.error('Failed to update production order status:', error);
            toast.error('Gagal memperbarui status SPK.');
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
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchAllData}
                        className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-xl hover:bg-muted border border-border transition-colors cursor-pointer"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-md"
                    >
                        <Plus size={16} /> Buat SPK Baru
                    </Button>
                </div>
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
                                        <th className="px-4 py-3">Barang Jadi & Formula</th>
                                        <th className="px-4 py-3">Gudang Target</th>
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
                                            <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                                                Belum ada Surat Perintah Kerja (Production Order).
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredOrders.map((order) => {
                                            const status = order.status.toUpperCase();
                                            const item = items.find(i => i.id === order.item_id);
                                            const bom = boms.find(b => b.id === order.bom_id);
                                            const warehouse = warehouses.find(w => w.id === order.warehouse_id);

                                            return (
                                                <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-4 py-3 font-mono font-bold text-foreground">
                                                        {order.production_order_number}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-semibold text-foreground">
                                                            {item?.name || order.item_id}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 font-mono">
                                                            <Layers size={12} className="text-primary" />
                                                            {bom?.bom_number || 'BOM Formula'}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1 font-medium text-foreground">
                                                            <WarehouseIcon size={13} className="text-amber-500" />
                                                            {warehouse?.name || 'Gudang Utama'}
                                                        </span>
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

            {/* Create Production Order Modal */}
            <Modal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title="Terbitkan Surat Perintah Kerja Produksi (SPK)"
            >
                <form onSubmit={handleCreateOrder} className="space-y-4 pt-2">
                    <div>
                        <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                            Nomor SPK Produksi
                        </label>
                        <Input
                            type="text"
                            value={formOrderNumber}
                            onChange={(e) => setFormOrderNumber(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                            Pilih Formula Resep BOM *
                        </label>
                        <Select
                            value={formBomId}
                            onChange={(val) => setFormBomId(val)}
                            options={[
                                { value: '', label: 'Pilih Master BOM Formula...' },
                                ...boms.map(b => {
                                    const targetItem = items.find(i => i.id === b.item_id);
                                    return {
                                        value: b.id,
                                        label: `${b.bom_number} - ${targetItem?.name || b.bom_name || 'Barang Jadi'}`
                                    };
                                })
                            ]}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                                Target Kuantitas Produksi *
                            </label>
                            <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={formTargetQty}
                                onChange={(e) => setFormTargetQty(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                                Gudang Target Hasil Jadi *
                            </label>
                            <Select
                                value={formWarehouseId}
                                onChange={(val) => setFormWarehouseId(val)}
                                options={[
                                    { value: '', label: 'Pilih Gudang...' },
                                    ...warehouses.map(w => ({ value: w.id, label: w.name }))
                                ]}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={createLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                            {createLoading ? 'Menerbitkan...' : 'Terbitkan SPK Produksi'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
