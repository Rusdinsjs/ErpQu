import React, { useState } from 'react';
import { Button, Input, Table, TableHead, TableBody, TableRow, TableTh, TableTd, Modal } from '../../components/ui';
import { Percent, Plus, CheckCircle2, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
    mode?: 'schemes' | 'rules';
}

export default function BuyingPricingView({ mode = 'rules' }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [name, setName] = useState(mode === 'schemes' ? 'Skema Promosi Supplier Volume Discount' : 'Aturan Diskon Pembelian Grosir');
    const [discount, setDiscount] = useState('12.5');

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success(`${mode === 'schemes' ? 'Skema Promosi Supplier' : 'Aturan Diskon Pembelian'} "${name}" berhasil disimpan.`);
        setIsModalOpen(false);
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
                        <Percent className="text-blue-500" size={32} />
                        {mode === 'schemes' ? 'Skema Promosi & Rebate Supplier (Promotional Scheme)' : 'Aturan Diskon Beli Kuantitas (Pricing Rule)'}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Kelola skema potongan harga kuantitas besar, potongan tunai supplier, dan aturan penetapan harga beli otomatis.
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20">
                    <Plus size={18} /> Tambah {mode === 'schemes' ? 'Skema Promosi' : 'Aturan Diskon'}
                </Button>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                <Table>
                    <TableHead>
                        <TableRow className="bg-muted/40">
                            <TableTh>Nama Aturan / Skema Supplier</TableTh>
                            <TableTh>Min. Kuantitas Beli</TableTh>
                            <TableTh align="right">Persentase Diskon (%)</TableTh>
                            <TableTh align="center">Status</TableTh>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow className="hover:bg-muted/30">
                            <TableTd className="font-bold text-foreground">Diskon Pembelian Grosir Utuh (Tier 1)</TableTd>
                            <TableTd className="text-muted-foreground">≥ 100 Pcs</TableTd>
                            <TableTd align="right" className="font-extrabold text-blue-600">12,5%</TableTd>
                            <TableTd align="center">
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 inline-flex items-center gap-1">
                                    <CheckCircle2 size={12} /> Aktif
                                </span>
                            </TableTd>
                        </TableRow>
                        <TableRow className="hover:bg-muted/30">
                            <TableTd className="font-bold text-foreground">Rebate Akhir Tahun Supplier A</TableTd>
                            <TableTd className="text-muted-foreground">≥ 1.000 Pcs</TableTd>
                            <TableTd align="right" className="font-extrabold text-blue-600">15,0%</TableTd>
                            <TableTd align="center">
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 inline-flex items-center gap-1">
                                    <CheckCircle2 size={12} /> Aktif
                                </span>
                            </TableTd>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Buat ${mode === 'schemes' ? 'Skema Promosi Supplier' : 'Aturan Diskon Pembelian'}`}>
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Nama Aturan / Skema</label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Diskon Potongan (%)</label>
                        <Input type="number" step="0.1" value={discount} onChange={(e) => setDiscount(e.target.value)} required />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">Simpan Aturan</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
