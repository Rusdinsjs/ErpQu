import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Package, ArrowUpRight, BarChart2, Layers, Plus, Truck,
    ClipboardList, FileText, CheckCircle2, AlertTriangle, ShieldAlert,
    TrendingUp, RefreshCw, BarChart3, QrCode, Warehouse, Tags,
    Boxes, ShoppingCart, SlidersHorizontal, BookOpen, AlertOctagon
} from 'lucide-react';
import { inventoryApi } from '../api/inventory';

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
        title: 'Stock Transactions',
        icon: Boxes,
        gradient: 'from-amber-500/20 to-orange-500/5',
        links: [
            { label: 'Stock Entry (Transfer & In/Out)', route: '/stock-entry', icon: RefreshCw },
            { label: 'Delivery Note (Pengiriman)', route: '/delivery-notes', icon: Truck },
            { label: 'Purchase Receipt (Penerimaan)', route: '/purchase-receipt', icon: ShoppingCart },
            { label: 'Material Request (Permintaan)', route: '/material-request', icon: ClipboardList },
            { label: 'Pick List', route: '/pick-lists', icon: FileText },
            { label: 'Delivery Trip', route: '/delivery-trip', icon: Truck },
            { label: 'Stock Opname / Rekonsiliasi', route: '/stock-opname', icon: CheckCircle2 },
            { label: 'Landed Cost Voucher', route: '/landed-cost-vouchers', icon: TrendingUp },
        ]
    },
    {
        title: 'Items & Pricing',
        icon: Package,
        gradient: 'from-cyan-500/20 to-blue-500/5',
        links: [
            { label: 'Katalog Barang (Item Master)', route: '/inventory-items', icon: Package },
            { label: 'Kategori / Item Group', route: '/inventory-categories', icon: Layers },
            { label: 'Product Bundle / Paket', route: '/stock-product-bundles', icon: Boxes },
            { label: 'Item Alternative (Substitusi)', route: '/item-alternatives', icon: SlidersHorizontal },
            { label: 'Item Manufacturer', route: '/item-manufacturers', icon: Warehouse },
            { label: 'Brand & Merek', route: '/brands', icon: Tags },
        ]
    },
    {
        title: 'Serial No & Batch',
        icon: QrCode,
        gradient: 'from-emerald-500/20 to-teal-500/5',
        links: [
            { label: 'Nomor Seri (Serial No)', route: '/serial-numbers', icon: QrCode },
            { label: 'Batch / Lot Number', route: '/batches', icon: Layers },
            { label: 'Instalasi & Pemasangan', route: '/installation-notes', icon: FileText },
        ]
    },
    {
        title: 'Settings & Master Gudang',
        icon: Warehouse,
        gradient: 'from-violet-500/20 to-purple-500/5',
        links: [
            { label: 'Master Gudang (Warehouses)', route: '/warehouses', icon: Warehouse },
            { label: 'Satuan Ukur (UOM)', route: '/uoms', icon: SlidersHorizontal },
            { label: 'Faktor Konversi UOM', route: '/uom-conversions', icon: RefreshCw },
            { label: 'Item Tax Template', route: '/stock-tax-templates', icon: FileText },
            { label: 'Pengaturan Stok', route: '/stock-settings', icon: SlidersHorizontal },
        ]
    },
    {
        title: 'Laporan Utama Stok',
        icon: BarChart3,
        gradient: 'from-pink-500/20 to-rose-500/5',
        links: [
            { label: 'Buku Besar Stok (Stock Ledger)', route: '/stock-ledger', icon: BookOpen },
            { label: 'Saldo Stok per Gudang', route: '/stock-balance', icon: BarChart3 },
            { label: 'Ringkasan Stok (Summary)', route: '/stock-summary', icon: BarChart2 },
            { label: 'Analisa Umur Stok (Ageing)', route: '/stock-ageing', icon: AlertTriangle },
            { label: 'Proyeksi Kebutuhan Stok', route: '/stock-projected-qty', icon: TrendingUp },
        ]
    },
    {
        title: 'Laporan Analisa Khusus',
        icon: FileText,
        gradient: 'from-slate-500/20 to-zinc-500/5',
        links: [
            { label: 'Analitik Mutasi Stok', route: '/stock-analytics', icon: TrendingUp },
            { label: 'Riwayat Saldo per Batch', route: '/batch-wise-balance', icon: Layers },
            { label: 'Status Nomor Seri', route: '/serial-no-status', icon: QrCode },
            { label: 'Laporan Defisit / Shortage', route: '/item-shortage-report', icon: AlertOctagon },
        ]
    }
];

