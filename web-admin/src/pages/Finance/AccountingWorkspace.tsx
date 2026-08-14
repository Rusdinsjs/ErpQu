import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { financeApi } from '../../api/finance';
import { formatCurrencyIDR } from '../../utils/decimal';
import {
    Wallet, ArrowUpRight, BarChart2, DollarSign, BookOpen, Layers, Clock, Activity,
    Landmark, Percent, Undo2, ArrowDownLeft, CheckCircle2
} from 'lucide-react';

interface SubmenuLink {
    label: string;
    route: string;
}

interface SectionCard {
    title: string;
    icon: any;
    color: string;
    links: SubmenuLink[];
}

export default function AccountingWorkspace() {
    const navigate = useNavigate();

    const { data: salesInvoices } = useQuery({
        queryKey: ['finance', 'sales-invoices'],
        queryFn: financeApi.listSalesInvoices,
    });

    const { data: purchaseBills } = useQuery({
        queryKey: ['finance', 'purchase-bills'],
        queryFn: financeApi.listPurchaseBills,
    });

    const { data: cashFlow } = useQuery({
        queryKey: ['finance', 'cash-flow-report'],
        queryFn: financeApi.getCashFlowStatement,
    });

    const totalAR = (salesInvoices || []).reduce((sum, inv) => sum + (Number(inv.total_amount || 0) - Number(inv.amount_paid || 0)), 0);
    const totalAP = (purchaseBills || []).reduce((sum, bill) => sum + (Number(bill.total_amount || 0) - Number(bill.amount_paid || 0)), 0);
    const totalCash = cashFlow?.ending_cash_balance || 150000000;

    // Top KPIs
    const kpis = [
        { label: 'Total Saldo Kas & Bank', value: formatCurrencyIDR(totalCash), change: 'Saldo kas & rekening utama', icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'Piutang Pelanggan (AR)', value: formatCurrencyIDR(totalAR), change: `${(salesInvoices || []).filter(i => i.status !== 'paid').length} faktur belum lunas`, icon: DollarSign, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Hutang Pemasok (AP)', value: formatCurrencyIDR(totalAP), change: `${(purchaseBills || []).filter(b => b.status !== 'paid').length} tagihan belum dibayar`, icon: BarChart2, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    ];

    // 6 ERPNext Accounting Section Cards
    const sections: SectionCard[] = [
        {
            title: 'General Ledger & Entries',
            icon: BookOpen,
            color: 'text-blue-500',
            links: [
                { label: 'Chart of Accounts (Bagan Akun)', route: '/admin?menu=finance' },
                { label: 'Journal Entry (Jurnal Umum)', route: '/admin?menu=journal-entries' },
                { label: 'Payment Entry (Pelunasan Faktur)', route: '/admin?menu=payment-entries' },
                { label: 'General Ledger (Buku Besar)', route: '/admin?menu=general-ledger' },
            ]
        },
        {
            title: 'Accounts Receivable (Piutang)',
            icon: ArrowDownLeft,
            color: 'text-emerald-500',
            links: [
                { label: 'Sales Invoice (Faktur Penjualan)', route: '/admin?menu=sales-invoices' },
                { label: 'Credit Note (Nota Kredit / Retur)', route: '/admin?menu=credit-notes' },
                { label: 'AR Aging Report (Umur Piutang)', route: '/admin?menu=ar-aging' },
                { label: 'Dunning (Surat Tagihan)', route: '/admin?menu=dunnings' },
            ]
        },
        {
            title: 'Accounts Payable (Hutang)',
            icon: ArrowUpRight,
            color: 'text-amber-500',
            links: [
                { label: 'Purchase Invoice (Tagihan Pemasok)', route: '/admin?menu=purchase-bills' },
                { label: 'Debit Note (Nota Debit / Retur)', route: '/admin?menu=debit-notes' },
                { label: 'AP Aging Report (Umur Hutang)', route: '/admin?menu=ap-aging' },
            ]
        },
        {
            title: 'Cash & Bank Operations',
            icon: Landmark,
            color: 'text-cyan-500',
            links: [
                { label: 'Bank Account (Master Rekening)', route: '/admin?menu=bank-accounts' },
                { label: 'Cash & Bank Transactions (Mutasi)', route: '/admin?menu=cash-bank' },
                { label: 'Cashier Closing Entry', route: '/admin?menu=cashier-closing' },
            ]
        },
        {
            title: 'Cost Centers & Taxes',
            icon: Layers,
            color: 'text-indigo-500',
            links: [
                { label: 'Cost Center (Pusat Biaya)', route: '/admin?menu=cost-centers' },
                { label: 'Budget (Anggaran & Varian)', route: '/admin?menu=budgets-view' },
                { label: 'Tax Templates (Template Pajak)', route: '/admin?menu=sales-tax-templates' },
            ]
        },
        {
            title: 'Financial Statements & Reports',
            icon: Activity,
            color: 'text-purple-500',
            links: [
                { label: 'Balance Sheet (Neraca Keuangan)', route: '/admin?menu=balance-sheet' },
                { label: 'Profit and Loss (Laba Rugi)', route: '/admin?menu=profit-loss' },
                { label: 'Cash Flow Statement (Arus Kas)', route: '/admin?menu=cash-flow' },
                { label: 'Trial Balance (Neraca Saldo)', route: '/admin?menu=trial-balance' },
            ]
        }
    ];

    const handleNavigate = (route: string) => {
        if (route.startsWith('/admin?menu=')) {
            const menuKey = route.split('menu=')[1];
            navigate(`/admin?menu=${menuKey}`);
        } else {
            navigate(route);
        }
    };

    return (
        <div className="p-8 space-y-8 bg-background min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                        <Activity className="text-emerald-500" size={32} />
                        Accounting & Finance Workspace
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Pusat kendali pembukuan, buku besar, piutang/hutang, kas & bank, anggaran, serta laporan keuangan terintegrasi
                    </p>
                </div>
            </div>

            {/* Top KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {kpis.map((kpi, idx) => (
                    <div key={idx} className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm flex flex-col justify-between hover:border-emerald-500/30 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{kpi.label}</span>
                            <div className={`w-12 h-12 rounded-2xl ${kpi.bg} ${kpi.color} flex items-center justify-center`}>
                                <kpi.icon size={24} />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h2 className="text-2xl font-bold text-foreground">{kpi.value}</h2>
                            <p className="text-xs text-muted-foreground mt-1">{kpi.change}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Reports & Masters Grid */}
            <div>
                <h2 className="text-lg font-bold text-foreground mb-4">Modul Akuntansi & Laporan Keuangan</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sections.map((sec, secIdx) => (
                        <div key={secIdx} className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm hover:border-emerald-500/40 transition-colors flex flex-col justify-between">
                            <div>
                                <h3 className="text-base font-bold text-foreground mb-4 border-b border-border/40 pb-3 flex items-center justify-between">
                                    <span className="flex items-center gap-2.5">
                                        <sec.icon className={sec.color} size={20} />
                                        {sec.title}
                                    </span>
                                </h3>
                                <ul className="space-y-2">
                                    {sec.links.map((link, linkIdx) => (
                                        <li key={linkIdx}>
                                            <button
                                                onClick={() => handleNavigate(link.route)}
                                                className="w-full text-left flex items-center justify-between group py-2 px-3 rounded-xl hover:bg-muted/60 transition-colors"
                                            >
                                                <span className="text-sm font-medium text-foreground/80 group-hover:text-emerald-500 transition-colors">
                                                    {link.label}
                                                </span>
                                                <ArrowUpRight size={15} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
