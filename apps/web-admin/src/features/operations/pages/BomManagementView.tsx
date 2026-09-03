import React, { useState, useEffect } from 'react';
import { api } from '../../../api/http';
import { inventoryApi, type InventoryItem } from '../../inventory/api/inventory';
import { useAuthStore } from '../../../store/useAuthStore';
import { PageHeader, Card, Badge, LoadingSpinner, Modal, Button, Input, Select } from '../../../components/ui';
import { Layers, Calculator, RefreshCw, CheckCircle2, Package, Search, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Bom {
    id: string;
    bom_number: string;
    bom_name?: string;
    item_id: string;
    quantity?: string | number;
    base_quantity?: string | number;
    is_active: boolean;
    created_at: string;
}

interface MaterialRequirement {
    item_id: string;
    base_qty: string | number;
    scrap_percentage: string | number;
    total_qty_required: string | number;
}

interface BomLineItem {
    item_id: string;
    qty_required: number;
    scrap_percentage: number;
}

export default function BomManagementView() {
    const activeCompanyId = useAuthStore(s => s.activeCompanyId) || 'c0000000-0000-0000-0000-000000000001';
    const [boms, setBoms] = useState<Bom[]>([]);
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Create BOM Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [formItemId, setFormItemId] = useState('');
    const [formBomNumber, setFormBomNumber] = useState(`BOM-${Date.now().toString().slice(-6)}`);
    const [formQuantity, setFormQuantity] = useState('1');
    const [formLineItems, setFormLineItems] = useState<BomLineItem[]>([
        { item_id: '', qty_required: 1, scrap_percentage: 0 }
    ]);

    // Material Requirement Calculator Modal State
    const [selectedBom, setSelectedBom] = useState<Bom | null>(null);
    const [targetQty, setTargetQty] = useState('100');
    const [calcLoading, setCalcLoading] = useState(false);
    const [requirements, setRequirements] = useState<MaterialRequirement[]>([]);

    const fetchBoms = async () => {
        try {
            setLoading(true);
            const [bomsRes, itemsRes] = await Promise.all([
                api.get('/manufacturing/boms'),
                inventoryApi.listItems()
            ]);
            if (bomsRes.data?.success && bomsRes.data?.data) {
                setBoms(bomsRes.data.data);
            }
            if (Array.isArray(itemsRes)) {
                setItems(itemsRes);
            }
        } catch (error) {
            console.error('Failed to load BOMs:', error);
            toast.error('Gagal memuat master Bill of Materials.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBoms();
    }, []);

    const handleAddLineItem = () => {
        setFormLineItems(prev => [...prev, { item_id: '', qty_required: 1, scrap_percentage: 0 }]);
    };

    const handleRemoveLineItem = (index: number) => {
        if (formLineItems.length > 1) {
            setFormLineItems(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleLineItemChange = (index: number, field: keyof BomLineItem, value: any) => {
        setFormLineItems(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const handleCreateBom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formItemId) {
            toast.error('Pilih barang jadi (hasil produksi).');
            return;
        }
        const validMaterials = formLineItems.filter(l => l.item_id && l.qty_required > 0);
        if (validMaterials.length === 0) {
            toast.error('Tambahkan minimal 1 bahan baku valid.');
            return;
        }

        try {
            setCreateLoading(true);
            const payload = {
                company_id: activeCompanyId,
                item_id: formItemId,
                bom_number: formBomNumber.trim() || `BOM-${Date.now().toString().slice(-6)}`,
                quantity: parseFloat(formQuantity) || 1,
                items: validMaterials.map(l => ({
                    item_id: l.item_id,
                    qty_required: l.qty_required,
                    scrap_percentage: l.scrap_percentage ? parseFloat(String(l.scrap_percentage)) : 0
                }))
            };

            const res = await api.post('/manufacturing/boms', payload);
            if (res.data?.success || res.status === 200 || res.status === 201) {
                toast.success('Master BOM berhasil dibuat!');
                setIsCreateOpen(false);
                setFormItemId('');
                setFormBomNumber(`BOM-${Date.now().toString().slice(-6)}`);
                setFormLineItems([{ item_id: '', qty_required: 1, scrap_percentage: 0 }]);
                fetchBoms();
            }
        } catch (error: any) {
            console.error('Failed to create BOM:', error);
            toast.error(error.response?.data?.error || 'Gagal menyimpan master BOM.');
        } finally {
            setCreateLoading(false);
        }
    };

    const handleCalculateRequirements = async () => {
        if (!selectedBom) return;
        try {
            setCalcLoading(true);
            const res = await api.get(
                `/manufacturing/boms/${selectedBom.id}/requirements?target_qty=${targetQty}`
            );
            if (res.data?.success && res.data?.data) {
                setRequirements(res.data.data);
            }
        } catch (error) {
            console.error('Failed to calculate material requirements:', error);
        } finally {
            setCalcLoading(false);
        }
    };

    const openCalculator = (bom: Bom) => {
        setSelectedBom(bom);
        setRequirements([]);
        setTargetQty('100');
    };

    const getItemName = (itemId: string) => {
        const item = items.find(i => i.id === itemId);
        return item ? `${item.name} (${item.sku || 'SKU'})` : itemId;
    };

    const filteredBoms = boms.filter(
        (b) =>
            b.bom_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (b.bom_name && b.bom_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            getItemName(b.item_id).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Bill of Materials (BOM) & Resep Produksi"
                subtitle="Master formula struktur bahan baku bertingkat dengan toleransi scrap untuk perencanaan kebutuhan material (MRP)"
            >
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchBoms}
                        className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-xl hover:bg-muted border border-border transition-colors cursor-pointer"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-md"
                    >
                        <Plus size={16} /> Buat BOM Baru
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
                                placeholder="Cari nomor atau nama BOM..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <span className="text-xs text-muted-foreground">
                            {filteredBoms.length} Master Resep BOM Terdaftar
                        </span>
                    </div>

                    <Card className="overflow-hidden border-border bg-card/70">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-semibold border-b border-border">
                                    <tr>
                                        <th className="px-4 py-3">Nomor BOM</th>
                                        <th className="px-4 py-3">Nama Formula</th>
                                        <th className="px-4 py-3 text-right">Kuantitas Dasar (Batch)</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                        <th className="px-4 py-3 text-center">Kalkulator Kebutuhan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {filteredBoms.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                                                Belum ada data Bill of Materials (BOM).
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredBoms.map((bom) => {
                                            const itemName = getItemName(bom.item_id);
                                            const batchQty = bom.quantity || bom.base_quantity || 1;
                                            return (
                                                <tr key={bom.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-4 py-3 font-mono font-medium text-foreground">
                                                        {bom.bom_number}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                                                        <Layers size={16} className="text-primary" />
                                                        <span>{bom.bom_name || itemName}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                                                        {Number(batchQty).toLocaleString('id-ID')} unit
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {bom.is_active ? (
                                                            <Badge variant="default" className="bg-emerald-600 text-white font-bold">
                                                                AKTIF
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary">NON-AKTIF</Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={() => openCalculator(bom)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-primary/20"
                                                        >
                                                            <Calculator size={14} />
                                                            Simulasi MRP
                                                        </button>
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

            {/* Create BOM Modal */}
            <Modal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title="Buat Formula Resep BOM Baru"
            >
                <form onSubmit={handleCreateBom} className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                                Barang Jadi (Hasil Produksi) *
                            </label>
                            <Select
                                value={formItemId}
                                onChange={(val) => setFormItemId(val)}
                                options={[
                                    { value: '', label: 'Pilih Barang Jadi...' },
                                    ...items.map(i => ({ value: i.id, label: `${i.name} (${i.sku || 'SKU'})` }))
                                ]}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                                Nomor / Kode Formula BOM
                            </label>
                            <Input
                                type="text"
                                value={formBomNumber}
                                onChange={(e) => setFormBomNumber(e.target.value)}
                                placeholder="BOM-001"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                            Kuantitas Dasar Per Batch Produksi
                        </label>
                        <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={formQuantity}
                            onChange={(e) => setFormQuantity(e.target.value)}
                            placeholder="1"
                            required
                        />
                    </div>

                    {/* Materials Lines */}
                    <div className="pt-2 border-t border-border">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Komposisi Bahan Baku (Line Items)
                            </span>
                            <button
                                type="button"
                                onClick={handleAddLineItem}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                            >
                                <Plus size={14} /> Tambah Bahan Baku
                            </button>
                        </div>

                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                            {formLineItems.map((line, idx) => (
                                <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-muted/40 border border-border">
                                    <div className="flex-1">
                                        <Select
                                            value={line.item_id}
                                            onChange={(val) => handleLineItemChange(idx, 'item_id', val)}
                                            options={[
                                                { value: '', label: 'Pilih Bahan Baku...' },
                                                ...items.map(i => ({ value: i.id, label: `${i.name} (${i.sku || 'SKU'})` }))
                                            ]}
                                        />
                                    </div>
                                    <div className="w-24">
                                        <Input
                                            type="number"
                                            min="0.001"
                                            step="0.001"
                                            placeholder="Qty"
                                            value={line.qty_required}
                                            onChange={(e) => handleLineItemChange(idx, 'qty_required', parseFloat(e.target.value) || 0)}
                                            required
                                        />
                                    </div>
                                    <div className="w-20">
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                            placeholder="Scrap%"
                                            value={line.scrap_percentage}
                                            onChange={(e) => handleLineItemChange(idx, 'scrap_percentage', parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    {formLineItems.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveLineItem(idx)}
                                            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={createLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                            {createLoading ? 'Menyimpan...' : 'Simpan Formula BOM'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Material Requirement Exploding Calculator Modal */}
            <Modal
                isOpen={!!selectedBom}
                onClose={() => setSelectedBom(null)}
                title={`Simulasi Kebutuhan Material: ${selectedBom?.bom_name || getItemName(selectedBom?.item_id || '')}`}
            >
                <div className="space-y-5">
                    <div className="bg-muted/40 p-4 rounded-xl border border-border flex items-center justify-between">
                        <div>
                            <div className="text-xs font-bold uppercase text-muted-foreground">Formula Terpilih</div>
                            <div className="text-sm font-bold text-foreground">{selectedBom?.bom_number}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-bold uppercase text-muted-foreground">Basis Batch Resep</div>
                            <div className="text-sm font-bold text-foreground">{selectedBom?.quantity || selectedBom?.base_quantity || 1} unit</div>
                        </div>
                    </div>

                    <div className="flex gap-3 items-end">
                        <div className="flex-1">
                            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                                Target Kuantitas Produksi Selesai
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={targetQty}
                                onChange={(e) => setTargetQty(e.target.value)}
                                className="w-full px-3 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                            />
                        </div>
                        <button
                            onClick={handleCalculateRequirements}
                            disabled={calcLoading}
                            className="px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                        >
                            <Calculator size={16} />
                            {calcLoading ? 'Menghitung...' : 'Hitung Kebutuhan'}
                        </button>
                    </div>

                    {/* Requirements Breakdown Table */}
                    {requirements.length > 0 && (
                        <div className="border border-border rounded-xl overflow-hidden mt-4">
                            <div className="bg-muted/60 px-4 py-2 text-xs font-bold uppercase text-muted-foreground border-b border-border">
                                Rincian Kebutuhan Bahan Baku (Termasuk Toleransi Scrap)
                            </div>
                            <table className="w-full text-xs text-left">
                                <thead className="bg-muted/30 text-muted-foreground font-semibold border-b border-border">
                                    <tr>
                                        <th className="px-3 py-2">Bahan Baku</th>
                                        <th className="px-3 py-2 text-right">Kebutuhan Netto</th>
                                        <th className="px-3 py-2 text-right">Scrap Rate (%)</th>
                                        <th className="px-3 py-2 text-right">Total Kebutuhan Bruto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {requirements.map((req, idx) => (
                                        <tr key={idx} className="hover:bg-muted/20">
                                            <td className="px-3 py-2 font-medium text-foreground">{getItemName(req.item_id)}</td>
                                            <td className="px-3 py-2 text-right font-mono">{Number(req.base_qty).toFixed(2)}</td>
                                            <td className="px-3 py-2 text-right font-mono text-amber-500 font-semibold">{req.scrap_percentage}%</td>
                                            <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">
                                                {Number(req.total_qty_required).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
