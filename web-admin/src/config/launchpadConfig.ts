// Launchpad Configuration — Types & Default Config
// This defines the mapping between Launchpad module cards and sidebar menu items.
// The config is stored in backend settings (key: 'launchpad_config') and can be
// customized by admins via Settings UI.

// ─── All available menu IDs in the application ───────────────────────────────
export type MenuId =
    | 'dashboard' | 'analytics' | 'reports'
    | 'assets' | 'asset-lifecycle' | 'categories' | 'locations' | 'asset-audit'
    | 'work-orders' | 'conversions' | 'maintenance-schedules' | 'maintenance-templates' | 'maintenance-teams'
    | 'fuel' | 'loans' | 'tax-renewals'
    | 'rentals' | 'contracts' | 'contract-templates' | 'clients'
    | 'sales-invoices'
    | 'inventory-items' | 'inventory-categories' | 'stock-opname' | 'stock-entry' | 'material-request' | 'quality-inspection' | 'delivery-trip' | 'warehouses'
    | 'purchase-bills' | 'purchase-receipt'
    | 'finance' | 'cash-bank' | 'expenses' | 'journal-entries' | 'financial-reports'
    | 'employees' | 'departments' | 'attendance' | 'leaves'
    | 'approvals'
    | 'company' | 'branch' | 'email-account'
    | 'users' | 'roles' | 'approval-workflow-settings' | 'audit' | 'settings' | 'profile';

// ─── Launchpad Module Config Shape ───────────────────────────────────────────
export interface LaunchpadModuleConfig {
    id: string;
    title: string;
    subtitle: string;
    icon: string;           // Lucide icon name
    gradient: string;       // Tailwind gradient classes
    iconBg: string;         // Icon background gradient
    defaultRoute: string;   // Route when clicking the card
    minLevel: number;       // Minimum role level to see this card
    features: string[];     // 3 bullet-point descriptions for the card
    menuIds: MenuId[];      // Sidebar menu IDs belonging to this module
    order: number;          // Display order
    enabled: boolean;       // Whether this module is active
}

export interface LaunchpadConfig {
    modules: LaunchpadModuleConfig[];
    globalMenuIds: MenuId[];  // Menus that ALWAYS appear regardless of active module
}

// ─── Menu Label Registry ─────────────────────────────────────────────────────
// Used by Settings UI to display human-readable names for menu IDs
export const MENU_LABELS: Record<MenuId, string> = {
    'dashboard': 'Dashboard Overview',
    'analytics': 'Performance Analytics',
    'reports': 'Management Reports',
    'assets': 'All Assets',
    'asset-lifecycle': 'Asset Lifecycle',
    'categories': 'Asset Categories',
    'locations': 'Locations',
    'asset-audit': 'Asset Audit',
    'work-orders': 'Work Orders',
    'conversions': 'Conversions',
    'maintenance-schedules': 'PM Schedules',
    'maintenance-templates': 'Maintenance SOP',
    'maintenance-teams': 'Maintenance Teams',
    'fuel': 'Fuel Management',
    'loans': 'Internal Loans',
    'tax-renewals': 'Tax & Documents',
    'rentals': 'Rental Orders',
    'contracts': 'Contracts',
    'contract-templates': 'Contract Templates',
    'clients': 'Clients / Partners',
    'sales-invoices': 'Sales Invoices',
    'inventory-items': 'Inventory Items',
    'inventory-categories': 'Inventory Categories',
    'warehouses': 'Warehouses & Bins',
    'stock-opname': 'Stock Opname',
    'stock-entry': 'Stock Entry',
    'material-request': 'Material Request',
    'quality-inspection': 'Quality Inspection',
    'delivery-trip': 'Delivery Trips',
    'purchase-bills': 'Vendor Bills',
    'purchase-receipt': 'Purchase Receipts (GRN)',
    'finance': 'Chart of Accounts',
    'cash-bank': 'Cash & Bank',
    'expenses': 'Expenses (Opex/Capex)',
    'journal-entries': 'Journal Entries',
    'financial-reports': 'Financial Reports',
    'employees': 'Employees',
    'departments': 'Departments',
    'attendance': 'Attendance',
    'leaves': 'Leaves',
    'approvals': 'Approval Center',
    'company': 'Company Management',
    'branch': 'Branch Management',
    'email-account': 'Email Accounts',
    'users': 'User Operations',
    'roles': 'Access Rights',
    'approval-workflow-settings': 'Workflows',
    'audit': 'Audit Logs',
    'settings': 'App Settings',
    'profile': 'My Profile',
};

