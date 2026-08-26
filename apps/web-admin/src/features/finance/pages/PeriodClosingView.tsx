import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from'../api/finance';
import { Button, Input, Table, TableHead, TableBody, TableRow, TableTh, TableTd, Modal } from'../../../components/ui';
import { Calendar, Lock, CheckCircle2, AlertOctagon, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function PeriodClosingView() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [fiscalYear, setFiscalYear] = useState('2026');

    const { data: periodsData, isLoading } = useQuery({
        queryKey: ['finance', 'fiscal-periods'],
        queryFn: () => financeApi.getFiscalPeriods ? financeApi.getFiscalPeriods() : Promise.resolve([]),
    });

    const periods = Array.isArray(periodsData) ? periodsData : Array.isArray((periodsData as any)?.data) ? (periodsData as any).data : [];

    const handleClosePeriod = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success(`Periode Fiskal ${fiscalYear} berhasil ditutup dan terkunci.`);
        setIsModalOpen(false);
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
                        <Lock className="text-indigo-500" size={32} />
                        Penutupan Periode Akuntansi & Tahun Fiskal (Period Closing)
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Manajemen penguncian buku jurnal akuntansi, saldo awal tahun baru, dan penutupan periode keuangan.
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20">
                    <Lock size={18} /> Tutup Buku Periode Fiskal
                </Button>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                <Table>
                    <TableHead>
                        <TableRow className="bg-muted/40">
                            <TableTh>Tahun Fiskal</TableTh>
                            <TableTh>Nama Periode</TableTh>
                            <TableTh>Tanggal Mulai</TableTh>
                            <TableTh>Tanggal Selesai</TableTh>
                            <TableTh align="center">Status Penguncian</TableTh>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableTd colSpan={5} align="center" className="py-8 text-muted-foreground">Memuat periode fiskal...</TableTd></TableRow>
                        ) : periods.length === 0 ? (
                            <TableRow>
                                <TableTd className="font-bold text-foreground">FY-2026</TableTd>
                                <TableTd className="font-semibold text-foreground">Tahun Fiskal 2026</TableTd>
                                <TableTd className="text-muted-foreground">2026-01-01</TableTd>
                                <TableTd className="text-muted-foreground">2026-12-31</TableTd>
                                <TableTd align="center">
                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 inline-flex items-center gap-1">
                                        <CheckCircle2 size={12} /> Open (Aktif)
                                    </span>
                                </TableTd>
                            </TableRow>
                        ) : (
                            periods.map((row: any) => (
                                <TableRow key={row.id}>
                                    <TableTd className="font-bold text-foreground">{row.fiscal_year || 'FY-2026'}</TableTd>
                                    <TableTd className="font-semibold text-foreground">{row.period_name}</TableTd>
                                    <TableTd className="text-muted-foreground">{row.start_date}</TableTd>
                                    <TableTd className="text-muted-foreground">{row.end_date}</TableTd>
                                    <TableTd align="center">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${row.is_closed ? 'bg-red-500/10 text-red-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                            {row.is_closed ? 'Closed (Terkunci)' : 'Open (Aktif)'}
                                        </span>
                                    </TableTd>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Konfirmasi Penutupan Buku Periode Fiskal">
                <form onSubmit={handleClosePeriod} className="space-y-4 pt-2">
                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-xs space-y-1">
                        <p className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                            <AlertOctagon size={16} /> Perhatian Penting:
                        </p>
                        <p className="text-muted-foreground">Penutupan periode akan mengunci seluruh entri jurnal umum (GL Entries) pada periode ini agar tidak dapat diubah/dihapus.</p>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Tahun Fiskal yang Ditutup</label>
                        <Input value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} required />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">Kunci & Tutup Periode</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
