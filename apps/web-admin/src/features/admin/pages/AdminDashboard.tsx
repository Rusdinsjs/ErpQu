// Admin Dashboard - Main Container with Dark Theme
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, matchPath } from 'react-router-dom';
import { useAuthStore } from'../../../store/useAuthStore';
import { useNavigationStore } from'../../../store/useNavigationStore';
import {
    LayoutDashboard, Package, FolderTree, Users, LogOut, Menu, X,
    FileText, Settings, ChevronDown, ChevronRight, ClipboardCheck,
    Truck, HandMetal, Building2, MapPin, Scan, UserCircle, Clock,
    Calendar as CalendarIcon, ArrowLeftRight, TrendingUp,
    Wallet, ShoppingCart, Receipt, History, Wrench, Fuel, Shield, Layers,
    CheckSquare, Box, ShieldAlert,
    Briefcase, User, FileSpreadsheet,
    Database, Mail, ShoppingBag, Tag, Download, RefreshCw, Lock, CheckCircle2, DollarSign, BarChart2, Activity, Factory, CreditCard, HandCoins, Award, UserPlus, GraduationCap, AlertOctagon
} from 'lucide-react';
import { getImageUrl } from'../../../utils/image';
import { Logo } from'../../../components/ui';
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from'../../settings/api/settings';
import { rbacApi } from'../api/rbac';
import { useTheme } from'../../../contexts/ThemeContext';
import { AIChatWidget } from'../../../components/AI/AIChatWidget';
import { AdminContentRouter } from'../components/AdminContentRouter';
import { AdminHeaderBar } from'../components/AdminHeaderBar';
import type { MenuId, LaunchpadConfig } from'../../../config/launchpadConfig';
import { MENU_TO_RESOURCE, DEFAULT_LAUNCHPAD_CONFIG } from'../../../config/launchpadConfig';
import {
    type TabId,
    type NavItem,
    type NavGroup,
    type NavHeader,
    type NavEntry,
    isNavGroup,
    isNavHeader,
} from'../../../types/navigation';

import { ALL_NAV_ITEMS } from'../../../config/navigationConfig';

