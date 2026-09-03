import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi, type CreditNote, type DebitNote, type CreateCreditNoteRequest, type CreateDebitNoteRequest } from '../api/finance';
import { clientApi } from '../../clients/api/client-management';
import { vendorApi } from '../../buying/api/vendors';
import { Button, Input, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableSkeleton, Modal } from '../../../components/ui';
import { Plus, Undo2, ArrowDownLeft, ArrowUpRight, CheckCircle2, FileText, User, Building2 } from 'lucide-react';
import { formatCurrencyIDR } from '../../../utils/decimal';
import { toast } from 'sonner';

export default function CreditDebitNotes() {
    const queryClient = useQueryClient();
    const [tab, setTab] = useState<'credit' | 'debit'>('credit');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [noteNo, setNoteNo] = useState('');
    const [partnerId, setPartnerId] = useState('');
    const [postingDate, setPostingDate] = useState(new Date().toISOString().split('T')[0]);
    const [reason, setReason] = useState('');
    const [totalAmount, setTotalAmount] = useState('');

    const { data: clientsResponse } = useQuery({
        queryKey: ['clients'],
        queryFn: () => clientApi.list({ limit: 100 }),
    });
    const clients = Array.isArray(clientsResponse?.data) ? clientsResponse.data : (clientsResponse as any)?.data?.data || [];

    const { data: vendorsResponse } = useQuery({
        queryKey: ['vendors-list'],
        queryFn: () => vendorApi.listVendors(1, 100),
    });
    const vendors = Array.isArray(vendorsResponse?.data) ? vendorsResponse.data : [];

    const { data: creditNotes, isLoading: creditLoading } = useQuery({
        queryKey: ['finance', 'credit-notes'],
        queryFn: financeApi.listCreditNotes,
        enabled: tab === 'credit',
    });

    const { data: debitNotes, isLoading: debitLoading } = useQuery({
        queryKey: ['finance', 'debit-notes'],
        queryFn: financeApi.listDebitNotes,
        enabled: tab === 'debit',
    });

    const createCreditMutation = useMutation({
        mutationFn: financeApi.createCreditNote,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance', 'credit-notes'] });
            setIsModalOpen(false);
            resetForm();
            toast.success('Nota Kredit (Credit Note) berhasil diterbitkan.');
        },
        onError: (err: any) => toast.error('Gagal membuat Nota Kredit: ' + err.message)
    });

    const createDebitMutation = useMutation({
        mutationFn: financeApi.createDebitNote,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance', 'debit-notes'] });
            setIsModalOpen(false);
            resetForm();
            toast.success('Nota Debit (Debit Note) berhasil diterbitkan.');
        },
        onError: (err: any) => toast.error('Gagal membuat Nota Debit: ' + err.message)
    });

    const resetForm = () => {
        setNoteNo('');
        setPartnerId('');
        setReason('');
        setTotalAmount('');
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        const amt = parseFloat(totalAmount);
        if (isNaN(amt) || amt <= 0) {
            toast.error('Masukkan nilai nominal retur yang valid.');
            return;
        }

        if (tab === 'credit') {
            createCreditMutation.mutate({
                credit_note_no: noteNo || undefined,
                customer_id: partnerId || undefined,
                posting_date: postingDate,
                reason: reason || undefined,
                total_amount: amt,
            });
        } else {
            createDebitMutation.mutate({
                debit_note_no: noteNo || undefined,
                supplier_id: partnerId || undefined,
                posting_date: postingDate,
                reason: reason || undefined,
                total_amount: amt,
            });
        }
    };

    const currentNotes = tab === 'credit' ? (creditNotes || []) : (debitNotes || []);
    const isLoading = tab === 'credit' ? creditLoading : debitLoading;

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                        <Undo2 className="text-cyan-500" size={32} />
                        Nota Retur (Credit & Debit Notes)
                    </h1>
                    <p className="text-muted-foreground mt-1">Pencatatan nota kredit retur penjualan dan nota debit retur pembelian ke supplier</p>
                </div>
                <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="gap-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-lg shadow-cyan-500/20">
                    <Plus size={18} />
                    {tab === 'credit' ? 'Terbitkan Nota Kredit' : 'Terbitkan Nota Debit'}
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex bg-muted p-1 rounded-xl w-fit border border-border">
                <button
                    onClick={() => setTab('credit')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'credit' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <ArrowDownLeft size={16} className="text-cyan-500" />
                    Credit Note (Retur Penjualan Pelanggan)
                </button>
                <button
                    onClick={() => setTab('debit')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'debit' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <ArrowUpRight size={16} className="text-amber-500" />
                    Debit Note (Retur Pembelian Supplier)
                </button>
            </div>

            {/* Table */}
            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                {isLoading ? (
                    <TableSkeleton rows={4} cols={6} />
                ) : currentNotes.length === 0 ? (
                    <div className="text-center py-16">
                        <FileText className="mx-auto text-muted-foreground mb-3" size={48} />
                        <h3 className="text-lg font-semibold text-foreground">Belum Ada {tab === 'credit' ? 'Nota Kredit' : 'Nota Debit'}</h3>
                        <p className="text-sm text-muted-foreground mt-1">Terbitkan nota retur untuk menyesuaikan saldo piutang atau hutang.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow className="bg-muted/40">
                                <TableTh>No. Dokumen</TableTh>
                                <TableTh>{tab === 'credit' ? 'Pelanggan (Customer)' : 'Pemasok (Vendor)'}</TableTh>
                                <TableTh>Tanggal Posting</TableTh>
                                <TableTh>Alasan Retur / Penyesuaian</TableTh>
                                <TableTh align="right">Nilai Retur (Rp)</TableTh>
                                <TableTh align="center">Status</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {currentNotes.map((row: any) => (
                                <TableRow key={row.id} className="hover:bg-muted/30">
                                    <TableTd className="font-semibold text-foreground">{row.credit_note_no || row.debit_note_no}</TableTd>
                                    <TableTd className="text-xs font-medium text-foreground">
                                        {tab === 'credit'
                                            ? (clients.find((c: any) => c.id === row.customer_id)?.name || row.customer_name || 'Pelanggan Umum')
                                            : (vendors.find((v: any) => v.id === row.supplier_id)?.name || row.supplier_name || 'Vendor Umum')
                                        }
                                    </TableTd>
                                    <TableTd className="text-muted-foreground">{row.posting_date}</TableTd>
                                    <TableTd className="text-muted-foreground">{row.reason || '-'}</TableTd>
                                    <TableTd align="right" className="font-bold text-foreground">{formatCurrencyIDR(String(Number(row.total_amount || 0)))}</TableTd>
                                    <TableTd align="center">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 inline-flex items-center gap-1">
                                            <CheckCircle2 size={12} /> {row.status}
                                        </span>
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={tab === 'credit' ? 'Terbitkan Nota Kredit (Credit Note)' : 'Terbitkan Nota Debit (Debit Note)'}>
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">No. Dokumen (Opsional)</label>
                            <Input placeholder="Otomatis jika kosong" value={noteNo} onChange={(e) => setNoteNo(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Tanggal Posting</label>
                            <Input type="date" value={postingDate} onChange={(e) => setPostingDate(e.target.value)} required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                            {tab === 'credit' ? 'Pilih Pelanggan (Customer)' : 'Pilih Pemasok (Vendor)'}
                        </label>
                        {tab === 'credit' ? (
                            <select
                                value={partnerId}
                                onChange={(e) => setPartnerId(e.target.value)}
                                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:ring-2 focus:ring-cyan-500/30 outline-none"
                            >
                                <option value="">-- Pilih Pelanggan Terdaftar --</option>
                                {clients.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.phone || 'Pelanggan'})</option>
                                ))}
                            </select>
                        ) : (
                            <select
                                value={partnerId}
                                onChange={(e) => setPartnerId(e.target.value)}
                                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:ring-2 focus:ring-cyan-500/30 outline-none"
                            >
                                <option value="">-- Pilih Vendor Terdaftar --</option>
                                {vendors.map((v: any) => (
                                    <option key={v.id} value={v.id}>{v.name} ({v.code || 'Vendor'})</option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Alasan Retur / Penyesuaian Harga</label>
                        <Input placeholder="Contoh: Kerusakan barang saat transit..." value={reason} onChange={(e) => setReason(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Nilai Nominal Retur (Rp)</label>
                        <Input type="number" placeholder="Contoh: 3500000" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} required />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white">
                            Simpan & Terbitkan
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
