import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buyingQuotationDataApi, type RequestForQuotation } from '../api/buying-quotation-data';
import { useAuthStore } from '../../../store/useAuthStore';
import { Button, Input, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableSkeleton, Modal } from '../../../components/ui';
import { Plus, Search, FileQuestion, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RequestsForQuotation() {
    const queryClient = useQueryClient();
    const activeCompanyId = useAuthStore(s => s.activeCompanyId) || 'c0000000-0000-0000-0000-000000000001';
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [rfqNumber, setRfqNumber] = useState('');
    const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
    const [tcName, setTcName] = useState('Standard Terms');
    const [terms, setTerms] = useState('Pembayaran tempo 30 hari setelah barang diterima.');

    const { data: rfqs, isLoading } = useQuery({
        queryKey: ['buying', 'rfqs'],
        queryFn: buyingQuotationDataApi.getRequestsForQuotation,
    });

    const createMutation = useMutation({
        mutationFn: buyingQuotationDataApi.createRequestForQuotation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['buying', 'rfqs'] });
            setIsModalOpen(false);
            setRfqNumber('');
            toast.success('Request for Quotation (RFQ) berhasil dibuat.');
        },
        onError: (err: any) => {
            toast.error('Gagal membuat RFQ: ' + (err?.message || 'Terjadi kesalahan'));
        }
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate({
            company_id: activeCompanyId,
            rfq_number: rfqNumber || `RFQ-${Date.now().toString().slice(-6)}`,
            transaction_date: transactionDate,
            tc_name: tcName,
            terms: terms,
            status: 'Submitted',
        });
    };

    const rfqList: RequestForQuotation[] = Array.isArray(rfqs)
        ? rfqs
        : Array.isArray((rfqs as any)?.data)
        ? (rfqs as any).data
        : [];

    const filtered = rfqList.filter((r: RequestForQuotation) => {
        const rNum = r.rfq_number || '';
        const tc = r.tc_name || '';
        const search = searchTerm.toLowerCase();
        return rNum.toLowerCase().includes(search) || tc.toLowerCase().includes(search);
    });

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                        <FileQuestion className="text-blue-500" size={32} />
                        Permintaan Penawaran Harga (Requests for Quotation - RFQ)
                    </h1>
                    <p className="text-muted-foreground mt-1">Kirim permintaan penawaran harga barang & jasa ke beberapa vendor sekaligus</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20">
                    <Plus size={18} />
                    Buat RFQ Baru
                </Button>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl p-4 flex gap-4 items-center shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cari nomor RFQ atau syarat penawaran..."
                        className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                </div>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                {isLoading ? (
                    <TableSkeleton rows={5} cols={5} />
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <FileQuestion className="mx-auto text-muted-foreground mb-3" size={48} />
                        <h3 className="text-lg font-semibold text-foreground">Belum Ada Permintaan Penawaran (RFQ)</h3>
                        <p className="text-sm text-muted-foreground mt-1">Buat RFQ untuk meminta penawaran harga kompetitif dari supplier.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow className="bg-muted/40">
                                <TableTh>No. Dokumen RFQ</TableTh>
                                <TableTh>Tanggal Transaksi</TableTh>
                                <TableTh>Template Syarat & Ketentuan</TableTh>
                                <TableTh>Keterangan Terms</TableTh>
                                <TableTh align="center">Status</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.map((row: RequestForQuotation, idx: number) => (
                                <TableRow key={row.id || idx} className="hover:bg-muted/30">
                                    <TableTd className="font-semibold text-foreground">{row.rfq_number || `RFQ-${idx + 1}`}</TableTd>
                                    <TableTd className="text-muted-foreground">{row.transaction_date || '-'}</TableTd>
                                    <TableTd className="font-medium text-foreground">{row.tc_name || 'Standard Terms'}</TableTd>
                                    <TableTd className="text-muted-foreground max-w-xs truncate">{row.terms || '-'}</TableTd>
                                    <TableTd align="center">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 inline-flex items-center gap-1">
                                            <CheckCircle2 size={12} /> {row.status || 'Submitted'}
                                        </span>
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Buat Request for Quotation (RFQ) Baru">
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">No. RFQ (Opsional)</label>
                            <Input placeholder="Otomatis jika kosong" value={rfqNumber} onChange={(e) => setRfqNumber(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Tanggal Permintaan</label>
                            <Input type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Judul Template Terms</label>
                        <Input value={tcName} onChange={(e) => setTcName(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Syarat & Ketentuan Pengadaan</label>
                        <textarea
                            value={terms}
                            onChange={(e) => setTerms(e.target.value)}
                            rows={3}
                            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/30 outline-none"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={createMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {createMutation.isPending ? 'Menyimpan...' : 'Terbitkan RFQ'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