export default function AdminDashboard() {
    const { theme, setTheme } = useTheme();
    const [activeTab, setActiveTab] = useState<TabId>('dashboard');
    const { activeModule, setActiveModule, getVisibleMenuIds, launchpadConfig, setLaunchpadConfig } = useNavigationStore();

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };
    const [sidebarOpen, setSidebarOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1024 : true));

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) setSidebarOpen(false);
            else setSidebarOpen(true);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
        asset_operations: true,
        maintenance_group: false,
        hrd_group: false,
        master_data: false,
        rental_group: false,
        finance_group: true,
        inventory_group: false,
        settings_group: false
    });
    const [logoutModalOpen, setLogoutModalOpen] = useState(false);

    // For sub-views that need parameters
    const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null);
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
    const [selectedInventoryId, setSelectedInventoryId] = useState<string | null>(null);
    const [assetViewMode, setAssetViewMode] = useState<'list' | 'lifecycle' | 'details'>('list');
    const [selectedRentalId, setSelectedRentalId] = useState<string | null>(null);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [selectedContractId] = useState<string | null>(null);

    const { user, logout, hasPermission } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (window.innerWidth < 1024) setSidebarOpen(false);
    }, [location.pathname]);

    // Fetch public settings for dynamic branding
    const { data: publicSettings } = useQuery({
        queryKey: ['public-settings'],
        queryFn: settingsApi.getPublic
    });

    // Update document title dynamically
    useEffect(() => {
        if (publicSettings?.app_name) {
            document.title = `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} | ${publicSettings.app_name}`;
        } else {
            document.title = 'Asset Management System';
        }
    }, [activeTab, publicSettings]);

    // Fetch dynamic doctypes
    const { data: dynamicDoctypes = [] } = useQuery({
        queryKey: ['doctypes'],
        queryFn: rbacApi.listDocTypes,
    });

    // Sync backend launchpad_config with navigation store
    useEffect(() => {
        if (publicSettings?.launchpad_config) {
            try {
                const backendConfigStr = typeof publicSettings.launchpad_config === 'string'
                    ? publicSettings.launchpad_config
                    : JSON.stringify(publicSettings.launchpad_config);
                const backendConfig = JSON.parse(backendConfigStr);
                if (backendConfig && Array.isArray(backendConfig.modules)) {
                    if (!backendConfig.modules.some((m: any) => m.id === 'organization')) {
                        backendConfig.modules.unshift(DEFAULT_LAUNCHPAD_CONFIG.modules[0]);
                    }
                    backendConfig.modules = backendConfig.modules.map((m: any) => {
                        if (m.id === 'asset-management') {
                            const ids = (m.menuIds || []).filter((id: string) => id !== 'maintenance-templates');
                            const assetIds: MenuId[] = [
                                'assets-workspace', 'assets', 'categories', 'locations', 'asset-lifecycle', 'asset-audit', 'conversions',
                                'work-orders', 'maintenance-schedules', 'maintenance-templates', 'maintenance-teams',
                                'tax-renewals', 'fuel', 'loans',
                                'asset-settings', 'depreciation-methods', 'maintenance-types',
                                'depreciation-ledger', 'roi-trends', 'condition-distribution', 'workorder-summary', 'fuel-consumption',
                                'custody-history', 'team-performance', 'tax-expiry', 'cost-analysis', 
                                'iot-sensor-stream', 'asset-health-telemetry', 'threshold-alerts'
                            ];
                            assetIds.forEach(id => {
                                if (!ids.includes(id)) ids.push(id);
                            });
                            return { ...m, menuIds: ids, defaultRoute: '/assets-workspace' };
                        }
                        if (m.id === 'commercial') {
                            const ids = (m.menuIds || []).filter((id: string) => id !== 'purchase-bills' && id !== 'contracts');
                            const sellingIds: MenuId[] = [
                                'selling-workspace', 'customers', 'quotations', 'sales-orders', 'sales-invoices',
                                'blanket-orders', 'sales-partners', 'sales-persons', 'pos-profiles', 'pos-settings',
                                'pos-opening', 'pos-closing', 'loyalty-programs', 'loyalty-points', 'items', 'item-prices',
                                'price-lists', 'item-groups', 'product-bundles', 'promotional-schemes', 'pricing-rules',
                                'shipping-rules', 'coupon-codes', 'selling-settings', 'terms-templates', 'tax-templates',
                                'utm-sources', 'customer-groups', 'contacts', 'addresses', 'territories', 'campaigns',
                                'sales-analytics', 'so-analysis', 'sales-funnel', 'so-trends', 'quotation-trends',
                                'customer-acquisition', 'inactive-customers', 'salesperson-summary', 'item-sales-history',
                                'customer-directory', 'packing-stock', 'pending-so-pr', 'delivery-trends', 'invoice-trends',
                                'customer-credit-balance', 'dormant-customers', 'partner-commissions',
                                'territory-target-variance', 'salesperson-target-variance', 'partner-target-variance'
                            ];
                            sellingIds.forEach(id => {
                                if (!ids.includes(id)) ids.push(id);
                            });
                            return { ...m, menuIds: ids };
                        }
                        if (m.id === 'procurement') {
                            const ids = m.menuIds || [];
                            const buyingIds: MenuId[] = [
                                'buying-workspace', 'material-requests', 'purchase-orders', 'purchase-bills',
                                'rfqs', 'supplier-quotations', 'items', 'buying-item-prices', 'buying-price-lists',
                                'buying-product-bundles', 'buying-item-groups', 'buying-promotional-schemes', 'buying-pricing-rules',
                                'buying-settings', 'purchase-tax-templates-view', 'terms-templates',
                                'suppliers', 'supplier-groups', 'supplier-contacts',
                                'supplier-addresses', 'supplier-scorecards', 'scorecard-variables',
                                'scorecard-criteria', 'scorecard-standings', 'purchase-analytics', 'po-analysis',
                                'item-consumption', 'items-to-order-receive', 'po-trends', 'procurement-tracker',
                                'items-to-request', 'item-purchase-history', 'purchase-receipt-trends',
                                'purchase-invoice-trends', 'subcontract-materials', 'subcontract-received',
                                'rfq-comparison', 'pr-to-rfq', 'supplier-directory', 'import-supplier-invoice',
                                'purchase-receipt'
                            ];
                            buyingIds.forEach(id => {
                                if (!ids.includes(id)) ids.push(id);
                            });
                            return { ...m, menuIds: ids };
                        }
                        if (m.id === 'rental') {
                            const ids = m.menuIds || [];
                            if (!ids.includes('contracts')) ids.push('contracts');
                            if (!ids.includes('contract-templates')) ids.push('contract-templates');
                            return { ...m, menuIds: ids };
                        }
                        if (m.id === 'supply-chain') {
                            const ids = (m.menuIds || []).filter((id: string) => id !== 'conversions' && id !== 'purchase-bills');
                            const stockIds: MenuId[] = [
                                'stock-workspace', 'stock-entry', 'delivery-notes', 'purchase-receipt',
                                'material-request', 'pick-lists', 'delivery-trip', 'stock-opname',
                                'landed-cost-vouchers', 'inventory-items', 'inventory-categories',
                                'stock-product-bundles', 'item-alternatives', 'item-manufacturers',
                                'manufacturers', 'serial-numbers', 'batches', 'installation-notes',
                                'stock-settings', 'warehouses', 'brands', 'item-attributes', 'uoms',
                                'uom-conversions', 'item-manufacturers', 'stock-tax-templates', 'stock-ledger', 'stock-balance',
                                'stock-summary', 'stock-ageing', 'stock-projected-qty', 'stock-analytics',
                                'batch-wise-balance', 'serial-no-status', 'item-shortage-report',
                                'quality-inspection'
                            ];
                            stockIds.forEach(id => {
                                if (!ids.includes(id)) ids.push(id);
                            });
                            return { ...m, menuIds: ids };
                        }
                        if (m.id === 'finance') {
                            const ids = m.menuIds || [];
                            const accIds: MenuId[] = [
                                'accounting-workspace', 'chart-of-accounts', 'journal-entries-view',
                                'payment-entries', 'payment-reconciliation', 'bank-accounts',
                                'bank-transactions', 'bank-clearance', 'cashier-closing', 'cost-centers',
                                'accounting-dimensions', 'budgets-view', 'sales-tax-templates',
                                'purchase-tax-templates-view', 'tax-categories', 'tax-rules',
                                'credit-notes', 'debit-notes', 'dunnings', 'balance-sheet',
                                'profit-loss', 'cash-flow', 'trial-balance', 'general-ledger-report',
                                'ar-aging', 'ap-aging', 'finance', 'cash-bank', 'expenses', 'journal-entries',
                                'financial-reports', 'sales-invoices', 'purchase-bills',
                                'period-closing', 'exchange-rates'
                            ];
                            accIds.forEach(id => {
                                if (!ids.includes(id)) ids.push(id);
                            });
                            return { ...m, menuIds: ids };
                        }
                        if (m.id === 'hr') {
                            const ids = m.menuIds || [];
                            const hrModuleIds: MenuId[] = ['hr-workspace', 'employees', 'attendance', 'leaves', 'salary-slips', 'payroll-processing', 'salary-assignments', 'salary-structures', 'designations', 'employee-lifecycle', 'shifts', 'attendance-logs', 'overtime', 'attendance-requests'];
                            hrModuleIds.forEach(id => {
                                if (!ids.includes(id)) ids.push(id);
                            });
                            return { ...m, menuIds: ids.filter((id: string) => id !== 'departments') };
                        }
                        if (m.id === 'admin') {
                            const ids = m.menuIds || [];
                            if (!ids.includes('system-reset')) ids.push('system-reset');
                            return {
                                ...m, menuIds: ids.filter((id: string) =>
                                    id !== 'locations' &&
                                    id !== 'approval-workflow-settings' &&
                                    id !== 'users' &&
                                    id !== 'roles' &&
                                    id !== 'inventory-categories' &&
                                    id !== 'categories' &&
                                    id !== 'maintenance-templates'
                                )
                            };
                        }
                        if (m.id === 'organization') {
                            const ids = m.menuIds || [];
                            if (!ids.includes('departments')) ids.push('departments');
                            if (!ids.includes('approval-workflow-settings')) ids.push('approval-workflow-settings');
                            if (!ids.includes('users')) ids.push('users');
                            if (!ids.includes('roles')) ids.push('roles');
                            if (!ids.includes('webhooks')) ids.push('webhooks');
                            if (!ids.includes('outbox-management')) ids.push('outbox-management');
                            return { ...m, menuIds: ids };
                        }
                        return m;
                    });
                    setLaunchpadConfig(backendConfig as LaunchpadConfig);
                }
            } catch {
                // Ignore parse errors
            }
        }
    }, [publicSettings, setLaunchpadConfig]);

    // Sync URL with State
    useEffect(() => {
        const path = location.pathname;

        const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

        // 1. Handle Deep Links (Priority)
        const lifecycleMatch = matchPath('/assets/:id/lifecycle', path);
        if (lifecycleMatch?.params.id) {
            setActiveTab('assets');
            setSelectedAssetId(lifecycleMatch.params.id);
            setAssetViewMode('lifecycle');
            setSelectedWorkOrderId(null);
            setOpenGroups(prev => ({ ...prev, asset_operations: true }));
            return;
        }

        // Handle specific asset settings & report sub-routes before :id matching
        if (path === '/assets/settings' || path === '/assets/asset-settings') {
            setActiveTab('asset-settings');
            setSelectedAssetId(null);
            setOpenGroups(prev => ({ ...prev, asset_operations: true }));
            return;
        }

        if (path === '/assets/depreciation-methods') {
            setActiveTab('depreciation-methods');
            setSelectedAssetId(null);
            setOpenGroups(prev => ({ ...prev, asset_operations: true }));
            return;
        }

        if (path === '/assets/maintenance-types') {
            setActiveTab('maintenance-types');
            setSelectedAssetId(null);
            setOpenGroups(prev => ({ ...prev, asset_operations: true }));
            return;
        }

        if (path.startsWith('/assets/reports/')) {
            const reportKey = path.replace('/assets/reports/', '');
            setActiveTab(reportKey as TabId);
            setSelectedAssetId(null);
            setOpenGroups(prev => ({ ...prev, asset_operations: true }));
            return;
        }

        const assetDetailMatch = matchPath('/assets/:id', path);
        if (assetDetailMatch?.params.id && isUuid(assetDetailMatch.params.id)) {
            setActiveTab('assets');
            setSelectedAssetId(assetDetailMatch.params.id);
            setAssetViewMode('details');
            setSelectedWorkOrderId(null);
            setOpenGroups(prev => ({ ...prev, asset_operations: true }));
            return;
        }

        const rentalFormMatch = matchPath('/rentals/new', path);
        if (rentalFormMatch) {
            setActiveTab('rental-form');
            setSelectedRentalId(null);
            return;
        }

        const rentalDetailMatch = matchPath('/rentals/:id', path);
        if (rentalDetailMatch?.params.id) {
            setActiveTab('rentals');
            setSelectedRentalId(rentalDetailMatch.params.id);
            setSelectedWorkOrderId(null);
            setSelectedAssetId(null);
            return;
        }

        const employee360Match = matchPath('/employees/:id/360', path);
        if (employee360Match?.params.id) {
            setActiveTab('employee-360');
            setSelectedEmployeeId(employee360Match.params.id);
            setSelectedAssetId(null);
            setSelectedWorkOrderId(null);
            return;
        }

        const woMatch = matchPath('/work-orders/:id', path);
        if (woMatch?.params.id) {
            setActiveTab('work-orders');
            setSelectedWorkOrderId(woMatch.params.id);
            setSelectedAssetId(null);
            setSelectedInventoryId(null);
            setOpenGroups(prev => ({ ...prev, maintenance_group: true }));
            return;
        }

        const invMatch = matchPath('/inventory-items/:id', path);
        if (invMatch?.params.id) {
            setActiveTab('inventory-items');
            setSelectedInventoryId(invMatch.params.id);
            setSelectedAssetId(null);
            setSelectedWorkOrderId(null);
            setOpenGroups(prev => ({ ...prev, inventory_group: true }));
            return;
        }

        const contractsMatch = matchPath('/rentals/contracts', path);
        if (contractsMatch) {
            setActiveTab('contracts');
            setOpenGroups(prev => ({ ...prev, rental_group: true }));
            return;
        }

        const journalNewMatch = matchPath('/finance/journals/new', path);
        if (journalNewMatch) {
            setActiveTab('journal-form');
            setOpenGroups(prev => ({ ...prev, finance_group: true }));
            setSelectedAssetId(null);
            setSelectedWorkOrderId(null);
            return;
        }

        const journalListMatch = matchPath('/finance/journals', path);
        if (journalListMatch) {
            setActiveTab('journal-entries');
            setOpenGroups(prev => ({ ...prev, finance_group: true }));
            setSelectedAssetId(null);
            setSelectedWorkOrderId(null);
            return;
        }

        if (path === '/accounting-workspace') {
            setActiveTab('accounting-workspace');
            setOpenGroups(prev => ({ ...prev, finance_group: true }));
            setSelectedAssetId(null);
            setSelectedWorkOrderId(null);
            return;
        }

        if (path.startsWith('/accounting/reports/')) {
            const reportKey = path.replace('/accounting/reports/', '');
            setActiveTab(reportKey as TabId);
            setOpenGroups(prev => ({ ...prev, finance_group: true }));
            setSelectedAssetId(null);
            setSelectedWorkOrderId(null);
            return;
        }

        if (path.startsWith('/accounting/')) {
            const accKey = path.replace('/accounting/', '');
            setActiveTab(accKey as TabId);
            setOpenGroups(prev => ({ ...prev, finance_group: true }));
            setSelectedAssetId(null);
            setSelectedWorkOrderId(null);
            return;
        }

        // 2. Handle Simple Tabs
        const segments = path.split('/').filter(Boolean);
        const lastSegment = segments[segments.length - 1];

        if (lastSegment) {
            const foundTab = lastSegment as TabId;
            setActiveTab(foundTab);

            // Auto-expand group if child is active
            // Recursive finder for nested groups
            const findParentGroup = (items: NavEntry[], targetId: TabId): NavGroup | undefined => {
                if (targetId === 'work-orders') {
                    return items.find(i => !isNavHeader(i) && i.id === 'maintenance_group') as NavGroup;
                }

                for (const item of items) {
                    if (isNavHeader(item)) continue;
                    if (isNavGroup(item)) {
                        if (item.children.some(child => !isNavHeader(child) && child.id === targetId)) {
                            return item;
                        }
                        const foundInChild = findParentGroup(item.children, targetId);
                        if (foundInChild) return item;
                    } else if (item.id === targetId) {
                        return undefined; // At root
                    }
                }
                return undefined;
            };

            // Guard against UUIDs being interpreted as tabs (which causes Dashboard fallback)
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(foundTab);

            if (!isUuid) {
                const foundGroup = findParentGroup(navItems, foundTab);
                if (foundGroup) {
                    setOpenGroups(prev => ({ ...prev, [foundGroup.id]: true }));
                } else if (['assets-workspace', 'assets', 'categories', 'locations', 'asset-lifecycle', 'asset-audit'].includes(foundTab)) {
                    setOpenGroups(prev => ({ ...prev, asset_operations: true }));
                } else if (['accounting-workspace', 'chart-of-accounts', 'cash-bank', 'journal-entries', 'payment-entries', 'payment-reconciliation', 'sales-invoices', 'purchase-bills', 'credit-notes', 'debit-notes', 'dunnings', 'bank-accounts', 'bank-transactions', 'cost-centers', 'accounting-dimensions', 'budgets', 'sales-tax-templates', 'purchase-tax-templates-view', 'tax-categories', 'tax-rules', 'balance-sheet', 'profit-loss', 'cash-flow', 'trial-balance', 'general-ledger-report', 'ar-aging', 'ap-aging'].includes(foundTab)) {
                    setOpenGroups(prev => ({ ...prev, finance_group: true }));
                } else if (['hr-workspace'].includes(foundTab)) {
                    setOpenGroups(prev => ({ ...prev, hr_group: true }));
                } else if (foundTab === 'work-orders') {
                    // Explicit fallback for work-orders to ensure group opens
                    setOpenGroups(prev => ({ ...prev, maintenance_group: true }));
                }

                // Only set active tab if it's not a UUID and seems to be a valid tab
                // (Though ideally we should validate against valid TabIds)
                setActiveTab(foundTab);
            }

            setSelectedAssetId(null);
            setAssetViewMode('list');
            setSelectedWorkOrderId(null);
            setSelectedRentalId(null);
            setSelectedEmployeeId(null);
        } else if (path === '/') {
            setActiveTab('dashboard');
            setSelectedAssetId(null);
            setAssetViewMode('list');
            setSelectedWorkOrderId(null);
            setSelectedRentalId(null);
            setSelectedEmployeeId(null);
        }
    }, [location.pathname]);

    const handleLogout = () => {
        setLogoutModalOpen(true);
    };

    const confirmLogout = () => {
        logout();
        navigate('/login');
        setLogoutModalOpen(false);
    };

    const toggleGroup = (groupId: string) => {
        setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
    };

    // Auto-detect module from current tab when no module is set
    // (e.g., direct URL access without going through Launchpad)
    useEffect(() => {
        if (!activeModule && activeTab !== 'dashboard') {
            const menuId = activeTab as MenuId;
            const matchingModule = launchpadConfig.modules.find(m =>
                (m.menuIds || []).includes(menuId)
            );
            if (matchingModule) {
                setActiveModule(matchingModule.id);
            }
        }
    }, [activeTab, activeModule, launchpadConfig, setActiveModule]);

    // Auto-open primary sidebar group when switching modules
    useEffect(() => {
        if (activeModule) {
            const groupMapping: Record<string, string> = {
                'organization': 'organization_group',
                'asset-management': 'asset_management_group',
                'supply-chain': 'inventory_group',
                'rental': 'rental_module',
                'procurement': 'procurement_group',
                'commercial': 'commercial_group',
                'finance': 'finance_group',
                'hr': 'hr_group',
                'admin': 'settings_group'
            };

            const groupId = groupMapping[activeModule];
            if (groupId) {
                setOpenGroups(prev => ({ ...prev, [groupId]: true }));
            }
        }
    }, [activeModule]);

    // Dynamically construct navItems structure based on launchpadConfig
    const navItems: NavEntry[] = useMemo(() => {
        const getModuleMenuIds = (moduleId: string): string[] => {
            const mod = launchpadConfig?.modules?.find(m => m.id === moduleId);
            return (mod && Array.isArray(mod.menuIds)) ? mod.menuIds : [];
        };

        const fieldOpsIds = getModuleMenuIds('field-operations');
        const rawCommercialIds = getModuleMenuIds('commercial');
        // Exclude items assigned to field-operations from commercialIds so they move exclusively
        const commercialIds = rawCommercialIds.filter(id => !fieldOpsIds.includes(id));
        const rentalIds = getModuleMenuIds('rental');
        const procurementIds = getModuleMenuIds('procurement');
        const assetIds = getModuleMenuIds('asset-management');
        const supplyChainIds = getModuleMenuIds('supply-chain');
        const financeIds = getModuleMenuIds('finance');
        const hrIds = getModuleMenuIds('hr');
        const adminIds = getModuleMenuIds('admin');
        const insightsIds = getModuleMenuIds('insights');
        const organizationIds = getModuleMenuIds('organization');

        const getGroupItems = (_moduleIds: string[], preferredOrder: string[], allowedFilter?: string[]) => {
            const result: NavItem[] = [];
            const filterList = allowedFilter || preferredOrder;

            preferredOrder.forEach(id => {
                if (ALL_NAV_ITEMS[id] && filterList.includes(id)) {
                    if (!result.some(item => item.id === id)) {
                        result.push(ALL_NAV_ITEMS[id]);
                    }
                }
            });
            return result;
        };

        const getDynamicDocTypes = (moduleName: string) => {
            const items = dynamicDoctypes
                .filter((dt: any) => dt.module === moduleName)
                .map((dt: any) => {
                    const id = dt.name.toLowerCase().replace(/\s+/g, '-');
                    // Check if this doctype is already in ALL_NAV_ITEMS (mapped statically)
                    const isAlreadyMapped = Object.values(ALL_NAV_ITEMS).some(
                        (nav) => nav.label.toLowerCase() === dt.name.toLowerCase()
                    );
                    
                    if (isAlreadyMapped) return null;

                    return {
                        id,
                        label: dt.name,
                        icon: FileText,
                        path: `/app/${id}`,
                        minLevel: 5,
                    } as NavItem;
                })
                .filter(Boolean) as NavItem[];
                
            if (items.length > 0) {
                return {
                    id: `dynamic_${moduleName.toLowerCase()}_subgroup`,
                    label: 'Other Forms',
                    icon: Layers,
                    minLevel: 5,
                    children: items
                };
            }
            return null;
        };

        return [
            ALL_NAV_ITEMS['dashboard'],
            ALL_NAV_ITEMS['assets-workspace'],
            ALL_NAV_ITEMS['stock-workspace'],
            ALL_NAV_ITEMS['buying-workspace'],
            ALL_NAV_ITEMS['selling-workspace'],
            ALL_NAV_ITEMS['accounting-workspace'],
            ...(activeModule === 'insights' && (insightsIds.length === 0 || insightsIds.includes('analytics')) ? [ALL_NAV_ITEMS['analytics']] : []),
            ...(activeModule === 'insights' && (insightsIds.length === 0 || insightsIds.includes('reports')) ? [ALL_NAV_ITEMS['reports']] : []),
            ALL_NAV_ITEMS['hr-workspace'],
            {
                id: 'organization_group',
                label: 'Organization',
                icon: Building2,
                minLevel: 2,
                children: [
                    ...getGroupItems(organizationIds, ['company', 'branch', 'departments', 'users', 'roles', 'email-account', 'approval-workflow-settings'],
                        ['company', 'branch', 'departments', 'users', 'roles', 'email-account', 'approval-workflow-settings']),
                ],
            },
            {
                id: 'asset_management_group',
                label: 'Asset Management',
                icon: Box,
                minLevel: 5,
                children: [
                    {
                        id: 'asset_operations_subgroup',
                        label: 'Asset Operations',
                        icon: Box,
                        minLevel: 5,
                        children: getGroupItems(assetIds, ['assets', 'categories', 'locations', 'asset-lifecycle', 'asset-audit', 'conversions'])
                    },
                    {
                        id: 'maintenance_field_ops_subgroup',
                        label: 'Maintenance & Field Ops',
                        icon: Wrench,
                        minLevel: 5,
                        children: getGroupItems(assetIds, ['work-orders', 'maintenance-schedules', 'maintenance-templates', 'maintenance-teams'])
                    },
                    {
                        id: 'compliance_utilities_subgroup',
                        label: 'Compliance & Utilities',
                        icon: ShieldAlert,
                        minLevel: 5,
                        children: getGroupItems(assetIds, ['tax-renewals', 'fuel', 'loans'])
                    },
                    {
                        id: 'asset_settings_subgroup',
                        label: 'Settings & Setup',
                        icon: Settings,
                        minLevel: 5,
                        children: getGroupItems(assetIds, ['asset-settings', 'depreciation-methods', 'maintenance-types'])
                    },
                    {
                        id: 'asset_key_reports_subgroup',
                        label: 'Key Reports',
                        icon: FileText,
                        minLevel: 5,
                        children: getGroupItems(assetIds, ['depreciation-ledger', 'roi-trends', 'condition-distribution', 'workorder-summary', 'fuel-consumption'])
                    },
                    {
                        id: 'asset_other_reports_subgroup',
                        label: 'Other Reports',
                        icon: History,
                        minLevel: 5,
                        children: getGroupItems(assetIds, ['custody-history', 'team-performance', 'tax-expiry', 'cost-analysis'])
                    },
                    {
                        id: 'asset_telemetry_subgroup',
                        label: 'Telemetry & IoT',
                        icon: Activity,
                        minLevel: 5,
                        children: getGroupItems(assetIds, ['iot-sensor-stream', 'asset-health-telemetry', 'threshold-alerts'])
                    },
                    getDynamicDocTypes('Assets')
                ].filter(Boolean) as NavGroup[]
            },
            {
                id: 'inventory_group',
                label: 'Supply Chain & Inventory',
                icon: Package,
                minLevel: 4,
                children: [
                    {
                        id: 'stock_operations_subgroup',
                        label: 'Stock Operations',
                        icon: ClipboardCheck,
                        minLevel: 4,
                        children: getGroupItems(supplyChainIds, ['stock-entry', 'delivery-notes', 'purchase-receipt', 'material-request', 'pick-lists', 'delivery-trip', 'stock-opname', 'landed-cost-vouchers'])
                    },
                    {
                        id: 'products_pricing_subgroup',
                        label: 'Products',
                        icon: Package,
                        minLevel: 4,
                        children: getGroupItems(supplyChainIds, ['inventory-items', 'inventory-categories', 'stock-product-bundles', 'item-alternatives', 'item-manufacturers', 'manufacturers'])
                    },
                    {
                        id: 'serial_batch_subgroup',
                        label: 'Serial No and Batch',
                        icon: Tag,
                        minLevel: 3,
                        children: getGroupItems(supplyChainIds, ['serial-numbers', 'batches', 'installation-note'])
                    },
                    {
                        id: 'stock_setup_subgroup',
                        label: 'Settings',
                        icon: Settings,
                        minLevel: 3,
                        children: getGroupItems(supplyChainIds, ['stock-settings', 'warehouses', 'brands', 'item-attributes', 'uoms', 'uom-conversions', 'item-tax-templates', 'item-manufacturers', 'quality-inspection'])
                    },
                    {
                        id: 'stock_key_reports_subgroup',
                        label: 'Key Reports',
                        icon: FileText,
                        minLevel: 3,
                        children: getGroupItems(supplyChainIds, ['stock-ledger', 'stock-balance', 'stock-summary', 'stock-ageing', 'stock-projected-qty'])
                    },
                    {
                        id: 'stock_other_reports_subgroup',
                        label: 'Other Reports',
                        icon: FileText,
                        minLevel: 3,
                        children: getGroupItems(supplyChainIds, ['stock-analytics', 'batch-wise-balance', 'serial-no-status', 'item-shortage-report'])
                    },
                    getDynamicDocTypes('Inventory')
                ].filter(Boolean) as (NavItem | NavHeader | NavGroup)[]
            },
            {
                id: 'rental_module',
                label: 'Rental & Contracts',
                icon: Truck,
                minLevel: 4,
                children: [
                    ...getGroupItems(rentalIds, ['rentals', 'contracts', 'contract-templates']),
                    getDynamicDocTypes('Rentals')
                ].filter(Boolean) as (NavItem | NavHeader | NavGroup)[]
            },
            {
                id: 'procurement_group',
                label: 'Procurement & Buying',
                icon: ShoppingCart,
                minLevel: 3,
                children: [
                    {
                        id: 'procurement_orders_subgroup',
                        label: 'Buying',
                        icon: ShoppingCart,
                        minLevel: 3,
                        children: getGroupItems(procurementIds, ['material-requests', 'purchase-orders', 'purchase-bills', 'rfqs', 'supplier-quotations'])
                    },
                    {
                        id: 'buying_items_pricing_subgroup',
                        label: 'Items & Pricing',
                        icon: Tag,
                        minLevel: 3,
                        children: getGroupItems(procurementIds, ['items', 'buying-item-prices', 'buying-price-lists', 'buying-product-bundles', 'buying-item-groups', 'buying-promotional-schemes', 'buying-pricing-rules'])
                    },
                    {
                        id: 'buying_supplier_subgroup',
                        label: 'Supplier',
                        icon: Users,
                        minLevel: 3,
                        children: getGroupItems(procurementIds, ['suppliers', 'supplier-groups', 'supplier-contacts', 'supplier-addresses'])
                    },
                    {
                        id: 'buying_scorecard_subgroup',
                        label: 'Supplier Scorecard',
                        icon: Shield,
                        minLevel: 3,
                        children: getGroupItems(procurementIds, ['supplier-scorecards', 'scorecard-variables', 'scorecard-criteria', 'scorecard-standings'])
                    },
                    {
                        id: 'buying_setup_subgroup',
                        label: 'Settings',
                        icon: Settings,
                        minLevel: 3,
                        children: getGroupItems(procurementIds, ['buying-settings', 'purchase-tax-templates-view', 'terms-templates'])
                    },
                    {
                        id: 'buying_key_reports_subgroup',
                        label: 'Key Reports',
                        icon: FileText,
                        minLevel: 3,
                        children: getGroupItems(procurementIds, ['purchase-analytics', 'po-analysis', 'item-consumption', 'items-to-order-receive', 'po-trends', 'procurement-tracker'])
                    },
                    {
                        id: 'buying_other_reports_subgroup',
                        label: 'Other Reports',
                        icon: FileText,
                        minLevel: 3,
                        children: getGroupItems(procurementIds, ['items-to-request', 'item-purchase-history', 'purchase-receipt-trends', 'purchase-invoice-trends', 'subcontract-materials', 'subcontract-received', 'rfq-comparison', 'pr-to-rfq', 'supplier-directory', 'import-supplier-invoice', 'purchase-receipt'])
                    },
                    getDynamicDocTypes('Purchase')
                ].filter(Boolean) as (NavItem | NavHeader | NavGroup)[]
            },
            {
                id: 'commercial_group',
                label: 'Commercial & Selling',
                icon: TrendingUp,
                minLevel: 3,
                children: [
                    {
                        id: 'selling_orders_subgroup',
                        label: 'Selling',
                        icon: TrendingUp,
                        minLevel: 3,
                        children: getGroupItems(commercialIds, ['customers', 'quotations', 'sales-orders', 'sales-invoices', 'blanket-orders', 'sales-partners', 'sales-persons'])
                    },
                    {
                        id: 'pos_subgroup',
                        label: 'Point of Sale',
                        icon: ShoppingBag,
                        minLevel: 3,
                        children: getGroupItems(commercialIds, ['pos-profiles', 'pos-settings', 'pos-opening', 'pos-closing', 'loyalty-programs', 'loyalty-points'])
                    },
                    {
                        id: 'selling_items_pricing_subgroup',
                        label: 'Items and Pricing',
                        icon: Tag,
                        minLevel: 3,
                        children: getGroupItems(commercialIds, ['items', 'item-prices', 'price-lists', 'item-groups', 'product-bundles', 'promotional-schemes', 'pricing-rules', 'shipping-rules', 'coupon-codes'])
                    },
                    {
                        id: 'selling_setup_subgroup',
                        label: 'Settings',
                        icon: Settings,
                        minLevel: 3,
                        children: getGroupItems(commercialIds, ['selling-settings', 'terms-templates', 'tax-templates', 'utm-sources', 'customer-groups', 'contacts', 'addresses', 'territories', 'campaigns'])
                    },
                    {
                        id: 'selling_key_reports_subgroup',
                        label: 'Key Reports',
                        icon: FileText,
                        minLevel: 3,
                        children: getGroupItems(commercialIds, ['sales-analytics', 'so-analysis', 'sales-funnel', 'so-trends', 'quotation-trends', 'customer-acquisition', 'inactive-customers', 'salesperson-summary', 'item-sales-history'])
                    },
                    {
                        id: 'selling_other_reports_subgroup',
                        label: 'Other Reports',
                        icon: FileText,
                        minLevel: 3,
                        children: getGroupItems(commercialIds, ['customer-directory', 'packing-stock', 'pending-so-pr', 'delivery-trends', 'invoice-trends', 'customer-credit-balance', 'dormant-customers', 'partner-commissions', 'territory-target-variance', 'salesperson-target-variance', 'partner-target-variance'])
                    },
                    getDynamicDocTypes('Sales')
                ].filter(Boolean) as (NavItem | NavHeader | NavGroup)[]
            },
            {
                id: 'finance_group',
                label: 'Finance & Accounting',
                icon: Wallet,
                minLevel: 2,
                children: [
                    {
                        id: 'general_ledger_subgroup',
                        label: 'General Ledger & Entries',
                        icon: FileText,
                        minLevel: 2,
                        children: getGroupItems(financeIds, ['finance', 'journal-entries-view', 'payment-entries', 'payment-reconciliation'])
                    },
                    {
                        id: 'ar_subgroup',
                        label: 'Accounts Receivable',
                        icon: DollarSign,
                        minLevel: 2,
                        children: getGroupItems(financeIds, ['sales-invoices', 'credit-notes', 'dunnings', 'ar-aging'])
                    },
                    {
                        id: 'ap_subgroup',
                        label: 'Accounts Payable',
                        icon: Wallet,
                        minLevel: 2,
                        children: getGroupItems(financeIds, ['purchase-bills', 'debit-notes', 'ap-aging'])
                    },
                    {
                        id: 'cash_bank_subgroup',
                        label: 'Cash & Bank Operations',
                        icon: Wallet,
                        minLevel: 2,
                        children: getGroupItems(financeIds, ['bank-accounts', 'bank-transactions', 'bank-clearance', 'cashier-closing'])
                    },
                    {
                        id: 'acc_setup_subgroup',
                        label: 'Cost Centers & Taxes',
                        icon: Settings,
                        minLevel: 2,
                        children: getGroupItems(financeIds, ['cost-centers', 'accounting-dimensions', 'budgets-view', 'sales-tax-templates', 'purchase-tax-templates-view', 'tax-categories', 'tax-rules'])
                    },
                    {
                        id: 'fin_reports_subgroup',
                        label: 'Financial Statements & Reports',
                        icon: FileText,
                        minLevel: 2,
                        children: getGroupItems(financeIds, ['balance-sheet', 'profit-loss', 'cash-flow', 'trial-balance', 'general-ledger-report'])
                    },
                    getDynamicDocTypes('Finance')
                ].filter(Boolean) as (NavItem | NavHeader | NavGroup)[]
            },
            {
                id: 'hr_group',
                label: 'Human Resources',
                icon: Users,
                minLevel: 5,
                children: [
                    { type: 'header', label: 'Kepegawaian & Karir' },
                    ...getGroupItems(hrIds, ['employees', 'designations', 'employee-lifecycle']),
                    { type: 'header', label: 'Presensi & Cuti' },
                    ...getGroupItems(hrIds, ['attendance', 'leaves', 'shifts', 'attendance-logs', 'overtime', 'attendance-requests']),
                    { type: 'header', label: 'Penggajian (Payroll)' },
                    ...getGroupItems(hrIds, ['salary-slips', 'payroll-processing', 'salary-assignments', 'salary-structures']),
                    { type: 'header', label: 'Kesejahteraan & Kinerja' },
                    ...getGroupItems(hrIds, ['employee-loans', 'expense-claims', 'appraisal']),
                    { type: 'header', label: 'Talenta & Disiplin' },
                    ...getGroupItems(hrIds, ['recruitment', 'training-certifications', 'disciplinary-actions']),
                    { type: 'header', label: 'Operasional Driver & P2H' },
                    ...getGroupItems(hrIds, ['driver-assignments', 'p2h-inspections', 'driver-safety-incidents']),
                    getDynamicDocTypes('HR')
                ].filter(Boolean) as (NavItem | NavHeader)[]
            },
            {
                id: 'settings_group',
                label: 'Configuration',
                icon: Settings,
                minLevel: 2,
                children: [
                    { type: 'header', label: 'Operational Templates' },
                    ...getGroupItems(adminIds, ['contract-templates'], ['contract-templates']),
                    { type: 'header', label: 'System & Security' },
                    ...getGroupItems(adminIds.filter(id => id !== 'contract-templates'), ['approvals', 'audit', 'settings', 'system-reset']),
                ]
            },
        ];
    }, [launchpadConfig]);

    // Filtered Nav Items based on active Launchpad module
    const visibleNavItems = useMemo(() => {
        // Get visible menu IDs from the navigation store
        const visibleMenuIds = getVisibleMenuIds();

        // No module selected → show all menus (fallback)
        if (!activeModule) return navItems;

        const moduleToGroupId: Record<string, string[]> = {
            'organization': ['dashboard', 'analytics', 'reports', 'organization_group'],
            'asset-management': ['assets-workspace', 'analytics', 'reports', 'asset_management_group'],
            'supply-chain': ['stock-workspace', 'analytics', 'reports', 'inventory_group'],
            'rental': ['dashboard', 'analytics', 'reports', 'rental_module'],
            'procurement': ['buying-workspace', 'analytics', 'reports', 'procurement_group'],
            'commercial': ['selling-workspace', 'analytics', 'reports', 'commercial_group'],
            'finance': ['accounting-workspace', 'analytics', 'reports', 'finance_group'],
            'hr': ['hr-workspace', 'dashboard', 'analytics', 'reports', 'hr_group'],
            'admin': ['dashboard', 'analytics', 'reports', 'settings_group']
        };

        const allowedGroupIds = moduleToGroupId[activeModule] || [];
        const moduleFilteredItems = navItems.filter(item => isNavHeader(item) || allowedGroupIds.includes((item as any).id));

        // Helper: collect all leaf menu IDs from a nav entry
        const getLeafIds = (entry: NavEntry): string[] => {
            if (isNavHeader(entry)) return [];
            if (isNavGroup(entry)) {
                return entry.children.flatMap(getLeafIds);
            }
            return [(entry as NavItem).id];
        };

        // Filter: keep items/groups that have at least one visible menu ID
        return moduleFilteredItems.filter(item => {
            if (isNavHeader(item)) {
                // Show header if the next non-header item would be visible
                // (handled by rendering — headers without following content are harmless)
                return true;
            }

            const leafIds = getLeafIds(item);
            return leafIds.some(id => visibleMenuIds.includes(id as MenuId));
        });
    }, [user, activeModule, getVisibleMenuIds, navItems]);


    // Check if user is admin
    const isAdmin = (user?.role_level ?? 5) <= 2;

    // Render Section Header
    const renderNavHeader = (header: NavHeader) => {
        const userLevel = user?.role_level ?? 5;
        const requiredLevel = header.minLevel ?? 5;
        if (userLevel > requiredLevel) return null;

        if (!sidebarOpen) return <div className="h-px bg-border/10 my-4 mx-4" />;

        return (
            <div className="px-4 py-2 mt-4 text-[10px] font-bold text-muted-foreground/50 tracking-widest uppercase flex items-center gap-2 select-none">
                <span className="whitespace-nowrap">{header.label}</span>
                <div className="h-[1px] flex-1 bg-border/10" />
            </div>
        );
    };
    // Render Navigation Item
    const renderNavItem = (item: NavItem, isChild = false) => {
        const menuId = item.id as MenuId;
        const resourceId = MENU_TO_RESOURCE[menuId] || menuId.replace(/-/g, '_');

        let hasAccess = hasPermission(`${resourceId}.read`) ||
            hasPermission(`${resourceId}.view`) ||
            hasPermission(`${resourceId}.*`);

        if (!hasAccess && resourceId === 'work_order') {
            hasAccess = hasPermission('maintenance.read') || hasPermission('maintenance.view') || hasPermission('maintenance.*');
        }
        if (!hasAccess && resourceId === 'approval_center') {
            hasAccess = hasPermission('approval_center.read') || hasPermission('approval_center.view') || hasPermission('approval_center.*') || hasPermission('maintenance.approve') || hasPermission('work_order.approve_cost');
        }

        if (!hasAccess) return null;

        // Backward compatibility for adminOnly flag
        if (item.adminOnly && !isAdmin) return null;

        return (
            <button
                key={item.id}
                onClick={() => {
                    navigate(item.path || `/${item.id}`);
                    if (window.innerWidth < 1024) {
                        setSidebarOpen(false);
                    }
                }}
                className={`w-full flex items-center gap-3 px-4 ${isChild ? 'py-2' : 'py-3'} rounded-lg transition-all duration-200 ${activeTab === item.id
                    ? 'bg-blue-600/20 text-blue-400 shadow-sm shadow-blue-500/10'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    } ${isChild ? 'text-sm' : ''}`}
            >
                <item.icon size={isChild ? 16 : 20} />
                {sidebarOpen && (
                    <>
                        <span className="font-medium flex-1 text-left">{item.label}</span>
                        {item.showBadge && (
                            <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                                !
                            </span>
                        )}
                    </>
                )}
            </button>
        );
    };

    // Render Navigation Group (Recursive)
    const renderNavGroup = (group: NavGroup) => {
        // Check if any child (deep check) is active
        const isChildActiveRecursive = (items: NavEntry[]): boolean => {
            return items.some(item => {
                if (isNavHeader(item)) return false;
                if (isNavGroup(item)) return isChildActiveRecursive(item.children);
                return (item as NavItem).id === activeTab;
            });
        };

        const isChildActive = isChildActiveRecursive(group.children);
        const isOpen = openGroups[group.id] || false;

        // Also ensure at least one child is visible
        const visibleMenuIds = getVisibleMenuIds();

        const isItemVisible = (entry: NavEntry): boolean => {
            if (isNavHeader(entry)) return false;
            if (isNavGroup(entry)) {
                return entry.children.some(isItemVisible);
            }
            const item = entry as NavItem;
            const menuId = item.id as MenuId;
            const resourceId = MENU_TO_RESOURCE[menuId] || menuId.replace(/-/g, '_');

            // Check read, view, or wildcard permission
            let hasAccess = hasPermission(`${resourceId}.read`) ||
                hasPermission(`${resourceId}.view`) ||
                hasPermission(`${resourceId}.*`);

            // Fallback resource mapping
            if (!hasAccess && resourceId === 'work_order') {
                hasAccess = hasPermission('maintenance.read') || hasPermission('maintenance.view') || hasPermission('maintenance.*');
            }
            if (!hasAccess && resourceId === 'approval_center') {
                hasAccess = hasPermission('approval_center.read') || hasPermission('approval_center.view') || hasPermission('approval_center.*') || hasPermission('maintenance.approve') || hasPermission('work_order.approve_cost');
            }

            if (!hasAccess) {
                return false;
            }

            if (item.adminOnly && !isAdmin) {
                return false;
            }

            if (activeModule && !visibleMenuIds.includes(menuId)) {
                // Always allow HR sub-menus when in HR module
                if (activeModule === 'hr' && ['salary-slips', 'payroll-processing', 'salary-assignments', 'salary-structures', 'employee-loans', 'expense-claims', 'appraisal', 'recruitment', 'training-certifications', 'disciplinary-actions', 'driver-assignments', 'p2h-inspections', 'driver-safety-incidents', 'designations', 'employee-lifecycle', 'shifts', 'attendance-logs', 'overtime', 'attendance-requests', 'leaves', 'attendance', 'employees'].includes(menuId)) {
                    return true;
                }
                return false;
            }

            return true;
        };

        const visibleChildren = group.children.filter((child, idx, array) => {
            if (isNavHeader(child)) {
                const remaining = array.slice(idx + 1);
                const nextHeaderIdx = remaining.findIndex(isNavHeader);
                const sectionItems = nextHeaderIdx >= 0 ? remaining.slice(0, nextHeaderIdx) : remaining;
                return sectionItems.some(isItemVisible);
            }
            return isItemVisible(child);
        });

        if (visibleChildren.length === 0) return null;

        return (
            <div key={group.id}>
                <button
                    onClick={() => toggleGroup(group.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isChildActive ? 'bg-blue-600/20 text-blue-400' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }`}
                >
                    <group.icon size={20} />
                    {sidebarOpen && (
                        <>
                            <span className="font-medium flex-1 text-left">{group.label}</span>
                            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </>
                    )}
                </button>

                {sidebarOpen && isOpen && (
                    <div className="mt-1 border-l border-border space-y-1 ml-4">
                        {visibleChildren.map((child) => {
                            if (isNavHeader(child)) return renderNavHeader(child);
                            if (isNavGroup(child)) return renderNavGroup(child);
                            return renderNavItem(child as NavItem, true);
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
            {/* Mobile Backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`flex-none bg-card backdrop-blur-xl border-r border-border transition-all duration-300 ease-in-out flex flex-col fixed lg:relative inset-y-0 left-0 z-50 lg:z-20 h-full shadow-2xl lg:shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]
                ${sidebarOpen ? 'w-64 translate-x-0' : 'w-64 lg:w-20 -translate-x-full lg:translate-x-0'}`}
            >
                {/* Brand / Logo & Toggle */}
                <div className="h-16 flex items-center px-4 border-b border-border gap-2">
                    <div
                        className="flex items-center gap-3 overflow-hidden cursor-pointer flex-1"
                        onClick={() => { setActiveModule(null); navigate('/launchpad'); }}
                        title="Kembali ke Launchpad"
                    >
                        <Logo collapsed={!sidebarOpen} />
                    </div>

                    {/* Desktop Toggle Button */}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground hidden lg:block transition-colors"
                    >
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>

                    {/* Mobile Close Button */}
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-2 hover:bg-gray-800 rounded-lg text-muted-foreground hover:text-white lg:hidden transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 global-scrollbar">
                    {visibleNavItems.map((entry) => {
                        if (isNavHeader(entry)) return renderNavHeader(entry);
                        return isNavGroup(entry) ? renderNavGroup(entry) : renderNavItem(entry as NavItem);
                    })}
                </nav>

                {/* User & Logout */}
                <div className="p-4 border-t border-border">
                    {sidebarOpen && (
                        <button
                            onClick={() => { setActiveTab('profile'); navigate('/profile'); }}
                            className="mb-4 px-2 py-1.5 flex items-center gap-3 w-full text-left rounded-xl hover:bg-muted/80 transition-all border border-transparent hover:border-border cursor-pointer group"
                            title="Buka Profil Saya"
                        >
                            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden border border-border/50 shrink-0 group-hover:scale-105 transition-transform">
                                {user?.avatar_url ? (
                                    <img
                                        src={getImageUrl(user.avatar_url)}
                                        alt={user.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
                                            (e.target as HTMLImageElement).src = isAdmin ? '/avatar-admin.png' : '/avatar-user.png';
                                        }}
                                    />
                                ) : (
                                    <img
                                        src={user?.role === 'admin' || user?.role === 'super_admin' ? '/avatar-admin.png' : '/avatar-user.png'}
                                        alt={user?.name}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{user?.name}</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{user?.role}</p>
                            </div>
                        </button>
                    )}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-all duration-200"
                    >
                        <LogOut size={18} />
                        {sidebarOpen && <span className="font-medium text-sm">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content with Header */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative">
                {/* Global Ambient Background for Glassmorphism Context */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 dark:bg-blue-500/10 blur-[100px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/100/5 dark:bg-emerald-500/100/10 blur-[100px]" />
                    <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-purple-500/100/5 dark:bg-purple-500/100/10 blur-[120px]" />
                </div>

                {/* Header */}
                <AdminHeaderBar
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    activeTab={activeTab}
                    setActiveTab={(tab: string) => setActiveTab(tab as TabId)}
                    setActiveModule={setActiveModule}
                    theme={theme}
                    toggleTheme={toggleTheme}
                    user={user}
                    navigate={navigate}
                />

                {/* Content Area */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent relative z-10 global-scrollbar p-3 sm:p-6 lg:p-8">
                    <AdminContentRouter
                        activeTab={activeTab}
                        selectedAssetId={selectedAssetId}
                        assetViewMode={assetViewMode}
                        selectedWorkOrderId={selectedWorkOrderId}
                        selectedInventoryId={selectedInventoryId}
                        selectedRentalId={selectedRentalId}
                        selectedContractId={selectedContractId}
                        selectedEmployeeId={selectedEmployeeId}
                        hasPermission={hasPermission}
                        setActiveTab={(tab: string) => setActiveTab(tab as TabId)}
                        navigate={navigate}
                    />
                </main>
            </div>

            {/* Logout Modal */}
            {logoutModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-card border border-border/80 p-6 rounded-2xl max-w-sm w-full shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-foreground mb-2">Konfirmasi Logout</h3>
                        <p className="text-sm text-muted-foreground mb-6">Apakah Anda yakin ingin keluar dari sistem?</p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setLogoutModalOpen(false)}
                                className="px-4 py-2 bg-secondary text-secondary-foreground font-medium text-sm rounded-xl hover:bg-muted transition-colors border border-border cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmLogout}
                                className="px-4 py-2 bg-red-600 text-white font-semibold text-sm rounded-xl hover:bg-red-500 shadow-md transition-colors cursor-pointer"
                            >
                                Keluar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <AIChatWidget />
        </div>
    );
}
