import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi, type CreatePurchaseBillRequest } from '../../api/finance';
import { clientApi } from '../../api/client-management';
import { Card, Button, Badge } from '../../components/ui';
import {
    Plus,
    Search,
    Filter,
    Download,
    MoreVertical,
    ShoppingBag,
    AlertCircle,
    CheckSquare,
    X,
    Barcode,
    Trash2,
    Save,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrencyIDR, subtractDecimalStrings, sumDecimalStrings } from '../../utils/decimal';

interface BillItemRow {
    item_code: string;
    item_name: string;
    accepted_qty: number;
    rate: number;
    amount: number;
}

export default function PurchaseBills() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'payments' | 'address' | 'terms' | 'more'>('details');
    const [currencyExpanded, setCurrencyExpanded] = useState(false);
    const [supplierInvoiceExpanded, setSupplierInvoiceExpanded] = useState(true);
    const queryClient = useQueryClient();

    // Form Field States (Matching standard ERPNext Purchase Invoice)
    const [series, setSeries] = useState('ACC-PINV-.YYYY.-');
    const [supplierId, setSupplierId] = useState('');
    const [company, setCompany] = useState('SJS Group');
    const [postingDate, setPostingDate] = useState(new Date().toISOString().split('T')[0]);
    const [postingTime, setPostingTime] = useState('18:30:55');
    const [editPostingTime, setEditPostingTime] = useState(false);
    const [dueDate, setDueDate] = useState('');

    // Checkbox Flags on Main Header
    const [isPaid, setIsPaid] = useState(false);
    const [isReturn, setIsReturn] = useState(false);
    const [considerTaxWithholding, setConsiderTaxWithholding] = useState(false);

    // Supplier Invoice Info
    const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
    const [supplierInvoiceDate, setSupplierInvoiceDate] = useState('');

    // Currency and Stock Options
    const [currency, setCurrency] = useState('IDR');
    const [priceList, setPriceList] = useState('Standard Buying');
    const [scanBarcode, setScanBarcode] = useState('');
    const [updateStock, setUpdateStock] = useState(false);
    const [isSubcontracted, setIsSubcontracted] = useState(false);

    // Items Child Table State
    const [items, setItems] = useState<BillItemRow[]>([
        {
            item_code: 'MAT-PBR-001',
            item_name: 'Solar Industri HSD (High Speed Diesel)',
            accepted_qty: 5000,
            rate: 14500,
            amount: 72500000
        }
    ]);

    // Taxes and Charges
    const [taxCategory, setTaxCategory] = useState('');
    const [shippingRule, setShippingRule] = useState('');
    const [incoterm, setIncoterm] = useState('EXW - Ex Works');
    const [taxTemplate, setTaxTemplate] = useState('PPN Masukan 11%');

    // Payments Tab States
    const [modeOfPayment, setModeOfPayment] = useState('Transfer Bank BCA');
    const [paidAmount, setPaidAmount] = useState(0);

    // Terms & Remarks
    const [paymentTerms, setPaymentTerms] = useState('Net 30');
    const [termsText, setTermsText] = useState('1. Pembayaran ditransfer setelah faktur pajak dan bukti surat jalan diterima.\n2. Retur berlaku jika terdapat kecacatan material.');
    const [budgetType, setBudgetType] = useState('OPEX');
    const [remarks, setRemarks] = useState('');

    const { data: bills, isLoading } = useQuery({
        queryKey: ['finance', 'purchase-bills'],
        queryFn: financeApi.listPurchaseBills
    });

    const { data: vendorsResponse } = useQuery({
        queryKey: ['vendors'],
        queryFn: () => clientApi.list({ limit: 100 })
    });
    const vendors = Array.isArray(vendorsResponse?.data) ? vendorsResponse.data : (vendorsResponse as any)?.data?.data || [];

    const createMutation = useMutation({
        mutationFn: financeApi.createPurchaseBill,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance', 'purchase-bills'] });
            setIsModalOpen(false);
            toast.success('Faktur Tagihan Pembelian (Purchase Invoice) berhasil dibuat');
        },
        onError: (error: unknown) => {
            toast.error('Gagal membuat tagihan: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    });

    const handleOpenCreate = () => {
        setIsModalOpen(true);
    };

    // Calculation Totals
    const totalQuantity = items.reduce((acc, curr) => acc + (curr.accepted_qty || 0), 0);
    const netTotal = items.reduce((acc, curr) => acc + (curr.accepted_qty * curr.rate || 0), 0);
    const totalTaxes = taxTemplate === 'PPN Masukan 11%' ? netTotal * 0.11 : 0;
    const grandTotal = netTotal + totalTaxes;

    // Item Table Handlers
    const handleAddItemRow = () => {
        setItems([
            ...items,
            {
                item_code: '',
                item_name: '',
                accepted_qty: 1,
                rate: 0,
                amount: 0
            }
        ]);
    };

    const handleRemoveItemRow = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: keyof BillItemRow, value: any) => {
        const updated = [...items];
        const row = { ...updated[index], [field]: value };
        if (field === 'accepted_qty' || field === 'rate') {
            row.amount = (row.accepted_qty || 0) * (row.rate || 0);
        }
        updated[index] = row;
        setItems(updated);
    };

    const handleCreateBill = (e: React.FormEvent) => {
        e.preventDefault();
        const billNo = `ACC-PINV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const payload: CreatePurchaseBillRequest = {
            bill_number: billNo,
            vendor_id: supplierId,
            date: postingDate,
            due_date: dueDate,
            budget_type: budgetType,
            items: items.map(i => ({
                description: i.item_name || i.item_code,
                quantity: String(i.accepted_qty),
                unit_price: String(i.rate)
            }))
        };
        createMutation.mutate(payload);
    };

    const totalPayable = sumDecimalStrings(
        bills?.map((bill) => subtractDecimalStrings(bill.total_amount, bill.amount_paid)) ?? [],
    );
    const overdueTotal = sumDecimalStrings(
        bills?.filter((bill) => bill.status === 'overdue').map((bill) => bill.total_amount) ?? [],
    );
    const paidTotal = sumDecimalStrings(
        bills?.filter((bill) => bill.status === 'paid').map((bill) => bill.total_amount) ?? [],
    );

    const stats = [
        { label: 'Total Utang', value: formatCurrencyIDR(totalPayable), icon: ShoppingBag, color: 'text-rose-400', bg: 'bg-rose-500/10' },
        { label: 'Jatuh Tempo', value: formatCurrencyIDR(overdueTotal), icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
        { label: 'Lunas (Total)', value: formatCurrencyIDR(paidTotal), icon: CheckSquare, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    ];

    return (
        <div className="space-y-6 bg-background min-h-screen">
            {/* Page Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Tagihan Pembelian (Purchase Invoices)</h1>
                    <p className="text-sm text-muted-foreground">Kelola tagihan supplier, faktur pajak pembelian, dan status pembayaran</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2 border-border/80 text-muted-foreground">
                        <Download size={16} />
                        Export
                    </Button>
                    <Button
                        onClick={handleOpenCreate}
                        className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-md"
                    >
                        <Plus size={16} />
                        Buat Tagihan Pembelian Baru
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((stat, i) => (
                    <Card key={i} className="bg-card border-border/60 shadow-sm rounded-2xl">
                        <div className="p-5 flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                <stat.icon className={stat.color} size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground">{stat.label}</p>
                                <p className="text-2xl font-bold text-foreground mt-0.5">{stat.value}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* List Table */}
            <Card className="bg-card border-border/60 shadow-sm overflow-hidden rounded-2xl">
                <div className="p-4 border-b border-border/60 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex gap-2 items-center flex-1 min-w-[300px]">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <input
                                placeholder="Cari tagihan invoice, supplier, atau nomor faktur..."
                                className="w-full bg-background border border-border/80 rounded-xl pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="gap-2 border-border/80 text-muted-foreground rounded-xl">
                            <Filter size={16} />
                            Filter
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-muted-foreground">
                        <thead className="bg-muted/40 text-muted-foreground uppercase text-[11px] font-bold tracking-wider border-b border-border/60">
                            <tr>
                                <th className="px-6 py-4">Nomor Faktur</th>
                                <th className="px-6 py-4">Supplier</th>
                                <th className="px-6 py-4">Tanggal Faktur</th>
                                <th className="px-6 py-4">Jatuh Tempo</th>
                                <th className="px-6 py-4 text-right">Total Tagihan</th>
                                <th className="px-6 py-4 text-right">Terbayar</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 text-foreground font-medium">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center animate-pulse">Memuat data tagihan...</td>
                                </tr>
                            ) : bills && bills.length > 0 ? (
                                bills.map((bill) => (
                                    <tr key={bill.id} className="hover:bg-muted/30 transition-colors cursor-pointer group">
                                        <td className="px-6 py-4 font-bold text-primary">{bill.bill_number}</td>
                                        <td className="px-6 py-4 font-semibold text-foreground">
                                            {vendors.find((v) => v.id === bill.vendor_id)?.name || bill.vendor_id || 'CV Teknik Jaya Abadi'}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs">{new Date(bill.date || Date.now()).toLocaleDateString('id-ID')}</td>
                                        <td className="px-6 py-4 font-mono text-xs">{bill.due_date ? new Date(bill.due_date).toLocaleDateString('id-ID') : '-'}</td>
                                        <td className="px-6 py-4 text-right font-bold text-foreground">
                                            {formatCurrencyIDR(bill.total_amount)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-semibold text-emerald-500">
                                            {formatCurrencyIDR(bill.amount_paid)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant={bill.status === 'paid' ? 'success' : bill.status === 'overdue' ? 'danger' : 'warning'} className="capitalize">
                                                {bill.status || 'Unpaid'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                                                <MoreVertical size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground italic">
                                        Belum ada data tagihan pembelian
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal Form Standard ERPNext Compliant Purchase Invoice (Left Image Match) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-card border border-border/80 rounded-2xl w-full max-w-5xl my-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                        {/* Top Action Header Bar (Matching Image 1 Left Top) */}
                        <div className="px-6 py-4 bg-muted/40 border-b border-border/60 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground font-semibold">Tindakan Cepat:</span>
                                <select className="bg-background border border-border/80 rounded-xl px-3 py-1.5 text-xs text-foreground font-medium focus:ring-1 focus:ring-primary/20">
                                    <option value="">Get Items From :</option>
                                    <option value="purchase_order">Purchase Order</option>
                                    <option value="purchase_receipt">Purchase Receipt</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                    Not Saved
                                </span>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Form Title */}
                        <div className="px-6 pt-4 pb-2 border-b border-border/40 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-foreground">New Purchase Invoice</h2>
                                <p className="text-xs text-muted-foreground">Formulir Faktur Tagihan Pembelian Standar ERPNext Compliant</p>
                            </div>
                        </div>

                        {/* ERPNext Tab Navigation (Details | Payments | Address & Contact | Terms | More Info) */}
                        <div className="px-6 border-b border-border/60 flex items-center gap-6 bg-muted/20 shrink-0">
                            {[
                                { id: 'details', label: 'Details' },
                                { id: 'payments', label: 'Payments' },
                                { id: 'address', label: 'Address & Contact' },
                                { id: 'terms', label: 'Terms' },
                                { id: 'more', label: 'More Info' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`py-3 text-xs font-semibold border-b-2 transition-all ${
                                        activeTab === tab.id
                                            ? 'border-primary text-primary font-bold'
                                            : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Modal Form Scrollable Content */}
                        <form onSubmit={handleCreateBill} className="p-6 space-y-6 overflow-y-auto flex-1">

                            {/* TAB 1: DETAILS */}
                            {activeTab === 'details' && (
                                <div className="space-y-6">

                                    {/* Section 1: Main Header Fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground/90">
                                                Series <span className="text-rose-500">*</span>
                                            </label>
                                            <select
                                                value={series}
                                                onChange={(e) => setSeries(e.target.value)}
                                                required
                                                className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary/20"
                                            >
                                                <option value="ACC-PINV-.YYYY.-">ACC-PINV-.YYYY.-</option>
                                                <option value="ACC-PINV-RET-.YYYY.-">ACC-PINV-RET-.YYYY.-</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground/90">
                                                Supplier <span className="text-rose-500">*</span>
                                            </label>
                                            <select
                                                value={supplierId}
                                                onChange={(e) => setSupplierId(e.target.value)}
                                                required
                                                className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary/20"
                                            >
                                                <option value="">Pilih Supplier / Vendor</option>
                                                {vendors.map((v: any) => (
                                                    <option key={v.id} value={v.id}>{v.name}</option>
                                                ))}
                                                <option value="cv_teknik_jaya">CV Teknik Jaya Abadi</option>
                                                <option value="pt_pertamina">PT Pertamina Lubricants</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground/90">
                                                Company
                                            </label>
                                            <select
                                                value={company}
                                                onChange={(e) => setCompany(e.target.value)}
                                                className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary/20"
                                            >
                                                <option value="SJS Group">SJS Group</option>
                                                <option value="Main Operations">Main Operations</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground/90">
                                                Posting Date <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={postingDate}
                                                onChange={(e) => setPostingDate(e.target.value)}
                                                required
                                                className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground/90">
                                                Posting Time
                                            </label>
                                            <input
                                                type="time"
                                                value={postingTime}
                                                onChange={(e) => setPostingTime(e.target.value)}
                                                disabled={!editPostingTime}
                                                className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground disabled:opacity-50 focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground/90">
                                                Due Date (Jatuh Tempo)
                                            </label>
                                            <input
                                                type="date"
                                                value={dueDate}
                                                onChange={(e) => setDueDate(e.target.value)}
                                                className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>
                                    </div>

                                    {/* Right Checkbox Flags (Is Paid, Is Return, Tax Withholding, Edit Posting Time) */}
                                    <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="edit_posting_time"
                                                checked={editPostingTime}
                                                onChange={(e) => setEditPostingTime(e.target.checked)}
                                                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                                            />
                                            <label htmlFor="edit_posting_time" className="text-xs font-medium text-foreground cursor-pointer">
                                                Edit Posting Date and Time
                                            </label>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="is_paid"
                                                checked={isPaid}
                                                onChange={(e) => setIsPaid(e.target.checked)}
                                                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                                            />
                                            <label htmlFor="is_paid" className="text-xs font-medium text-foreground cursor-pointer">
                                                Is Paid (Sudah Dibayar)
                                            </label>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="is_return"
                                                checked={isReturn}
                                                onChange={(e) => setIsReturn(e.target.checked)}
                                                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                                            />
                                            <label htmlFor="is_return" className="text-xs font-medium text-foreground cursor-pointer">
                                                Is Return (Debit Note)
                                            </label>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="tax_withholding"
                                                checked={considerTaxWithholding}
                                                onChange={(e) => setConsiderTaxWithholding(e.target.checked)}
                                                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                                            />
                                            <label htmlFor="tax_withholding" className="text-xs font-medium text-foreground cursor-pointer">
                                                Consider for Tax Withholding
                                            </label>
                                        </div>
                                    </div>

                                    {/* Section 2: Supplier Invoice Info (Collapsible Panel) */}
                                    <div className="border border-border/70 rounded-2xl overflow-hidden bg-card">
                                        <button
                                            type="button"
                                            onClick={() => setSupplierInvoiceExpanded(!supplierInvoiceExpanded)}
                                            className="w-full px-4 py-2.5 bg-muted/30 text-xs font-bold text-foreground flex justify-between items-center border-b border-border/40"
                                        >
                                            <span>Supplier Invoice Info (Faktur Vendor)</span>
                                            {supplierInvoiceExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>
                                        {supplierInvoiceExpanded && (
                                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-muted-foreground">Supplier Invoice No</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Nomor faktur dari supplier..."
                                                        value={supplierInvoiceNo}
                                                        onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                                                        className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-muted-foreground">Supplier Invoice Date</label>
                                                    <input
                                                        type="date"
                                                        value={supplierInvoiceDate}
                                                        onChange={(e) => setSupplierInvoiceDate(e.target.value)}
                                                        className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Section 3: Currency and Price List */}
                                    <div className="border border-border/70 rounded-2xl overflow-hidden bg-card">
                                        <button
                                            type="button"
                                            onClick={() => setCurrencyExpanded(!currencyExpanded)}
                                            className="w-full px-4 py-2.5 bg-muted/30 text-xs font-bold text-foreground flex justify-between items-center border-b border-border/40"
                                        >
                                            <span>Currency and Price List</span>
                                            {currencyExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>
                                        {currencyExpanded && (
                                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-muted-foreground">Currency</label>
                                                    <select
                                                        value={currency}
                                                        onChange={(e) => setCurrency(e.target.value)}
                                                        className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground"
                                                    >
                                                        <option value="IDR">IDR (Rupiah Indonesia)</option>
                                                        <option value="USD">USD (US Dollar)</option>
                                                        <option value="EUR">EUR (Euro)</option>
                                                        <option value="SGD">SGD (Singapore Dollar)</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-muted-foreground">Price List</label>
                                                    <select
                                                        value={priceList}
                                                        onChange={(e) => setPriceList(e.target.value)}
                                                        className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground"
                                                    >
                                                        <option value="Standard Buying">Standard Buying</option>
                                                        <option value="Bulk Wholesale Buying">Bulk Wholesale Buying</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Section 4: Scan Barcode & Stock Options */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                        <div className="space-y-1.5 md:col-span-2">
                                            <label className="text-xs font-semibold text-foreground/90 flex items-center gap-1">
                                                <Barcode size={14} className="text-muted-foreground" /> Scan Barcode
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Scan barcode barang..."
                                                value={scanBarcode}
                                                onChange={(e) => setScanBarcode(e.target.value)}
                                                className="w-full bg-background border border-border/80 rounded-xl px-3.5 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>

                                        <div className="space-y-2 pt-4">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="update_stock"
                                                    checked={updateStock}
                                                    onChange={(e) => setUpdateStock(e.target.checked)}
                                                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                                                />
                                                <label htmlFor="update_stock" className="text-xs font-medium text-foreground cursor-pointer">
                                                    Update Stock (Perbarui Stok Gudang)
                                                </label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="is_subcontracted_inv"
                                                    checked={isSubcontracted}
                                                    onChange={(e) => setIsSubcontracted(e.target.checked)}
                                                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                                                />
                                                <label htmlFor="is_subcontracted_inv" className="text-xs font-medium text-foreground cursor-pointer">
                                                    Is Subcontracted
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 5: Items Child Table */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                                                Items <span className="text-rose-500">*</span>
                                            </h3>
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleAddItemRow}
                                                    className="rounded-xl border-border/80 text-xs px-3 py-1.5"
                                                >
                                                    <Plus size={14} className="mr-1" /> Add row
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="rounded-xl border-border/80 text-xs px-3 py-1.5"
                                                >
                                                    Add multiple
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto border border-border/70 rounded-2xl bg-card shadow-sm">
                                            <table className="w-full text-xs text-left">
                                                <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] font-bold tracking-wider border-b border-border/50">
                                                    <tr>
                                                        <th className="p-3 w-10 text-center">#</th>
                                                        <th className="p-3 font-semibold min-w-[200px]">Item *</th>
                                                        <th className="p-3 font-semibold w-28 text-right">Accepted Qty *</th>
                                                        <th className="p-3 font-semibold w-36 text-right">Rate (IDR) *</th>
                                                        <th className="p-3 font-semibold w-40 text-right">Amount (IDR) *</th>
                                                        <th className="p-3 w-12 text-center">Aksi</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/40 bg-background/50">
                                                    {items.map((row, rIdx) => (
                                                        <tr key={rIdx} className="hover:bg-muted/20 transition-colors">
                                                            <td className="p-3 text-center font-mono text-muted-foreground font-medium">{rIdx + 1}</td>
                                                            <td className="p-2">
                                                                <input
                                                                    type="text"
                                                                    value={row.item_code}
                                                                    onChange={(e) => handleItemChange(rIdx, 'item_code', e.target.value)}
                                                                    placeholder="Kode / nama item..."
                                                                    className="w-full bg-background border border-border/70 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary/20 font-medium"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <input
                                                                    type="number"
                                                                    value={row.accepted_qty}
                                                                    onChange={(e) => handleItemChange(rIdx, 'accepted_qty', parseFloat(e.target.value) || 0)}
                                                                    className="w-full bg-background border border-border/70 rounded-lg px-2.5 py-1.5 text-xs text-foreground text-right focus:ring-1 focus:ring-primary/20 font-bold"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <input
                                                                    type="number"
                                                                    value={row.rate}
                                                                    onChange={(e) => handleItemChange(rIdx, 'rate', parseFloat(e.target.value) || 0)}
                                                                    className="w-full bg-background border border-border/70 rounded-lg px-2.5 py-1.5 text-xs text-foreground text-right focus:ring-1 focus:ring-primary/20"
                                                                />
                                                            </td>
                                                            <td className="p-2 text-right font-bold text-foreground">
                                                                Rp {row.amount.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                                                            </td>
                                                            <td className="p-2 text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveItemRow(rIdx)}
                                                                    className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                                >
                                                                    <Trash2 size={15} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Table Footer Totals */}
                                        <div className="flex flex-wrap justify-between items-center p-3 rounded-xl bg-muted/30 border border-border/40 gap-4">
                                            <div className="text-xs text-muted-foreground font-semibold">
                                                Total Quantity: <span className="text-foreground font-bold">{totalQuantity.toLocaleString('id-ID')}</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground font-semibold">
                                                Total (IDR): <span className="text-foreground text-sm font-bold">Rp {netTotal.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 6: Taxes and Charges */}
                                    <div className="space-y-4 pt-4 border-t border-border/60">
                                        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Taxes and Charges</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground">Tax Category</label>
                                                <select
                                                    value={taxCategory}
                                                    onChange={(e) => setTaxCategory(e.target.value)}
                                                    className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground"
                                                >
                                                    <option value="">Standard Tax</option>
                                                    <option value="Zero Tax">Zero Tax / Bebas PPN</option>
                                                </select>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground">Shipping Rule</label>
                                                <select
                                                    value={shippingRule}
                                                    onChange={(e) => setShippingRule(e.target.value)}
                                                    className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground"
                                                >
                                                    <option value="">Standard Delivery</option>
                                                    <option value="Express Franco">Express Franco</option>
                                                </select>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground">Incoterm</label>
                                                <select
                                                    value={incoterm}
                                                    onChange={(e) => setIncoterm(e.target.value)}
                                                    className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground"
                                                >
                                                    <option value="EXW - Ex Works">EXW - Ex Works</option>
                                                    <option value="FOB - Free on Board">FOB - Free on Board</option>
                                                    <option value="CIF - Cost Insurance Freight">CIF - Cost Insurance Freight</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground/90">
                                                Purchase Taxes and Charges Template
                                            </label>
                                            <select
                                                value={taxTemplate}
                                                onChange={(e) => setTaxTemplate(e.target.value)}
                                                className="w-full bg-background border border-border/80 rounded-xl px-3.5 py-2 text-xs text-foreground"
                                            >
                                                <option value="PPN Masukan 11%">PPN Masukan 11%</option>
                                                <option value="PPh 23 2%">PPh Pasal 23 (2%)</option>
                                                <option value="Non Pajak">Non Pajak</option>
                                            </select>
                                        </div>

                                        {/* Grand Totals Summary Card */}
                                        <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2 text-xs">
                                            <div className="flex justify-between text-muted-foreground">
                                                <span>Net Total (IDR):</span>
                                                <span className="font-semibold text-foreground">Rp {netTotal.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between text-muted-foreground">
                                                <span>Total Taxes & Charges (11%):</span>
                                                <span className="font-semibold text-emerald-500">Rp {totalTaxes.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between border-t border-border/50 pt-2 text-sm font-bold text-foreground">
                                                <span>Grand Total (IDR):</span>
                                                <span className="text-primary text-base">Rp {grandTotal.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: PAYMENTS */}
                            {activeTab === 'payments' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground">Mode of Payment</label>
                                            <select
                                                value={modeOfPayment}
                                                onChange={(e) => setModeOfPayment(e.target.value)}
                                                className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground"
                                            >
                                                <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                                                <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                                                <option value="Kas Tunai">Kas Tunai</option>
                                                <option value="Cek / Giro">Cek / Giro</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground">Paid Amount (IDR)</label>
                                            <input
                                                type="number"
                                                value={paidAmount}
                                                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                                                className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: ADDRESS & CONTACT */}
                            {activeTab === 'address' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground">Supplier Address</label>
                                            <textarea
                                                rows={3}
                                                placeholder="Alamat resmi supplier..."
                                                defaultValue="Jl. Industri Raya No. 45, Kawasan Industri Rungkut, Surabaya"
                                                className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground">Contact Person</label>
                                            <input
                                                type="text"
                                                defaultValue="Bpk. Hendra (Sales Manager - 08123456789)"
                                                className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground">Shipping Address</label>
                                            <textarea
                                                rows={3}
                                                defaultValue="Gudang Utama SJS Group - Jl. Daan Mogot KM 12, Jakarta Barat"
                                                className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground">Billing Address</label>
                                            <textarea
                                                rows={3}
                                                defaultValue="Head Office SJS Group - Gedung Menara Kuningan Lt. 15, Jakarta Selatan"
                                                className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 4: TERMS */}
                            {activeTab === 'terms' && (
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">Payment Terms Template</label>
                                        <select
                                            value={paymentTerms}
                                            onChange={(e) => setPaymentTerms(e.target.value)}
                                            className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground"
                                        >
                                            <option value="Cash">Cash on Delivery (COD)</option>
                                            <option value="Net 15">Net 15 Hari</option>
                                            <option value="Net 30">Net 30 Hari</option>
                                            <option value="Net 60">Net 60 Hari</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">Terms and Conditions</label>
                                        <textarea
                                            rows={6}
                                            value={termsText}
                                            onChange={(e) => setTermsText(e.target.value)}
                                            className="w-full bg-background border border-border/80 rounded-xl px-3.5 py-2.5 text-xs text-foreground font-mono"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* TAB 5: MORE INFO */}
                            {activeTab === 'more' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground">Tipe Anggaran (Budget Type)</label>
                                            <select
                                                value={budgetType}
                                                onChange={(e) => setBudgetType(e.target.value)}
                                                className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground"
                                            >
                                                <option value="OPEX">OPEX (Operasional)</option>
                                                <option value="CAPEX">CAPEX (Modal & Investasi Aset)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">Catatan / Remarks</label>
                                        <textarea
                                            rows={4}
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            placeholder="Catatan internal faktur tagihan..."
                                            className="w-full bg-background border border-border/80 rounded-xl px-3.5 py-2.5 text-xs text-foreground"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Modal Bottom Actions (Matching Image 1 Left Top Save Button) */}
                            <div className="flex justify-end items-center gap-3 pt-4 border-t border-border/60">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsModalOpen(false)}
                                    className="rounded-xl border-border/80 font-medium px-4 py-2 text-xs text-muted-foreground hover:text-foreground"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="rounded-xl font-bold px-6 py-2.5 text-xs shadow-md bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
                                >
                                    <Save size={16} />
                                    {createMutation.isPending ? 'Menyimpan...' : 'Save & Submit Tagihan'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

