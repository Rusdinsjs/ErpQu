import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '../../finance/api/finance';
import { inventoryApi } from '../api/inventory';
import { vendorApi } from '../../buying/api/vendors';
import { useAuthStore } from '../../../store/useAuthStore';
import { Card, Button, Badge } from '../../../components/ui';
import {
    Plus, Search, Filter, Download, X, ClipboardCheck, Eye
} from 'lucide-react';
import { toast } from 'sonner';

export default function PurchaseReceipts() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

    const [selectedPoId, setSelectedPoId] = useState('');
    const [selectedVendorId, setSelectedVendorId] = useState('');
    const [selectedWarehouseId, setSelectedWarehouseId] = useState('');

    const queryClient = useQueryClient();
    const activeCompanyId = useAuthStore(s => s.activeCompanyId) || 'c0000000-0000-0000-0000-000000000001';

    const { data: receipts, isLoading } = useQuery({
        queryKey: ['finance', 'purchase-receipts', activeCompanyId],
        queryFn: () => financeApi.listPurchaseReceipts(activeCompanyId)
    });

    const { data: purchaseOrdersResponse } = useQuery({
        queryKey: ['finance', 'purchase-orders'],
        queryFn: financeApi.listPurchaseOrders
    });
    const purchaseOrders = Array.isArray(purchaseOrdersResponse) ? purchaseOrdersResponse : (purchaseOrdersResponse as any)?.data || [];

    const { data: warehouses = [] } = useQuery({
        queryKey: ['inventory', 'warehouses'],
        queryFn: inventoryApi.listWarehouses
    });

    const { data: itemsResponse } = useQuery({
        queryKey: ['inventory', 'items'],
        queryFn: inventoryApi.listItems
    });
    const items = itemsResponse || [];

    const { data: vendorsResponse } = useQuery({
        queryKey: ['vendors-list'],
        queryFn: () => vendorApi.listVendors(1, 100)
    });
    const vendors = Array.isArray(vendorsResponse?.data) ? vendorsResponse.data : [];

    const createMutation = useMutation({
        mutationFn: financeApi.createPurchaseReceipt,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance', 'purchase-receipts'] });
            setIsCreateModalOpen(false);
            setLines([{ item_id: '', qty_received: 1, unit_cost: 0 }]);
            toast.success('Purchase Receipt berhasil dibuat');
        },
        onError: (error: any) => {
            toast.error('Gagal membuat Purchase Receipt: ' + error.message);
        }
    });

    const submitMutation = useMutation({
        mutationFn: financeApi.submitPurchaseReceipt,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance', 'purchase-receipts'] });
            setIsDetailsModalOpen(false);
            toast.success('Purchase Receipt berhasil diposting ke persediaan & akuntansi!');
        },
        onError: (error: any) => {
            toast.error('Gagal memposting: ' + error.message);
        }
    });

    // Form dynamic rows state
    const [lines, setLines] = useState<any[]>([
        { item_id: '', qty_received: 1, unit_cost: 0 }
    ]);

    const handleAddLine = () => {
        setLines([...lines, { item_id: '', qty_received: 1, unit_cost: 0 }]);
    };

    const handleRemoveLine = (index: number) => {
        if (lines.length > 1) {
            setLines(lines.filter((_, i) => i !== index));
        }
    };

    const handlePoChange = (poId: string) => {
        setSelectedPoId(poId);
        if (!poId) return;
        const po = purchaseOrders.find((p: any) => p.id === poId);
        if (po) {
            if (po.vendor_id) {
                setSelectedVendorId(po.vendor_id);
            }
            if (po.warehouse_id) {
                setSelectedWarehouseId(po.warehouse_id);
            }
            if (Array.isArray(po.items) && po.items.length > 0) {
                setLines(po.items.map((pi: any) => ({
                    item_id: pi.item_id || '',
                    qty_received: Number(pi.quantity || 1),
                    unit_cost: Number(pi.rate || pi.unit_price || 0)
                })));
            }
        }
    };

    const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const vId = selectedVendorId || (formData.get('vendor_id') as string);
        const wId = selectedWarehouseId || (formData.get('warehouse_id') as string);

        if (!vId) {
            toast.error('Pilih supplier / vendor terlebih dahulu');
            return;
        }

        const payload = {
            company_id: activeCompanyId,
            receipt_number: formData.get('receipt_number'),
            purchase_order_id: selectedPoId || null,
            vendor_id: vId,
            warehouse_id: wId,
            posting_date: formData.get('posting_date'),
            notes: formData.get('notes'),
            items: lines.map(line => ({
                item_id: line.item_id,
                qty_received: Number(line.qty_received),
                unit_cost: Number(line.unit_cost),
                po_line_id: null,
                batch_no: null,
                serial_no: null
            }))
        };

        if (payload.items.some(i => !i.item_id)) {
            toast.error('Silakan pilih item untuk semua baris');
            return;
        }

        createMutation.mutate(payload);
    };



    // Auto-generate doc number
    const generateDocNumber = () => {
        return `PR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Penerimaan Barang (GRN)</h1>
                    <p className="text-muted-foreground">Pencatatan masuk barang fisik dari Vendor / Supplier</p>
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
                        Buat Penerimaan
                    </Button>
                </div>
            </div>

            <Card className="bg-card border-border overflow-hidden">
                <div className="p-4 border-b border-border flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex gap-2 items-center flex-1 min-w-[300px]">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <input
                                placeholder="Cari nomor penerimaan..."
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
                                <th className="px-6 py-4">Nomor GRN</th>
                                <th className="px-6 py-4">Vendor</th>
                                <th className="px-6 py-4">Gudang Tujuan</th>
                                <th className="px-6 py-4">Tanggal Posting</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-foreground">
                            {isLoading ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center animate-pulse">Memuat data...</td></tr>
                            ) : receipts && receipts.length > 0 ? (
                                receipts
                                    .filter((r: any) => r.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map((receipt: any) => (
                                        <tr key={receipt.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-primary">{receipt.receipt_number}</td>
                                            <td className="px-6 py-4 text-foreground">
                                                {vendors.find((v: any) => v.id === receipt.vendor_id)?.name || 'Unknown Vendor'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {warehouses.find((w: any) => w.id === receipt.warehouse_id)?.name || 'Unknown Warehouse'}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs">
                                                {new Date(receipt.posting_date).toLocaleDateString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge
                                                    variant={receipt.status === 'SUBMITTED' ? 'success' : 'default'}
                                                    className="uppercase text-[10px]"
                                                >
                                                    {receipt.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="p-2 hover:bg-muted rounded-lg text-primary"
                                                    onClick={() => {
                                                        setSelectedReceipt(receipt);
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
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">
                                        Belum ada penerimaan barang
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Create Purchase Receipt Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
                    <Card className="w-full max-w-4xl bg-card border-border shadow-2xl my-8">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-foreground">Buat Penerimaan Barang (GRN)</h2>
                                <button onClick={() => setIsCreateModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-6">
                                {/* Rujukan PO */}
                                <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-1.5">
                                    <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                                        Rujukan Pesanan Pembelian (Purchase Order)
                                    </label>
                                    <select
                                        value={selectedPoId}
                                        onChange={(e) => handlePoChange(e.target.value)}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground font-medium"
                                    >
                                        <option value="">-- Penerimaan Langsung Tanpa PO --</option>
                                        {purchaseOrders.map((po: any) => (
                                            <option key={po.id} value={po.id}>
                                                {po.order_number || po.name || po.po_number} - {po.supplier_name || 'Vendor'} (Total: Rp {Number(po.total_amount || 0).toLocaleString('id-ID')})
                                            </option>
                                        ))}
                                    </select>
                                    <span className="text-[11px] text-muted-foreground block">
                                        Memilih PO akan otomatis mengisi vendor, gudang tujuan, dan rincian item barang.
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Nomor GRN</label>
                                        <input
                                            name="receipt_number"
                                            required
                                            className="w-full bg-background border border-border rounded px-3 py-2 text-foreground"
                                            defaultValue={generateDocNumber()}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Tanggal Posting</label>
                                        <input
                                            name="posting_date"
                                            type="date"
                                            required
                                            className="w-full bg-background border border-border rounded px-3 py-2 text-foreground"
                                            defaultValue={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Vendor / Supplier *</label>
                                        <select
                                            name="vendor_id"
                                            value={selectedVendorId}
                                            onChange={(e) => setSelectedVendorId(e.target.value)}
                                            required
                                            className="w-full bg-background border border-border rounded px-3 py-2 text-foreground"
                                        >
                                            <option value="">-- Pilih Vendor Resmi --</option>
                                            {vendors.map((vendor: any) => (
                                                <option key={vendor.id} value={vendor.id}>
                                                    {vendor.name} ({vendor.code || 'Vendor'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Gudang Penerima *</label>
                                        <select
                                            name="warehouse_id"
                                            value={selectedWarehouseId}
                                            onChange={(e) => setSelectedWarehouseId(e.target.value)}
                                            required
                                            className="w-full bg-background border border-border rounded px-3 py-2 text-foreground"
                                        >
                                            <option value="">-- Pilih Gudang Tujuan --</option>
                                            {warehouses.map((wh: any) => (
                                                <option key={wh.id} value={wh.id}>{wh.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Catatan / Remarks</label>
                                    <textarea
                                        name="notes"
                                        rows={2}
                                        className="w-full bg-background border border-border rounded px-3 py-2 text-foreground"
                                        placeholder="Tambahkan keterangan..."
                                    />
                                </div>

                                {/* Items Dynamic Lines */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-sm font-semibold text-foreground">Daftar Barang Penerimaan</h3>
                                        <Button type="button" onClick={handleAddLine} variant="outline" size="sm">Tambah Baris</Button>
                                    </div>

                                    <div className="space-y-2">
                                        {lines.map((line, index) => (
                                            <div key={index} className="flex gap-3 items-center">
                                                <div className="flex-1">
                                                    <select
                                                        value={line.item_id}
                                                        onChange={(e) => handleLineChange(index, 'item_id', e.target.value)}
                                                        className="w-full bg-background border border-border rounded px-3 py-2 text-foreground text-sm"
                                                        required
                                                    >
                                                        <option value="">Pilih Item</option>
                                                        {items.map((item: any) => (
                                                            <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="w-32">
                                                    <input
                                                        type="number"
                                                        placeholder="Qty"
                                                        required
                                                        min="1"
                                                        step="any"
                                                        value={line.qty_received}
                                                        onChange={(e) => handleLineChange(index, 'qty_received', e.target.value)}
                                                        className="w-full bg-background border border-border rounded px-3 py-2 text-foreground text-sm"
                                                    />
                                                </div>
                                                <div className="w-40">
                                                    <input
                                                        type="number"
                                                        placeholder="Harga Satuan"
                                                        required
                                                        min="0"
                                                        step="any"
                                                        value={line.unit_cost}
                                                        onChange={(e) => handleLineChange(index, 'unit_cost', e.target.value)}
                                                        className="w-full bg-background border border-border rounded px-3 py-2 text-foreground text-sm"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveLine(index)}
                                                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2 justify-end pt-4 border-t border-border">
                                    <Button variant="ghost" type="button" onClick={() => setIsCreateModalOpen(false)}>Batal</Button>
                                    <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">Simpan Draft</Button>
                                </div>
                            </form>
                        </div>
                    </Card>
                </div>
            )}

            {/* Details Modal */}
            {isDetailsModalOpen && selectedReceipt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <Card className="w-full max-w-2xl bg-card border-border shadow-2xl">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-foreground">Detail Penerimaan Barang</h2>
                                <button onClick={() => setIsDetailsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground block">Nomor GRN</span>
                                        <span className="font-semibold text-primary">{selectedReceipt.receipt_number}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block">Tanggal Posting</span>
                                        <span className="font-semibold">{new Date(selectedReceipt.posting_date).toLocaleDateString('id-ID')}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block">Vendor / Supplier</span>
                                        <span className="font-semibold">
                                            {vendors.find((v: any) => v.id === selectedReceipt.vendor_id)?.name || 'Unknown Vendor'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block">Gudang Penerima</span>
                                        <span className="font-semibold">
                                            {warehouses.find((w: any) => w.id === selectedReceipt.warehouse_id)?.name || 'Unknown Warehouse'}
                                        </span>
                                    </div>
                                </div>

                                {selectedReceipt.notes && (
                                    <div className="bg-muted/50 p-3 rounded text-sm text-foreground">
                                        <span className="text-muted-foreground block text-xs mb-1">Catatan</span>
                                        {selectedReceipt.notes}
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                                    <Button variant="ghost" onClick={() => setIsDetailsModalOpen(false)}>Tutup</Button>
                                    {selectedReceipt.status === 'draft' && (
                                        <Button
                                            onClick={() => submitMutation.mutate(selectedReceipt.id)}
                                            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                            disabled={submitMutation.isPending}
                                        >
                                            <ClipboardCheck size={16} />
                                            {submitMutation.isPending ? 'Memproses...' : 'Submit & Post ke Akuntansi'}
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
