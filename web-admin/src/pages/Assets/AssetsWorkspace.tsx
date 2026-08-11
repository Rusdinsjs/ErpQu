import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Wrench, ShieldAlert, TrendingUp, DollarSign, ArrowUpRight,
    MapPin, Layers, FileText, CheckSquare, Compass, Settings, Users,
    RefreshCw, Clock, Navigation, AlertTriangle
} from 'lucide-react';

interface SectionLink {
    label: string;
    route: string;
}

interface SectionCard {
    title: string;
    links: SectionLink[];
}

export default function AssetsWorkspace() {
    const navigate = useNavigate();

    // Top KPIs
    const kpis = [
        { label: 'Total Active Assets', value: '148 Item', change: 'Rp 2,45 Miliar Asset Value', icon: Box, color: 'text-cyan-500 bg-cyan-500/10' },
        { label: 'Active Work Orders', value: '12 Order', change: '8 In Progress, 4 Pending', icon: Wrench, color: 'text-amber-500 bg-amber-500/10' },
        { label: 'PM Schedules Due Soon', value: '5 Schedule', change: 'Maintenance Overdue: 0', icon: ShieldAlert, color: 'text-emerald-500 bg-emerald-500/10' },
    ];

    // ERPNext / ERPQu Asset & Field Operations Sections
    const sections: SectionCard[] = [
        {
            title: 'Asset Operations',
            links: [
                { label: 'All Assets', route: '/assets' },
                { label: 'Asset Category', route: '/categories' },
                { label: 'Locations & Geolocation Map', route: '/locations' },
                { label: 'Asset Lifecycle & Tracking', route: '/asset-lifecycle' },
                { label: 'Asset Audit Sessions', route: '/asset-audit' },
                { label: 'Asset Conversion Requests', route: '/conversions' },
            ]
        },
        {
            title: 'Maintenance & Field Ops',
            links: [
                { label: 'Work Orders', route: '/work-orders' },
                { label: 'Preventive Maintenance Schedules', route: '/maintenance-schedules' },
                { label: 'Maintenance SOP Templates', route: '/maintenance-templates' },
                { label: 'Maintenance Teams', route: '/maintenance-teams' },
            ]
        },
        {
            title: 'Compliance & Utilities',
            links: [
                { label: 'Tax & Document Renewals', route: '/tax-renewals' },
                { label: 'Fuel Management & Logs', route: '/fuel' },
                { label: 'Internal Asset Loans', route: '/loans' },
            ]
        },
        {
            title: 'Settings & Setup',
            links: [
                { label: 'Asset Settings', route: '/assets/settings' },
                { label: 'Depreciation Methods', route: '/assets/depreciation-methods' },
                { label: 'Maintenance Types', route: '/assets/maintenance-types' },
            ]
        },
        {
            title: 'Key Reports',
            links: [
                { label: 'Asset Depreciation Ledger', route: '/assets/reports/depreciation-ledger' },
                { label: 'Asset ROI & Cost Trends', route: '/assets/reports/roi-trends' },
                { label: 'Asset Condition Distribution', route: '/assets/reports/condition-distribution' },
                { label: 'Work Order Maintenance Summary', route: '/assets/reports/workorder-summary' },
                { label: 'Fuel Consumption Report', route: '/assets/reports/fuel-consumption' },
            ]
        },
        {
            title: 'Other Reports',
            links: [
                { label: 'Asset Custody & Transfer History', route: '/assets/reports/custody-history' },
                { label: 'Maintenance Team Performance', route: '/assets/reports/team-performance' },
                { label: 'Tax Renewal Expiry Schedule', route: '/assets/reports/tax-expiry' },
                { label: 'Asset Maintenance Cost Analysis', route: '/assets/reports/cost-analysis' },
            ]
        }
    ];

    return (
        <div className="p-6 space-y-8 bg-background min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Assets & Maintenance EAM Workspace</h1>
                    <p className="text-sm text-muted-foreground">Kelola siklus aset, lokasi peta geolocation, pemeliharaan (PM & Work Orders), dan log kepatuhan</p>
                </div>
            </div>

            {/* Top KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {kpis.map((kpi, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm flex flex-col justify-between hover:border-primary/30 transition-colors">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">{kpi.label}</span>
                            <div className={`w-10 h-10 rounded-xl ${kpi.color} flex items-center justify-center`}>
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
