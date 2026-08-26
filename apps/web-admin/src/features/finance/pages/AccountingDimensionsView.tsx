import React, { useState } from 'react';
import { Button, Input, Table, TableHead, TableBody, TableRow, TableTh, TableTd, Modal } from'../../../components/ui';
import { Layers, Plus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AccountingDimensionsView() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [name, setName] = useState('Proyek Infrastruktur Utama');

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success(`Dimensi Akuntansi "${name}" berhasil disimpan.`);
        setIsModalOpen(false);
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
                        <Layers className="text-purple-500" size={32} />
                        Pengaturan Dimensi Akuntansi (Accounting Dimensions)
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Master penambahan segmen analisis akuntansi kustom (misal: Kode Proyek, Segmen Bisnis, Wilayah Operasional) di luar COA baku.
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-500/20">
                    <Plus size={18} /> Tambah Dimensi Akuntansi Baru
                </Button>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                <Table>
                    <TableHead>
                        <TableRow className="bg-muted/40">
                            <TableTh>Nama Dimensi Akuntansi</TableTh>
                            <TableTh>Tipe Referensi Document</TableTh>
                            <TableTh align="center">Status Mandatori</TableTh>
                            <TableTh align="center">Status</TableTh>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow className="hover:bg-muted/30">
                            <TableTd className="font-bold text-foreground">Segmen Proyek (Project Code)</TableTd>
                            <TableTd className="text-muted-foreground">GL Entries & Sales Invoices</TableTd>
                            <TableTd align="center">
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600">Opsional</span>
                            </TableTd>
                            <TableTd align="center">
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 inline-flex items-center gap-1">
                                    <CheckCircle2 size={12} /> Aktif
                                </span>
                            </TableTd>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Dimensi Akuntansi Baru">
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Nama Dimensi Akuntansi</label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold">Simpan Dimensi</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