export default function StockWorkspace() {
    const navigate = useNavigate();
    const companyId = '75d1be11-9669-42b7-a39f-26ec0398f6d6';

    const { data: dashboardKpi, isLoading } = useQuery({
        queryKey: ['inventory', 'dashboard-kpi', companyId],
        queryFn: () => inventoryApi.getStockDashboardKpi(companyId),
        staleTime: 30_000,
    });

    const totalValuation = dashboardKpi?.total_stock_valuation || 0;
    const totalWarehouses = dashboardKpi?.total_warehouses || 0;
    const lowStockItems = dashboardKpi?.low_stock_items || 0;
    const totalItems = dashboardKpi?.total_items || 120;
    const healthyStock = Math.max(totalItems - lowStockItems, 0);

    const kpis = [
        {
            label: 'Total Valuasi Stok',
            value: totalValuation,
            isCurrency: true,
            sub: 'Realtime inventory valuation',
            icon: Package,
            color: 'text-amber-400',
            bg: 'bg-gradient-to-br from-amber-500/15 to-orange-500/10',
            border: 'border-amber-500/20 hover:border-amber-400/40',
        },
        {
            label: 'Gudang & Lokasi Aktif',
            value: totalWarehouses,
            suffix: 'Gudang',
            sub: 'Active locations & storage bins',
            icon: Warehouse,
            color: 'text-cyan-400',
            bg: 'bg-gradient-to-br from-cyan-500/15 to-blue-500/10',
            border: 'border-cyan-500/20 hover:border-cyan-400/40',
        },
        {
            label: 'Peringatan Stok Rendah',
            value: lowStockItems,
            suffix: 'Item',
            sub: 'Di bawah reorder point',
            icon: AlertTriangle,
            color: lowStockItems > 0 ? 'text-rose-400' : 'text-emerald-400',
            bg: lowStockItems > 0
                ? 'bg-gradient-to-br from-rose-500/15 to-red-500/10'
                : 'bg-gradient-to-br from-emerald-500/15 to-teal-500/10',
            border: lowStockItems > 0
                ? 'border-rose-500/20 hover:border-rose-400/40'
                : 'border-emerald-500/20 hover:border-emerald-400/40',
        },
    ];

    const quickActions = [
        { label: 'Input Stock Entry', icon: RefreshCw, route: '/stock-entry', color: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20' },
        { label: 'Material Request', icon: ClipboardList, route: '/material-request', color: 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20' },
        { label: 'Tambah Item Baru', icon: Plus, route: '/inventory-items', color: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20' },
    ];

    return (
        <div className="p-4 md:p-6 space-y-6 bg-background min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header + Quick Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Boxes size={24} />
                        </div>
                        Stock & Inventory EAM Workspace
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Kelola pergudangan, mutasi stok barang, nomor seri, batch lot, dan laporan persediaan
                    </p>
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
                    <span className="text-sm font-medium text-muted-foreground mb-3">Kondisi Persediaan</span>
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="w-[120px] h-[120px] rounded-full bg-muted animate-pulse" />
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <MiniDonut
                                segments={[
                                    { value: healthyStock, color: '#10b981', label: 'Stok Aman' },
                                    { value: lowStockItems, color: '#f43f5e', label: 'Stok Rendah' },
                                ]}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Section Cards Grid */}
            <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Modul & Transaksi Stok</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
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
