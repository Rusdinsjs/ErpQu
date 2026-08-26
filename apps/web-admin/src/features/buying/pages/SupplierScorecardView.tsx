import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buyingScorecardDataApi, type SupplierScorecard } from'../api/buying-scorecard-data';
import { vendorApi } from'../api/vendors';
import { Button, Input, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableSkeleton, Modal } from'../../../components/ui';
import { Star, ShieldCheck, Award, AlertTriangle, Plus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SupplierScorecardView() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [vendorId, setVendorId] = useState('');
    const [evaluationDate, setEvaluationDate] = useState(new Date().toISOString().split('T')[0]);
    const [score, setScore] = useState('95');
    const [status, setStatus] = useState('Approved');
    const [remarks, setRemarks] = useState('Kualitas barang sangat baik & tepat waktu.');

    const { data: scorecards, isLoading } = useQuery({
        queryKey: ['buying', 'supplier-scorecards'],
        queryFn: buyingScorecardDataApi.getSupplierScorecards,
    });

    const { data: vendorsData } = useQuery({
        queryKey: ['vendors'],
        queryFn: () => vendorApi.listVendors(1, 100),
    });

    const vendorsList = vendorsData?.data || [];

    const getVendorName = (id: string) => {
        const v = vendorsList.find(item => item.id === id);
        return v ? v.name : 'Supplier General';
    };

    const createMutation = useMutation({
        mutationFn: buyingScorecardDataApi.createSupplierScorecard,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['buying', 'supplier-scorecards'] });
            setIsModalOpen(false);
            toast.success('Evaluasi Scorecard Supplier berhasil disimpan.');
        },
        onError: (err: any) => toast.error('Gagal: ' + err.message)
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        const numScore = parseFloat(score);
        if (isNaN(numScore) || numScore < 0 || numScore > 100 || !vendorId) {
            toast.error('Pilih supplier dan berikan skor evaluasi (0 - 100).');
            return;
        }

        createMutation.mutate({
            company_id: '00000000-0000-0000-0000-000000000001',
            vendor_id: vendorId,
            evaluation_date: evaluationDate,
            score: numScore,
            status,
            remarks,
        });
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                        <Star className="text-amber-500" size={32} />
                        Penilaian Kinerja Pemasok (Supplier Scorecards)
                    </h1>
                    <p className="text-muted-foreground mt-1">Evaluasi mutu, ketepatan pengiriman SLA, kepatuhan harga & rating kelayakan vendor</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-lg shadow-amber-500/20">
                    <Plus size={18} />
                    Beri Penilaian Vendor
                </Button>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                {isLoading ? (
                    <TableSkeleton rows={4} cols={5} />
                ) : (scorecards || []).length === 0 ? (
                    <div className="text-center py-16">
                        <Award className="mx-auto text-muted-foreground mb-3" size={48} />
                        <h3 className="text-lg font-semibold text-foreground">Belum Ada Evaluasi Scorecard</h3>
                        <p className="text-sm text-muted-foreground mt-1">Beri penilaian berkala untuk menentukan vendor prioritas (preferred supplier).</p>
                    </div>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow className="bg-muted/40">
                                <TableTh>Supplier / Vendor</TableTh>
                                <TableTh>Tanggal Evaluasi</TableTh>
                                <TableTh align="center">Skor Kinerja (0-100)</TableTh>
                                <TableTh>Catatan Evaluator</TableTh>
                                <TableTh align="center">Status Kelayakan</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(scorecards || []).map((row: SupplierScorecard) => (
                                <TableRow key={row.id} className="hover:bg-muted/30">
                                    <TableTd className="font-semibold text-foreground">{getVendorName(row.vendor_id)}</TableTd>
                                    <TableTd className="text-muted-foreground">{row.evaluation_date}</TableTd>
                                    <TableTd align="center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${Number(row.score) >= 90 ? 'bg-emerald-500/10 text-emerald-600' : Number(row.score) >= 75 ? 'bg-amber-500/10 text-amber-600' : 'bg-rose-500/10 text-rose-600'}`}>
                                            {Number(row.score).toFixed(1)} / 100
                                        </span>
                                    </TableTd>
                                    <TableTd className="text-muted-foreground max-w-sm truncate">{row.remarks || '-'}</TableTd>
                                    <TableTd align="center">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 inline-flex items-center gap-1">
                                            <ShieldCheck size={12} /> {row.status || 'Approved'}
                                        </span>
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Beri Evaluasi Scorecard Vendor">
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Pilih Supplier</label>
                        <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} required className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/30 outline-none">
                            <option value="">-- Pilih Supplier yang Dievaluasi --</option>
                            {vendorsList.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Tanggal Evaluasi</label>
                            <Input type="date" value={evaluationDate} onChange={(e) => setEvaluationDate(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Skor Kinerja (0 - 100)</label>
                            <Input type="number" min="0" max="100" value={score} onChange={(e) => setScore(e.target.value)} required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Status Kelayakan Pengadaan</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/30 outline-none">
                            <option value="Preferred">Preferred (Pemasok Prioritas)</option>
                            <option value="Approved">Approved (Pemasok Terverifikasi)</option>
                            <option value="On Hold">On Hold (Dalam Pengawasan)</option>
                            <option value="Rejected">Rejected (Diblokir)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Catatan Evaluator</label>
                        <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/30 outline-none" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={createMutation.isPending} className="bg-amber-600 hover:bg-amber-700 text-white">Simpan Scorecard</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
