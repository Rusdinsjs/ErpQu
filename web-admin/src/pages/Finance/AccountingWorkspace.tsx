import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Wallet, ArrowUpRight, BarChart2, DollarSign
} from 'lucide-react';

interface SubmenuLink {
    label: string;
    route: string;
}

interface SectionCard {
    title: string;
    links: SubmenuLink[];
}

export default function AccountingWorkspace() {
    const navigate = useNavigate();

    // Top KPIs
    const kpis = [
        { label: 'Total Cash & Bank Balance', value: 'Rp 0,00', change: 'Saldo kas & rekening utama', icon: Wallet },
        { label: 'Accounts Receivable (AR)', value: 'Rp 0,00', change: 'Total piutang pelanggan', icon: DollarSign },
        { label: 'Accounts Payable (AP)', value: 'Rp 0,00', change: 'Total hutang ke supplier', icon: BarChart2 },
    ];

    // 6 ERPNext Accounting Section Cards
    const sections: SectionCard[] = [
        {
            title: 'General Ledger & Entries',
            links: [
                { label: 'Chart of Accounts', route: '/finance' },
                { label: 'Journal Entry', route: '/accounting/journal-entries' },
                { label: 'Payment Entry', route: '/accounting/payment-entries' },
                { label: 'Payment Reconciliation', route: '/accounting/payment-reconciliation' },
            ]
        },
        {
            title: 'Accounts Receivable',
            links: [
                { label: 'Sales Invoice', route: '/finance/invoices' },
                { label: 'Credit Note', route: '/accounting/credit-notes' },
                { label: 'Dunning (Surat Tagihan)', route: '/accounting/dunnings' },
                { label: 'AR Aging Report', route: '/accounting/reports/ar-aging' },
            ]
        },
        {
            title: 'Accounts Payable',
            links: [
                { label: 'Purchase Invoice (Vendor Bills)', route: '/finance/bills' },
                { label: 'Debit Note', route: '/accounting/debit-notes' },
                { label: 'AP Aging Report', route: '/accounting/reports/ap-aging' },
            ]
        },
        {
            title: 'Cash & Bank Operations',
            links: [
                { label: 'Bank Account', route: '/accounting/bank-accounts' },
                { label: 'Bank Transaction', route: '/accounting/bank-transactions' },
                { label: 'Bank Clearance', route: '/accounting/bank-clearance' },
                { label: 'Cashier Closing Entry', route: '/accounting/cashier-closing' },
            ]
        },
        {
            title: 'Cost Centers & Taxes',
            links: [
                { label: 'Cost Center', route: '/accounting/cost-centers' },
                { label: 'Accounting Dimension', route: '/accounting/dimensions' },
                { label: 'Budget', route: '/accounting/budgets' },
                { label: 'Sales Tax Template', route: '/accounting/sales-tax-templates' },
                { label: 'Purchase Tax Template', route: '/accounting/purchase-tax-templates' },
                { label: 'Tax Category & Rules', route: '/accounting/tax-rules' },
            ]
        },
        {
            title: 'Financial Statements & Reports',
            links: [
                { label: 'Balance Sheet (Neraca)', route: '/accounting/reports/balance-sheet' },
                { label: 'Profit and Loss Statement (Laba Rugi)', route: '/accounting/reports/profit-loss' },
                { label: 'Cash Flow Statement (Arus Kas)', route: '/accounting/reports/cash-flow' },
                { label: 'Trial Balance (Neraca Saldo)', route: '/accounting/reports/trial-balance' },
                { label: 'General Ledger Report', route: '/accounting/reports/general-ledger' },
            ]
        }
    ];

    return (
        <div className="p-6 space-y-8 bg-background min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Accounting Workspace</h1>
                    <p className="text-sm text-muted-foreground">Kelola pembukuan, buku besar, piutang/hutang, kas & bank, serta laporan keuangan akuntansi</p>
                </div>
            </div>

            {/* Top KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {kpis.map((kpi, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">{kpi.label}</span>
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                <kpi.icon size={20} />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h2 className="text-2xl font-bold text-foreground">{kpi.value}</h2>
                            <p className="text-xs text-muted-foreground mt-1">{kpi.change}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Reports & Masters Header */}
            <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Accounting Modules & Financial Statements</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sections.map((sec, secIdx) => (
                        <div key={secIdx} className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm hover:border-emerald-500/40 transition-colors">
                            <h3 className="text-base font-semibold text-foreground mb-4 border-b border-border/40 pb-2 flex items-center justify-between">
                                {sec.title}
                            </h3>
                            <ul className="space-y-2.5">
                                {sec.links.map((link, linkIdx) => (
                                    <li key={linkIdx}>
                                        <button
                                            onClick={() => navigate(link.route)}
                                            className="w-full text-left flex items-center justify-between group py-1 px-2 rounded-lg hover:bg-muted/60 transition-colors"
                                        >
                                            <span className="text-sm text-foreground/80 group-hover:text-emerald-500 transition-colors flex items-center gap-1.5">
                                                {link.label}
                                            </span>
                                            <ArrowUpRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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
