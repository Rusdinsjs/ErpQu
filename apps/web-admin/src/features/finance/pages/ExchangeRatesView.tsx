import React, { useState } from 'react';
import { Button, Input, Table, TableHead, TableBody, TableRow, TableTh, TableTd, Modal } from'../../../components/ui';
import { DollarSign, Plus, CheckCircle2, RefreshCw } from 'lucide-react';
import { formatCurrencyIDR } from'../../../utils/decimal';
import { toast } from 'sonner';

export default function ExchangeRatesView() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currency, setCurrency] = useState('USD');
    const [rate, setRate] = useState('16250');

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success(`Master Kurs ${currency} = ${formatCurrencyIDR(rate)} berhasil disimpan.`);
        setIsModalOpen(false);
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
                        <DollarSign className="text-emerald-500" size={32} />
                        Master Kurs & Mata Uang Asing (Exchange Rates)
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Master penetapan nilai tukar mata uang asing harian terhadap Rupiah (IDR) untuk transaksi ekspor/impor.
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/20">
                    <Plus size={18} /> Tambah Kurs Mata Uang Baru
                </Button>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                <Table>
                    <TableHead>
                        <TableRow className="bg-muted/40">
                            <TableTh>Mata Uang Asal</TableTh>
                            <TableTh>Mata Uang Target</TableTh>
                            <TableTh align="right">Nilai Kurs Tukar (IDR)</TableTh>
                            <TableTh>Tanggal Berlaku</TableTh>
                            <TableTh align="center">Status</TableTh>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow className="hover:bg-muted/30">
                            <TableTd className="font-bold text-foreground">USD ($)</TableTd>
                            <TableTd className="text-muted-foreground">IDR (Rp)</TableTd>
                            <TableTd align="right" className="font-extrabold text-emerald-600">Rp 16.250,00</TableTd>
                            <TableTd className="text-muted-foreground">{new Date().toLocaleDateString('id-ID')}</TableTd>
                            <TableTd align="center">
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 inline-flex items-center gap-1">
                                    <CheckCircle2 size={12} /> Aktif
                                </span>
                            </TableTd>
                        </TableRow>
                        <TableRow className="hover:bg-muted/30">
                            <TableTd className="font-bold text-foreground">EUR (€)</TableTd>
                            <TableTd className="text-muted-foreground">IDR (Rp)</TableTd>
                            <TableTd align="right" className="font-extrabold text-emerald-600">Rp 17.680,00</TableTd>
                            <TableTd className="text-muted-foreground">{new Date().toLocaleDateString('id-ID')}</TableTd>
                            <TableTd align="center">
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 inline-flex items-center gap-1">
                                    <CheckCircle2 size={12} /> Aktif
                                </span>
                            </TableTd>
                        </TableRow>
                        <TableRow className="hover:bg-muted/30">
                            <TableTd className="font-bold text-foreground">SGD (S$)</TableTd>
                            <TableTd className="text-muted-foreground">IDR (Rp)</TableTd>
                            <TableTd align="right" className="font-extrabold text-emerald-600">Rp 12.100,00</TableTd>
                            <TableTd className="text-muted-foreground">{new Date().toLocaleDateString('id-ID')}</TableTd>
                            <TableTd align="center">
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 inline-flex items-center gap-1">
                                    <CheckCircle2 size={12} /> Aktif
                                </span>
                            </TableTd>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Kurs Mata Uang Baru">
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Kode Mata Uang Asing</label>
                        <Input placeholder="Contoh: USD, EUR, JPY" value={currency} onChange={(e) => setCurrency(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Nilai Kurs terhadap Rupiah (IDR)</label>
                        <Input type="number" placeholder="16250" value={rate} onChange={(e) => setRate(e.target.value)} required />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">Simpan Kurs</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
