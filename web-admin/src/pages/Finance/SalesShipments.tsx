import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '../../api/finance';
import { inventoryApi } from '../../api/inventory';
import { clientApi } from '../../api/client-management';
import { Card, Button, Badge } from '../../components/ui';
import {
    Plus, Search, Filter, Download, X, ClipboardCheck, Eye
} from 'lucide-react';
import { toast } from 'sonner';

export default function SalesShipments() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedShipment, setSelectedShipment] = useState<any>(null);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    const queryClient = useQueryClient();

    const { data: shipments, isLoading } = useQuery({
        queryKey: ['finance', 'sales-shipments'],
        queryFn: financeApi.listSalesShipments
    });

    const { data: warehouses = [] } = useQuery({
        queryKey: ['inventory', 'warehouses'],
        queryFn: inventoryApi.listWarehouses
    });

    const { data: itemsResponse } = useQuery({
        queryKey: ['inventory', 'items'],
        queryFn: inventoryApi.listItems
    });
    const itemsList = itemsResponse || [];

    const { data: ordersResponse } = useQuery({
        queryKey: ['finance', 'sales-orders'],
        queryFn: financeApi.listSalesOrders
    });
    const salesOrders = ordersResponse?.data || [];

    const { data: clientsResponse } = useQuery({
        queryKey: ['clients'],
        queryFn: () => clientApi.list({ limit: 100 })
    });
    const clients = Array.isArray(clientsResponse?.data) ? clientsResponse.data : (clientsResponse as any)?.data?.data || [];

    // Form dynamic items state based on selected sales order
    const [lines, setLines] = useState<any[]>([]);

    useEffect(() => {
        if (selectedOrder) {
            // Find the items of this sales order.
            // Since salesOrders contains the full order details including items,
            // let's grab them. If items are in selectedOrder.items:
            const orderItems = selectedOrder.items || [];
            setLines(orderItems.map((item: any) => ({
                order_item_id: item.id,
                description: item.description,
                quantity_shipped: item.quantity,
                item_id: '' // User will choose which inventory item this maps to
            })));
        } else {
            setLines([]);
        }
    }, [selectedOrder]);

    const createMutation = useMutation({
        mutationFn: financeApi.createSalesShipment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance', 'sales-shipments'] });
            setIsCreateModalOpen(false);
            setSelectedOrder(null);
            toast.success('Pengiriman berhasil dicatat');
        },
        onError: (error: any) => {
            toast.error('Gagal mencatat pengiriman: ' + error.message);
        }
    });

    const submitMutation = useMutation({
        mutationFn: financeApi.submitSalesShipment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance', 'sales-shipments'] });
            setIsDetailsModalOpen(false);
            toast.success('Pengiriman berhasil disubmit & stok berkurang!');
        },
        onError: (error: any) => {
            toast.error('Gagal mensubmit pengiriman: ' + error.message);
        }
    });

    const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const payload = {
            shipment_number: formData.get('shipment_number'),
            sales_order_id: formData.get('sales_order_id'),
            warehouse_id: formData.get('warehouse_id'),
            date: formData.get('date'),
            courier_name: formData.get('courier_name'),
            tracking_number: formData.get('tracking_number'),
            items: lines.map(line => ({
                order_item_id: line.order_item_id,
                description: line.description,
                quantity_shipped: Number(line.quantity_shipped),
                item_id: line.item_id || null
            }))
        };

        if (!payload.sales_order_id) {
            toast.error('Silakan pilih Sales Order');
            return;
        }

        if (payload.items.some(i => !i.item_id)) {
            toast.error('Silakan petakan semua baris ke produk inventory');
            return;
        }

        createMutation.mutate(payload);
    };

    const handleLineChange = (index: number, field: string, value: any) => {
        const newLines = [...lines];
        newLines[index][field] = value;
        setLines(newLines);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Pengiriman Barang (DO)</h1>
                    <p className="text-muted-foreground">Pantau pengiriman pesanan (Surat Jalan) ke pelanggan</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2 border-border text-muted-foreground">
                        <Download size={18} />
                        Export
                    </Button>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                        <Plus size={18} />
                        Catat Pengiriman
                    </Button>
                </div>
            </div>

            <Card className="bg-card border-border overflow-hidden">
                <div className="p-4 border-b border-border flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex gap-2 items-center flex-1 min-w-[300px]">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <input
                                placeholder="Cari resi, pengiriman..."
                                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="gap-2 border-border text-muted-foreground">
                            <Filter size={16} />
                            Filter
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-muted-foreground">
                        <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-4">Nomor Pengiriman</th>
                                <th className="px-6 py-4">Sales Order</th>
                                <th className="px-6 py-4">Kurir</th>
                                <th className="px-6 py-4">No. Resi</th>
                                <th className="px-6 py-4">Tanggal Kirim</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-foreground">
                            {isLoading ? (
                                <tr><td colSpan={7} className="px-6 py-8 text-center animate-pulse">Memuat data...</td></tr>
                            ) : shipments && shipments.length > 0 ? (
                                shipments
                                    .filter((s: any) => s.shipment_number.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map((ship: any) => (
                                        <tr key={ship.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-primary">{ship.shipment_number}</td>
                                            <td className="px-6 py-4 text-foreground">
                                                {salesOrders.find((so: any) => so.id === ship.sales_order_id)?.order_number || 'Unknown SO'}
                                            </td>
                                            <td className="px-6 py-4">{ship.courier_name || '-'}</td>
                                            <td className="px-6 py-4 font-mono">{ship.tracking_number || '-'}</td>
                                            <td className="px-6 py-4 font-mono text-xs">
                                                {new Date(ship.date).toLocaleDateString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge
                                                    variant={ship.status === 'SUBMITTED' ? 'success' : 'default'}
                                                    className="uppercase text-[10px]"
                                                >
                                                    {ship.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="p-2 hover:bg-muted rounded-lg text-primary"
                                                    onClick={() => {
                                                        setSelectedShipment(ship);
                                                        setIsDetailsModalOpen(true);
                                                    }}
                                                >
                                                    <Eye size={16} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground italic">
                                        Belum ada pengiriman
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Create Shipment Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
                    <Card className="w-full max-w-4xl bg-card border-border shadow-2xl my-8">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-foreground">Catat Pengiriman Barang</h2>
                                <button onClick={() => setIsCreateModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Nomor Surat Jalan (DO)</label>
                                        <input
                                            name="shipment_number"
                                            required
                                            className="w-full bg-background border border-border rounded px-3 py-2 text-foreground"
                                            defaultValue={`DO/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Tanggal Kirim</label>
                                        <input
                                            name="date"
                                            type="date"
                                            required
                                            className="w-full bg-background border border-border rounded px-3 py-2 text-foreground"
                                            defaultValue={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Pilih Sales Order</label>
                                        <select
                                            name="sales_order_id"
                                            required
                                            onChange={(e) => {
                                                const order = salesOrders.find((so: any) => so.id === e.target.value);
                                                setSelectedOrder(order || null);
                                            }}
                                            className="w-full bg-background border border-border rounded px-3 py-2 text-foreground"
                                        >
                                            <option value="">Pilih Sales Order</option>
                                            {salesOrders.map((so: any) => (
                                                <option key={so.id} value={so.id}>
                                                    {so.order_number} - {clients.find((c: any) => c.id === so.client_id)?.name || 'Unknown Customer'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Gudang Asal</label>
                                        <select
                                            name="warehouse_id"
                                            required
                                            className="w-full bg-background border border-border rounded px-3 py-2 text-foreground"
                                        >
                                            <option value="">Pilih Gudang</option>
                                            {warehouses.map((wh: any) => (
                                                <option key={wh.id} value={wh.id}>{wh.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Kurir / Ekspedisi</label>
                                        <input
                                            name="courier_name"
                                            placeholder="JNE, Pos Indonesia, dll"
                                            className="w-full bg-background border border-border rounded px-3 py-2 text-foreground"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Nomor Resi Tracking</label>
                                        <input
                                            name="tracking_number"
                                            placeholder="Masukkan resi pengiriman"
                                            className="w-full bg-background border border-border rounded px-3 py-2 text-foreground"
                                        />
                                    </div>
                                </div>

                                {selectedOrder && (
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Petakan Barang ke Persediaan</h3>
                                        <div className="space-y-3">
                                            {lines.map((line, index) => (
                                                <div key={index} className="grid grid-cols-12 gap-3 items-center">
                                                    <div className="col-span-5 text-sm text-foreground font-medium">
                                                        {line.description}
                                                    </div>
                                                    <div className="col-span-4">
                                                        <select
                                                            value={line.item_id}
                                                            onChange={(e) => handleLineChange(index, 'item_id', e.target.value)}
                                                            className="w-full bg-background border border-border rounded px-3 py-1.5 text-foreground text-xs"
                                                            required
                                                        >
                                                            <option value="">Pilih Barang Persediaan</option>
                                                            {itemsList.map((item: any) => (
                                                                <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-span-3">
                                                        <input
                                                            type="number"
                                                            value={line.quantity_shipped}
                                                            onChange={(e) => handleLineChange(index, 'quantity_shipped', e.target.value)}
                                                            className="w-full bg-background border border-border rounded px-3 py-1.5 text-foreground text-xs"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2 justify-end pt-4 border-t border-border">
                                    <Button variant="ghost" type="button" onClick={() => setIsCreateModalOpen(false)}>Batal</Button>
                                    <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">Simpan</Button>
                                </div>
                            </form>
                        </div>
                    </Card>
                </div>
            )}

            {/* Detail Shipment Modal */}
            {isDetailsModalOpen && selectedShipment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <Card className="w-full max-w-2xl bg-card border-border shadow-2xl">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-foreground">Detail Pengiriman</h2>
                                <button onClick={() => setIsDetailsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground block">Nomor Pengiriman</span>
                                        <span className="font-semibold text-primary">{selectedShipment.shipment_number}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block">Tanggal Kirim</span>
                                        <span className="font-semibold">{new Date(selectedShipment.date).toLocaleDateString('id-ID')}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block">Kurir</span>
                                        <span className="font-semibold">{selectedShipment.courier_name || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block">No. Resi</span>
                                        <span className="font-semibold font-mono">{selectedShipment.tracking_number || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block">Gudang Asal</span>
                                        <span className="font-semibold">
                                            {warehouses.find((w: any) => w.id === selectedShipment.warehouse_id)?.name || 'Unknown Warehouse'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                                    <Button variant="ghost" onClick={() => setIsDetailsModalOpen(false)}>Tutup</Button>
                                    {selectedShipment.status === 'pending' && (
                                        <Button
                                            onClick={() => submitMutation.mutate(selectedShipment.id)}
                                            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                            disabled={submitMutation.isPending}
                                        >
                                            <ClipboardCheck size={16} />
                                            {submitMutation.isPending ? 'Memproses...' : 'Submit & Potong Stok'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
