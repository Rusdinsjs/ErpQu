import React, { useState } from 'react';
import { Button, Input, Table, TableHead, TableBody, TableRow, TableTh, TableTd, Modal } from'../../../components/ui';
import { FileText, Plus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
    buyingOnly?: boolean;
}

export default function TermsTemplatesView({ buyingOnly = false }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [title, setTitle] = useState(buyingOnly ? 'Syarat & Ketentuan Pembelian Standar' : 'Syarat & Ketentuan Penjualan Ritel');

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success(`Template Syarat & Ketentuan "${title}" berhasil disimpan.`);
        setIsModalOpen(false);
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
                        <FileText className={buyingOnly ? 'text-blue-500' : 'text-orange-500'} size={32} />
                        Template Syarat & Ketentuan Legal ({buyingOnly ? 'Pembelian' : 'Penjualan'})
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Pengaturan template syarat pembayaran, masa garansi, dan ketentuan garansi pada dokumen cetak PO / SO.
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className={`gap-2 text-white rounded-xl shadow-lg ${buyingOnly ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' : 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/20'}`}>
                    <Plus size={18} /> Buat Template Ketentuan Baru
                </Button>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                <Table>
                    <TableHead>
                        <TableRow className="bg-muted/40">
                            <TableTh>Judul Template Syarat & Ketentuan</TableTh>
                            <TableTh>Modul Terkait</TableTh>
                            <TableTh align="center">Status</TableTh>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow className="hover:bg-muted/30">
                            <TableTd className="font-semibold text-foreground">{buyingOnly ? 'Syarat Pembayaran PO 30 Hari' : 'Klausul Garansi & Pembayaran Penjualan'}</TableTd>
                            <TableTd className="text-muted-foreground">{buyingOnly ? 'Buying / Purchasing' : 'Selling / Commercial'}</TableTd>
                            <TableTd align="center">
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 inline-flex items-center gap-1">
                                    <CheckCircle2 size={12} /> Aktif
                                </span>
                            </TableTd>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Buat Template Terms & Conditions (${buyingOnly ? 'Pembelian' : 'Penjualan'})`}>
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Judul Template</label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Isi Klausul Syarat & Ketentuan</label>
                        <textarea
                            rows={4}
                            placeholder="1. Pembayaran dilakukan maksimal 30 hari setelah faktur diterima.&#10;2. Pengembalian barang maksimal 7 hari kerja..."
                            className="w-full p-3 bg-background border border-border rounded-xl text-sm font-sans"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" className={buyingOnly ? 'bg-blue-600 text-white font-bold' : 'bg-orange-600 text-white font-bold'}>Simpan Template</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