// ─── Resource Mapping (Frontend MenuId to Backend RBAC Resource) ─────────────
export const MENU_TO_RESOURCE: Record<MenuId, string> = {
    'dashboard': 'dashboard',
    'analytics': 'analytics',
    'reports': 'report',
    'assets': 'asset',
    'asset-lifecycle': 'asset_lifecycle',
    'categories': 'categories',
    'locations': 'location',
    'asset-audit': 'asset_audit',
    'work-orders': 'work_order',
    'conversions': 'conversion',
    'maintenance-schedules': 'preventive_schedule',
    'maintenance-templates': 'maintenance_template',
    'maintenance-teams': 'work_order',
    'fuel': 'fuel',
    'loans': 'loan',
    'tax-renewals': 'tax_document',
    'rentals': 'rental',
    'contracts': 'contract',
    'contract-templates': 'contract_template',
    'clients': 'client',
    'sales-invoices': 'sales_invoice',
    'inventory-items': 'inventory',
    'inventory-categories': 'inventory_category',
    'warehouses': 'inventory',
    'stock-opname': 'stock_opname',
    'stock-entry': 'inventory',
    'material-request': 'inventory',
    'quality-inspection': 'quality_inspection',
    'delivery-trip': 'delivery_trip',
    'purchase-bills': 'purchase_bill',
    'purchase-receipt': 'purchase_bill',
    'finance': 'finance',
    'cash-bank': 'cash_bank',
    'expenses': 'expense',
    'journal-entries': 'journal',
    'financial-reports': 'financial_report',
    'employees': 'employee',
    'departments': 'department',
    'attendance': 'attendance',
    'leaves': 'leave',
    'approvals': 'approval_center',
    'company': 'company',
    'branch': 'branch',
    'email-account': 'email_account',
    'users': 'user',
    'roles': 'role',
    'approval-workflow-settings': 'approval_workflow',
    'audit': 'audit_log',
    'settings': 'settings',
    'profile': 'profile',
};

