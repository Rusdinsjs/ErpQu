import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    financeApi, type SalesInvoice, type CreateSalesInvoiceRequest,
    type UpdateSalesInvoiceRequest, type CreateInvoiceItemRequest
} from '../api/finance';
import { clientApi } from '../../clients/api/client-management';
import {
    Card, Button, Badge, Modal, CurrencyInput, UniversalTableToolbar,
    type TableColumnOption, type FilterChip, useToast
} from '../../../components/ui';
import {
    calculateInvoiceTotalString,
    deriveInvoiceStates,
    formatCurrencyIDR,
    subtractDecimalStrings,
    sumDecimalStrings,
} from '../../../utils/decimal';
import {
    Plus, Search, Filter, Download, MoreVertical, TrendingUp,
    Clock, CheckCircle2, X, Eye, Edit, Trash2, FileText,
    PlusCircle, Trash, DollarSign, Printer, Building2, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

export default function SalesInvoices() {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid' | 'overdue'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewInvoice, setViewInvoice] = useState<SalesInvoice | null>(null);
    const [editInvoice, setEditInvoice] = useState<SalesInvoice | null>(null);
    const [createDefaults, setCreateDefaults] = useState({ invoiceNumber: '', date: '', dueDate: '' });

    // Dynamic line items state for create/edit modal
    const [createItems, setCreateItems] = useState<Array<{ description: string; quantity: number; unit_price: number }>>([
        { description: '', quantity: 1, unit_price: 0 }
    ]);

    const queryClient = useQueryClient();

    // Column visibility state
    const [columns, setColumns] = useState<TableColumnOption[]>([
        { key: 'invoice_number', label: 'Nomor Faktur', visible: true },
        { key: 'client', label: 'Klien / Pelanggan', visible: true },
        { key: 'date', label: 'Tanggal & Jatuh Tempo', visible: true },
        { key: 'total_amount', label: 'Total Faktur (Rp)', visible: true },
        { key: 'paid_amount', label: 'Terbayar (Rp)', visible: true },
        { key: 'status', label: 'Status Pembayaran', visible: true },
    ]);

    const toggleColumn = (key: string) => {
        setColumns(prev => prev.map(c => c.key === key ? { ...c, visible: !c.visible } : c));
    };

    const isColVisible = (key: string) => {
        const col = columns.find(c => c.key === key);
        return col ? col.visible !== false : true;
    };

    const { data: rawInvoices, isLoading } = useQuery({
        queryKey: ['finance', 'sales-invoices'],
        queryFn: financeApi.listSalesInvoices
    });
    const invoices: SalesInvoice[] = Array.isArray(rawInvoices) ? rawInvoices : (rawInvoices as any)?.data || [];

    const { data: clientsResponse } = useQuery({
        queryKey: ['clients'],
        queryFn: () => clientApi.list({ limit: 100 })
    });
    const clients = Array.isArray(clientsResponse?.data) ? clientsResponse.data : (clientsResponse as any)?.data?.data || [];

    const createMutation = useMutation({
        mutationFn: financeApi.createSalesInvoice,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance', 'sales-invoices'] });
            setIsModalOpen(false);
            setCreateItems([{ description: '', quantity: 1, unit_price: 0 }]);
            toast.success('Faktur Penjualan (Invoice) berhasil dibuat dan dijurnal otomatis');
        },
        onError: (error: unknown) => {
            toast.error('Gagal membuat invoice: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    });

    const deleteMutation = useMutation({
        mutationFn: financeApi.deleteSalesInvoice,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance', 'sales-invoices'] });
            toast.success('Invoice berhasil dihapus');
        },
        onError: (error: unknown) => {
            toast.error('Gagal menghapus invoice: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    });

    const handleOpenCreate = () => {
        const now = new Date();
        const due = new Date(now);
        due.setDate(due.getDate() + 30);
        setCreateDefaults({
            invoiceNumber: `INV/${now.getFullYear()}/${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
            date: now.toISOString().slice(0, 10),
            dueDate: due.toISOString().slice(0, 10),
        });
        setCreateItems([{ description: '', quantity: 1, unit_price: 0 }]);
        setIsModalOpen(true);
    };

    const handleAddItemRow = () => {
        setCreateItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0 }]);
    };

    const handleRemoveItemRow = (idx: number) => {
        if (createItems.length <= 1) return;
        setCreateItems(prev => prev.filter((_, i) => i !== idx));
    };

    const handleUpdateItemRow = (idx: number, field: string, val: any) => {
        setCreateItems(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], [field]: val };
            return next;
        });
    };

    // Calculate Modal Grand Total
    const modalSubtotal = useMemo(() => {
        return createItems.reduce((acc, item) => acc + ((item.quantity || 0) * (item.unit_price || 0)), 0);
    }, [createItems]);

    // Financial KPI Stats
    const stats = useMemo(() => {
        let totalVal = 0;
        let paidVal = 0;
        let unpaidCount = 0;
        let overdueCount = 0;

        const now = new Date();

        invoices.forEach((inv: any) => {
            const total = parseFloat(inv.total_amount || '0');
            const paid = parseFloat(inv.paid_amount || '0');
            totalVal += total;
            paidVal += paid;

            const isPaid = paid >= total && total > 0;
            const isOverdue = inv.due_date && new Date(inv.due_date) < now && !isPaid;

            if (!isPaid) unpaidCount++;
            if (isOverdue) overdueCount++;
        });

        return {
            totalValue: totalVal,
            paidValue: paidVal,
            outstandingValue: totalVal - paidVal,
            unpaidCount,
            overdueCount,
        };
    }, [invoices]);

    // Filtered Invoices
    const filteredInvoices = useMemo(() => {
        return invoices.filter((inv: any) => {
            const num = (inv.invoice_number || '').toLowerCase();
            const clientName = (inv.client_name || '').toLowerCase();
            const matchSearch = num.includes(searchTerm.toLowerCase()) || clientName.includes(searchTerm.toLowerCase());

            const total = parseFloat(inv.total_amount || '0');
            const paid = parseFloat(inv.paid_amount || '0');
            const isPaid = paid >= total && total > 0;
            const isOverdue = inv.due_date && new Date(inv.due_date) < new Date() && !isPaid;

            let matchStatus = true;
            if (statusFilter === 'unpaid') matchStatus = !isPaid;
            if (statusFilter === 'paid') matchStatus = isPaid;
            if (statusFilter === 'overdue') matchStatus = isOverdue;

            return matchSearch && matchStatus;
        });
    }, [invoices, searchTerm, statusFilter]);

    const activeFilterChips = useMemo<FilterChip[]>(() => {
        if (statusFilter === 'all') return [];
        return [{
            id: 'status',
            label: 'Status Pembayaran',
            value: statusFilter === 'unpaid' ? 'Belum Lunas' : statusFilter === 'paid' ? 'Lunas' : 'Jatuh Tempo (Overdue)'
        }];
    }, [statusFilter]);

    // Export dataset
    const exportDataset = useMemo(() => {
        return filteredInvoices.map((inv: any) => ({
            'Nomor Faktur': inv.invoice_number,
            'Nama Klien': inv.client_name || '-',
            'Tanggal Faktur': inv.date,
            'Jatuh Tempo': inv.due_date || '-',
            'Total Faktur (Rp)': parseFloat(inv.total_amount || '0'),
            'Terbayar (Rp)': parseFloat(inv.paid_amount || '0'),
            'Sisa Piutang (Rp)': parseFloat(inv.total_amount || '0') - parseFloat(inv.paid_amount || '0'),
            'Status': inv.status || 'Active'
        }));
    }, [filteredInvoices]);

    return (
        <div className="p-4 md:p-6 space-y-6 bg-background min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header + Action */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <FileText size={24} />
                        </div>
                        Faktur Penjualan & Piutang (Sales Invoices)
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Penerbitan tagihan resmi kepada klien, monitoring piutang jatuh tempo, dan auto-journaling akuntansi
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="filled"
                        onClick={handleOpenCreate}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Terbitkan Faktur Baru
                    </Button>
                </div>
            </div>

            {/* Financial KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-muted-foreground">Total Nilai Tagihan</span>
                        <div className="text-2xl font-bold text-foreground mt-1">
                            Rp {(stats.totalValue / 1_000_000).toFixed(1)} Jt
                        </div>
                        <span className="text-[11px] text-muted-foreground">{invoices.length} Faktur terbit</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                        <DollarSign size={20} />
                    </div>
                </div>

                <div
                    onClick={() => setStatusFilter(statusFilter === 'unpaid' ? 'all' : 'unpaid')}
                    className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between cursor-pointer transition-all ${
                        statusFilter === 'unpaid'
                            ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/30'
                            : 'bg-card border-border/60 hover:border-amber-500/40'
                    }`}
                >
                    <div>
                        <span className="text-xs font-medium text-amber-400">Sisa Piutang (Unpaid)</span>
                        <div className="text-2xl font-bold text-amber-300 mt-1">
                            Rp {(stats.outstandingValue / 1_000_000).toFixed(1)} Jt
                        </div>
                        <span className="text-[11px] text-amber-500/80">{stats.unpaidCount} Faktur belum lunas</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <Clock size={20} />
                    </div>
                </div>

                <div
                    onClick={() => setStatusFilter(statusFilter === 'paid' ? 'all' : 'paid')}
                    className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between cursor-pointer transition-all ${
                        statusFilter === 'paid'
                            ? 'bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/30'
                            : 'bg-card border-border/60 hover:border-emerald-500/40'
                    }`}
                >
                    <div>
                        <span className="text-xs font-medium text-emerald-400">Kas Diterima (Paid)</span>
                        <div className="text-2xl font-bold text-emerald-300 mt-1">
                            Rp {(stats.paidValue / 1_000_000).toFixed(1)} Jt
                        </div>
                        <span className="text-[11px] text-emerald-500/80">Sudah terbayar</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <CheckCircle2 size={20} />
                    </div>
                </div>

                <div
                    onClick={() => setStatusFilter(statusFilter === 'overdue' ? 'all' : 'overdue')}
                    className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between cursor-pointer transition-all ${
                        statusFilter === 'overdue'
                            ? 'bg-rose-500/20 border-rose-500 ring-2 ring-rose-500/30'
                            : 'bg-card border-border/60 hover:border-rose-500/40'
                    }`}
                >
                    <div>
                        <span className="text-xs font-medium text-rose-400">Jatuh Tempo (Overdue)</span>
                        <div className="text-2xl font-bold text-rose-300 mt-1">{stats.overdueCount} Faktur</div>
                        <span className="text-[11px] text-rose-500/80">Perlu penagihan segera</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                        <AlertTriangle size={20} />
                    </div>
                </div>
            </div>

            {/* Universal Table Toolbar */}
            <UniversalTableToolbar
                searchQuery={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Cari nomor faktur atau nama klien..."
                columns={columns}
                onToggleColumn={toggleColumn}
                activeFilterChips={activeFilterChips}
                onRemoveFilterChip={() => setStatusFilter('all')}
                onResetAllFilters={() => { setSearchTerm(''); setStatusFilter('all'); }}
                exportData={exportDataset}
                exportFilename="laporan_faktur_penjualan"
            />

            {/* Invoices Table */}
            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-border/40 bg-muted/40">
                                {isColVisible('invoice_number') && (
                                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Nomor Faktur
                                    </th>
                                )}
                                {isColVisible('client') && (
                                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Klien / Pelanggan
                                    </th>
                                )}
                                {isColVisible('date') && (
                                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Tanggal & Tempo
                                    </th>
                                )}
                                {isColVisible('total_amount') && (
                                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
                                        Total Faktur (Rp)
                                    </th>
                                )}
                                {isColVisible('paid_amount') && (
                                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
                                        Terbayar (Rp)
                                    </th>
                                )}
                                {isColVisible('status') && (
                                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">
                                        Status
                                    </th>
                                )}
                                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                                        <FileText size={40} className="mx-auto mb-3 opacity-20" />
                                        <p className="text-sm font-semibold">Tidak ada faktur penjualan yang cocok</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((invoice: any) => {
                                    const total = parseFloat(invoice.total_amount || '0');
                                    const paid = parseFloat(invoice.paid_amount || '0');
                                    const isPaid = paid >= total && total > 0;
                                    const isPartiallyPaid = paid > 0 && paid < total;
                                    const isOverdue = invoice.due_date && new Date(invoice.due_date) < new Date() && !isPaid;

                                    return (
                                        <tr key={invoice.id} className="hover:bg-muted/30 transition-colors">
                                            {isColVisible('invoice_number') && (
                                                <td className="px-5 py-3.5 font-mono font-bold text-foreground">
                                                    {invoice.invoice_number}
                                                </td>
                                            )}
                                            {isColVisible('client') && (
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 size={14} className="text-muted-foreground" />
                                                        <span className="font-semibold text-foreground text-xs">
                                                            {invoice.client_name || 'Pelanggan Umum'}
                                                        </span>
                                                    </div>
                                                </td>
                                            )}
                                            {isColVisible('date') && (
                                                <td className="px-5 py-3.5 text-xs">
                                                    <div className="text-foreground font-medium">{invoice.date}</div>
                                                    <div className={`text-[11px] ${isOverdue ? 'text-rose-400 font-bold' : 'text-muted-foreground'}`}>
                                                        Tempo: {invoice.due_date || '-'}
                                                    </div>
                                                </td>
                                            )}
                                            {isColVisible('total_amount') && (
                                                <td className="px-5 py-3.5 text-right font-mono font-bold text-foreground">
                                                    Rp {total.toLocaleString('id-ID')}
                                                </td>
                                            )}
                                            {isColVisible('paid_amount') && (
                                                <td className="px-5 py-3.5 text-right font-mono text-xs">
                                                    <span className={isPaid ? 'text-emerald-400 font-bold' : 'text-foreground'}>
                                                        Rp {paid.toLocaleString('id-ID')}
                                                    </span>
                                                </td>
                                            )}
                                            {isColVisible('status') && (
                                                <td className="px-5 py-3.5 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                        isPaid
                                                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                                            : isOverdue
                                                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse'
                                                            : isPartiallyPaid
                                                            ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                                                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                                    }`}>
                                                        {isPaid ? 'Lunas' : isOverdue ? 'Overdue' : isPartiallyPaid ? 'Sebagian' : 'Belum Lunas'}
                                                    </span>
                                                </td>
                                            )}
                                            <td className="px-5 py-3.5 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewInvoice(invoice)}
                                                        className="p-1.5 text-muted-foreground hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                                                        title="Lihat Rincian Faktur"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => window.print()}
                                                        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                        title="Cetak Faktur PDF"
                                                    >
                                                        <Printer size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (confirm(`Hapus faktur ${invoice.invoice_number}?`)) {
                                                                deleteMutation.mutate(invoice.id);
                                                            }
                                                        }}
                                                        className="p-1.5 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                        title="Hapus Faktur"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Terbitkan Faktur Baru */}
            <Modal
                isOpen={isModalOpen}
                opened={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Terbitkan Faktur Penjualan (Sales Invoice)"
                size="3xl"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        createMutation.mutate({
                            invoice_number: formData.get('invoice_number') as string,
                            client_id: formData.get('client_id') as string,
                            date: formData.get('date') as string,
                            due_date: (formData.get('due_date') as string) || undefined,
                            subject: (formData.get('subject') as string) || undefined,
                            items: createItems.map(item => ({
                                description: item.description,
                                quantity: item.quantity.toString(),
                                unit_price: item.unit_price.toString(),
                            }))
                        });
                    }}
                    className="space-y-4 max-h-[80vh] overflow-y-auto pr-1 custom-scrollbar"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                                Nomor Faktur *
                            </label>
                            <input
                                name="invoice_number"
                                required
                                defaultValue={createDefaults.invoiceNumber}
                                className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                                Klien / Pelanggan *
                            </label>
                            <select
                                name="client_id"
                                required
                                className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-medium"
                            >
                                <option value="">Pilih Klien...</option>
                                {clients.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                                Tanggal Faktur *
                            </label>
                            <input
                                type="date"
                                name="date"
                                required
                                defaultValue={createDefaults.date}
                                className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                                Jatuh Tempo
                            </label>
                            <input
                                type="date"
                                name="due_date"
                                defaultValue={createDefaults.dueDate}
                                className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                                Perihal / Subjek
                            </label>
                            <input
                                name="subject"
                                placeholder="cth. Sewa Excavator Bulan Sept"
                                className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    {/* Sub-table Invoice Items */}
                    <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                                Rincian Jasa / Penjualan Barang
                            </span>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddItemRow}
                                className="rounded-xl text-xs flex items-center gap-1.5"
                            >
                                <Plus size={14} />
                                Tambah Baris
                            </Button>
                        </div>

                        <div className="border border-border/60 rounded-2xl overflow-hidden">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-muted/60 border-b border-border/40">
                                    <tr>
                                        <th className="p-3 font-bold">Deskripsi Jasa / Barang *</th>
                                        <th className="p-3 font-bold w-24">Jumlah</th>
                                        <th className="p-3 font-bold w-48">Harga Satuan (Rp)</th>
                                        <th className="p-3 font-bold text-right w-36">Total (Rp)</th>
                                        <th className="p-3 font-bold text-center w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {createItems.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-muted/20">
                                            <td className="p-2.5">
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Deskripsi layanan / item..."
                                                    value={item.description}
                                                    onChange={(e) => handleUpdateItemRow(idx, 'description', e.target.value)}
                                                    className="w-full bg-transparent border border-border/40 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                                                />
                                            </td>
                                            <td className="p-2.5">
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={item.quantity}
                                                    onChange={(e) => handleUpdateItemRow(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-transparent border border-border/40 rounded-lg px-2.5 py-1.5 text-xs text-foreground font-mono text-center focus:outline-none focus:border-primary"
                                                />
                                            </td>
                                            <td className="p-2.5">
                                                <CurrencyInput
                                                    value={item.unit_price}
                                                    onChange={(val) => handleUpdateItemRow(idx, 'unit_price', val)}
                                                    size="sm"
                                                />
                                            </td>
                                            <td className="p-2.5 text-right font-mono font-bold text-foreground">
                                                Rp {(item.quantity * item.unit_price).toLocaleString('id-ID')}
                                            </td>
                                            <td className="p-2.5 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItemRow(idx)}
                                                    disabled={createItems.length <= 1}
                                                    className={`p-1 transition-colors ${
                                                        createItems.length <= 1
                                                            ? 'text-muted-foreground/30 cursor-not-allowed'
                                                            : 'text-muted-foreground hover:text-rose-400'
                                                    }`}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Summary Footer */}
                    <div className="flex justify-between items-center p-3 bg-muted/30 border border-border/40 rounded-xl">
                        <span className="text-xs font-semibold text-muted-foreground">Grand Total Faktur:</span>
                        <span className="text-base font-mono font-bold text-emerald-400">
                            Rp {modalSubtotal.toLocaleString('id-ID')}
                        </span>
                    </div>

                    <div className="flex gap-2 justify-end pt-3 border-t border-border/40">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl">
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            variant="filled"
                            loading={createMutation.isPending}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl"
                        >
                            Terbitkan Faktur
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal Detail & Print Invoice */}
            <Modal
                isOpen={!!viewInvoice}
                opened={!!viewInvoice}
                onClose={() => setViewInvoice(null)}
                title={`Rincian Faktur: ${viewInvoice?.invoice_number || ''}`}
                size="2xl"
            >
                {viewInvoice && (
                    <div className="space-y-4 text-xs">
                        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 border border-border/40 rounded-2xl">
                            <div>
                                <span className="text-muted-foreground">Klien / Pelanggan:</span>
                                <div className="font-bold text-sm text-foreground mt-0.5">{viewInvoice.client_name || '-'}</div>
                                <div className="text-muted-foreground mt-1">Tanggal: {viewInvoice.date}</div>
                            </div>
                            <div className="text-right">
                                <span className="text-muted-foreground">Total Tagihan:</span>
                                <div className="text-lg font-mono font-bold text-emerald-400 mt-0.5">
                                    Rp {parseFloat(viewInvoice.total_amount || '0').toLocaleString('id-ID')}
                                </div>
                                <div className="text-muted-foreground mt-1">Jatuh Tempo: {viewInvoice.due_date || '-'}</div>
                            </div>
                        </div>

                        {viewInvoice.items && viewInvoice.items.length > 0 && (
                            <div className="border border-border/40 rounded-xl overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-muted/40">
                                        <tr>
                                            <th className="p-2.5 font-bold">Deskripsi</th>
                                            <th className="p-2.5 font-bold text-center">Jumlah</th>
                                            <th className="p-2.5 font-bold text-right">Harga Satuan</th>
                                            <th className="p-2.5 font-bold text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/20">
                                        {viewInvoice.items.map((it: any, i: number) => (
                                            <tr key={i}>
                                                <td className="p-2.5">{it.description}</td>
                                                <td className="p-2.5 text-center font-mono">{it.quantity}</td>
                                                <td className="p-2.5 text-right font-mono">
                                                    Rp {parseFloat(it.unit_price || '0').toLocaleString('id-ID')}
                                                </td>
                                                <td className="p-2.5 text-right font-mono font-bold">
                                                    Rp {(parseFloat(it.quantity || '0') * parseFloat(it.unit_price || '0')).toLocaleString('id-ID')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-2">
                            <Button variant="outline" onClick={() => window.print()} className="rounded-xl flex items-center gap-1.5">
                                <Printer size={15} /> Cetak Faktur PDF
                            </Button>
                            <Button variant="outline" onClick={() => setViewInvoice(null)} className="rounded-xl">
                                Tutup
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
