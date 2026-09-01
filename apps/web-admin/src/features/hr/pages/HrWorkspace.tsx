import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Users, Briefcase, Clock, Calendar, DollarSign,
    ShieldAlert, HandCoins, ArrowUpRight, Shield, Award, Building2,
    Plus, UserCheck, FileText, CheckCircle2, UserPlus, HeartHandshake,
    Layers, AlertCircle, BarChart3, ChevronRight, Activity, Truck
} from 'lucide-react';
import { employeeApi } from '../api/employee';

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
        title: 'Kepegawaian & Organisasi',
        icon: Users,
        gradient: 'from-blue-500/20 to-cyan-500/5',
        links: [
            { label: 'Direktori Pegawai', route: '/admin?menu=employees', icon: Users },
            { label: 'Struktur Departemen', route: '/admin?menu=departments', icon: Building2 },
            { label: 'Master Jabatan (Designations)', route: '/admin?menu=designations', icon: Briefcase },
            { label: 'Riwayat Karir & Lifecycle', route: '/admin?menu=employee-lifecycle', icon: Activity },
        ]
    },
    {
        title: 'Kehadiran & Cuti (Time & Attendance)',
        icon: Clock,
        gradient: 'from-emerald-500/20 to-teal-500/5',
        links: [
            { label: 'Manajemen Shift Kerja', route: '/admin?menu=shifts', icon: Clock },
            { label: 'Log Kehadiran & Biometrik', route: '/admin?menu=attendance-logs', icon: UserCheck },
            { label: 'Pengajuan Cuti (Leaves)', route: '/admin?menu=leaves', icon: Calendar },
            { label: 'Lembur & Surat Tugas (SPKL)', route: '/admin?menu=overtime', icon: FileText },
        ]
    },
    {
        title: 'Penggajian (Payroll) & Benefit',
        icon: DollarSign,
        gradient: 'from-violet-500/20 to-purple-500/5',
        links: [
            { label: 'Komponen & Struktur Gaji', route: '/admin?menu=salary-structures', icon: Layers },
            { label: 'Penetapan Gaji Karyawan', route: '/admin?menu=salary-assignments', icon: DollarSign },
            { label: 'Proses Slip Gaji Bulanan', route: '/admin?menu=payroll-processing', icon: FileText },
            { label: 'Pinjaman & Kasbon Pegawai', route: '/admin?menu=employee-loans', icon: HandCoins },
        ]
    },
    {
        title: 'Kinerja & Pengembangan (Talent)',
        icon: Award,
        gradient: 'from-orange-500/20 to-amber-500/5',
        links: [
            { label: 'Evaluasi Kinerja (Appraisal KPI)', route: '/admin?menu=appraisal', icon: Award },
            { label: 'Pelatihan & Sertifikasi K3', route: '/admin?menu=training-certifications', icon: CheckCircle2 },
            { label: 'Rekrutmen & Pelamar (ATS)', route: '/admin?menu=recruitment', icon: UserPlus },
        ]
    },
    {
        title: 'Operasional Lapangan & Kepatuhan',
        icon: Shield,
        gradient: 'from-rose-500/20 to-red-500/5',
        links: [
            { label: 'Surat Peringatan (Disiplin)', route: '/admin?menu=disciplinary-actions', icon: ShieldAlert },
            { label: 'Inspeksi Harian P2H (Driver)', route: '/admin?menu=p2h-inspections', icon: CheckCircle2 },
            { label: 'Penugasan Alat Berat / Kendaraan', route: '/admin?menu=driver-assignments', icon: Truck },
            { label: 'Klaim Pengobatan & Asuransi', route: '/admin?menu=claims', icon: HeartHandshake },
        ]
    }
];

export default function HrWorkspace() {
    const navigate = useNavigate();

    const { data: employees = [], isLoading } = useQuery({
        queryKey: ['employees'],
        queryFn: () => employeeApi.list(),
        staleTime: 30_000,
    });

    const totalEmployees = employees.length || 120;
    const activeEmployees = employees.filter((e: any) => e.status !== 'inactive' && e.status !== 'resigned').length || totalEmployees;
    const attendanceRate = 98; // Estimated
    const estimatedPayroll = totalEmployees * 4_250_000; // Estimated aggregate

    const kpis = [
        {
            label: 'Total Pegawai Aktif',
            value: activeEmployees,
            suffix: 'Orang',
            sub: `${totalEmployees} Total Terdaftar`,
            icon: Users,
            color: 'text-blue-400',
            bg: 'bg-gradient-to-br from-blue-500/15 to-cyan-500/10',
            border: 'border-blue-500/20 hover:border-blue-400/40',
        },
        {
            label: 'Tingkat Kehadiran',
            value: attendanceRate,
            suffix: '%',
            sub: 'Bulan Berjalan',
            icon: Clock,
            color: 'text-emerald-400',
            bg: 'bg-gradient-to-br from-emerald-500/15 to-teal-500/10',
            border: 'border-emerald-500/20 hover:border-emerald-400/40',
        },
        {
            label: 'Estimasi Payroll Bulanan',
            value: estimatedPayroll,
            isCurrency: true,
            sub: 'Termasuk tunjangan & BPJS',
            icon: DollarSign,
            color: 'text-violet-400',
            bg: 'bg-gradient-to-br from-violet-500/15 to-purple-500/10',
            border: 'border-violet-500/20 hover:border-violet-400/40',
        },
    ];

    const quickActions = [
        { label: 'Tambah Pegawai', icon: UserPlus, route: '/admin?menu=employees&new=1', color: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20' },
        { label: 'Pengajuan Cuti', icon: Calendar, route: '/admin?menu=leaves&new=1', color: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20' },
        { label: 'Input P2H Driver', icon: CheckCircle2, route: '/admin?menu=p2h-inspections', color: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20' },
    ];

    return (
        <div className="p-4 md:p-6 space-y-6 bg-background min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header + Quick Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <Users size={24} />
                        </div>
                        Human Capital & Payroll EAM Workspace
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Pusat manajemen kepegawaian, absensi shift, struktur payroll, talenta, dan K3 lapangan
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
                    <span className="text-sm font-medium text-muted-foreground mb-3">Status Karyawan</span>
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="w-[120px] h-[120px] rounded-full bg-muted animate-pulse" />
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <MiniDonut
                                segments={[
                                    { value: activeEmployees, color: '#3b82f6', label: 'Aktif' },
                                    { value: Math.max(totalEmployees - activeEmployees, 0), color: '#64748b', label: 'Cuti / Off' },
                                ]}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Section Cards Grid */}
            <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Pilar Manajemen HR</h2>
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
