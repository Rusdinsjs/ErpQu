import React, { useState } from 'react';
import { Button, Input, Table, TableHead, TableBody, TableRow, TableTh, TableTd, Modal } from'../../../components/ui';
import { FileText, Plus, CheckCircle2, Send, AlertTriangle } from 'lucide-react';
import { formatCurrencyIDR } from'../../../utils/decimal';
import { toast } from 'sonner';

export default function DunningsView() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [customerName, setCustomerName] = useState('PT Mitra Sukses Mandiri');
    const [amount, setAmount] = useState('45000000');

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success(`Surat Penagihan (Dunning Letter) untuk ${customerName} berhasil diterbitkan & dikirim.`);
        setIsModalOpen(false);
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
                        <FileText className="text-rose-500" size={32} />
                        Manajemen Surat Penagihan Piutang Jatuh Tempo (Dunnings)
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Penerbitan surat teguran penagihan resmi (Dunning Letter 1/2/3) dan peringatan denda keterlambatan piutang.
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-500/20">
                    <Plus size={18} /> Terbitkan Surat Penagihan (Dunning)
                </Button>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                <Table>
                    <TableHead>
                        <TableRow className="bg-muted/40">
                            <TableTh>No. Surat Penagihan</TableTh>
                            <TableTh>Nama Pelanggan (Customer)</TableTh>
                            <TableTh>Tingkat Teguran (Dunning Level)</TableTh>
                            <TableTh align="right">Total Piutang Jatuh Tempo (Rp)</TableTh>
                            <TableTh align="center">Status Surat</TableTh>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow className="hover:bg-muted/30">
                            <TableTd className="font-mono font-bold text-rose-600">DUN-2026-0001</TableTd>
                            <TableTd className="font-semibold text-foreground">PT Mitra Sukses Mandiri</TableTd>
                            <TableTd className="text-muted-foreground">Teguran 1 (Peringatan Awal 7 Hari)</TableTd>
                            <TableTd align="right" className="font-extrabold text-red-500">Rp 45.000.000,00</TableTd>
                            <TableTd align="center">
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 inline-flex items-center gap-1">
                                    <Send size={12} /> Terkirim ke Customer
                                </span>
                            </TableTd>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Terbitkan Surat Penagihan Piutang (Dunning Letter)">
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Nama Pelanggan / Customer</label>
                        <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total Nilai Tagihan Jatuh Tempo (Rp)</label>
                        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white font-bold">Terbitkan & Kirim Email</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