// ─── Default Balanced Config ─────────────────────────────────────────────────
export const DEFAULT_LAUNCHPAD_CONFIG: LaunchpadConfig = {
    globalMenuIds: ['profile'],
    modules: [
        {
            id: 'organization',
            title: 'Organization',
            subtitle: 'Entitas & Struktur Organisasi',
            icon: 'Building2',
            gradient: 'from-blue-600/20 to-indigo-600/20',
            iconBg: 'bg-gradient-to-br from-blue-600 to-indigo-600',
            defaultRoute: '/company',
            minLevel: 5,
            features: ['Company & Entity', 'Branch & Departments', 'Users & Access Control'],
            menuIds: ['company', 'branch', 'departments', 'users', 'roles', 'email-account', 'approval-workflow-settings'],
            order: 1,
            enabled: true,
        },
        {
            id: 'insights',
            title: 'Insights & Reporting',
            subtitle: 'Business Intelligence',
            icon: 'BarChart3',
            gradient: 'from-blue-500/20 to-cyan-500/20',
            iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-500',
            defaultRoute: '/dashboard',
            minLevel: 5,
            features: ['Dashboard Overview', 'Analytics', 'Reports'],
            menuIds: ['dashboard', 'analytics', 'reports'],
            order: 2,
            enabled: true,
        },
        {
            id: 'asset-management',
            title: 'Asset Management',
            subtitle: 'Asset Registry & Tracking',
            icon: 'Box',
            gradient: 'from-emerald-500/20 to-teal-500/20',
            iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-500',
            defaultRoute: '/assets',
            minLevel: 5,
            features: ['Asset Registry', 'Asset Categories', 'Lifecycle Tracking', 'Asset Audit'],
            menuIds: ['assets', 'categories', 'asset-lifecycle', 'asset-audit', 'conversions'],
            order: 3,
            enabled: true,
        },
        {
            id: 'field-operations',
            title: 'Field Operations',
            subtitle: 'Maintenance & Services',
            icon: 'Wrench',
            gradient: 'from-amber-500/20 to-orange-500/20',
            iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
            defaultRoute: '/work-orders',
            minLevel: 5,
            features: ['Work Orders & Teams', 'PM Schedules', 'Maintenance SOP', 'Fuel & Tax', 'Internal Loans'],
            menuIds: ['work-orders', 'maintenance-schedules', 'maintenance-templates', 'maintenance-teams', 'fuel', 'tax-renewals', 'loans'],
            order: 4,
            enabled: true,
        },
        {
            id: 'commercial',
            title: 'Commercial & Sales',
            subtitle: 'Clients, Sales & Contracts',
            icon: 'TrendingUp',
            gradient: 'from-violet-500/20 to-purple-500/20',
            iconBg: 'bg-gradient-to-br from-violet-500 to-purple-500',
            defaultRoute: '/sales-invoices',
            minLevel: 4,
            features: ['Client Management', 'Sales Invoices', 'Partner Directory'],
            menuIds: ['clients', 'sales-invoices'],
            order: 5,
            enabled: true,
        },
        {
            id: 'procurement',
            title: 'Procurement & Buying',
            subtitle: 'Vendor Bills & Purchasing',
            icon: 'ShoppingBag',
            gradient: 'from-amber-600/20 to-yellow-600/20',
            iconBg: 'bg-gradient-to-br from-amber-600 to-yellow-600',
            defaultRoute: '/purchase-bills',
            minLevel: 4,
            features: ['Vendor Bills', 'Purchase Orders', 'Supplier Procurement'],
            menuIds: ['purchase-bills', 'purchase-receipt'],
            order: 6,
            enabled: true,
        },
        {
            id: 'rental',
            title: 'Equipment Rental',
            subtitle: 'Heavy Fleet & Asset Rental',
            icon: 'Truck',
            gradient: 'from-cyan-500/20 to-blue-500/20',
            iconBg: 'bg-gradient-to-br from-cyan-500 to-blue-500',
            defaultRoute: '/rentals',
            minLevel: 4,
            features: ['Rental Orders', 'Rental Contracts', 'Contract Templates'],
            menuIds: ['rentals', 'contracts', 'contract-templates'],
            order: 7,
            enabled: true,
        },
        {
            id: 'telemetry',
            title: 'Telemetry & IoT Stream',
            subtitle: 'Live Asset Sensors & Alerts',
            icon: 'Activity',
            gradient: 'from-rose-500/20 to-red-500/20',
            iconBg: 'bg-gradient-to-br from-rose-500 to-red-500',
            defaultRoute: '/dashboard',
            minLevel: 4,
            features: ['IoT Sensor Stream', 'Threshold Alert Engine', 'Asset Health Telemetry'],
            menuIds: ['analytics'],
            order: 8,
            enabled: true,
        },
        {
            id: 'supply-chain',
            title: 'Supply Chain & Inventory',
            subtitle: 'Stock Ledger & Warehouse',
            icon: 'Package',
            gradient: 'from-orange-500/20 to-red-500/20',
            iconBg: 'bg-gradient-to-br from-orange-500 to-red-400',
            defaultRoute: '/inventory-items',
            minLevel: 3,
            features: ['Inventory Control', 'Inventory Categories', 'Stock Opname', 'Stock Entry', 'Material Request', 'Warehouse Bins'],
            menuIds: ['inventory-items', 'inventory-categories', 'warehouses', 'stock-opname', 'stock-entry', 'material-request', 'purchase-receipt', 'quality-inspection', 'delivery-trip'],
            order: 9,
            enabled: true,
        },
        {
            id: 'finance',
            title: 'Finance & Accounting',
            subtitle: 'General Ledger & Cash Flow',
            icon: 'Wallet',
            gradient: 'from-green-500/20 to-emerald-500/20',
            iconBg: 'bg-gradient-to-br from-green-500 to-emerald-500',
            defaultRoute: '/cash-bank',
            minLevel: 2,
            features: ['Cash & Bank', 'Expenses (Opex/Capex)', 'General Ledger & Reports'],
            menuIds: ['finance', 'cash-bank', 'expenses', 'journal-entries', 'financial-reports'],
            order: 10,
            enabled: true,
        },
        {
            id: 'hr',
            title: 'Human Resources',
            subtitle: 'People & Attendance',
            icon: 'Users',
            gradient: 'from-pink-500/20 to-rose-500/20',
            iconBg: 'bg-gradient-to-br from-pink-500 to-rose-500',
            defaultRoute: '/employees',
            minLevel: 3,
            features: ['Employees Directory', 'Attendance Records', 'Leave Requests'],
            menuIds: ['employees', 'attendance', 'leaves'],
            order: 11,
            enabled: true,
        },
        {
            id: 'admin',
            title: 'System Administration',
            subtitle: 'Governance & Workflows',
            icon: 'Settings',
            gradient: 'from-slate-500/20 to-gray-500/20',
            iconBg: 'bg-gradient-to-br from-slate-500 to-gray-500',
            defaultRoute: '/approvals',
            minLevel: 2,
            features: ['Approval Center & Workflows', 'Audit Logs', 'System Settings'],
            menuIds: ['locations', 'approvals', 'audit', 'settings'],
            order: 12,
            enabled: true,
        },
    ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Get all menuIds for a specific module (including global menus) */
export function getMenuIdsForModule(config: LaunchpadConfig, moduleId: string): MenuId[] {
    const mod = config.modules.find(m => m.id === moduleId);
    if (!mod) return [];
    return [...new Set([...mod.menuIds, ...config.globalMenuIds])];
}

/** Get all menuIds across ALL modules (for super admin or fallback) */
export function getAllMenuIds(config: LaunchpadConfig): MenuId[] {
    const allIds = config.modules.flatMap(m => m.menuIds);
    return [...new Set([...allIds, ...config.globalMenuIds])];
}

/** Find which module a given menuId belongs to */
export function findModuleForMenu(config: LaunchpadConfig, menuId: MenuId): LaunchpadModuleConfig | undefined {
    return config.modules.find(m => m.menuIds.includes(menuId));
}
