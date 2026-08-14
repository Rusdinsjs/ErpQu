import { useNavigate } from 'react-router-dom';
import {
    Users, Briefcase, Clock, Calendar, DollarSign,
    ShieldAlert, HandCoins, ArrowUpRight, Shield, Award, Building2
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

export default function HrWorkspace() {
    const navigate = useNavigate();

    // Top KPIs
    const kpis = [
        { label: 'Total Pegawai', value: `120 Pegawai`, change: `Termasuk 10 Baru`, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Rata-rata Kehadiran', value: `98%`, change: `Bulan Ini`, icon: Clock, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'Total Payroll Bulanan', value: `Rp 245.000.000`, change: `Diestimasi untuk bulan ini`, icon: DollarSign, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    ];

    const sections: SectionCard[] = [
        {
            title: 'Kepegawaian & Organisasi',
            icon: Users,
            color: 'text-blue-500',
            links: [
                { label: 'Direktori Pegawai', route: '/admin?menu=employees' },
                { label: 'Departemen', route: '/admin?menu=departments' },
                { label: 'Master Jabatan (Designations)', route: '/admin?menu=designations' },
                { label: 'Riwayat Karir', route: '/admin?menu=employee-lifecycle' },
            ]
        },
        {
            title: 'Kehadiran & Cuti (Time & Attendance)',
            icon: Clock,
            color: 'text-emerald-500',
            links: [
                { label: 'Manajemen Shift', route: '/admin?menu=shifts' },
                { label: 'Kehadiran & Log', route: '/admin?menu=attendance-logs' },
                { label: 'Cuti Pegawai (Leaves)', route: '/admin?menu=leaves' },
                { label: 'Lembur (SPKL)', route: '/admin?menu=overtime' },
            ]
        },
        {
            title: 'Penggajian (Payroll) & Benefit',
            icon: DollarSign,
            color: 'text-violet-500',
            links: [
                { label: 'Struktur Gaji', route: '/admin?menu=salary-structures' },
                { label: 'Penetapan Gaji Pegawai', route: '/admin?menu=salary-assignments' },
                { label: 'Proses Payroll', route: '/admin?menu=payroll-processing' },
                { label: 'Pinjaman & Kasbon', route: '/admin?menu=employee-loans' },
            ]
        },
        {
            title: 'Kinerja & Pengembangan (Talent)',
            icon: Award,
            color: 'text-orange-500',
            links: [
                { label: 'Evaluasi Kinerja (Appraisal)', route: '/admin?menu=appraisal' },
                { label: 'Pelatihan & Sertifikasi', route: '/admin?menu=training-certifications' },
                { label: 'Rekrutmen (ATS)', route: '/admin?menu=recruitment' },
            ]
        },
        {
            title: 'Operasional Khusus & Kepatuhan',
            icon: Shield,
            color: 'text-rose-500',
            links: [
                { label: 'Surat Peringatan & Disiplin', route: '/admin?menu=disciplinary-actions' },
                { label: 'Inspeksi P2H (Driver)', route: '/admin?menu=p2h-inspections' },
                { label: 'Penugasan Alat Berat', route: '/admin?menu=driver-assignments' },
                { label: 'Klaim & Reimbursement', route: '/admin?menu=expense-claims' },
            ]
        },
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
                        <Building2 className="text-blue-500" size={32} />
                        Human Resources Workspace
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Pusat kendali kepegawaian, kehadiran, cuti, penggajian, evaluasi kinerja, serta manajemen armada driver
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
                <h2 className="text-lg font-bold text-foreground mb-4">Modul Human Resources (HR Desk)</h2>
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
