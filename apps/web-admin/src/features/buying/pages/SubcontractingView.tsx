import React, { useState } from 'react';
import { Button, Input, Table, TableHead, TableBody, TableRow, TableTh, TableTd, Modal } from'../../../components/ui';
import { Truck, Plus, CheckCircle2, Package } from 'lucide-react';
import { formatCurrencyIDR } from'../../../utils/decimal';
import { toast } from 'sonner';

interface Props {
    mode?: 'order' | 'received';
}

export default function SubcontractingView({ mode = 'order' }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [supplierName, setSupplierName] = useState('PT Subkontraktor Teknik Presisi');

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success(`Dokumen Subkontrak (${mode === 'order' ? 'PO Outward Material' : 'Inward Material Receipt'}) berhasil dibuat.`);
        setIsModalOpen(false);
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
                        <Truck className="text-blue-500" size={32} />
                        Pekerjaan Subkontrak ({mode === 'order' ? 'Pengiriman Bahan Baku / Outward' : 'Penerimaan Hasil Subkontrak / Inward'})
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Manajemen pengiriman bahan baku ke pabrik subkontraktor dan penerimaan komponen hasil maklon.
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20">
                    <Plus size={18} /> Buat Dokumen Subkontrak Baru
                </Button>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                <Table>
                    <TableHead>
                        <TableRow className="bg-muted/40">
                            <TableTh>No. Dokumen Subkontrak</TableTh>
                            <TableTh>Nama Supplier / Subkontraktor</TableTh>
                            <TableTh>Item Bahan / Komponen</TableTh>
                            <TableTh align="right">Kuantitas</TableTh>
                            <TableTh align="center">Status</TableTh>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow className="hover:bg-muted/30">
                            <TableTd className="font-mono font-bold text-blue-600">SBC-2026-0001</TableTd>
                            <TableTd className="font-semibold text-foreground">PT Subkontraktor Teknik Presisi</TableTd>
                            <TableTd className="text-muted-foreground">Plat Baja & Komponen Mesin</TableTd>
                            <TableTd align="right" className="font-bold text-foreground">500 Pcs</TableTd>
                            <TableTd align="center">
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 inline-flex items-center gap-1">
                                    <CheckCircle2 size={12} /> {mode === 'order' ? 'Dispatched' : 'Received & Inspected'}
                                </span>
                            </TableTd>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Buat Dokumen Subkontrak (${mode === 'order' ? 'Pengiriman Bahan' : 'Penerimaan Hasil'})`}>
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Nama Vendor / Subkontraktor</label>
                        <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} required />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">Simpan Dokumen</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
