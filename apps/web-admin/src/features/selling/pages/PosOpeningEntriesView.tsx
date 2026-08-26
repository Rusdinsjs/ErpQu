import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesPosDataApi, type PosOpeningEntry } from'../api/sales-pos-data';
import { Button, Input, Table, TableHead, TableBody, TableRow, TableTh, TableTd, Modal } from'../../../components/ui';
import { Clock, Plus, CheckCircle2, User, Store } from 'lucide-react';
import { formatCurrencyIDR } from'../../../utils/decimal';
import { toast } from 'sonner';

export default function PosOpeningEntriesView() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [openingFloat, setOpeningFloat] = useState('500000');

    const { data: openingsData, isLoading } = useQuery({
        queryKey: ['sales', 'pos-openings'],
        queryFn: salesPosDataApi.listPosOpeningEntries,
    });

    const createOpeningMutation = useMutation({
        mutationFn: salesPosDataApi.createPosOpeningEntry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales', 'pos-openings'] });
            setIsModalOpen(false);
            toast.success('Shift kasir berhasil dibuka.');
        },
        onError: (err: any) => toast.error('Gagal: ' + err.message)
    });

    const openings: PosOpeningEntry[] = Array.isArray((openingsData as any)?.data)
        ? (openingsData as any).data
        : Array.isArray(openingsData) ? (openingsData as any) : [];

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createOpeningMutation.mutate({
            pos_profile_id: '00000000-0000-0000-0000-000000000001',
            user_id: 'current-user',
            period_start_date: new Date().toISOString(),
            opening_amount: Number(openingFloat) || 0,
            status: 'Open',
        });
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
                        <Clock className="text-amber-500" size={32} />
                        Dokumen Pembukaan Shift Kasir (POS Opening Entry)
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Riwayat modal kas awal laci dan registrasi pembukaan sesi kasir toko ritel.
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-lg shadow-amber-500/20">
                    <Plus size={18} /> Buka Shift Kasir Baru
                </Button>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                <Table>
                    <TableHead>
                        <TableRow className="bg-muted/40">
                            <TableTh>No. Dokumen Opening</TableTh>
                            <TableTh>Terminal POS Profile</TableTh>
                            <TableTh>Kasir (User)</TableTh>
                            <TableTh>Waktu Pembukaan</TableTh>
                            <TableTh align="right">Modal Awal Kas (Rp)</TableTh>
                            <TableTh align="center">Status Shift</TableTh>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableTd colSpan={6} align="center" className="py-8 text-muted-foreground">Memuat dokumen pembukaan shift...</TableTd></TableRow>
                        ) : openings.length === 0 ? (
                            <TableRow><TableTd colSpan={6} align="center" className="py-8 text-muted-foreground">Belum ada dokumen pembukaan shift kasir.</TableTd></TableRow>
                        ) : (
                            openings.map((row) => (
                                <TableRow key={row.id} className="hover:bg-muted/30">
                                    <TableTd className="font-mono font-bold text-amber-600">{row.id}</TableTd>
                                    <TableTd className="font-semibold text-foreground">Kasir Utama Toko Cabang Jakarta</TableTd>
                                    <TableTd className="text-muted-foreground flex items-center gap-1.5 pt-3">
                                        <User size={14} /> Kasir Shift Pagi
                                    </TableTd>
                                    <TableTd className="text-muted-foreground">{row.period_start_date ? new Date(row.period_start_date).toLocaleString('id-ID') : '-'}</TableTd>
                                    <TableTd align="right" className="font-extrabold text-foreground">{formatCurrencyIDR((row.opening_amount || 0).toString())}</TableTd>
                                    <TableTd align="center">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 inline-flex items-center gap-1">
                                            <CheckCircle2 size={12} /> {row.status || 'Open'}
                                        </span>
                                    </TableTd>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Buka Shift Kasir (POS Opening Entry)">
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Modal Kas Awal di Laci (Rp)</label>
                        <Input
                            type="number"
                            placeholder="500000"
                            value={openingFloat}
                            onChange={(e) => setOpeningFloat(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">Mulai Shift Now</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
