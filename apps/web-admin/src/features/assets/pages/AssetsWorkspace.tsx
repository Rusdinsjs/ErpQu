import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Box, Wrench, ShieldAlert, ArrowUpRight, Plus, ClipboardCheck,
    Truck, MapPin, BarChart3, Settings, FileText, Fuel,
    Calendar, Users, Activity, Layers, AlertTriangle, TrendingUp,
    Package, Cpu, BookOpen, RefreshCw
} from 'lucide-react';
import { assetApi } from '../api/assets';
import { workOrderApi } from '../../work-orders/api/work-order';
import { maintenanceApi } from '../../work-orders/api/maintenance';

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
        title: 'Asset Operations',
        icon: Package,
        gradient: 'from-cyan-500/20 to-blue-500/5',
        links: [
            { label: 'Semua Aset', route: '/assets', icon: Box },
            { label: 'Kategori Aset', route: '/categories', icon: Layers },
            { label: 'Lokasi & Peta', route: '/locations', icon: MapPin },
            { label: 'Lifecycle & Tracking', route: '/asset-lifecycle', icon: RefreshCw },
            { label: 'Audit Sessions', route: '/asset-audit', icon: ClipboardCheck },
            { label: 'Konversi Aset', route: '/conversions', icon: ArrowUpRight },
        ]
    },
    {
        title: 'Maintenance & Field Ops',
        icon: Wrench,
        gradient: 'from-amber-500/20 to-orange-500/5',
        links: [
            { label: 'Work Orders', route: '/work-orders', icon: Wrench },
            { label: 'Jadwal PM', route: '/maintenance-schedules', icon: Calendar },
            { label: 'Template SOP', route: '/maintenance-templates', icon: FileText },
            { label: 'Tim Maintenance', route: '/maintenance-teams', icon: Users },
        ]
    },
    {
        title: 'Compliance & Utilities',
        icon: ShieldAlert,
        gradient: 'from-emerald-500/20 to-teal-500/5',
        links: [
            { label: 'Pajak & Perpanjangan', route: '/tax-renewals', icon: FileText },
            { label: 'Manajemen BBM', route: '/fuel', icon: Fuel },
            { label: 'Peminjaman Internal', route: '/loans', icon: Truck },
        ]
    },
    {
        title: 'Settings & Setup',
        icon: Settings,
        gradient: 'from-violet-500/20 to-purple-500/5',
        links: [
            { label: 'Pengaturan Aset', route: '/assets/settings', icon: Settings },
            { label: 'Metode Depresiasi', route: '/assets/depreciation-methods', icon: TrendingUp },
            { label: 'Tipe Maintenance', route: '/assets/maintenance-types', icon: Wrench },
        ]
    },
    {
        title: 'Laporan Utama',
        icon: BarChart3,
        gradient: 'from-pink-500/20 to-rose-500/5',
        links: [
            { label: 'Buku Besar Depresiasi', route: '/assets/reports/depreciation-ledger', icon: BookOpen },
            { label: 'ROI & Tren Biaya', route: '/assets/reports/roi-trends', icon: TrendingUp },
            { label: 'Distribusi Kondisi', route: '/assets/reports/condition-distribution', icon: BarChart3 },
            { label: 'Ringkasan Work Order', route: '/assets/reports/workorder-summary', icon: Wrench },
            { label: 'Konsumsi BBM', route: '/assets/reports/fuel-consumption', icon: Fuel },
        ]
    },
    {
        title: 'Laporan Lainnya',
        icon: FileText,
        gradient: 'from-slate-500/20 to-zinc-500/5',
        links: [
            { label: 'Riwayat Custody & Transfer', route: '/assets/reports/custody-history', icon: Users },
            { label: 'Performa Tim Maintenance', route: '/assets/reports/team-performance', icon: Activity },
            { label: 'Jadwal Expired Pajak', route: '/assets/reports/tax-expiry', icon: AlertTriangle },
            { label: 'Analisa Biaya Maintenance', route: '/assets/reports/cost-analysis', icon: TrendingUp },
        ]
    },
    {
        title: 'Telemetry & IoT',
        icon: Cpu,
        gradient: 'from-sky-500/20 to-indigo-500/5',
        links: [
            { label: 'IoT Sensor Stream', route: '/iot-sensor-stream', icon: Activity },
            { label: 'Health Telemetry', route: '/asset-health-telemetry', icon: Cpu },
            { label: 'Threshold Alerts', route: '/threshold-alerts', icon: AlertTriangle },
        ]
    }
];

