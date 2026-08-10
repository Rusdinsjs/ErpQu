// MainLayout - Pure Tailwind
import { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useNavigationStore } from '../../store/useNavigationStore';
import {
    LayoutGrid, LayoutDashboard, Box, Wrench, Wallet, Building2, Settings,
    LogOut, Menu, ChevronLeft, ChevronRight, ChevronDown
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { NotificationBell } from '../Header/NotificationBell';
import { AvatarUpload } from '../AvatarUpload';
import { AIChatWidget } from '../AI/AIChatWidget';

export function MainLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const [openMenus, setOpenMenus] = useState<string[]>([
        '/assets-module', '/ops-module', '/selling-module', '/buying-module', '/stock-module', '/finance-module', '/finance'
    ]);

    const toggleMenu = (path: string) => {
        setOpenMenus(prev =>
            prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
        );
    };

    useEffect(() => {
        navItems.forEach(item => {
            if (item.children && item.children.some((c: any) => location.pathname === c.path || location.pathname.startsWith(c.path + '/'))) {
                setOpenMenus(prev => prev.includes(item.path) ? prev : [...prev, item.path]);
            }
        });
    }, [location.pathname]);
    const logout = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);
    const hasPermission = useAuthStore((state) => state.hasPermission);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const ROUTE_TO_RESOURCE: Record<string, string> = {
        '/assets': 'asset',
        '/assets/lifecycle': 'asset',
        '/categories': 'category',
        '/locations': 'location',
        '/conversions': 'conversion',
        '/work-orders': 'work_order',
        '/maintenance-templates': 'maintenance',
        '/fuel': 'fuel',
        '/rentals': 'rental',
        '/loans': 'loan',
        '/inventory': 'inventory',
        '/tax-renewals': 'tax_renewal',
        '/finance': 'finance',
        '/finance/expenses': 'finance',
        '/finance/invoices': 'finance',
        '/finance/bills': 'finance',
        '/finance/reports': 'finance',
        '/employees': 'employee',
        '/departments': 'department',
        '/clients': 'client',
        '/attendance': 'attendance',
        '/leaves': 'leave',
        '/approvals': 'approval',
        '/reports': 'report',
        '/users': 'user',
        '/roles': 'role',
        '/audit': 'audit',
        '/settings': 'setting',
    };

    const canAccessRoutePath = (path: string, minLevel: number = 5): boolean => {
        if (!user) return false;
        if (user.role_level <= 2) return true; // Admin/Super Admin bypass

        const resource = ROUTE_TO_RESOURCE[path];
        if (!resource) return user.role_level <= minLevel;

        if (path === '/users') {
            return hasPermission('user.create') || hasPermission('user.update') || hasPermission('user.delete') || hasPermission('user.*') || hasPermission('user.read') || hasPermission('user.view');
        }

        return (
            hasPermission(`${resource}.read`) ||
            hasPermission(`${resource}.view`) ||
            hasPermission(`${resource}.*`) ||
            user.role_level <= minLevel
        );
    };

    const navItems = [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/', minLevel: 5 },

        // MODUL ASSETS
        {
            label: 'Asset Management',
            icon: Box,
            path: '/assets-module',
            minLevel: 5,
            children: [
                { label: 'All Assets', path: '/assets', minLevel: 5 },
                { label: 'Lifecycle (Audit)', path: '/assets/lifecycle', minLevel: 4 },
                { label: 'Categories', path: '/categories', minLevel: 4 },
                { label: 'Locations', path: '/locations', minLevel: 4 },
            ]
        },

        // MODUL OPERATIONS
        {
            label: 'Operations',
            icon: Wrench,
            path: '/ops-module',
            minLevel: 5,
            children: [
                { label: 'Work Orders', path: '/work-orders', minLevel: 5 },
                { label: 'Maint. Templates', path: '/maintenance-templates', minLevel: 3 },
                { label: 'Fuel Management', path: '/fuel', minLevel: 4 },
                { label: 'Rentals', path: '/rentals', minLevel: 4 },
                { label: 'Internal Loans', path: '/loans', minLevel: 5 },
                { label: 'Inventory / Parts', path: '/inventory', minLevel: 4 },
                { label: 'Tax & Documents', path: '/tax-renewals', minLevel: 3 },
            ]
        },

        // MODUL COMMERCIAL & SELLING
        {
            label: 'Commercial & Selling',
            icon: Wallet,
            path: '/selling-module',
            minLevel: 4,
            children: [
                { label: 'Selling Workspace', path: '/selling-workspace', minLevel: 4 },
                { label: 'Customers', path: '/customers', minLevel: 4 },
                { label: 'Quotations', path: '/quotations', minLevel: 4 },
                { label: 'Sales Orders', path: '/sales-orders', minLevel: 4 },
                { label: 'Sales Invoices', path: '/sales-invoices', minLevel: 3 },
                { label: 'Blanket Orders', path: '/blanket-orders', minLevel: 3 },
                { label: 'Sales Partners', path: '/sales-partners', minLevel: 3 },
                { label: 'Sales Persons', path: '/sales-persons', minLevel: 3 },
                { label: 'POS Profiles', path: '/pos-profiles', minLevel: 3 },
                { label: 'POS Settings', path: '/pos-settings', minLevel: 2 },
                { label: 'POS Opening Entry', path: '/pos-opening', minLevel: 4 },
                { label: 'POS Closing Entry', path: '/pos-closing', minLevel: 4 },
                { label: 'Loyalty Programs', path: '/loyalty-programs', minLevel: 3 },
                { label: 'Loyalty Points Entry', path: '/loyalty-points', minLevel: 4 },
                { label: 'Items & Pricing', path: '/items', minLevel: 4 },
                { label: 'Item Prices', path: '/item-prices', minLevel: 3 },
                { label: 'Price Lists', path: '/price-lists', minLevel: 3 },
                { label: 'Product Bundles', path: '/product-bundles', minLevel: 3 },
                { label: 'Promotional Schemes', path: '/promotional-schemes', minLevel: 3 },
                { label: 'Pricing Rules', path: '/pricing-rules', minLevel: 3 },
                { label: 'Shipping Rules', path: '/shipping-rules', minLevel: 3 },
                { label: 'Coupon Codes', path: '/coupon-codes', minLevel: 3 },
                { label: 'Selling Settings', path: '/selling-settings', minLevel: 2 },
                { label: 'Terms & Conditions', path: '/terms-templates', minLevel: 3 },
                { label: 'Sales Taxes Templates', path: '/tax-templates', minLevel: 3 },
                { label: 'UTM Sources', path: '/utm-sources', minLevel: 3 },
                { label: 'Customer Groups', path: '/customer-groups', minLevel: 3 },
                { label: 'Contacts', path: '/contacts', minLevel: 4 },
                { label: 'Addresses', path: '/addresses', minLevel: 4 },
                { label: 'Territories', path: '/territories', minLevel: 3 },
                { label: 'Campaigns', path: '/campaigns', minLevel: 3 },
                { label: 'Sales Analytics', path: '/sales-analytics', minLevel: 3 },
                { label: 'Sales Order Analysis', path: '/so-analysis', minLevel: 3 },
                { label: 'Sales Funnel', path: '/sales-funnel', minLevel: 3 },
                { label: 'Sales Order Trends', path: '/so-trends', minLevel: 3 },
                { label: 'Quotation Trends', path: '/quotation-trends', minLevel: 3 },
                { label: 'Customer Acquisition', path: '/customer-acquisition', minLevel: 3 },
                { label: 'Inactive Customers', path: '/inactive-customers', minLevel: 3 },
                { label: 'Sales Person Summary', path: '/salesperson-summary', minLevel: 3 },
                { label: 'Item Sales History', path: '/item-sales-history', minLevel: 3 },
                { label: 'Customer Directory', path: '/customer-directory', minLevel: 3 },
                { label: 'Packing Stock', path: '/packing-stock', minLevel: 3 },
                { label: 'Pending SO Items for PR', path: '/pending-so-pr', minLevel: 3 },
                { label: 'Delivery Trends', path: '/delivery-trends', minLevel: 3 },
                { label: 'Invoice Trends', path: '/invoice-trends', minLevel: 3 },
                { label: 'Customer Credit Balance', path: '/customer-credit-balance', minLevel: 3 },
                { label: 'Dormant Customers', path: '/dormant-customers', minLevel: 3 },
                { label: 'Partner Commissions', path: '/partner-commissions', minLevel: 3 },
                { label: 'Territory Target Variance', path: '/territory-target-variance', minLevel: 3 },
                { label: 'Sales Person Target Variance', path: '/salesperson-target-variance', minLevel: 3 },
                { label: 'Partner Target Variance', path: '/partner-target-variance', minLevel: 3 },
            ]
        },

        // MODUL PROCUREMENT & BUYING
        {
            label: 'Procurement & Buying',
            icon: ShoppingCart,
            path: '/buying-module',
            minLevel: 4,
            children: [
                { label: 'Buying Workspace', path: '/buying-workspace', minLevel: 4 },
                { label: 'Material Requests', path: '/buying/material-requests', minLevel: 4 },
                { label: 'Purchase Orders', path: '/buying/purchase-orders', minLevel: 4 },
                { label: 'Purchase Bills (Vendor Bills)', path: '/buying/purchase-bills', minLevel: 3 },
                { label: 'Requests for Quotation (RFQ)', path: '/buying/rfqs', minLevel: 4 },
                { label: 'Supplier Quotations', path: '/buying/supplier-quotations', minLevel: 4 },
                { label: 'Suppliers (Vendors)', path: '/buying/suppliers', minLevel: 4 },
                { label: 'Supplier Groups', path: '/buying/supplier-groups', minLevel: 3 },
                { label: 'Supplier Contacts', path: '/buying/supplier-contacts', minLevel: 4 },
                { label: 'Supplier Addresses', path: '/buying/supplier-addresses', minLevel: 4 },
                { label: 'Item Prices (Buying)', path: '/buying/item-prices', minLevel: 3 },
                { label: 'Price Lists (Buying)', path: '/buying/price-lists', minLevel: 3 },
                { label: 'Product Bundles', path: '/buying/product-bundles', minLevel: 3 },
                { label: 'Item Groups', path: '/inventory-categories', minLevel: 3 },
                { label: 'Promotional Schemes', path: '/buying/promotional-schemes', minLevel: 3 },
                { label: 'Pricing Rules', path: '/buying/pricing-rules', minLevel: 3 },
                { label: 'Buying Settings', path: '/buying/settings', minLevel: 2 },
                { label: 'Purchase Taxes Templates', path: '/buying/tax-templates', minLevel: 3 },
                { label: 'Terms & Conditions Template', path: '/buying/terms-templates', minLevel: 3 },
                { label: 'Supplier Scorecard', path: '/buying/supplier-scorecards', minLevel: 3 },
                { label: 'Scorecard Variables', path: '/buying/scorecard-variables', minLevel: 3 },
                { label: 'Scorecard Criteria', path: '/buying/scorecard-criteria', minLevel: 3 },
                { label: 'Scorecard Standings', path: '/buying/scorecard-standings', minLevel: 3 },
                { label: 'Purchase Analytics', path: '/buying/reports/purchase-analytics', minLevel: 3 },
                { label: 'Purchase Order Analysis', path: '/buying/reports/po-analysis', minLevel: 3 },
                { label: 'Item Wise Consumption', path: '/buying/reports/item-consumption', minLevel: 3 },
                { label: 'Items to Order and Receive', path: '/buying/reports/items-to-order-receive', minLevel: 3 },
                { label: 'Purchase Order Trends', path: '/buying/reports/po-trends', minLevel: 3 },
                { label: 'Procurement Tracker', path: '/buying/reports/procurement-tracker', minLevel: 3 },
                { label: 'Items To Be Requested', path: '/buying/reports/items-to-request', minLevel: 3 },
                { label: 'Item-wise Purchase History', path: '/buying/reports/item-purchase-history', minLevel: 3 },
                { label: 'Purchase Receipt Trends', path: '/buying/reports/receipt-trends', minLevel: 3 },
                { label: 'Purchase Invoice Trends', path: '/buying/reports/invoice-trends', minLevel: 3 },
                { label: 'Subcontracted Raw Materials', path: '/buying/reports/subcontract-materials', minLevel: 3 },
                { label: 'Subcontracted Item To Be Received', path: '/buying/reports/subcontract-received', minLevel: 3 },
                { label: 'Supplier Quotation Comparison', path: '/buying/reports/rfq-comparison', minLevel: 3 },
                { label: 'Material Requests for Quote', path: '/buying/reports/pr-to-rfq', minLevel: 3 },
                { label: 'Supplier Addresses & Contacts', path: '/buying/reports/supplier-directory', minLevel: 3 },
                { label: 'Import Supplier Invoice', path: '/buying/reports/import-invoice', minLevel: 3 },
            ]
        },

        // MODUL SUPPLY CHAIN & INVENTORY
        {
            label: 'Supply Chain & Inventory',
            icon: Package,
            path: '/stock-module',
            minLevel: 4,
            children: [
                { label: 'Stock Workspace', path: '/stock-workspace', minLevel: 4 },
                { label: 'Items', path: '/inventory-items', minLevel: 4 },
                { label: 'Item Groups', path: '/inventory-categories', minLevel: 4 },
                { label: 'Stock Entry', path: '/stock-entry', minLevel: 4 },
                { label: 'Delivery Notes (Surat Jalan)', path: '/delivery-notes', minLevel: 4 },
                { label: 'Purchase Receipts (GRN)', path: '/purchase-receipt', minLevel: 4 },
                { label: 'Material Request', path: '/material-request', minLevel: 4 },
                { label: 'Pick Lists', path: '/pick-lists', minLevel: 3 },
                { label: 'Delivery Trips', path: '/delivery-trip', minLevel: 4 },
                { label: 'Stock Reconciliation (Opname)', path: '/stock-opname', minLevel: 3 },
                { label: 'Landed Cost Vouchers', path: '/landed-cost-vouchers', minLevel: 3 },
                { label: 'Product Bundles', path: '/stock/product-bundles', minLevel: 3 },
                { label: 'Item Alternatives', path: '/stock/item-alternatives', minLevel: 3 },
                { label: 'Item Manufacturers', path: '/stock/item-manufacturers', minLevel: 3 },
                { label: 'Manufacturers', path: '/stock/manufacturers', minLevel: 3 },
                { label: 'Serial Numbers', path: '/stock/serial-numbers', minLevel: 3 },
                { label: 'Batches', path: '/stock/batches', minLevel: 3 },
                { label: 'Installation Notes', path: '/stock/installation-notes', minLevel: 3 },
                { label: 'Stock Settings', path: '/stock/settings', minLevel: 2 },
                { label: 'Warehouses', path: '/warehouses', minLevel: 3 },
                { label: 'Brands', path: '/stock/brands', minLevel: 3 },
                { label: 'Item Attributes', path: '/stock/item-attributes', minLevel: 3 },
                { label: 'Units of Measure (UOM)', path: '/stock/uoms', minLevel: 3 },
                { label: 'UOM Conversion Factors', path: '/stock/uom-conversions', minLevel: 3 },
                { label: 'Item Tax Templates', path: '/stock/tax-templates', minLevel: 3 },
                { label: 'Stock Ledger', path: '/stock/reports/stock-ledger', minLevel: 3 },
                { label: 'Stock Balance', path: '/stock/reports/stock-balance', minLevel: 3 },
                { label: 'Stock Summary', path: '/stock/reports/stock-summary', minLevel: 3 },
                { label: 'Stock Ageing', path: '/stock/reports/stock-ageing', minLevel: 3 },
                { label: 'Stock Projected Qty', path: '/stock/reports/projected-qty', minLevel: 3 },
                { label: 'Stock Analytics', path: '/stock/reports/stock-analytics', minLevel: 3 },
                { label: 'Batch-wise Balance History', path: '/stock/reports/batch-balance', minLevel: 3 },
                { label: 'Serial No Status', path: '/stock/reports/serial-status', minLevel: 3 },
                { label: 'Item Shortage Report', path: '/stock/reports/item-shortage', minLevel: 3 },
            ]
        },

        // MODUL FINANCE & ACCOUNTING
        {
            label: 'Finance & Accounting',
            icon: Wallet,
            path: '/finance-module',
            minLevel: 2,
            children: [
                { label: 'Accounting Workspace', path: '/accounting-workspace', minLevel: 2 },
                { label: 'Chart of Accounts', path: '/finance', minLevel: 2 },
                { label: 'Cash & Bank', path: '/cash-bank', minLevel: 2 },
                { label: 'Journal Entry', path: '/accounting/journal-entries', minLevel: 2 },
                { label: 'Payment Entry', path: '/accounting/payment-entries', minLevel: 2 },
                { label: 'Payment Reconciliation', path: '/accounting/payment-reconciliation', minLevel: 2 },
                { label: 'Sales Invoices', path: '/finance/invoices', minLevel: 2 },
                { label: 'Purchase Bills', path: '/finance/bills', minLevel: 2 },
                { label: 'Credit Notes', path: '/accounting/credit-notes', minLevel: 2 },
                { label: 'Debit Notes', path: '/accounting/debit-notes', minLevel: 2 },
                { label: 'Dunning (Surat Tagihan)', path: '/accounting/dunnings', minLevel: 2 },
                { label: 'Bank Accounts', path: '/accounting/bank-accounts', minLevel: 2 },
                { label: 'Bank Transactions', path: '/accounting/bank-transactions', minLevel: 2 },
                { label: 'Bank Clearance', path: '/accounting/bank-clearance', minLevel: 2 },
                { label: 'Cashier Closing Entry', path: '/accounting/cashier-closing', minLevel: 2 },
                { label: 'Expenses (Opex/Capex)', path: '/finance/expenses', minLevel: 2 },
                { label: 'Cost Center', path: '/accounting/cost-centers', minLevel: 2 },
                { label: 'Accounting Dimension', path: '/accounting/dimensions', minLevel: 2 },
                { label: 'Budget', path: '/accounting/budgets', minLevel: 2 },
                { label: 'Sales Taxes Template', path: '/accounting/sales-tax-templates', minLevel: 2 },
                { label: 'Purchase Taxes Template', path: '/accounting/purchase-tax-templates', minLevel: 2 },
                { label: 'Tax Category & Rules', path: '/accounting/tax-rules', minLevel: 2 },
                { label: 'Balance Sheet (Neraca)', path: '/accounting/reports/balance-sheet', minLevel: 2 },
                { label: 'Profit and Loss Statement', path: '/accounting/reports/profit-loss', minLevel: 2 },
                { label: 'Cash Flow Statement', path: '/accounting/reports/cash-flow', minLevel: 2 },
                { label: 'Trial Balance (Neraca Saldo)', path: '/accounting/reports/trial-balance', minLevel: 2 },
                { label: 'General Ledger Report', path: '/accounting/reports/general-ledger', minLevel: 2 },
                { label: 'Accounts Receivable (AR) Aging', path: '/accounting/reports/ar-aging', minLevel: 2 },
                { label: 'Accounts Payable (AP) Aging', path: '/accounting/reports/ap-aging', minLevel: 2 },
            ]
        },

        // MODUL HR / CORE
        {
            label: 'Organization',
            icon: Building2,
            path: '/hr-module',
            minLevel: 4,
            children: [
                { label: 'Employees', path: '/employees', minLevel: 4 },
                { label: 'Departments', path: '/departments', minLevel: 3 },
                { label: 'Clients', path: '/clients', minLevel: 4 },
                { label: 'Attendance', path: '/attendance', minLevel: 4 },
                { label: 'Leaves', path: '/leaves', minLevel: 4 },
            ]
        },

        // SYSTEM / ADMIN
        {
            label: 'System',
            icon: Settings,
            path: '/system-module',
            minLevel: 5,
            children: [
                { label: 'Approval Center', path: '/approvals', minLevel: 3 }, // Managers need this
                { label: 'Reports Center', path: '/reports', minLevel: 3 },
                { label: 'User Management', path: '/users', minLevel: 2 },
                { label: 'Access Rights (RBAC)', path: '/roles', minLevel: 1 },
                { label: 'Audit Logs', path: '/audit', minLevel: 2 },
                { label: 'Settings', path: '/settings', minLevel: 2 },
            ]
        },
    ];

    // Filter items based on granular permissions & asset group restrictions
    const filteredNavItems = navItems.filter(item => {
        if (item.children) {
            item.children = item.children.filter(child => {
                const childLevel = (child as any).minLevel ?? 5;
                const hasAssetRestriction = user && !!user.allowed_asset_group;

                if (hasAssetRestriction && ['/categories', '/locations'].includes(child.path)) {
                    return false;
                }

                return canAccessRoutePath(child.path, childLevel);
            });
            // Keep parent if at least one child is accessible
            return item.children.length > 0;
        }

        return canAccessRoutePath(item.path, item.minLevel ?? 5);
    });



    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {/* Sidebar Desktop */}
            <aside
                className={`
                    hidden md:flex flex-col bg-card/60 backdrop-blur-xl border-r border-border/50 transition-all duration-300 shadow-xl
                    ${collapsed ? 'w-20' : 'w-72'}
                `}
            >
                <div className="h-16 flex items-center px-6 border-b border-border shrink-0 overflow-hidden whitespace-nowrap">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xl shrink-0">
                            E
                        </div>
                        <span className={`font-bold text-lg text-foreground transition-opacity duration-300 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                            ERPQu
                        </span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {/* Back to Launchpad Button */}
                    <div className="mb-4 pb-4 border-b border-border/30">
                        <button
                            onClick={() => { useNavigationStore.getState().setActiveModule(null); navigate('/launchpad'); }}
                            className={`
                                w-full flex items-center gap-3 px-4 py-3 rounded-xl text-primary hover:bg-primary/10 transition-all duration-300 font-medium group
                                ${collapsed ? 'justify-center' : ''}
                            `}
                            title={collapsed ? 'Launchpad' : undefined}
                        >
                            <LayoutGrid size={20} strokeWidth={1.5} className="shrink-0 transition-transform group-hover:scale-110" />
                            <span className={`whitespace-nowrap transition-all duration-300 ${collapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                                App Launcher
                            </span>
                        </button>
                    </div>
                    {filteredNavItems.map((item: any) => {
                        const hasChildren = item.children && item.children.length > 0;
                        const isMenuOpen = openMenus.includes(item.path);
                        const fullCurrentPath = location.pathname + location.search;
                        const active = location.pathname === item.path || (hasChildren && item.children.some((c: any) => fullCurrentPath === c.path || location.pathname.startsWith(c.path + '/')));

                        return (
                            <div key={item.path} className="space-y-1">
                                <button
                                    onClick={() => {
                                        if (hasChildren && !collapsed) {
                                            toggleMenu(item.path);
                                        } else {
                                            navigate(item.path);
                                        }
                                    }}
                                    className={`
                                        w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-300 group
                                        ${active 
                                            ? 'bg-gradient-to-r from-primary/15 to-transparent text-primary shadow-sm border-l-2 border-primary -ml-0.5' 
                                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground border-l-2 border-transparent -ml-0.5'
                                        }
                                        ${collapsed ? 'justify-center ml-0 border-none' : ''}
                                    `}
                                    title={collapsed ? item.label : undefined}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon size={20} strokeWidth={1.5} className={active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground transition-colors'} />
                                        <span className={`whitespace-nowrap font-medium transition-all duration-300 ${collapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                                            {item.label}
                                        </span>
                                    </div>
                                    {hasChildren && !collapsed && (
                                        <ChevronDown size={14} className={`transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                                    )}
                                </button>

                                {hasChildren && isMenuOpen && !collapsed && (
                                    <div className="pl-11 space-y-1 my-1 overflow-hidden transition-all duration-300 animate-in slide-in-from-top-2">
                                        {item.children.map((child: any) => {
                                            const childActive = fullCurrentPath === child.path || location.pathname.startsWith(child.path + '/');
                                            return (
                                                <button
                                                    key={child.path}
                                                    onClick={() => navigate(child.path)}
                                                    className={`
                                                        w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200
                                                        ${childActive ? 'text-primary font-medium bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}
                                                    `}
                                                >
                                                    {child.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="p-3 border-t border-border space-y-1">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className={`
                            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors
                            ${collapsed ? 'justify-center' : ''}
                        `}
                    >
                        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                        <span className={`whitespace-nowrap transition-all duration-300 ${collapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                            Collapse
                        </span>
                    </button>

                    <button
                        onClick={handleLogout}
                        className={`
                            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-900/20 transition-colors
                            ${collapsed ? 'justify-center' : ''}
                        `}
                    >
                        <LogOut size={20} strokeWidth={1.5} className="shrink-0" />
                        <span className={`whitespace-nowrap transition-all duration-300 ${collapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                            Logout
                        </span>
                    </button>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
            )}

            {/* Mobile Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border transform transition-transform duration-300 md:hidden flex flex-col
                    ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <div className="h-16 flex items-center justify-between px-6 border-b border-border">
                    <span className="font-bold text-lg text-foreground">Asset Manager</span>
                    <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400">
                        <ChevronLeft size={24} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                    {/* Back to Launchpad Button Mobile */}
                    <div className="mb-4 pb-4 border-b border-border/50">
                        <button
                            onClick={() => { useNavigationStore.getState().setActiveModule(null); navigate('/launchpad'); setMobileMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-primary hover:bg-primary/10 transition-colors font-medium"
                        >
                            <LayoutGrid size={20} />
                            <span>App Launcher</span>
                        </button>
                    </div>
                    {filteredNavItems.map((item: any) => {
                        const hasChildren = item.children && item.children.length > 0;
                        const isMenuOpen = openMenus.includes(item.path);
                        const fullCurrentPath = location.pathname + location.search;
                        const active = location.pathname === item.path || (hasChildren && item.children.some((c: any) => fullCurrentPath === c.path || location.pathname.startsWith(c.path + '/')));

                        return (
                            <div key={item.path} className="space-y-1">
                                <button
                                    onClick={() => {
                                        if (hasChildren) {
                                            toggleMenu(item.path);
                                        } else {
                                            navigate(item.path);
                                            setMobileMenuOpen(false);
                                        }
                                    }}
                                    className={`
                                        w-full flex items-center justify-between px-3 py-3 rounded-lg transition-colors
                                        ${active
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted-foreground hover:bg-muted'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon size={20} />
                                        <span>{item.label}</span>
                                    </div>
                                    {hasChildren && (
                                        <ChevronDown size={14} className={`transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                                    )}
                                </button>

                                {hasChildren && isMenuOpen && (
                                    <div className="pl-9 space-y-1">
                                        {item.children.map((child: any) => {
                                            const childActive = fullCurrentPath === child.path;
                                            return (
                                                <button
                                                    key={child.path}
                                                    onClick={() => {
                                                        navigate(child.path);
                                                        setMobileMenuOpen(false);
                                                    }}
                                                    className={`
                                                        w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors
                                                        ${childActive ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:bg-muted/50'}
                                                    `}
                                                >
                                                    {child.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-400 hover:bg-red-900/20 mt-4"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full min-w-0 bg-background">
                {/* Header */}
                <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-border/50 bg-card/60 backdrop-blur-xl shrink-0 shadow-sm relative z-10">
                    <div className="flex items-center gap-4">
                        <button
                            className="md:hidden text-slate-400 hover:text-white"
                            onClick={() => setMobileMenuOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                        <h2 className="text-lg font-semibold text-foreground md:hidden">Asset Manager</h2>
                        {/* Breadcrumbs or Page Title could go here */}
                    </div>

                    <div className="flex items-center gap-6">
                        <NotificationBell />

                        <div className="flex items-center gap-3 text-sm">
                            <div className="text-right hidden sm:block">
                                <p className="text-foreground font-medium">{user?.name}</p>
                                <p className="text-muted-foreground text-xs text-right capitalize">{(user as any)?.role_name || user?.role}</p>
                            </div>
                            <AvatarUpload size="sm" />
                        </div>
                    </div>
                </header>

                {/* Main Viewport */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                    <Outlet />
                </main>
                <AIChatWidget />
            </div>
        </div>
    );
}
