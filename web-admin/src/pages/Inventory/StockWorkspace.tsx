import { useNavigate } from 'react-router-dom';
import {
    Package, ArrowUpRight, BarChart2, Layers
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../../api/inventory';

interface SubmenuLink {
    label: string;
    route: string;
}

interface SectionCard {
    title: string;
    links: SubmenuLink[];
}

export default function StockWorkspace() {
    const navigate = useNavigate();

    // Default company ID
    const companyId = '75d1be11-9669-42b7-a39f-26ec0398f6d6';

    const { data: dashboardKpi } = useQuery({
        queryKey: ['inventory', 'dashboard-kpi', companyId],
        queryFn: () => inventoryApi.getStockDashboardKpi(companyId)
    });

    // Top KPIs
    const kpis = [
        { 
            label: 'Total Stock Valuation', 
            value: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(dashboardKpi?.total_stock_valuation || 0), 
            change: 'Realtime inventory value', 
            icon: Package 
        },
        { 
            label: 'Total Warehouses', 
            value: (dashboardKpi?.total_warehouses || 0).toString(), 
            change: 'Active locations & bins', 
            icon: Layers 
        },
        { 
            label: 'Low Stock Items', 
            value: `${dashboardKpi?.low_stock_items || 0} Items`, 
            change: 'Reorder point alerts', 
            icon: BarChart2 
        },
    ];

    // 6 ERPNext Stock Section Cards
    const sections: SectionCard[] = [
        {
            title: 'Stock Transactions',
            links: [
                { label: 'Stock Entry', route: '/stock-entry' },
                { label: 'Delivery Note', route: '/delivery-notes' },
                { label: 'Purchase Receipt', route: '/purchase-receipt' },
                { label: 'Material Request', route: '/material-request' },
                { label: 'Pick List', route: '/pick-lists' },
                { label: 'Delivery Trip', route: '/delivery-trip' },
                { label: 'Stock Reconciliation', route: '/stock-opname' },
                { label: 'Landed Cost Voucher', route: '/landed-cost-vouchers' },
            ]
        },
        {
            title: 'Items & Pricing',
            links: [
                { label: 'Item', route: '/inventory-items' },
                { label: 'Item Group', route: '/inventory-categories' },
                { label: 'Product Bundle', route: '/stock-product-bundles' },
                { label: 'Item Alternative', route: '/item-alternatives' },
                { label: 'Item Manufacturer', route: '/item-manufacturers' },
                { label: 'Manufacturer', route: '/manufacturers' },
            ]
        },
        {
            title: 'Serial No and Batch',
            links: [
                { label: 'Serial No', route: '/serial-numbers' },
                { label: 'Batch', route: '/batches' },
                { label: 'Installation Note', route: '/installation-notes' },
            ]
        },
        {
            title: 'Settings & Setup',
            links: [
                { label: 'Stock Settings', route: '/stock-settings' },
                { label: 'Warehouse', route: '/warehouses' },
                { label: 'Brand', route: '/brands' },
                { label: 'Item Attribute', route: '/item-attributes' },
                { label: 'UOM', route: '/uoms' },
                { label: 'UOM Conversion Factor', route: '/uom-conversions' },
                { label: 'Item Tax Template', route: '/stock-tax-templates' },
            ]
        },
        {
            title: 'Key Reports',
            links: [
                { label: 'Stock Ledger', route: '/stock-ledger' },
                { label: 'Stock Balance', route: '/stock-balance' },
                { label: 'Stock Summary', route: '/stock-summary' },
                { label: 'Stock Ageing', route: '/stock-ageing' },
                { label: 'Stock Projected Qty', route: '/stock-projected-qty' },
            ]
        },
        {
            title: 'Other Reports',
            links: [
                { label: 'Stock Analytics', route: '/stock-analytics' },
                { label: 'Batch-wise Balance History', route: '/batch-wise-balance' },
                { label: 'Serial No Status', route: '/serial-no-status' },
                { label: 'Item Shortage Report', route: '/item-shortage-report' },
            ]
        }
    ];

    return (
        <div className="p-6 space-y-8 bg-background min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Stock Workspace</h1>
                    <p className="text-sm text-muted-foreground">Kelola pergudangan, pergerakan stok, nomor seri, batch, dan laporan stok barang</p>
                </div>
            </div>

            {/* Top KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {kpis.map((kpi, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">{kpi.label}</span>
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
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
                        <div key={secIdx} className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm hover:border-orange-500/40 transition-colors">
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
                                            <span className="text-sm text-foreground/80 group-hover:text-orange-500 transition-colors flex items-center gap-1.5">
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