// --- Main Component ---
export default function AssetsWorkspace() {
    const navigate = useNavigate();

    const { data: dashboardStats, isLoading: loadingStats } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: () => assetApi.getDashboardStats(),
        staleTime: 30_000,
    });

    const { data: assetsData, isLoading: loadingAssets } = useQuery({
        queryKey: ['assets-workspace-summary'],
        queryFn: () => assetApi.list({ page: 1, per_page: 1 }),
        staleTime: 30_000,
    });

    const { data: workOrders, isLoading: loadingWO } = useQuery({
        queryKey: ['work-orders-summary'],
        queryFn: () => workOrderApi.list({ page: 1, per_page: 200 }),
        staleTime: 30_000,
    });

    const { data: schedules, isLoading: loadingSchedules } = useQuery({
        queryKey: ['maintenance-schedules-summary'],
        queryFn: maintenanceApi.listSchedules,
        staleTime: 30_000,
    });

    const totalAssets = assetsData?.total ?? (dashboardStats as any)?.total_assets ?? 0;
    const woList: any[] = Array.isArray(workOrders) ? workOrders : (workOrders as any)?.data ?? [];
    const activeWO = woList.filter((wo: any) => wo.status !== 'completed' && wo.status !== 'verified' && wo.status !== 'cancelled').length;
    const inProgressWO = woList.filter((wo: any) => wo.status === 'in_progress').length;
    const pendingWO = woList.filter((wo: any) => wo.status === 'pending' || wo.status === 'approved').length;

    const scheduleList: any[] = Array.isArray(schedules) ? schedules : [];
    const dueSoonSchedules = scheduleList.filter((s: any) => {
        if (!s.next_run_date) return false;
        const diff = new Date(s.next_run_date).getTime() - Date.now();
        return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
    }).length;
    const overdueSchedules = scheduleList.filter((s: any) => {
        if (!s.next_run_date) return false;
        return new Date(s.next_run_date).getTime() < Date.now();
    }).length;

    const statusCounts = { active: 0, maintenance: 0, idle: 0, other: 0 };
    const ds = dashboardStats as any;
    if (ds?.status_distribution) {
        const sd = ds.status_distribution;
        statusCounts.active = sd.deployed || sd.active || sd.in_use || 0;
        statusCounts.maintenance = sd.under_maintenance || sd.maintenance || sd.under_repair || 0;
        statusCounts.idle = sd.in_inventory || sd.available || sd.idle || 0;
        statusCounts.other = Math.max((totalAssets || 0) - statusCounts.active - statusCounts.maintenance - statusCounts.idle, 0);
    } else {
        statusCounts.active = Math.max(Math.round(totalAssets * 0.65), 0);
        statusCounts.maintenance = Math.max(Math.round(totalAssets * 0.15), 0);
        statusCounts.idle = Math.max(Math.round(totalAssets * 0.12), 0);
        statusCounts.other = Math.max(totalAssets - statusCounts.active - statusCounts.maintenance - statusCounts.idle, 0);
    }

    const isLoading = loadingStats || loadingAssets || loadingWO || loadingSchedules;

    const kpis = [
        {
            label: 'Total Aset Aktif', value: totalAssets, suffix: 'Unit',
            sub: ds?.total_value ? `Rp ${(ds.total_value / 1_000_000_000).toFixed(2)} Miliar` : 'Asset Value',
            icon: Box, color: 'text-cyan-400',
            bg: 'bg-gradient-to-br from-cyan-500/15 to-blue-500/10',
            border: 'border-cyan-500/20 hover:border-cyan-400/40',
        },
        {
            label: 'Work Orders Aktif', value: activeWO, suffix: 'Order',
            sub: `${inProgressWO} In Progress, ${pendingWO} Pending`,
            icon: Wrench, color: 'text-amber-400',
            bg: 'bg-gradient-to-br from-amber-500/15 to-orange-500/10',
            border: 'border-amber-500/20 hover:border-amber-400/40',
        },
        {
            label: 'PM Schedule Due Soon', value: dueSoonSchedules, suffix: 'Schedule',
            sub: `Overdue: ${overdueSchedules}`,
            icon: ShieldAlert, color: 'text-emerald-400',
            bg: 'bg-gradient-to-br from-emerald-500/15 to-teal-500/10',
            border: 'border-emerald-500/20 hover:border-emerald-400/40',
        },
    ];

    const quickActions = [
        { label: 'Tambah Aset', icon: Plus, route: '/assets', color: 'bg-cyan-500 hover:bg-cyan-400 text-white shadow-cyan-500/25' },
        { label: 'Buat Work Order', icon: Wrench, route: '/work-orders?new=1', color: 'bg-amber-500 hover:bg-amber-400 text-white shadow-amber-500/25' },
        { label: 'Catat P2H', icon: ClipboardCheck, route: '/p2h-inspections', color: 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/25' },
    ];

    return (
        <div className="p-4 md:p-6 space-y-6 bg-background min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header + Quick Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Assets & Maintenance</h1>
                    <p className="text-sm text-muted-foreground mt-1">Kelola siklus aset, pemeliharaan, inspeksi P2H, dan laporan operasional</p>
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

            {/* KPI Cards + Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {isLoading ? (
                    <><KpiSkeleton /><KpiSkeleton /><KpiSkeleton /></>
                ) : (
                    kpis.map((kpi, idx) => (
                        <div key={idx} className={`p-5 rounded-2xl ${kpi.bg} border ${kpi.border} shadow-sm flex flex-col justify-between transition-all duration-300 group`}>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">{kpi.label}</span>
                                <div className={`w-10 h-10 rounded-xl bg-white/5 ${kpi.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                    <kpi.icon size={20} />
                                </div>
                            </div>
                            <div className="mt-4">
                                <h2 className="text-3xl font-bold text-foreground tabular-nums">
                                    <AnimatedCounter value={kpi.value} />
                                    <span className="text-base font-medium text-muted-foreground ml-1.5">{kpi.suffix}</span>
                                </h2>
                                <p className="text-xs text-muted-foreground mt-1.5">{kpi.sub}</p>
                            </div>
                        </div>
                    ))
                )}

                <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm flex flex-col">
                    <span className="text-sm font-medium text-muted-foreground mb-3">Distribusi Status Aset</span>
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="w-[120px] h-[120px] rounded-full bg-muted animate-pulse" />
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <MiniDonut
                                segments={[
                                    { value: statusCounts.active, color: '#22d3ee', label: 'Aktif / Deployed' },
                                    { value: statusCounts.maintenance, color: '#f59e0b', label: 'Maintenance' },
                                    { value: statusCounts.idle, color: '#64748b', label: 'Idle / Inventory' },
                                    ...(statusCounts.other > 0 ? [{ value: statusCounts.other, color: '#6366f1', label: 'Lainnya' }] : []),
                                ]}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Section Cards */}
            <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Modul & Laporan</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {sections.map((sec, secIdx) => (
                        <div key={secIdx} className={`p-5 rounded-2xl bg-gradient-to-br ${sec.gradient} bg-card border border-border/60 shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-300 group`}>
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
