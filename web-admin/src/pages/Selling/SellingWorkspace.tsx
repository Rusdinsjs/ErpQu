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

export default function SellingWorkspace() {
    const navigate = useNavigate();

    // Top KPIs
    const kpis = [
        { label: 'Sales Orders', value: '0', change: '0% vs last month', icon: ShoppingCart },
        { label: 'Total Sales Amount', value: 'Rp 0,00', change: 'Rp 0,00 total revenue', icon: DollarSign },
        { label: 'Average Order Value', value: 'Rp 0,00', change: 'Based on completed SO', icon: TrendingUp },
    ];

    // 6 ERPNext Section Cards
    const sections: SectionCard[] = [
        {
            title: 'Selling',
            links: [
                { label: 'Customer', route: '/selling/customers' },
                { label: 'Quotation', route: '/selling/quotations' },
                { label: 'Sales Order', route: '/selling/sales-orders' },
                { label: 'Sales Invoice', route: '/selling/sales-invoices' },
                { label: 'Blanket Order', route: '/selling/blanket-orders' },
                { label: 'Sales Partner', route: '/selling/sales-partners' },
                { label: 'Sales Person', route: '/selling/sales-persons' },
            ]
        },
        {
            title: 'Point of Sale',
            links: [
                { label: 'Point-of-Sale Profile', route: '/selling/pos-profiles' },
                { label: 'POS Settings', route: '/selling/pos-settings' },
                { label: 'POS Opening Entry', route: '/selling/pos-opening' },
                { label: 'POS Closing Entry', route: '/selling/pos-closing' },
                { label: 'Loyalty Program', route: '/selling/loyalty-programs' },
                { label: 'Loyalty Point Entry', route: '/selling/loyalty-points' },
            ]
        },
        {
            title: 'Items and Pricing',
            links: [
                { label: 'Item', route: '/inventory-items' }, // Master Item (Same as Inventory Item)
                { label: 'Item Price', route: '/selling/item-prices' },
                { label: 'Price List', route: '/selling/price-lists' },
                { label: 'Item Group', route: '/inventory-categories' },
                { label: 'Product Bundle', route: '/selling/product-bundles' },
                { label: 'Promotional Scheme', route: '/selling/promotional-schemes' },
                { label: 'Pricing Rule', route: '/selling/pricing-rules' },
                { label: 'Shipping Rule', route: '/selling/shipping-rules' },
                { label: 'Coupon Code', route: '/selling/coupon-codes' },
            ]
        },
        {
            title: 'Settings',
            links: [
                { label: 'Selling Settings', route: '/selling/settings' },
                { label: 'Terms and Conditions Template', route: '/selling/terms-templates' },
                { label: 'Sales Taxes and Charges Template', route: '/selling/tax-templates' },
                { label: 'UTM Source', route: '/selling/utm-sources' },
                { label: 'Customer Group', route: '/selling/customer-groups' },
                { label: 'Contact', route: '/selling/contacts' },
                { label: 'Address', route: '/selling/addresses' },
                { label: 'Territory', route: '/selling/territories' },
                { label: 'Campaign', route: '/selling/campaigns' },
            ]
        },
        {
            title: 'Key Reports',
            links: [
                { label: 'Sales Analytics', route: '/selling/reports/sales-analytics' },
                { label: 'Sales Order Analysis', route: '/selling/reports/so-analysis' },
                { label: 'Sales Funnel', route: '/selling/reports/sales-funnel' },
                { label: 'Sales Order Trends', route: '/selling/reports/so-trends' },
                { label: 'Quotation Trends', route: '/selling/reports/quotation-trends' },
                { label: 'Customer Acquisition and Loyalty', route: '/selling/reports/customer-acquisition' },
                { label: 'Inactive Customers', route: '/selling/reports/inactive-customers' },
                { label: 'Sales Person-wise Transaction Summary', route: '/selling/reports/salesperson-summary' },
                { label: 'Item-wise Sales History', route: '/selling/reports/item-sales-history' },
            ]
        },
        {
            title: 'Other Reports',
            links: [
                { label: 'Customer Addresses And Contacts', route: '/selling/reports/customer-directory' },
                { label: 'Available Stock for Packing Items', route: '/selling/reports/packing-stock' },
                { label: 'Pending SO Items For Purchase Request', route: '/selling/reports/pending-so-pr' },
                { label: 'Delivery Note Trends', route: '/selling/reports/delivery-trends' },
                { label: 'Sales Invoice Trends', route: '/selling/reports/invoice-trends' },
                { label: 'Customer Credit Balance', route: '/selling/reports/customer-credit-balance' },
                { label: 'Customers Without Any Transaction', route: '/selling/reports/dormant-customers' },
                { label: 'Sales Partners Commission', route: '/selling/reports/partner-commissions' },
                { label: 'Territory Target Variance Based On Items', route: '/selling/reports/territory-target-variance' },
                { label: 'Sales Person Target Variance Based On Items', route: '/selling/reports/salesperson-target-variance' },
                { label: 'Sales Partner Target Variance Based On Items', route: '/selling/reports/partner-target-variance' },
            ]
        }
    ];

    return (
        <div className="p-6 space-y-8 bg-background min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Selling Workspace</h1>
                    <p className="text-sm text-muted-foreground">Kelola penjualan, POS, daftar harga, dan laporan performa penjualan</p>
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
