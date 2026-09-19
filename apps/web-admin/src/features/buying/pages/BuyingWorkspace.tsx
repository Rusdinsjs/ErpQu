import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { financeApi } from '../../finance/api/finance';
import { vendorApi } from '../api/vendors';
import {
    ShoppingCart, DollarSign, TrendingUp, ArrowUpRight, FileQuestion,
    FileSpreadsheet, Truck, Users, Star, BarChart3, Package, Settings,
    Plus, Activity, Layers, FileText, Tag
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
        title: 'Siklus Pengadaan (Procurement)',
        icon: ShoppingCart,
        gradient: 'from-rose-500/20 to-red-500/5',
        links: [
            { label: 'Material Request (Permintaan Barang)', route: '/material-requests', icon: Package },
            { label: 'Request for Quotation (RFQ)', route: '/rfqs', icon: FileQuestion },
            { label: 'Supplier Quotation (Penawaran Masuk)', route: '/supplier-quotations', icon: FileSpreadsheet },
            { label: 'Purchase Order (Pesanan Beli)', route: '/purchase-orders', icon: ShoppingCart },
            { label: 'Purchase Invoice (Tagihan Vendor)', route: '/purchase-bills', icon: DollarSign },
        ]
    },
    {
        title: 'Pemasok & Mitra (Suppliers)',
        icon: Truck,
        gradient: 'from-amber-500/20 to-orange-500/5',
        links: [
            { label: 'Direktori Vendor / Supplier', route: '/suppliers', icon: Truck },
            { label: 'Supplier Groups (Kategori Mitra)', route: '/supplier-groups', icon: Layers },
            { label: 'Supplier Contacts (PIC Vendor)', route: '/supplier-contacts', icon: Users },
            { label: 'Supplier Addresses (Alamat Pabrik)', route: '/supplier-addresses', icon: Truck },
        ]
    },
    {
        title: 'Evaluasi & Scorecard Vendor',
        icon: Star,
        gradient: 'from-yellow-500/20 to-amber-500/5',
        links: [
            { label: 'Supplier Scorecard (Rating Vendor)', route: '/supplier-scorecards', icon: Star },
            { label: 'Scorecard Criteria & Standing', route: '/scorecard-standings', icon: BarChart3 },
        ]
    },
    {
        title: 'Laporan & Analisis Pengadaan',
        icon: BarChart3,
        gradient: 'from-blue-500/20 to-cyan-500/5',
        links: [
            { label: 'Purchase Analytics (Analisis Belanja)', route: '/purchase-analytics', icon: BarChart3 },
            { label: 'Purchase Order Trends (Tren PO)', route: '/po-trends', icon: TrendingUp },
            { label: 'Procurement Tracker (Pelacakan)', route: '/procurement-tracker', icon: Activity },
        ]
    },
    {
        title: 'Master Barang & Harga Beli',
        icon: Package,
        gradient: 'from-emerald-500/20 to-teal-500/5',
        links: [
            { label: 'Item Persediaan (Inventory Items)', route: '/items', icon: Package },
            { label: 'Item Groups (Kategori Barang)', route: '/buying-item-groups', icon: Layers },
            { label: 'Item Prices (Daftar Harga Beli)', route: '/buying-item-prices', icon: Tag },
        ]
    },
    {
        title: 'Pengaturan & Pajak Pembelian',
        icon: Settings,
        gradient: 'from-slate-500/20 to-zinc-500/5',
        links: [
            { label: 'Purchase Taxes & Charges Template', route: '/purchase-tax-templates-view', icon: Settings },
            { label: 'Terms & Conditions Template', route: '/terms-templates', icon: FileText },
        ]
    }
];

export default function BuyingWorkspace() {
    const navigate = useNavigate();

    const { data: purchaseOrders, isLoading: loadingPO } = useQuery({
        queryKey: ['finance', 'purchase-orders'],
        queryFn: financeApi.listPurchaseOrders,
        staleTime: 30_000,
    });

    const { data: purchaseBills, isLoading: loadingBills } = useQuery({
        queryKey: ['finance', 'purchase-bills'],
        queryFn: financeApi.listPurchaseBills,
        staleTime: 30_000,
    });

    const { data: vendorsData, isLoading: loadingVendors } = useQuery({
        queryKey: ['vendors'],
        queryFn: () => vendorApi.listVendors(1, 100),
        staleTime: 30_000,
    });

    const orders = purchaseOrders?.data || purchaseOrders || [];
    const bills = purchaseBills || [];
    const vendors = vendorsData?.data || [];

    const totalPOAmount = orders.reduce((sum: number, po: any) => sum + Number(po.total_amount || 0), 0);
    const avgPOValue = orders.length > 0 ? totalPOAmount / orders.length : 0;
    const completedOrders = orders.filter((o: any) => o.status === 'completed' || o.status === 'billed' || o.status === 'received').length;
    const draftOrders = orders.filter((o: any) => o.status === 'draft').length;

    const paidBills = bills.filter((b: any) => b.status === 'paid').length;
    const unpaidBills = bills.filter((b: any) => b.status !== 'paid' && b.status !== 'draft').length;
    const draftBills = bills.filter((b: any) => b.status === 'draft').length;

    const isLoading = loadingPO || loadingBills || loadingVendors;

    const kpis = [
        {
            label: 'Total Purchase Orders',
            value: orders.length,
            suffix: 'PO',
            sub: `${draftOrders} Draft, ${completedOrders} Selesai`,
            icon: ShoppingCart,
            color: 'text-rose-400',
            bg: 'bg-gradient-to-br from-rose-500/15 to-red-500/10',
            border: 'border-rose-500/20 hover:border-rose-400/40',
        },
        {
            label: 'Total Belanja Pengadaan',
            value: totalPOAmount,
            isCurrency: true,
            sub: `${vendors.length} Vendor Terdaftar`,
            icon: DollarSign,
            color: 'text-amber-400',
            bg: 'bg-gradient-to-br from-amber-500/15 to-orange-500/10',
            border: 'border-amber-500/20 hover:border-amber-400/40',
        },
        {
            label: 'Rata-rata Nilai Order (AOV)',
            value: Math.round(avgPOValue),
            isCurrency: true,
            sub: 'Rata-rata per transaksi PO',
            icon: TrendingUp,
            color: 'text-emerald-400',
            bg: 'bg-gradient-to-br from-emerald-500/15 to-teal-500/10',
            border: 'border-emerald-500/20 hover:border-emerald-400/40',
        },
    ];

    const quickActions = [
        { label: 'Buat Purchase Order', icon: Plus, route: '/purchase-orders', color: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20' },
        { label: 'Material Request', icon: Package, route: '/material-requests', color: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20' },
        { label: 'Daftar Vendor', icon: Users, route: '/suppliers', color: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20' },
    ];

    return (
        <div className="p-4 md:p-6 space-y-6 bg-background min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header + Quick Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Buying & Procurement</h1>
                    <p className="text-sm text-muted-foreground mt-1">Pusat kendali pengadaan barang, manajemen vendor, penawaran harga, PO, dan evaluasi kinerja supplier</p>
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
                    <span className="text-sm font-medium text-muted-foreground mb-3">Status Tagihan Vendor</span>
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="w-[120px] h-[120px] rounded-full bg-muted animate-pulse" />
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <MiniDonut
                                segments={[
                                    { value: Math.max(paidBills, 1), color: '#10b981', label: 'Lunas' },
                                    { value: unpaidBills, color: '#f43f5e', label: 'Belum Bayar' },
                                    ...(draftBills > 0 ? [{ value: draftBills, color: '#f59e0b', label: 'Draft' }] : []),
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

