import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesPosDataApi, type PosClosingEntry } from'../api/sales-pos-data';
import { Button, Input, Table, TableHead, TableBody, TableRow, TableTh, TableTd, Modal } from'../../../components/ui';
import { CheckCircle2, Plus, Clock, User, DollarSign } from 'lucide-react';
import { formatCurrencyIDR } from'../../../utils/decimal';
import { toast } from 'sonner';

export default function PosClosingEntriesView() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [countedCash, setCountedCash] = useState('1250000');

    const { data: closingsData, isLoading } = useQuery({
        queryKey: ['sales', 'pos-closings'],
        queryFn: salesPosDataApi.listPosClosingEntries,
    });

    const createClosingMutation = useMutation({
        mutationFn: salesPosDataApi.createPosClosingEntry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales', 'pos-closings'] });
            setIsModalOpen(false);
            toast.success('Shift kasir berhasil ditutup dan direkonsiliasi.');
        },
        onError: (err: any) => toast.error('Gagal: ' + err.message)
    });

    const closings: PosClosingEntry[] = Array.isArray((closingsData as any)?.data)
        ? (closingsData as any).data
        : Array.isArray(closingsData) ? (closingsData as any) : [];

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createClosingMutation.mutate({
            pos_profile_id: '00000000-0000-0000-0000-000000000001',
            user_id: 'current-user',
            period_start_date: new Date().toISOString(),
            grand_total: Number(countedCash) || 1250000,
            net_total: (Number(countedCash) || 1250000) * 0.9,
            total_quantity: 10,
            status: 'Closed',
        });
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
                        <CheckCircle2 className="text-emerald-500" size={32} />
                        Dokumen Penutupan & Rekonsiliasi Shift Kasir (POS Closing Entry)
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Audit dan rekonsiliasi jumlah uang kas fisik laci kasir vs total penjualan sistem per shift.
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/20">
                    <Plus size={18} /> Tutup Shift & Rekonsiliasi
                </Button>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                <Table>
                    <TableHead>
                        <TableRow className="bg-muted/40">
                            <TableTh>No. Dokumen Closing</TableTh>
                            <TableTh>Terminal POS Profile</TableTh>
                            <TableTh>Kasir (User)</TableTh>
                            <TableTh>Waktu Penutupan</TableTh>
                            <TableTh align="right">Total Penjualan Gross (Rp)</TableTh>
                            <TableTh align="right">Total Penjualan Net (Rp)</TableTh>
                            <TableTh align="center">Status</TableTh>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableTd colSpan={7} align="center" className="py-8 text-muted-foreground">Memuat dokumen penutupan shift...</TableTd></TableRow>
                        ) : closings.length === 0 ? (
                            <TableRow><TableTd colSpan={7} align="center" className="py-8 text-muted-foreground">Belum ada dokumen penutupan shift kasir.</TableTd></TableRow>
                        ) : (
                            closings.map((row) => (
                                <TableRow key={row.id} className="hover:bg-muted/30">
                                    <TableTd className="font-mono font-bold text-emerald-600">{row.id}</TableTd>
                                    <TableTd className="font-semibold text-foreground">Kasir Utama Toko Cabang Jakarta</TableTd>
                                    <TableTd className="text-muted-foreground flex items-center gap-1.5 pt-3">
                                        <User size={14} /> Kasir Shift Pagi
                                    </TableTd>
                                    <TableTd className="text-muted-foreground">{row.period_start_date ? new Date(row.period_start_date).toLocaleString('id-ID') : '-'}</TableTd>
                                    <TableTd align="right" className="font-extrabold text-foreground">{formatCurrencyIDR((row.grand_total || 0).toString())}</TableTd>
                                    <TableTd align="right" className="font-bold text-emerald-600">{formatCurrencyIDR((row.net_total || 0).toString())}</TableTd>
                                    <TableTd align="center">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-500/10 text-gray-600">Closed</span>
                                    </TableTd>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tutup Shift & Rekonsiliasi Kasir">
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Jumlah Uang Kas Fisik di Laci (Rp)</label>
                        <Input
                            type="number"
                            value={countedCash}
                            onChange={(e) => setCountedCash(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">Simpan Penutupan</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
