import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi, type PaymentEntry, type CreatePaymentEntryRequest } from'../api/finance';
import { Button, Input, Select, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableSkeleton, Modal, StatusBadge } from'../../../components/ui';
import { Plus, Search, Filter, ArrowUpRight, ArrowDownLeft, CheckCircle2, DollarSign, Calendar, FileText, AlertCircle } from 'lucide-react';
import { formatCurrencyIDR } from'../../../utils/decimal';
import { toast } from 'sonner';

export default function PaymentEntries() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'Receive' | 'Pay'>('ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form state
    const [paymentType, setPaymentType] = useState<'Receive' | 'Pay'>('Receive');
    const [partyName, setPartyName] = useState('');
    const [amount, setAmount] = useState('');
    const [postingDate, setPostingDate] = useState(new Date().toISOString().split('T')[0]);
    const [modeOfPayment, setModeOfPayment] = useState('Bank Transfer');
    const [referenceNo, setReferenceNo] = useState('');
    const [selectedDocId, setSelectedDocId] = useState('');
    const [selectedDocNo, setSelectedDocNo] = useState('');

    const { data: entries, isLoading } = useQuery({
        queryKey: ['finance', 'payment-entries'],
        queryFn: financeApi.listPaymentEntries,
    });

    const { data: salesInvoices } = useQuery({
        queryKey: ['finance', 'sales-invoices'],
        queryFn: financeApi.listSalesInvoices,
        enabled: paymentType === 'Receive',
    });

    const { data: purchaseBills } = useQuery({
        queryKey: ['finance', 'purchase-bills'],
        queryFn: financeApi.listPurchaseBills,
        enabled: paymentType === 'Pay',
    });

    const createMutation = useMutation({
        mutationFn: financeApi.createPaymentEntry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance', 'payment-entries'] });
            queryClient.invalidateQueries({ queryKey: ['finance', 'sales-invoices'] });
            queryClient.invalidateQueries({ queryKey: ['finance', 'purchase-bills'] });
            queryClient.invalidateQueries({ queryKey: ['finance', 'reports'] });
            setIsModalOpen(false);
            resetForm();
            toast.success('Payment Entry berhasil dicatat dan faktur telah dialokasikan.');
        },
        onError: (err: any) => {
            toast.error('Gagal mencatat pembayaran: ' + (err.message || 'Terjadi kesalahan'));
        }
    });

    const resetForm = () => {
        setPartyName('');
        setAmount('');
        setReferenceNo('');
        setSelectedDocId('');
        setSelectedDocNo('');
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            toast.error('Masukkan jumlah pembayaran yang valid.');
            return;
        }

        const payload: CreatePaymentEntryRequest = {
            payment_type: paymentType,
            party_type: paymentType === 'Receive' ? 'Customer' : 'Supplier',
            party_name: partyName || (paymentType === 'Receive' ? 'Pelanggan' : 'Pemasok'),
            posting_date: postingDate,
            mode_of_payment: modeOfPayment,
            amount: numAmount,
            reference_no: referenceNo || undefined,
            references: selectedDocId ? [{
                reference_doctype: paymentType === 'Receive' ? 'Sales Invoice' : 'Purchase Bill',
                reference_id: selectedDocId,
                reference_name: selectedDocNo,
                total_amount: numAmount,
                allocated_amount: numAmount,
                outstanding_amount: 0,
            }] : undefined,
        };

        createMutation.mutate(payload);
    };

    const filteredEntries = (entries || []).filter(item => {
        const matchesSearch = (item.entry_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (item.party_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (item.reference_no || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'ALL' || item.payment_type === typeFilter;
        return matchesSearch && matchesType;
    });

    const totalReceived = (entries || []).filter(e => e.payment_type === 'Receive').reduce((sum, e) => sum + Number(e.paid_amount || 0), 0);
    const totalPaid = (entries || []).filter(e => e.payment_type === 'Pay').reduce((sum, e) => sum + Number(e.paid_amount || 0), 0);

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                        <DollarSign className="text-emerald-500" size={32} />
                        Payment Entries
                    </h1>
                    <p className="text-muted-foreground mt-1">Pencatatan pembayaran, pelunasan piutang (AR) & hutang (AP) terintegrasi jurnal</p>
                </div>
                <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/20">
                    <Plus size={18} />
                    Catat Pembayaran Baru
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Penerimaan (Inflow)</span>
                        <h3 className="text-2xl font-bold text-emerald-500 mt-1">{formatCurrencyIDR(String(totalReceived))}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Pelunasan dari Pelanggan</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <ArrowDownLeft size={24} />
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Pembayaran (Outflow)</span>
                        <h3 className="text-2xl font-bold text-amber-500 mt-1">{formatCurrencyIDR(String(totalPaid))}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Pembayaran ke Pemasok</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <ArrowUpRight size={24} />
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Voucher</span>
                        <h3 className="text-2xl font-bold text-foreground mt-1">{entries?.length || 0} Transaksi</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Status Submitted & Posted</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <FileText size={24} />
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-card border border-border/60 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
                <div className="relative flex-1 max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cari no voucher, nama pihak, referensi..."
                        className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    {(['ALL', 'Receive', 'Pay'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setTypeFilter(tab)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${typeFilter === tab ? 'bg-emerald-600 text-white shadow-sm' : 'bg-muted/60 text-muted-foreground hover:bg-muted'}`}
                        >
                            {tab === 'ALL' ? 'Semua' : tab === 'Receive' ? 'Penerimaan (Receive)' : 'Pembayaran (Pay)'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                {isLoading ? (
                    <TableSkeleton rows={5} cols={7} />
                ) : filteredEntries.length === 0 ? (
                    <div className="text-center py-16">
                        <DollarSign className="mx-auto text-muted-foreground mb-3" size={48} />
                        <h3 className="text-lg font-semibold text-foreground">Belum Ada Payment Entry</h3>
                        <p className="text-sm text-muted-foreground mt-1">Klik tombol &apos;Catat Pembayaran Baru&apos; untuk membuat voucher pelunasan pertama.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHead>
                                <TableRow className="bg-muted/40">
                                    <TableTh>No. Voucher</TableTh>
                                    <TableTh>Tanggal Posting</TableTh>
                                    <TableTh>Tipe</TableTh>
                                    <TableTh>Pihak (Party)</TableTh>
                                    <TableTh>Metode Bayar</TableTh>
                                    <TableTh>No. Referensi</TableTh>
                                    <TableTh align="right">Jumlah (Rp)</TableTh>
                                    <TableTh align="center">Status</TableTh>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredEntries.map((row) => (
                                    <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                                        <TableTd className="font-semibold text-foreground">{row.entry_no}</TableTd>
                                        <TableTd className="text-muted-foreground">{row.posting_date}</TableTd>
                                        <TableTd>
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${row.payment_type === 'Receive' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                                                {row.payment_type === 'Receive' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                                                {row.payment_type === 'Receive' ? 'Receive (Masuk)' : 'Pay (Keluar)'}
                                            </span>
                                        </TableTd>
                                        <TableTd>
                                            <div className="font-medium text-foreground">{row.party_name || '-'}</div>
                                            <span className="text-xs text-muted-foreground">{row.party_type || 'General'}</span>
                                        </TableTd>
                                        <TableTd className="text-muted-foreground">{row.mode_of_payment}</TableTd>
                                        <TableTd className="text-muted-foreground">{row.reference_no || '-'}</TableTd>
                                        <TableTd align="right" className="font-bold text-foreground">
                                            {formatCurrencyIDR(String(Number(row.paid_amount || 0)))}
                                        </TableTd>
                                        <TableTd align="center">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 flex items-center justify-center gap-1 w-fit mx-auto">
                                                <CheckCircle2 size={12} /> {row.status}
                                            </span>
                                        </TableTd>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* Create Payment Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Catat Payment Entry & Alokasi Faktur"
            >
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Tipe Pembayaran</label>
                            <select
                                value={paymentType}
                                onChange={(e) => {
                                    setPaymentType(e.target.value as 'Receive' | 'Pay');
                                    setSelectedDocId('');
                                }}
                                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 outline-none"
                            >
                                <option value="Receive">Receive (Penerimaan dari Pelanggan)</option>
                                <option value="Pay">Pay (Pembayaran ke Pemasok)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Tanggal Posting</label>
                            <Input
                                type="date"
                                value={postingDate}
                                onChange={(e) => setPostingDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Nama Pihak (Party)</label>
                            <Input
                                placeholder={paymentType === 'Receive' ? 'PT Mitra Sukses...' : 'CV Sumber Jaya...'}
                                value={partyName}
                                onChange={(e) => setPartyName(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Metode Pembayaran</label>
                            <select
                                value={modeOfPayment}
                                onChange={(e) => setModeOfPayment(e.target.value)}
                                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 outline-none"
                            >
                                <option value="Bank Transfer">Transfer Bank</option>
                                <option value="Cash">Kas Tunai</option>
                                <option value="Cheque / Giro">Cek / Bilyet Giro</option>
                            </select>
                        </div>
                    </div>

                    {/* Alokasi Dokumen */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                            Alokasikan ke Faktur / Tagihan (Opsional)
                        </label>
                        <select
                            value={selectedDocId}
                            onChange={(e) => {
                                const id = e.target.value;
                                setSelectedDocId(id);
                                if (paymentType === 'Receive') {
                                    const inv = (salesInvoices || []).find(i => i.id === id);
                                    if (inv) {
                                        setSelectedDocNo(inv.invoice_number);
                                        setAmount(String(Number(inv.total_amount) - Number(inv.amount_paid)));
                                        if (inv.client_id) setPartyName(inv.invoice_number);
                                    }
                                } else {
                                    const bill = (purchaseBills || []).find(b => b.id === id);
                                    if (bill) {
                                        setSelectedDocNo(bill.bill_number);
                                        setAmount(String(Number(bill.total_amount) - Number(bill.amount_paid)));
                                    }
                                }
                            }}
                            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 outline-none"
                        >
                            <option value="">-- Pilih Faktur untuk Pelunasan Otomatis --</option>
                            {paymentType === 'Receive' ? (
                                (salesInvoices || []).filter(i => i.status !== 'paid').map(inv => (
                                    <option key={inv.id} value={inv.id}>
                                        {inv.invoice_number} - Sisa: {formatCurrencyIDR(String(Number(inv.total_amount)) - Number(inv.amount_paid))}
                                    </option>
                                ))
                            ) : (
                                (purchaseBills || []).filter(b => b.status !== 'paid').map(bill => (
                                    <option key={bill.id} value={bill.id}>
                                        {bill.bill_number} - Sisa: {formatCurrencyIDR(String(Number(bill.total_amount)) - Number(bill.amount_paid))}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Jumlah Pembayaran (Rp)</label>
                            <Input
                                type="number"
                                placeholder="Contoh: 15000000"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">No. Referensi / Bukti Transfer</label>
                            <Input
                                placeholder="TRF/BCA/99281"
                                value={referenceNo}
                                onChange={(e) => setReferenceNo(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={createMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            {createMutation.isPending ? 'Menyimpan...' : 'Simpan & Posting Voucher'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
