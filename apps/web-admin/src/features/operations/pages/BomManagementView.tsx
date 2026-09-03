import React, { useState, useEffect } from 'react';
import { api } from '../../../api/http';
import { PageHeader, Card, Badge, LoadingSpinner, Modal } from '../../../components/ui';
import { Layers, Calculator, RefreshCw, CheckCircle2, Package, Search } from 'lucide-react';

interface Bom {
    id: string;
    bom_number: string;
    bom_name: string;
    item_id: string;
    base_quantity: string | number;
    is_active: boolean;
    created_at: string;
}

interface MaterialRequirement {
    item_id: string;
    base_qty: string | number;
    scrap_percentage: string | number;
    total_qty_required: string | number;
}

export default function BomManagementView() {
    const [boms, setBoms] = useState<Bom[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Material Requirement Calculator Modal State
    const [selectedBom, setSelectedBom] = useState<Bom | null>(null);
    const [targetQty, setTargetQty] = useState('100');
    const [calcLoading, setCalcLoading] = useState(false);
    const [requirements, setRequirements] = useState<MaterialRequirement[]>([]);

    const fetchBoms = async () => {
        try {
            setLoading(true);
            const res = await api.get('/manufacturing/boms');
            if (res.data?.success && res.data?.data) {
                setBoms(res.data.data);
            }
        } catch (error) {
            console.error('Failed to load BOMs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBoms();
    }, []);

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

    const filteredBoms = boms.filter(
        (b) =>
            b.bom_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.bom_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Bill of Materials (BOM) & Resep Produksi"
                subtitle="Master formula struktur bahan baku bertingkat dengan toleransi scrap untuk perencanaan kebutuhan material (MRP)"
            >
                <button
                    onClick={fetchBoms}
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
                                        filteredBoms.map((bom) => (
                                            <tr key={bom.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 font-mono font-medium text-foreground">
                                                    {bom.bom_number}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                                                    <Layers size={16} className="text-primary" />
                                                    {bom.bom_name}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                                                    {Number(bom.base_quantity).toLocaleString('id-ID')} unit
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
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            )}

            {/* Material Requirement Exploding Calculator Modal */}
            <Modal
                isOpen={!!selectedBom}
                onClose={() => setSelectedBom(null)}
                title={`Simulasi Kebutuhan Material: ${selectedBom?.bom_name || ''}`}
            >
                <div className="space-y-5">
                    <div className="bg-muted/40 p-4 rounded-xl border border-border flex items-center justify-between">
                        <div>
                            <div className="text-xs font-bold uppercase text-muted-foreground">Formula Terpilih</div>
                            <div className="text-sm font-bold text-foreground">{selectedBom?.bom_number}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-bold uppercase text-muted-foreground">Basis Batch Resep</div>
                            <div className="text-sm font-bold text-foreground">{selectedBom?.base_quantity} unit</div>
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
                                        <th className="px-3 py-2">ID Bahan Baku</th>
                                        <th className="px-3 py-2 text-right">Kebutuhan Netto</th>
                                        <th className="px-3 py-2 text-right">Scrap Rate (%)</th>
                                        <th className="px-3 py-2 text-right">Total Kebutuhan Bruto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {requirements.map((req, idx) => (
                                        <tr key={idx} className="hover:bg-muted/20">
                                            <td className="px-3 py-2 font-mono text-foreground">{req.item_id}</td>
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
