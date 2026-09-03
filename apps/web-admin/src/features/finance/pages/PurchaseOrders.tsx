import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '../api/finance';
import { vendorApi } from '../../buying/api/vendors';
import { inventoryApi } from '../../inventory/api/inventory';
import {
    Card, Button, Badge, Modal, CurrencyInput, UniversalTableToolbar,
    type TableColumnOption, type FilterChip
} from '../../../components/ui';
import {
    Plus, Search, Filter, Download, MoreVertical, X, Barcode,
    Trash2, Save, ChevronDown, ChevronUp, ShoppingBag, FileText,
    Printer, Building2, Calendar, CheckCircle2, Clock, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface POItemRow {
    item_code: string;
    item_name: string;
    required_by: string;
    quantity: number;
    uom: string;
    rate: number;
    amount: number;
    target_warehouse: string;
}

export default function PurchaseOrders() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'address' | 'terms' | 'more'>('details');
    const queryClient = useQueryClient();

    // Form Field States
    const [series, setSeries] = useState('PUR-ORD-.YYYY.-');
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [company, setCompany] = useState('SJS Group');
    const [supplierId, setSupplierId] = useState('');
    const [requiredBy, setRequiredBy] = useState('');
    const [isSubcontracted, setIsSubcontracted] = useState(false);
    const [currency, setCurrency] = useState('IDR');
    const [priceList, setPriceList] = useState('Standard Buying');
    const [targetWarehouse, setTargetWarehouse] = useState('Gudang Utama - Jakarta');
    const [subject, setSubject] = useState('');
    const [budgetType, setBudgetType] = useState('OPEX');

    // Taxes & Terms
    const [paymentTerms, setPaymentTerms] = useState('Net 30');
    const [termsText, setTermsText] = useState('1. Pembayaran akan ditransfer 30 hari setelah faktur dan barang diterima lengkap.\n2. Barang cacat atau tidak sesuai spesifikasi akan diretur.');
    const [remarks, setRemarks] = useState('');

    // Dynamic Items Child Table
    const [items, setItems] = useState<POItemRow[]>([
        {
            item_code: 'MAT-PBR-001',
            item_name: 'Solar Industri HSD (High Speed Diesel)',
            required_by: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
            quantity: 5000,
            uom: 'Liter',
            rate: 14500,
            amount: 72500000,
            target_warehouse: 'Gudang Utama - Jakarta'
        }
    ]);

    // Column visibility state
    const [columns, setColumns] = useState<TableColumnOption[]>([
        { key: 'po_number', label: 'Nomor PO', visible: true },
        { key: 'supplier', label: 'Vendor / Pemasok', visible: true },
        { key: 'date', label: 'Tanggal Order', visible: true },
        { key: 'items_count', label: 'Jumlah Item', visible: true },
        { key: 'total_amount', label: 'Total Nilai (Rp)', visible: true },
        { key: 'status', label: 'Status', visible: true },
    ]);

    const toggleColumn = (key: string) => {
        setColumns(prev => prev.map(c => c.key === key ? { ...c, visible: !c.visible } : c));
    };

    const isColVisible = (key: string) => {
        const col = columns.find(c => c.key === key);
        return col ? col.visible !== false : true;
    };

    const { data: ordersResponse, isLoading } = useQuery({
        queryKey: ['finance', 'purchase-orders'],
        queryFn: financeApi.listPurchaseOrders
    });
    const orders = Array.isArray(ordersResponse) ? ordersResponse : (ordersResponse as any)?.data || [];

    const { data: vendorsResponse } = useQuery({
        queryKey: ['vendors-list'],
        queryFn: () => vendorApi.listVendors(1, 100)
    });
    const vendors = Array.isArray(vendorsResponse?.data) ? vendorsResponse.data : [];

    const { data: inventoryItems = [] } = useQuery({
        queryKey: ['inventory-items-for-po'],
        queryFn: () => inventoryApi.listItems()
    });

    const { data: warehouses = [] } = useQuery({
        queryKey: ['warehouses-list'],
        queryFn: () => inventoryApi.listWarehouses()
    });

    const handleSelectInventoryItem = (index: number, itemId: string) => {
        const item = inventoryItems.find((it: any) => it.id === itemId);
        if (!item) return;
        const rate = Number(item.purchase_price || item.average_cost || 0);
        setItems(prev => {
            const next = [...prev];
            const qty = next[index]?.quantity || 1;
            next[index] = {
                ...next[index],
                item_code: item.sku,
                item_name: item.name,
                rate: rate,
                amount: qty * rate,
            };
            return next;
        });
    };

    const createMutation = useMutation({
        mutationFn: financeApi.createPurchaseOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance', 'purchase-orders'] });
            setIsModalOpen(false);
            toast.success('Pesanan Pembelian (PO) berhasil dibuat');
            // Reset items
            setItems([]);
        },
        onError: (error: any) => {
            toast.error('Gagal membuat pesanan: ' + error.message);
        }
    });

    const handleAddItem = () => {
        setItems(prev => [
            ...prev,
            {
                item_code: '',
                item_name: '',
                required_by: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                quantity: 1,
                uom: 'Unit',
                rate: 0,
                amount: 0,
                target_warehouse: targetWarehouse
            }
        ]);
    };

    const handleUpdateItem = (index: number, field: keyof POItemRow, value: any) => {
        setItems(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            if (field === 'quantity' || field === 'rate') {
                const q = field === 'quantity' ? Number(value) : next[index].quantity;
                const r = field === 'rate' ? Number(value) : next[index].rate;
                next[index].amount = q * r;
            }
            return next;
        });
    };

    const handleRemoveItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    // Subtotal & Calculations
    const subtotal = useMemo(() => {
        return items.reduce((acc, item) => acc + (item.amount || 0), 0);
    }, [items]);
    const ppnRate = 0.11;
    const taxAmount = subtotal * ppnRate;
    const grandTotal = subtotal + taxAmount;

    const filteredOrders = useMemo(() => {
        return orders.filter((o: any) => {
            const num = (o.name || o.po_number || o.id || '').toLowerCase();
            const supplier = (o.supplier_name || o.supplier || '').toLowerCase();
            return num.includes(searchTerm.toLowerCase()) || supplier.includes(searchTerm.toLowerCase());
        });
    }, [orders, searchTerm]);

    const exportDataset = useMemo(() => {
        return filteredOrders.map((o: any) => ({
            'Nomor PO': o.name || o.po_number || o.id,
            'Vendor/Supplier': o.supplier_name || o.supplier || '-',
            'Tanggal Order': o.transaction_date || o.order_date || '-',
            'Grand Total (Rp)': Number(o.grand_total || o.total_amount || 0),
            'Status': o.status || 'Draft'
        }));
    }, [filteredOrders]);

    return (
        <div className="p-4 md:p-6 space-y-6 bg-background min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header + Action */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                            <ShoppingBag size={24} />
                        </div>
                        Pesanan Pembelian (Purchase Orders)
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Penerbitan surat pesanan resmi kepada vendor, kontrol anggaran biaya, dan status penerimaan barang
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="filled"
                        onClick={() => setIsModalOpen(true)}
                        className="bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20 rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Buat Purchase Order Baru
                    </Button>
                </div>
            </div>

            {/* Universal Table Toolbar */}
            <UniversalTableToolbar
                searchQuery={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Cari nomor PO atau nama vendor..."
                columns={columns}
                onToggleColumn={toggleColumn}
                exportData={exportDataset}
                exportFilename="daftar_pesanan_pembelian_po"
            />

            {/* Orders Table */}
            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-border/40 bg-muted/40">
                                {isColVisible('po_number') && (
                                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Nomor PO
                                    </th>
                                )}
                                {isColVisible('supplier') && (
                                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Vendor / Pemasok
                                    </th>
                                )}
                                {isColVisible('date') && (
                                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Tanggal Order
                                    </th>
                                )}
                                {isColVisible('total_amount') && (
                                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
                                        Total Nilai (Rp)
                                    </th>
                                )}
                                {isColVisible('status') && (
                                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">
                                        Status
                                    </th>
                                )}
                                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                                        <ShoppingBag size={40} className="mx-auto mb-3 opacity-20" />
                                        <p className="text-sm font-semibold">Belum ada dokumen Purchase Order</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order: any) => (
                                    <tr key={order.id || order.name} className="hover:bg-muted/30 transition-colors">
                                        {isColVisible('po_number') && (
                                            <td className="px-5 py-3.5 font-mono font-bold text-foreground">
                                                {order.name || order.po_number || order.id?.substring(0, 8)}
                                            </td>
                                        )}
                                        {isColVisible('supplier') && (
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <Building2 size={14} className="text-muted-foreground" />
                                                    <span className="font-semibold text-foreground text-xs">
                                                        {order.supplier_name || order.supplier || 'Vendor Umum'}
                                                    </span>
                                                </div>
                                            </td>
                                        )}
                                        {isColVisible('date') && (
                                            <td className="px-5 py-3.5 text-xs text-muted-foreground">
                                                {order.transaction_date || order.order_date || '-'}
                                            </td>
                                        )}
                                        {isColVisible('total_amount') && (
                                            <td className="px-5 py-3.5 text-right font-mono font-bold text-foreground">
                                                Rp {Number(order.grand_total || order.total_amount || 0).toLocaleString('id-ID')}
                                            </td>
                                        )}
                                        {isColVisible('status') && (
                                            <td className="px-5 py-3.5 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                    order.status === 'Submitted' || order.status === 'Approved'
                                                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                                        : order.status === 'Cancelled'
                                                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                                }`}>
                                                    {order.status || 'Draft'}
                                                </span>
                                            </td>
                                        )}
                                        <td className="px-5 py-3.5 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => window.print()}
                                                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                    title="Cetak Purchase Order"
                                                >
                                                    <Printer size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Buat Purchase Order Baru */}
            <Modal
                isOpen={isModalOpen}
                opened={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Buat Dokumen Purchase Order (PO) Baru"
                size="4xl"
            >
                <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1 custom-scrollbar">
                    {/* Header Info */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-muted/30 border border-border/40 rounded-2xl">
                        <div>
                            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                                Vendor / Pemasok *
                            </label>
                            <select
                                className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-medium"
                                value={supplierId}
                                onChange={(e) => setSupplierId(e.target.value)}
                            >
                                <option value="">-- Pilih Vendor Resmi --</option>
                                {vendors.map((v: any) => (
                                    <option key={v.id} value={v.id}>{v.name} ({v.code || 'Vendor'})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                                Gudang Tujuan
                            </label>
                            <select
                                className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-medium"
                                value={targetWarehouse}
                                onChange={(e) => setTargetWarehouse(e.target.value)}
                            >
                                <option value="">-- Pilih Gudang --</option>
                                {warehouses.map((w: any) => (
                                    <option key={w.id} value={w.name || w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                                Tanggal Order
                            </label>
                            <input
                                type="date"
                                value={orderDate}
                                onChange={(e) => setOrderDate(e.target.value)}
                                className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                                Tipe Anggaran
                            </label>
                            <select
                                className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-medium"
                                value={budgetType}
                                onChange={(e) => setBudgetType(e.target.value)}
                            >
                                <option value="OPEX">OPEX (Operasional)</option>
                                <option value="CAPEX">CAPEX (Investasi Aset)</option>
                            </select>
                        </div>
                    </div>

                    {/* Sub-table Items */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                                Rincian Barang / Jasa yang Dipesan
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleAddItem}
                                className="rounded-xl text-xs flex items-center gap-1.5"
                            >
                                <Plus size={14} />
                                Tambah Baris Item
                            </Button>
                        </div>

                        <div className="border border-border/60 rounded-2xl overflow-hidden">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-muted/60 border-b border-border/40">
                                    <tr>
                                        <th className="p-3 font-bold">Nama Barang / Deskripsi</th>
                                        <th className="p-3 font-bold w-24">Jumlah</th>
                                        <th className="p-3 font-bold w-24">Satuan</th>
                                        <th className="p-3 font-bold w-44">Harga Satuan (Rp)</th>
                                        <th className="p-3 font-bold text-right w-36">Total (Rp)</th>
                                        <th className="p-3 font-bold text-center w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-6 text-center text-muted-foreground">
                                                Belum ada baris item. Klik "Tambah Baris Item" untuk mulai.
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-muted/20">
                                                <td className="p-2.5">
                                                    <div className="space-y-1">
                                                        {inventoryItems.length > 0 && (
                                                            <select
                                                                className="w-full bg-background border border-border/40 rounded-lg px-2 py-1 text-[11px] text-foreground focus:outline-none focus:border-primary"
                                                                onChange={(e) => handleSelectInventoryItem(idx, e.target.value)}
                                                                defaultValue=""
                                                            >
                                                                <option value="">-- Pilih dari Master Barang --</option>
                                                                {inventoryItems.map((it: any) => (
                                                                    <option key={it.id} value={it.id}>
                                                                        [{it.sku}] {it.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        )}
                                                        <input
                                                            type="text"
                                                            placeholder="Nama item suku cadang / material..."
                                                            value={item.item_name}
                                                            onChange={(e) => handleUpdateItem(idx, 'item_name', e.target.value)}
                                                            className="w-full bg-transparent border border-border/40 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-2.5">
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={item.quantity}
                                                        onChange={(e) => handleUpdateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                        className="w-full bg-transparent border border-border/40 rounded-lg px-2.5 py-1.5 text-xs text-foreground font-mono text-center focus:outline-none focus:border-primary"
                                                    />
                                                </td>
                                                <td className="p-2.5">
                                                    <input
                                                        type="text"
                                                        value={item.uom}
                                                        onChange={(e) => handleUpdateItem(idx, 'uom', e.target.value)}
                                                        className="w-full bg-transparent border border-border/40 rounded-lg px-2 py-1.5 text-xs text-foreground text-center focus:outline-none focus:border-primary"
                                                    />
                                                </td>
                                                <td className="p-2.5">
                                                    <CurrencyInput
                                                        value={item.rate}
                                                        onChange={(val) => handleUpdateItem(idx, 'rate', val)}
                                                        size="sm"
                                                    />
                                                </td>
                                                <td className="p-2.5 text-right font-mono font-bold text-foreground">
                                                    Rp {item.amount.toLocaleString('id-ID')}
                                                </td>
                                                <td className="p-2.5 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(idx)}
                                                        className="p-1 text-muted-foreground hover:text-rose-400 transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Summary Calculation */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 p-4 bg-muted/20 border border-border/40 rounded-2xl">
                        <div className="flex-1 space-y-2">
                            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider">
                                Catatan & Ketentuan Pembayaran:
                            </label>
                            <textarea
                                rows={2}
                                value={termsText}
                                onChange={(e) => setTermsText(e.target.value)}
                                className="w-full bg-background border border-border/40 rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                            />
                        </div>

                        <div className="w-full sm:w-72 space-y-2 text-xs font-medium">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal Barang:</span>
                                <span className="font-mono text-foreground font-bold">Rp {subtotal.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>PPN Masukan (11%):</span>
                                <span className="font-mono text-foreground font-bold">Rp {taxAmount.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between border-t border-border/40 pt-2 text-sm font-bold text-foreground">
                                <span>Grand Total:</span>
                                <span className="font-mono text-emerald-400">Rp {grandTotal.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Form Action */}
                    <div className="flex gap-2 justify-end pt-3 border-t border-border/40">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl">
                            Batal
                        </Button>
                        <Button
                            variant="filled"
                            onClick={() => createMutation.mutate({
                                supplier_id: supplierId,
                                order_date: orderDate,
                                items,
                                subtotal,
                                tax_amount: taxAmount,
                                grand_total: grandTotal,
                                terms_text: termsText
                            })}
                            loading={createMutation.isPending}
                            className="bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl"
                        >
                            Simpan & Terbitkan PO
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
