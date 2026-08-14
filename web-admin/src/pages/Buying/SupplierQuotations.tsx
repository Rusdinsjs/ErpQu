import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buyingQuotationDataApi, type SupplierQuotation } from '../../api/buying-quotation-data';
import { vendorApi } from '../../api/vendors';
import { Button, Input, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableSkeleton, Modal } from '../../components/ui';
import { Plus, Search, FileSpreadsheet, CheckCircle2, ArrowRight, DollarSign } from 'lucide-react';
import { formatCurrencyIDR } from '../../utils/decimal';
import { toast } from 'sonner';

export default function SupplierQuotations() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [quotationNo, setQuotationNo] = useState('');
    const [vendorId, setVendorId] = useState('');
    const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
    const [validTill, setValidTill] = useState(new Date(Date.now() + 30*24*3600*1000).toISOString().split('T')[0]);
    const [grandTotal, setGrandTotal] = useState('');

    const { data: quotations, isLoading } = useQuery({
        queryKey: ['buying', 'supplier-quotations'],
        queryFn: buyingQuotationDataApi.getSupplierQuotations,
    });

    const { data: vendorsData } = useQuery({
        queryKey: ['vendors'],
        queryFn: () => vendorApi.listVendors(1, 100),
    });

    const createMutation = useMutation({
        mutationFn: buyingQuotationDataApi.createSupplierQuotation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['buying', 'supplier-quotations'] });
            setIsModalOpen(false);
            setQuotationNo('');
            setGrandTotal('');
            toast.success('Penawaran Harga Supplier berhasil dicatat.');
        },
        onError: (err: any) => {
            toast.error('Gagal mencatat penawaran: ' + (err.message || 'Terjadi kesalahan'));
        }
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        const amt = parseFloat(grandTotal);
        if (isNaN(amt) || amt <= 0 || !vendorId) {
            toast.error('Pilih supplier dan masukkan nominal penawaran yang valid.');
            return;
        }

        createMutation.mutate({
            company_id: '00000000-0000-0000-0000-000000000001',
            quotation_number: quotationNo || `SQ-${Date.now().toString().slice(-6)}`,
            vendor_id: vendorId,
            transaction_date: transactionDate,
            valid_till: validTill,
            subtotal: amt,
            total_tax: 0,
            grand_total: amt,
            status: 'Submitted',
        });
    };

    const vendorsList = vendorsData?.data || [];

    const getVendorName = (id: string) => {
        const v = vendorsList.find(item => item.id === id);
        return v ? v.name : 'Supplier General';
    };

    const filtered = (quotations || []).filter((q: SupplierQuotation) => 
        (q.quotation_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        getVendorName(q.vendor_id).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                        <FileSpreadsheet className="text-emerald-500" size={32} />
                        Penawaran Harga Supplier (Supplier Quotations)
                    </h1>
                    <p className="text-muted-foreground mt-1">Daftar penawaran harga masuk dari berbagai vendor untuk perbandingan dan konversi ke PO</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/20">
                    <Plus size={18} />
                    Catat Penawaran Supplier
                </Button>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl p-4 flex gap-4 items-center shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cari nomor penawaran atau nama vendor..."
                        className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                </div>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                {isLoading ? (
                    <TableSkeleton rows={5} cols={6} />
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <FileSpreadsheet className="mx-auto text-muted-foreground mb-3" size={48} />
                        <h3 className="text-lg font-semibold text-foreground">Belum Ada Penawaran Harga Supplier</h3>
                        <p className="text-sm text-muted-foreground mt-1">Catat penawaran harga dari vendor untuk evaluasi kelayakan harga.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow className="bg-muted/40">
                                <TableTh>No. Penawaran</TableTh>
                                <TableTh>Supplier / Vendor</TableTh>
                                <TableTh>Tanggal Penawaran</TableTh>
                                <TableTh>Berlaku Sampai</TableTh>
                                <TableTh align="right">Total Penawaran (Rp)</TableTh>
                                <TableTh align="center">Status</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.map((row: SupplierQuotation) => (
                                <TableRow key={row.id} className="hover:bg-muted/30">
                                    <TableTd className="font-semibold text-foreground">{row.quotation_number}</TableTd>
                                    <TableTd className="font-medium text-foreground">{getVendorName(row.vendor_id)}</TableTd>
                                    <TableTd className="text-muted-foreground">{row.transaction_date}</TableTd>
                                    <TableTd className="text-muted-foreground">{row.valid_till || '-'}</TableTd>
                                    <TableTd align="right" className="font-bold text-foreground">{formatCurrencyIDR(Number(row.grand_total || 0))}</TableTd>
                                    <TableTd align="center">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 inline-flex items-center gap-1">
                                            <CheckCircle2 size={12} /> {row.status || 'Submitted'}
                                        </span>
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Catat Penawaran Harga Supplier">
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">No. Penawaran Vendor</label>
                            <Input placeholder="Contoh: QUO-VENDOR-2026-01" value={quotationNo} onChange={(e) => setQuotationNo(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Pemasok / Vendor</label>
                            <select
                                value={vendorId}
                                onChange={(e) => setVendorId(e.target.value)}
                                required
                                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 outline-none"
                            >
                                <option value="">-- Pilih Supplier --</option>
                                {vendorsList.map(v => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Tanggal Penawaran</label>
                            <Input type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Berlaku Hingga</label>
                            <Input type="date" value={validTill} onChange={(e) => setValidTill(e.target.value)} required />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Total Nilai Penawaran (Rp)</label>
                        <Input
                            type="number"
                            placeholder="Contoh: 45000000"
                            value={grandTotal}
                            onChange={(e) => setGrandTotal(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={createMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            {createMutation.isPending ? 'Menyimpan...' : 'Simpan Penawaran'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
