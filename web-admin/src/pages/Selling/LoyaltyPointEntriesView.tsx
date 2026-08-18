import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesPosDataApi, type LoyaltyPointEntry } from '../../api/sales-pos-data';
import { Button, Input, Table, TableHead, TableBody, TableRow, TableTh, TableTd, Modal } from '../../components/ui';
import { Award, Plus, User, FileText } from 'lucide-react';
import { formatCurrencyIDR } from '../../utils/decimal';
import { toast } from 'sonner';

export default function LoyaltyPointEntriesView() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [points, setPoints] = useState('100');

    const { data: pointsData, isLoading } = useQuery({
        queryKey: ['sales', 'loyalty-points'],
        queryFn: salesPosDataApi.listLoyaltyPointEntries,
    });

    const createPointMutation = useMutation({
        mutationFn: salesPosDataApi.createLoyaltyPointEntry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales', 'loyalty-points'] });
            setIsModalOpen(false);
            toast.success('Log poin loyalitas member berhasil disimpan.');
        },
        onError: (err: any) => toast.error('Gagal: ' + err.message)
    });

    const entries: LoyaltyPointEntry[] = Array.isArray((pointsData as any)?.data)
        ? (pointsData as any).data
        : Array.isArray(pointsData) ? (pointsData as any) : [];

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createPointMutation.mutate({
            client_id: 'client-001',
            loyalty_points: Number(points) || 10,
            purchase_amount: (Number(points) || 10) * 1000,
        });
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
                        <Award className="text-purple-500" size={32} />
                        Log Poin Member Pelanggan (Loyalty Point Entries)
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Catatan riwayat akumulasi poin belanja dan penukaran voucher member pelanggan.
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-500/20">
                    <Plus size={18} /> Tambah Log Poin Manual
                </Button>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                <Table>
                    <TableHead>
                        <TableRow className="bg-muted/40">
                            <TableTh>No. Log Poin</TableTh>
                            <TableTh>Nama Pelanggan (Member)</TableTh>
                            <TableTh>No. Faktur Transaksi</TableTh>
                            <TableTh align="right">Nilai Belanja (Rp)</TableTh>
                            <TableTh align="right">Poin Diperoleh / Ditukar</TableTh>
                            <TableTh>Tanggal Posting</TableTh>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableTd colSpan={6} align="center" className="py-8 text-muted-foreground">Memuat log poin member...</TableTd></TableRow>
                        ) : entries.length === 0 ? (
                            <TableRow><TableTd colSpan={6} align="center" className="py-8 text-muted-foreground">Belum ada riwayat perolehan poin member.</TableTd></TableRow>
                        ) : (
                            entries.map((row) => (
                                <TableRow key={row.id} className="hover:bg-muted/30">
                                    <TableTd className="font-mono font-bold text-purple-600">{row.id}</TableTd>
                                    <TableTd className="font-semibold text-foreground flex items-center gap-1.5 pt-3">
                                        <User size={14} /> Pelanggan Utama Member
                                    </TableTd>
                                    <TableTd className="font-mono text-muted-foreground">{row.sales_invoice_id || 'INV-2026-0001'}</TableTd>
                                    <TableTd align="right" className="font-medium text-foreground">{formatCurrencyIDR((row.purchase_amount || 0).toString())}</TableTd>
                                    <TableTd align="right" className="font-extrabold text-purple-600">+{row.loyalty_points || 0} Poin</TableTd>
                                    <TableTd className="text-muted-foreground">{row.posting_date ? new Date(row.posting_date).toLocaleString('id-ID') : '-'}</TableTd>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Log Poin Member Manual">
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Jumlah Poin Member</label>
                        <Input
                            type="number"
                            value={points}
                            onChange={(e) => setPoints(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold">Simpan Log Poin</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
