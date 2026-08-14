import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { financeApi } from '../../api/finance';
import { vendorApi } from '../../api/vendors';
import { formatCurrencyIDR } from '../../utils/decimal';
import {
    ShoppingCart, DollarSign, TrendingUp, ArrowUpRight, FileQuestion,
    FileSpreadsheet, Truck, Users, Star, BarChart3, Package, Settings
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

export default function BuyingWorkspace() {
    const navigate = useNavigate();

    const { data: purchaseOrders } = useQuery({
        queryKey: ['finance', 'purchase-orders'],
        queryFn: financeApi.listPurchaseOrders,
    });

    const { data: purchaseBills } = useQuery({
        queryKey: ['finance', 'purchase-bills'],
        queryFn: financeApi.listPurchaseBills,
    });

    const { data: vendorsData } = useQuery({
        queryKey: ['vendors'],
        queryFn: () => vendorApi.listVendors(1, 100),
    });

    const orders = purchaseOrders?.data || purchaseOrders || [];
    const bills = purchaseBills || [];
    const vendors = vendorsData?.data || [];

    const totalPOAmount = orders.reduce((sum: number, po: any) => sum + Number(po.total_amount || 0), 0);
    const avgPOValue = orders.length > 0 ? totalPOAmount / orders.length : 0;

    // Top KPIs
    const kpis = [
        { label: 'Total Purchase Orders', value: `${orders.length} PO`, change: `${orders.filter((o: any) => o.status === 'draft').length} order draft aktif`, icon: ShoppingCart, color: 'text-rose-500', bg: 'bg-rose-500/10' },
        { label: 'Total Belanja Pengadaan', value: formatCurrencyIDR(totalPOAmount), change: `${vendors.length} vendor aktif terdaftar`, icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { label: 'Rata-rata Nilai Order (AOV)', value: formatCurrencyIDR(avgPOValue), change: 'Rata-rata per transaksi PO', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    ];

    const sections: SectionCard[] = [
        {
            title: 'Siklus Pengadaan (Procurement)',
            icon: ShoppingCart,
            color: 'text-rose-500',
            links: [
                { label: 'Material Request (Permintaan Barang)', route: '/admin?menu=material-requests' },
                { label: 'Request for Quotation (RFQ)', route: '/admin?menu=rfqs' },
                { label: 'Supplier Quotation (Penawaran Masuk)', route: '/admin?menu=supplier-quotations' },
                { label: 'Purchase Order (Pesanan Beli)', route: '/admin?menu=purchase-orders' },
                { label: 'Purchase Invoice (Tagihan Vendor)', route: '/admin?menu=purchase-bills' },
            ]
        },
        {
            title: 'Pemasok & Mitra (Suppliers)',
            icon: Truck,
            color: 'text-amber-500',
            links: [
                { label: 'Direktori Vendor / Supplier', route: '/admin?menu=suppliers' },
                { label: 'Supplier Groups (Kategori Mitra)', route: '/admin?menu=supplier-groups' },
                { label: 'Supplier Contacts (PIC Vendor)', route: '/admin?menu=supplier-contacts' },
                { label: 'Supplier Addresses (Alamat Pabrik)', route: '/admin?menu=supplier-addresses' },
            ]
        },
        {
            title: 'Evaluasi & Scorecard Vendor',
            icon: Star,
            color: 'text-yellow-500',
            links: [
                { label: 'Supplier Scorecard (Rating Vendor)', route: '/admin?menu=supplier-scorecards' },
                { label: 'Scorecard Criteria & Standing', route: '/admin?menu=scorecard-standings' },
            ]
        },
        {
            title: 'Laporan & Analisis Pengadaan',
            icon: BarChart3,
            color: 'text-blue-500',
            links: [
                { label: 'Purchase Analytics (Analisis Belanja)', route: '/admin?menu=purchase-analytics' },
                { label: 'Purchase Order Trends (Tren PO)', route: '/admin?menu=po-trends' },
                { label: 'Procurement Tracker (Pelacakan)', route: '/admin?menu=procurement-tracker' },
            ]
        },
        {
            title: 'Master Barang & Harga Beli',
            icon: Package,
            color: 'text-emerald-500',
            links: [
                { label: 'Item Persediaan (Inventory Items)', route: '/admin?menu=items' },
                { label: 'Item Groups (Kategori Barang)', route: '/admin?menu=item-groups' },
                { label: 'Item Prices (Daftar Harga Beli)', route: '/admin?menu=buying-item-prices' },
            ]
        },
        {
            title: 'Pengaturan & Pajak Pembelian',
            icon: Settings,
            color: 'text-indigo-500',
            links: [
                { label: 'Purchase Taxes & Charges Template', route: '/admin?menu=purchase-tax-templates' },
                { label: 'Terms & Conditions Template', route: '/admin?menu=buying-terms-templates' },
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
                        <ShoppingCart className="text-rose-500" size={32} />
                        Buying & Procurement Workspace
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Pusat kendali pengadaan barang, manajemen vendor, perbandingan penawaran harga, PO, dan evaluasi kinerja supplier
                    </p>
                </div>
            </div>

            {/* Top KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {kpis.map((kpi, idx) => (
                    <div key={idx} className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm flex flex-col justify-between hover:border-rose-500/30 transition-all">
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

            {/* Sections Grid */}
            <div>
                <h2 className="text-lg font-bold text-foreground mb-4">Modul Pengadaan & Pembelian (Buying Desk)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sections.map((sec, secIdx) => (
                        <div key={secIdx} className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm hover:border-rose-500/40 transition-colors flex flex-col justify-between">
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
                                                <span className="text-sm font-medium text-foreground/80 group-hover:text-rose-500 transition-colors">
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
