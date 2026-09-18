import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { financeApi } from'../../finance/api/finance';
import { clientApi } from'../../clients/api/client-management';
import { formatCurrencyIDR } from'../../../utils/decimal';
import {
    ShoppingCart, DollarSign, TrendingUp, ArrowUpRight,
    Store, Tag, Users, BarChart3, Settings
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

export default function SellingWorkspace() {
    const navigate = useNavigate();

    const { data: salesOrders } = useQuery({
        queryKey: ['finance', 'sales-orders'],
        queryFn: financeApi.listSalesOrders,
    });

    const { data: clientsResponse } = useQuery({
        queryKey: ['clients'],
        queryFn: () => clientApi.list({ limit: 100, offset: 0 }),
    });

    const orders = salesOrders?.data || salesOrders || [];
    const clients = clientsResponse?.data?.data || (Array.isArray(clientsResponse?.data) ? clientsResponse.data : []);

    const totalSOAmount = orders.reduce((sum: number, so: any) => sum + Number(so.total_amount || 0), 0);
    const avgOrderValue = orders.length > 0 ? totalSOAmount / orders.length : 0;

    // Top KPIs
    const kpis = [
        { label: 'Total Sales Orders', value: `${orders.length} SO`, change: `${orders.filter((o: any) => o.status === 'draft').length} order draft`, icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Total Omzet Penjualan', value: formatCurrencyIDR(totalSOAmount.toString()), change: `${clients.length} pelanggan terdaftar`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'Rata-rata Nilai Order (AOV)', value: formatCurrencyIDR(avgOrderValue.toString()), change: 'Rata-rata per transaksi', icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    ];

    const sections: SectionCard[] = [
        {
            title: 'Siklus Penjualan (Selling)',
            icon: ShoppingCart,
            color: 'text-blue-500',
            links: [
                { label: 'Direktori Pelanggan (Customers)', route: '/customers' },
                { label: 'Penawaran Harga (Sales Quotation)', route: '/quotations' },
                { label: 'Pesanan Penjualan (Sales Order)', route: '/sales-orders' },
                { label: 'Faktur Penjualan (Sales Invoice)', route: '/sales-invoices' },
                { label: 'Kontrak Payung (Blanket Order)', route: '/blanket-orders' },
                { label: 'Mitra & Tim Sales (Sales Team)', route: '/sales-partners' },
            ]
        },
        {
            title: 'Point of Sale & Kasir Ritel',
            icon: Store,
            color: 'text-rose-500',
            links: [
                { label: 'Terminal Kasir (POS Profile)', route: '/pos-profiles' },
                { label: 'Shift Kasir (Opening & Closing)', route: '/pos-opening' },
                { label: 'Program Loyalitas & Poin', route: '/loyalty-programs' },
            ]
        },
        {
            title: 'Aturan Harga & Promosi Diskon',
            icon: Tag,
            color: 'text-orange-500',
            links: [
                { label: 'Aturan Diskon (Pricing Rules)', route: '/pricing-rules' },
                { label: 'Voucher Promo (Coupon Codes)', route: '/coupon-codes' },
                { label: 'Aturan Ongkir (Shipping Rules)', route: '/shipping-rules' },
            ]
        },
        {
            title: 'Segmentasi & Kampanye Pemasaran',
            icon: Users,
            color: 'text-violet-500',
            links: [
                { label: 'Customer Groups (Kategori)', route: '/customer-groups' },
                { label: 'Wilayah Distribusi (Territories)', route: '/territories' },
                { label: 'Kampanye Promo (Campaigns)', route: '/campaigns' },
            ]
        },
        {
            title: 'Laporan & Analisis Penjualan',
            icon: BarChart3,
            color: 'text-emerald-500',
            links: [
                { label: 'Sales Analytics & Tren SO', route: '/sales-analytics' },
                { label: 'Analisis Status Order (SO)', route: '/so-analysis' },
                { label: 'Sales Funnel (Konversi)', route: '/sales-funnel' },
            ]
        },
        {
            title: 'Pengaturan & Syarat Jual',
            icon: Settings,
            color: 'text-teal-500',
            links: [
                { label: 'Template Pajak Penjualan (PPN)', route: '/tax-templates' },
                { label: 'Syarat & Ketentuan (Terms)', route: '/terms-templates' },
            ]
        }
    ];

    const handleNavigate = (route: string) => {
        navigate(route);
    };

    return (
        <div className="p-8 space-y-8 bg-background min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                        <ShoppingCart className="text-blue-500" size={32} />
                        Selling & Sales Distribution Workspace
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Pusat kendali penjualan, pelanggan CRM, kontrak payung, kasir POS, aturan diskon, promosi, dan pelacakan omzet
                    </p>
                </div>
            </div>

            {/* Top KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {kpis.map((kpi, idx) => (
                    <div key={idx} className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm flex flex-col justify-between hover:border-blue-500/30 transition-all">
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
                <h2 className="text-lg font-bold text-foreground mb-4">Modul Penjualan & Distribusi (Selling Desk)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sections.map((sec, secIdx) => (
                        <div key={secIdx} className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm hover:border-blue-500/40 transition-colors flex flex-col justify-between">
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
                                                <span className="text-sm font-medium text-foreground/80 group-hover:text-blue-500 transition-colors">
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
