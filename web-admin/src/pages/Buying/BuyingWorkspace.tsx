import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShoppingCart, DollarSign, TrendingUp, ArrowUpRight
} from 'lucide-react';

interface SubmenuLink {
    label: string;
    route: string;
}

interface SectionCard {
    title: string;
    links: SubmenuLink[];
}

export default function BuyingWorkspace() {
    const navigate = useNavigate();

    // Top KPIs
    const kpis = [
        { label: 'Purchase Orders', value: '0', change: '0% vs last month', icon: ShoppingCart },
        { label: 'Total Purchase Amount', value: 'Rp 0,00', change: 'Rp 0,00 total expenditure', icon: DollarSign },
        { label: 'Average Order Value', value: 'Rp 0,00', change: 'Based on completed PO', icon: TrendingUp },
    ];

    // 8 ERPNext Buying Section Cards
    const sections: SectionCard[] = [
        {
            title: 'Buying',
            links: [
                { label: 'Material Request', route: '/buying/material-requests' },
                { label: 'Purchase Order', route: '/buying/purchase-orders' },
                { label: 'Purchase Invoice', route: '/buying/purchase-bills' },
                { label: 'Request for Quotation', route: '/buying/rfqs' },
                { label: 'Supplier Quotation', route: '/buying/supplier-quotations' },
            ]
        },
        {
            title: 'Items & Pricing',
            links: [
                { label: 'Item', route: '/inventory-items' },
                { label: 'Item Price', route: '/buying/item-prices' },
                { label: 'Price List', route: '/buying/price-lists' },
                { label: 'Product Bundle', route: '/buying/product-bundles' },
                { label: 'Item Group', route: '/inventory-categories' },
                { label: 'Promotional Scheme', route: '/buying/promotional-schemes' },
                { label: 'Pricing Rule', route: '/buying/pricing-rules' },
            ]
        },
        {
            title: 'Settings',
            links: [
                { label: 'Buying Settings', route: '/buying/settings' },
                { label: 'Purchase Taxes and Charges Template', route: '/buying/tax-templates' },
                { label: 'Terms and Conditions Template', route: '/buying/terms-templates' },
            ]
        },
        {
            title: 'Supplier',
            links: [
                { label: 'Supplier', route: '/buying/suppliers' },
                { label: 'Supplier Group', route: '/buying/supplier-groups' },
                { label: 'Contact', route: '/buying/supplier-contacts' },
                { label: 'Address', route: '/buying/supplier-addresses' },
            ]
        },
        {
            title: 'Supplier Scorecard',
            links: [
                { label: 'Supplier Scorecard', route: '/buying/supplier-scorecards' },
                { label: 'Supplier Scorecard Variable', route: '/buying/scorecard-variables' },
                { label: 'Supplier Scorecard Criteria', route: '/buying/scorecard-criteria' },
                { label: 'Supplier Scorecard Standing', route: '/buying/scorecard-standings' },
            ]
        },
        {
            title: 'Key Reports',
            links: [
                { label: 'Purchase Analytics', route: '/buying/reports/purchase-analytics' },
                { label: 'Purchase Order Analysis', route: '/buying/reports/po-analysis' },
                { label: 'Item Wise Consumption', route: '/buying/reports/item-consumption' },
                { label: 'Items to Order and Receive', route: '/buying/reports/items-to-order-receive' },
                { label: 'Purchase Order Trends', route: '/buying/reports/po-trends' },
                { label: 'Procurement Tracker', route: '/buying/reports/procurement-tracker' },
            ]
        },
        {
            title: 'Other Reports',
            links: [
                { label: 'Items To Be Requested', route: '/buying/reports/items-to-request' },
                { label: 'Item-wise Purchase History', route: '/buying/reports/item-purchase-history' },
                { label: 'Purchase Receipt Trends', route: '/buying/reports/receipt-trends' },
                { label: 'Purchase Invoice Trends', route: '/buying/reports/invoice-trends' },
                { label: 'Subcontracted Raw Materials To Be Transferred', route: '/buying/reports/subcontract-materials' },
                { label: 'Subcontracted Item To Be Received', route: '/buying/reports/subcontract-received' },
                { label: 'Supplier Quotation Comparison', route: '/buying/reports/rfq-comparison' },
                { label: 'Material Requests for which Supplier Quotation Created', route: '/buying/reports/pr-to-rfq' },
                { label: 'Supplier Addresses And Contacts', route: '/buying/reports/supplier-directory' },
            ]
        },
        {
            title: 'Regional',
            links: [
                { label: 'Import Supplier Invoice', route: '/buying/reports/import-invoice' },
            ]
        }
    ];

    return (
        <div className="p-6 space-y-8 bg-background min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Buying Workspace</h1>
                    <p className="text-sm text-muted-foreground">Kelola pengadaan barang, supplier, RFQ, PO, dan laporan analisis pembelian</p>
                </div>
            </div>

            {/* Top KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {kpis.map((kpi, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">{kpi.label}</span>
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
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
                <h2 className="text-lg font-semibold text-foreground mb-4">Reports & Masters</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sections.map((sec, secIdx) => (
                        <div key={secIdx} className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm hover:border-primary/40 transition-colors">
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
                                            <span className="text-sm text-foreground/80 group-hover:text-primary transition-colors flex items-center gap-1.5">
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
