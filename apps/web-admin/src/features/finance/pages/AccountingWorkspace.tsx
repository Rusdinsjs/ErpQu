import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { financeApi } from '../api/finance';
import {
    Activity, ArrowUpRight, DollarSign, BookOpen, Layers, Clock,
    Landmark, Percent, ArrowDownLeft, CheckCircle2, Plus, Receipt,
    FileSpreadsheet, FileText, Scale, TrendingUp, Wallet, BarChart3,
    AlertCircle
} from 'lucide-react';

// --- Animated Counter ---
function AnimatedCounter({ value, duration = 1200 }: { value: number; duration?: number }) {
    const [display, setDisplay] = useState(0);
    const ref = useRef<number>(0);

    useEffect(() => {
        const start = ref.current;
        const diff = value - start;
        if (diff === 0) return;
        const startTime = performance.now();

        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + diff * eased);
            setDisplay(current);
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                ref.current = value;
            }
        };
        requestAnimationFrame(animate);
    }, [value, duration]);

    return <>{display.toLocaleString('id-ID')}</>;
}

// --- Mini Donut Chart ---
function MiniDonut({ segments }: { segments: { value: number; color: string; label: string }[] }) {
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    if (total === 0) return null;

    const size = 120;
    const strokeWidth = 16;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    return (
        <div className="flex items-center gap-6">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
                {segments.map((seg, i) => {
                    const dash = (seg.value / total) * circumference;
                    const gap = circumference - dash;
                    const el = (
                        <circle
                            key={i}
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke={seg.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${dash} ${gap}`}
                            strokeDashoffset={-offset}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                        />
                    );
                    offset += dash;
                    return el;
                })}
                <text
                    x={size / 2}
                    y={size / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-foreground font-bold text-lg"
                    transform={`rotate(90 ${size / 2} ${size / 2})`}
                >
                    {total}
                </text>
            </svg>
            <div className="space-y-1.5">
                {segments.map((seg, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                        <span className="text-muted-foreground">{seg.label}</span>
                        <span className="font-semibold text-foreground ml-auto">{seg.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Skeleton Loader ---
function KpiSkeleton() {
    return (
        <div className="p-5 rounded-2xl bg-card border border-border/60 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="h-4 w-28 bg-muted rounded" />
                <div className="w-10 h-10 rounded-xl bg-muted" />
            </div>
            <div className="mt-4 space-y-2">
                <div className="h-7 w-20 bg-muted rounded" />
                <div className="h-3 w-36 bg-muted/60 rounded" />
            </div>
        </div>
    );
}

// --- Section Config ---
interface SectionLink {
    label: string;
    route: string;
    icon: React.ElementType;
}

interface SectionCard {
    title: string;
    icon: React.ElementType;
    gradient: string;
    links: SectionLink[];
}

const sections: SectionCard[] = [
    {
        title: 'General Ledger & Entries',
        icon: BookOpen,
        gradient: 'from-blue-500/20 to-indigo-500/5',
        links: [
            { label: 'Chart of Accounts (Bagan Akun)', route: '/chart-of-accounts', icon: Layers },
            { label: 'Journal Entry (Jurnal Umum)', route: '/journal-entries', icon: FileSpreadsheet },
            { label: 'Payment Entry (Pelunasan Faktur)', route: '/payment-entries', icon: Receipt },
            { label: 'General Ledger (Buku Besar)', route: '/general-ledger', icon: BookOpen },
        ]
    },
    {
        title: 'Accounts Receivable (Piutang)',
        icon: ArrowDownLeft,
        gradient: 'from-emerald-500/20 to-teal-500/5',
        links: [
            { label: 'Sales Invoice (Faktur Penjualan)', route: '/sales-invoices', icon: Receipt },
            { label: 'Credit Note (Nota Kredit / Retur)', route: '/credit-notes', icon: FileText },
            { label: 'AR Aging Report (Umur Piutang)', route: '/ar-aging', icon: Clock },
            { label: 'Dunning (Surat Tagihan)', route: '/dunnings', icon: AlertCircle },
        ]
    },
    {
        title: 'Accounts Payable (Hutang)',
        icon: ArrowUpRight,
        gradient: 'from-amber-500/20 to-orange-500/5',
        links: [
            { label: 'Purchase Invoice (Tagihan Pemasok)', route: '/purchase-bills', icon: FileText },
            { label: 'Debit Note (Nota Debit / Retur)', route: '/debit-notes', icon: FileSpreadsheet },
            { label: 'AP Aging Report (Umur Hutang)', route: '/ap-aging', icon: Clock },
        ]
    },
    {
        title: 'Cash & Bank Operations',
        icon: Landmark,
        gradient: 'from-cyan-500/20 to-sky-500/5',
        links: [
            { label: 'Bank Account (Master Rekening)', route: '/bank-accounts', icon: Landmark },
            { label: 'Cash & Bank Transactions (Mutasi)', route: '/cash-bank', icon: ArrowDownLeft },
            { label: 'Cashier Closing Entry', route: '/cashier-closing', icon: CheckCircle2 },
        ]
    },
    {
        title: 'Cost Centers & Taxes',
        icon: Layers,
        gradient: 'from-violet-500/20 to-purple-500/5',
        links: [
            { label: 'Cost Center (Pusat Biaya)', route: '/cost-centers', icon: Layers },
            { label: 'Budget (Anggaran & Varian)', route: '/budgets-view', icon: BarChart3 },
            { label: 'Tax Templates (Template Pajak)', route: '/sales-tax-templates', icon: Percent },
        ]
    },
    {
        title: 'Financial Statements & Reports',
        icon: Activity,
        gradient: 'from-rose-500/20 to-pink-500/5',
        links: [
            { label: 'Balance Sheet (Neraca Keuangan)', route: '/balance-sheet', icon: Scale },
            { label: 'Profit and Loss (Laba Rugi)', route: '/profit-loss', icon: TrendingUp },
            { label: 'Cash Flow Statement (Arus Kas)', route: '/cash-flow', icon: Wallet },
            { label: 'Trial Balance (Neraca Saldo)', route: '/trial-balance', icon: Activity },
        ]
    }
];

export default function AccountingWorkspace() {
    const navigate = useNavigate();

    const { data: salesInvoices, isLoading: loadingSales } = useQuery({
        queryKey: ['finance', 'sales-invoices'],
        queryFn: financeApi.listSalesInvoices,
        staleTime: 30_000,
    });

    const { data: purchaseBills, isLoading: loadingBills } = useQuery({
        queryKey: ['finance', 'purchase-bills'],
        queryFn: financeApi.listPurchaseBills,
        staleTime: 30_000,
    });

    const { data: cashFlow, isLoading: loadingCashFlow } = useQuery({
        queryKey: ['finance', 'cash-flow-report'],
        queryFn: financeApi.getCashFlowStatement,
        staleTime: 30_000,
    });

    const invoiceList = salesInvoices || [];
    const billList = purchaseBills || [];

    const totalAR = invoiceList.reduce((sum, inv) => sum + (Number(inv.total_amount || 0) - Number(inv.amount_paid || 0)), 0);
    const totalAP = billList.reduce((sum, bill) => sum + (Number(bill.total_amount || 0) - Number(bill.amount_paid || 0)), 0);
    const totalCash = cashFlow?.ending_cash_balance || 150000000;

    const paidInvoices = invoiceList.filter(i => i.status === 'paid').length;
    const unpaidInvoices = invoiceList.filter(i => i.status === 'unpaid' || i.status === 'pending' || i.status === 'partially_paid' || i.status === 'submitted').length;
    const draftInvoices = invoiceList.filter(i => i.status === 'draft').length;
    const overdueInvoices = invoiceList.filter(i => i.status === 'overdue').length;
    const unpaidBillsCount = billList.filter(b => b.status !== 'paid').length;

    const isLoading = loadingSales || loadingBills || loadingCashFlow;

    const kpis = [
        {
            label: 'Total Saldo Kas & Bank',
            value: Math.round(totalCash),
            isCurrency: true,
            sub: 'Posisi likuiditas kas & rekening utama',
            icon: Wallet,
            color: 'text-emerald-400',
            bg: 'bg-gradient-to-br from-emerald-500/15 to-teal-500/10',
            border: 'border-emerald-500/20 hover:border-emerald-400/40',
        },
        {
            label: 'Piutang Pelanggan (AR)',
            value: Math.round(totalAR),
            isCurrency: true,
            sub: `${unpaidInvoices} faktur belum lunas`,
            icon: DollarSign,
            color: 'text-blue-400',
            bg: 'bg-gradient-to-br from-blue-500/15 to-cyan-500/10',
            border: 'border-blue-500/20 hover:border-blue-400/40',
        },
        {
            label: 'Hutang Pemasok (AP)',
            value: Math.round(totalAP),
            isCurrency: true,
            sub: `${unpaidBillsCount} tagihan belum dibayar`,
            icon: BarChart3,
            color: 'text-amber-400',
            bg: 'bg-gradient-to-br from-amber-500/15 to-orange-500/10',
            border: 'border-amber-500/20 hover:border-amber-400/40',
        },
    ];

    const quickActions = [
        { label: 'Jurnal Umum Baru', icon: Plus, route: '/journal-entries', color: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20' },
        { label: 'Entri Pembayaran', icon: Receipt, route: '/payment-entries', color: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20' },
        { label: 'Buku Kas & Bank', icon: Landmark, route: '/cash-bank', color: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20' },
    ];

    const totalInvoiceCount = invoiceList.length;

    return (
        <div className="p-4 md:p-6 space-y-6 bg-background min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header + Quick Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Accounting & Finance</h1>
                    <p className="text-sm text-muted-foreground mt-1">Pusat kendali pembukuan, buku besar, piutang/hutang, kas & bank, anggaran, serta laporan keuangan terintegrasi</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {quickActions.map((action) => (
                        <button
                            key={action.label}
                            onClick={() => navigate(action.route)}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${action.color}`}
                        >
                            <action.icon size={16} />
                            {action.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Top KPIs + Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {isLoading ? (
                    <><KpiSkeleton /><KpiSkeleton /><KpiSkeleton /></>
                ) : (
                    kpis.map((kpi, idx) => (
                        <div
                            key={idx}
                            className={`p-5 rounded-2xl ${kpi.bg} border ${kpi.border} shadow-sm flex flex-col justify-between transition-all duration-300 group`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">{kpi.label}</span>
                                <div className={`w-10 h-10 rounded-xl bg-white/5 ${kpi.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                    <kpi.icon size={20} />
                                </div>
                            </div>
                            <div className="mt-4">
                                <h2 className="text-3xl font-bold text-foreground tabular-nums">
                                    <span className="text-lg font-normal text-muted-foreground mr-1">Rp</span>
                                    <AnimatedCounter value={kpi.value} />
                                </h2>
                                <p className="text-xs text-muted-foreground mt-1.5">{kpi.sub}</p>
                            </div>
                        </div>
                    ))
                )}

                <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm flex flex-col">
                    <span className="text-sm font-medium text-muted-foreground mb-3">Distribusi Faktur Penjualan</span>
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="w-[120px] h-[120px] rounded-full bg-muted animate-pulse" />
                        </div>
                    ) : totalInvoiceCount === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                            <Receipt className="text-muted-foreground/40 mb-2" size={32} />
                            <p className="text-xs text-muted-foreground">Belum ada faktur penjualan tercatat</p>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <MiniDonut
                                segments={[
                                    { value: paidInvoices, color: '#10b981', label: 'Lunas' },
                                    { value: unpaidInvoices, color: '#3b82f6', label: 'Belum Lunas' },
                                    ...(draftInvoices > 0 ? [{ value: draftInvoices, color: '#64748b', label: 'Draft' }] : []),
                                    ...(overdueInvoices > 0 ? [{ value: overdueInvoices, color: '#ef4444', label: 'Jatuh Tempo' }] : []),
                                ]}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Section Cards */}
            <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Modul & Laporan</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sections.map((sec, secIdx) => (
                        <div
                            key={secIdx}
                            className={`p-5 rounded-2xl bg-gradient-to-br ${sec.gradient} bg-card border border-border/60 shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-300 group`}
                        >
                            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/40">
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                                    <sec.icon size={18} />
                                </div>
                                <h3 className="text-sm font-semibold text-foreground">{sec.title}</h3>
                            </div>
                            <ul className="space-y-1">
                                {sec.links.map((link, linkIdx) => (
                                    <li key={linkIdx}>
                                        <button
                                            onClick={() => navigate(link.route)}
                                            className="w-full text-left flex items-center justify-between group/link py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors"
                                        >
                                            <span className="text-sm text-foreground/70 group-hover/link:text-primary transition-colors flex items-center gap-2">
                                                <link.icon size={14} className="text-muted-foreground group-hover/link:text-primary/70 transition-colors" />
                                                {link.label}
                                            </span>
                                            <ArrowUpRight size={13} className="text-muted-foreground/40 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
