import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { financeApi } from '../../finance/api/finance';
import { clientApi } from '../../clients/api/client-management';
import {
    ShoppingCart, DollarSign, TrendingUp, ArrowUpRight,
    Store, Tag, Users, BarChart3, Settings, Plus, Percent,
    Truck, MapPin, Layers, Activity, FileText, Receipt,
    FileSpreadsheet, Monitor, Clock, Award
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
interface SubmenuLink {
    label: string;
    route: string;
    icon: React.ElementType;
}

interface SectionCard {
    title: string;
    icon: React.ElementType;
    gradient: string;
    links: SubmenuLink[];
}

const sections: SectionCard[] = [
    {
        title: 'Siklus Penjualan (Selling)',
        icon: ShoppingCart,
        gradient: 'from-blue-500/20 to-cyan-500/5',
        links: [
            { label: 'Direktori Pelanggan (Customers)', route: '/customers', icon: Users },
            { label: 'Penawaran Harga (Sales Quotation)', route: '/quotations', icon: FileText },
            { label: 'Pesanan Penjualan (Sales Order)', route: '/sales-orders', icon: ShoppingCart },
            { label: 'Faktur Penjualan (Sales Invoice)', route: '/sales-invoices', icon: Receipt },
            { label: 'Kontrak Payung (Blanket Order)', route: '/blanket-orders', icon: FileSpreadsheet },
            { label: 'Mitra & Tim Sales (Sales Team)', route: '/sales-partners', icon: Award },
        ]
    },
    {
        title: 'Point of Sale & Kasir Ritel',
        icon: Store,
        gradient: 'from-rose-500/20 to-pink-500/5',
        links: [
            { label: 'Terminal Kasir (POS Profile)', route: '/pos-profiles', icon: Monitor },
            { label: 'Shift Kasir (Opening & Closing)', route: '/pos-opening', icon: Clock },
            { label: 'Program Loyalitas & Poin', route: '/loyalty-programs', icon: Award },
        ]
    },
    {
        title: 'Aturan Harga & Promosi Diskon',
        icon: Tag,
        gradient: 'from-amber-500/20 to-orange-500/5',
        links: [
            { label: 'Aturan Diskon (Pricing Rules)', route: '/pricing-rules', icon: Percent },
            { label: 'Voucher Promo (Coupon Codes)', route: '/coupon-codes', icon: Tag },
            { label: 'Aturan Ongkir (Shipping Rules)', route: '/shipping-rules', icon: Truck },
        ]
    },
    {
        title: 'Segmentasi & Kampanye Pemasaran',
        icon: Users,
        gradient: 'from-violet-500/20 to-purple-500/5',
        links: [
            { label: 'Customer Groups (Kategori)', route: '/customer-groups', icon: Layers },
            { label: 'Wilayah Distribusi (Territories)', route: '/territories', icon: MapPin },
            { label: 'Kampanye Promo (Campaigns)', route: '/campaigns', icon: TrendingUp },
        ]
    },
    {
        title: 'Laporan & Analisis Penjualan',
        icon: BarChart3,
        gradient: 'from-emerald-500/20 to-teal-500/5',
        links: [
            { label: 'Sales Analytics & Tren SO', route: '/sales-analytics', icon: BarChart3 },
            { label: 'Analisis Status Order (SO)', route: '/so-analysis', icon: Activity },
            { label: 'Sales Funnel (Konversi)', route: '/sales-funnel', icon: TrendingUp },
        ]
    },
    {
        title: 'Pengaturan & Syarat Jual',
        icon: Settings,
        gradient: 'from-slate-500/20 to-zinc-500/5',
        links: [
            { label: 'Template Pajak Penjualan (PPN)', route: '/tax-templates', icon: Percent },
            { label: 'Syarat & Ketentuan (Terms)', route: '/terms-templates', icon: FileText },
        ]
    }
];

export default function SellingWorkspace() {
    const navigate = useNavigate();

    const { data: salesOrders, isLoading: loadingSO } = useQuery({
        queryKey: ['finance', 'sales-orders'],
        queryFn: financeApi.listSalesOrders,
        staleTime: 30_000,
    });

    const { data: clientsResponse, isLoading: loadingClients } = useQuery({
        queryKey: ['clients'],
        queryFn: () => clientApi.list({ limit: 100, offset: 0 }),
        staleTime: 30_000,
    });

    const orders = salesOrders?.data || salesOrders || [];
    const clients = clientsResponse?.data?.data || (Array.isArray(clientsResponse?.data) ? clientsResponse.data : []);

    const totalSOAmount = orders.reduce((sum: number, so: any) => sum + Number(so.total_amount || 0), 0);
    const avgOrderValue = orders.length > 0 ? totalSOAmount / orders.length : 0;
    const completedOrders = orders.filter((o: any) => o.status === 'completed' || o.status === 'delivered' || o.status === 'paid').length;
    const draftOrders = orders.filter((o: any) => o.status === 'draft').length;
    const pendingOrders = orders.filter((o: any) => o.status === 'submitted' || o.status === 'pending' || o.status === 'processing').length;
    const otherOrders = Math.max(orders.length - completedOrders - draftOrders - pendingOrders, 0);

    const isLoading = loadingSO || loadingClients;

    const kpis = [
        {
            label: 'Total Sales Orders',
            value: orders.length,
            suffix: 'SO',
            sub: `${draftOrders} Draft, ${completedOrders} Selesai`,
            icon: ShoppingCart,
            color: 'text-blue-400',
            bg: 'bg-gradient-to-br from-blue-500/15 to-cyan-500/10',
            border: 'border-blue-500/20 hover:border-blue-400/40',
        },
        {
            label: 'Total Omzet Penjualan',
            value: totalSOAmount,
            isCurrency: true,
            sub: `${clients.length} Pelanggan Terdaftar`,
            icon: DollarSign,
            color: 'text-emerald-400',
            bg: 'bg-gradient-to-br from-emerald-500/15 to-teal-500/10',
            border: 'border-emerald-500/20 hover:border-emerald-400/40',
        },
        {
            label: 'Rata-rata Nilai Order (AOV)',
            value: Math.round(avgOrderValue),
            isCurrency: true,
            sub: 'Rata-rata per transaksi SO',
            icon: TrendingUp,
            color: 'text-purple-400',
            bg: 'bg-gradient-to-br from-purple-500/15 to-violet-500/10',
            border: 'border-purple-500/20 hover:border-purple-400/40',
        },
    ];

    const quickActions = [
        { label: 'Buat Sales Order', icon: Plus, route: '/sales-orders', color: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20' },
        { label: 'Penawaran Harga', icon: ShoppingCart, route: '/quotations', color: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20' },
        { label: 'Buka Kasir POS', icon: Store, route: '/point-of-sale', color: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20' },
    ];

    return (
        <div className="p-4 md:p-6 space-y-6 bg-background min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header + Quick Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Selling & Sales Distribution</h1>
                    <p className="text-sm text-muted-foreground mt-1">Pusat kendali penjualan, pelanggan CRM, kontrak payung, kasir POS, aturan diskon, promosi, dan omzet</p>
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
                                    {kpi.isCurrency ? (
                                        <>
                                            <span className="text-lg font-normal text-muted-foreground mr-1">Rp</span>
                                            <AnimatedCounter value={kpi.value} />
                                        </>
                                    ) : (
                                        <>
                                            <AnimatedCounter value={kpi.value} />
                                            {kpi.suffix && (
                                                <span className="text-base font-medium text-muted-foreground ml-1.5">{kpi.suffix}</span>
                                            )}
                                        </>
                                    )}
                                </h2>
                                <p className="text-xs text-muted-foreground mt-1.5">{kpi.sub}</p>
                            </div>
                        </div>
                    ))
                )}

                <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm flex flex-col">
                    <span className="text-sm font-medium text-muted-foreground mb-3">Distribusi Status Order</span>
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="w-[120px] h-[120px] rounded-full bg-muted animate-pulse" />
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <MiniDonut
                                segments={[
                                    { value: completedOrders, color: '#10b981', label: 'Selesai / Lunas' },
                                    { value: pendingOrders, color: '#3b82f6', label: 'Diproses' },
                                    { value: draftOrders, color: '#f59e0b', label: 'Draft' },
                                    ...(otherOrders > 0 ? [{ value: otherOrders, color: '#64748b', label: 'Lainnya' }] : []),
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

