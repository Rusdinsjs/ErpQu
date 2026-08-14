// Admin Dashboard - Main Container with Dark Theme
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, matchPath } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigationStore } from '../store/useNavigationStore';
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
import { getImageUrl } from '../utils/image';
import { Logo } from '../components/ui';
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '../api/settings';
import { useTheme } from '../contexts/ThemeContext';
import { AIChatWidget } from '../components/AI/AIChatWidget';
import { AdminContentRouter } from '../components/Admin/AdminContentRouter';
import { AdminHeaderBar } from '../components/Admin/AdminHeaderBar';
import type { MenuId, LaunchpadConfig } from '../config/launchpadConfig';
import { MENU_TO_RESOURCE, DEFAULT_LAUNCHPAD_CONFIG } from '../config/launchpadConfig';

// Define the available tabs
// Define the available tabs
type TabId =
    | 'dashboard'
    | 'assets-workspace' | 'buying-workspace' | 'selling-workspace' | 'stock-workspace' | 'accounting-workspace'
    | 'assets'
    | 'asset-settings' | 'depreciation-methods' | 'maintenance-types'
    | 'depreciation-ledger' | 'roi-trends' | 'condition-distribution' | 'workorder-summary' | 'fuel-consumption' | 'custody-history' | 'team-performance' | 'tax-expiry' | 'cost-analysis'
    | 'iot-sensor-stream' | 'asset-health-telemetry' | 'threshold-alerts'
    | 'categories'
    | 'inventory-categories' // New
    | 'inventory-items'      // New
    | 'warehouses'           // New
    | 'stock-opname'         // New
    | 'stock-entry'          // New
    | 'material-request'     // New
    | 'purchase-receipt'     // New
    | 'quality-inspection'
    | 'delivery-trip'
    | 'stock-workspace' | 'delivery-notes' | 'pick-lists' | 'landed-cost-vouchers' | 'stock-product-bundles'
    | 'item-alternatives' | 'item-manufacturers' | 'manufacturers' | 'serial-numbers' | 'batches' | 'installation-notes'
    | 'stock-settings' | 'brands' | 'item-attributes' | 'uoms' | 'uom-conversions' | 'item-tax-templates' | 'item-manufacturers'
    | 'stock-ledger' | 'stock-balance' | 'stock-summary' | 'stock-ageing' | 'stock-projected-qty' | 'stock-analytics'
    | 'batch-wise-balance' | 'serial-no-status' | 'item-shortage-report'
    | 'accounting-workspace' | 'chart-of-accounts' | 'journal-entries-view' | 'payment-entries' | 'payment-reconciliation'
    | 'bank-accounts' | 'bank-transactions' | 'bank-clearance' | 'cashier-closing' | 'cost-centers' | 'accounting-dimensions'
    | 'budgets-view' | 'sales-tax-templates' | 'purchase-tax-templates-view' | 'tax-categories' | 'tax-rules'
    | 'credit-notes' | 'debit-notes' | 'dunnings' | 'balance-sheet' | 'profit-loss' | 'cash-flow' | 'trial-balance'
    | 'general-ledger-report' | 'ar-aging' | 'ap-aging'
    | 'locations'
    | 'work-orders'
    | 'rentals'
    | 'rental-form'
    | 'contracts'
    | 'contract-detail'
    | 'contract-analytics'
    | 'contract-templates'
    | 'loans'
    | 'fuel'
    | 'employees'
    | 'designations' | 'employee-lifecycle' | 'employee-360' | 'shifts' | 'attendance-logs' | 'overtime' | 'attendance-requests'
    | 'attendance'
    | 'leaves'
    | 'salary-slips' | 'payroll-processing' | 'salary-assignments' | 'salary-structures' | 'employee-loans' | 'expense-claims' | 'appraisal' | 'recruitment' | 'training-certifications' | 'disciplinary-actions' | 'driver-assignments' | 'p2h-inspections' | 'driver-safety-incidents'
    | 'conversions'
    | 'approvals'
    | 'reports'
    | 'users'
    | 'roles'
    | 'audit'
    | 'asset-audit'
    | 'system-audit'
    | 'departments'
    | 'finance'
    | 'journal-entries'
    | 'journal-form'
    | 'general-ledger'
    | 'trial-balance'
    | 'financial-reports'
    | 'cash-bank'
    | 'sales'
    | 'sales-overview'
    | 'approval-workflow-settings'
    | 'sales-quotes'
    | 'sales-orders'
    | 'sales-shipments'
    | 'sales-invoices'
    | 'selling-workspace'
    | 'customers'
    | 'quotations'
    | 'blanket-orders'
    | 'sales-partners'
    | 'sales-persons'
    | 'pos-profiles'
    | 'pos-settings'
    | 'pos-opening'
    | 'pos-closing'
    | 'loyalty-programs'
    | 'loyalty-points'
    | 'items'
    | 'item-prices'
    | 'price-lists'
    | 'item-groups'
    | 'product-bundles'
    | 'promotional-schemes'
    | 'pricing-rules'
    | 'shipping-rules'
    | 'coupon-codes'
    | 'selling-settings'
    | 'terms-templates'
    | 'tax-templates'
    | 'utm-sources'
    | 'customer-groups'
    | 'contacts'
    | 'addresses'
    | 'territories'
    | 'campaigns'
    | 'sales-analytics'
    | 'so-analysis'
    | 'sales-funnel'
    | 'so-trends'
    | 'quotation-trends'
    | 'customer-acquisition'
    | 'inactive-customers'
    | 'salesperson-summary'
    | 'item-sales-history'
    | 'customer-directory'
    | 'packing-stock'
    | 'pending-so-pr'
    | 'delivery-trends'
    | 'invoice-trends'
    | 'customer-credit-balance'
    | 'dormant-customers'
    | 'partner-commissions'
    | 'territory-target-variance'
    | 'salesperson-target-variance'
    | 'partner-target-variance'
    | 'purchases' // This now refers to the group
    | 'purchase-overview'
    | 'purchase-quotes'
    | 'purchase-orders'
    | 'purchase-shipments'
    | 'purchase-bills'
    | 'buying-workspace' | 'material-requests' | 'rfqs' | 'supplier-quotations'
    | 'buying-item-prices' | 'buying-price-lists' | 'buying-product-bundles' | 'buying-item-groups' | 'buying-promotional-schemes' | 'buying-pricing-rules'
    | 'buying-settings'    | 'quality-inspection' | 'delivery-note' | 'pick-list' | 'installation-note'
    | 'supplier-quotations' | 'rfqs'
    | 'suppliers' | 'supplier-groups' | 'supplier-contacts' | 'supplier-addresses'
    | 'supplier-scorecards' | 'scorecard-variables' | 'scorecard-criteria' | 'scorecard-standings'
    | 'purchase-analytics' | 'po-analysis' | 'item-consumption' | 'items-to-order-receive' | 'po-trends' | 'procurement-tracker'
    | 'items-to-request' | 'item-purchase-history' | 'purchase-receipt-trends' | 'purchase-invoice-trends' | 'subcontract-materials' | 'subcontract-received' | 'rfq-comparison' | 'pr-to-rfq' | 'supplier-directory' | 'import-supplier-invoice'
    | 'maintenance-templates'
    | 'maintenance-schedules'
    | 'maintenance-teams'
    | 'tax-renewals'
    | 'expenses'
    | 'asset-lifecycle'
    | 'settings'
    | 'companies'
    | 'company'
    | 'branch'
    | 'email-account'
    | 'metadata-editor'
    | 'analytics'
    | 'profile';

interface NavItem {
    id: TabId;
    icon: any;
    label: string;
    adminOnly?: boolean;
    minLevel?: number; // 1=SuperAdmin, 2=Admin, 3=Manager, 4=Staff, 5=Viewer
    showBadge?: boolean;
    path?: string;
}

interface NavGroup {
    id: string;
    label: string;
    icon: any;
    children: NavEntry[];
    minLevel?: number;
    showBadge?: boolean;
}

interface NavHeader {
    type: 'header';
    label: string;
    minLevel?: number;
}

type NavEntry = NavItem | NavGroup | NavHeader;

const isNavGroup = (entry: NavEntry): entry is NavGroup => {
    return 'children' in entry;
};

const isNavHeader = (entry: NavEntry): entry is NavHeader => {
    return 'type' in entry && entry.type === 'header';
};

// Master registry of all navigation items in the application
const ALL_NAV_ITEMS: Record<string, NavItem> = {
    'dashboard': { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard Overview', minLevel: 5 },
    'analytics': { id: 'analytics', icon: TrendingUp, label: 'Performance Analytics', minLevel: 3 },
    'reports': { id: 'reports', icon: FileText, label: 'Management Reports', minLevel: 3 },

    'assets-workspace': { id: 'assets-workspace', icon: Box, label: 'Assets Workspace', path: '/assets-workspace', minLevel: 5 },
    'assets': { id: 'assets', icon: Box, label: 'All Assets', minLevel: 5 },
    'asset-lifecycle': { id: 'asset-lifecycle', icon: History, label: 'Asset Lifecycle & Tracking', minLevel: 4 },
    'categories': { id: 'categories', icon: FolderTree, label: 'Asset Category', minLevel: 4 },
    'locations': { id: 'locations', icon: MapPin, label: 'Locations & Geolocation Map', minLevel: 4 },
    'asset-audit': { id: 'asset-audit', icon: Scan, label: 'Asset Audit Sessions', minLevel: 4 },

    'inventory-items': { id: 'inventory-items', icon: Package, label: 'Item', minLevel: 4 },
    'inventory-categories': { id: 'inventory-categories', icon: FolderTree, label: 'Item Group', minLevel: 4 },
    'warehouses': { id: 'warehouses', icon: Database, label: 'Warehouse', minLevel: 3 },
    'stock-opname': { id: 'stock-opname', icon: Scan, label: 'Stock Reconciliation', minLevel: 3 },
    'stock-entry': { id: 'stock-entry', icon: ClipboardCheck, label: 'Stock Entry', minLevel: 3 },
    'material-request': { id: 'material-request', icon: FileText, label: 'Material Request', minLevel: 3 },
    'purchase-receipt': { id: 'purchase-receipt', icon: ClipboardCheck, label: 'Purchase Receipt', minLevel: 3 },
    'delivery-notes': { id: 'delivery-notes', icon: Truck, label: 'Delivery Note', minLevel: 3 },
    'pick-lists': { id: 'pick-lists', icon: ClipboardCheck, label: 'Pick List', minLevel: 3 },
    'delivery-trip': { id: 'delivery-trip', icon: Truck, label: 'Delivery Trip', minLevel: 3 },
    'installation-note': { id: 'installation-note', icon: Wrench, label: 'Installation Note', minLevel: 3 },
    'quality-inspection': { id: 'quality-inspection', icon: Scan, label: 'Quality Inspection', minLevel: 3 },
    'conversions': { id: 'conversions', icon: ArrowLeftRight, label: 'Asset Conversion Requests', minLevel: 3 },

    'purchase-bills': { id: 'purchase-bills', icon: FileText, label: 'Purchase Invoice', path: '/buying/purchase-bills', minLevel: 3 },
    'purchase-orders': { id: 'purchase-orders', icon: ShoppingCart, label: 'Purchase Order', path: '/buying/purchase-orders', minLevel: 4 },

    'work-orders': { id: 'work-orders', icon: ClipboardCheck, label: 'Work Orders', minLevel: 4 },
    'maintenance-schedules': { id: 'maintenance-schedules', icon: CalendarIcon, label: 'Preventive Maintenance Schedules', minLevel: 3 },
    'maintenance-templates': { id: 'maintenance-templates', icon: FileText, label: 'Maintenance SOP Templates', minLevel: 3 },
    'maintenance-teams': { id: 'maintenance-teams', icon: Users, label: 'Maintenance Teams', minLevel: 3 },
    'fuel': { id: 'fuel', icon: Fuel, label: 'Fuel Management & Logs', minLevel: 4 },
    'tax-renewals': { id: 'tax-renewals', icon: Receipt, label: 'Tax & Document Renewals', minLevel: 3 },
    'asset-settings': { id: 'asset-settings', icon: Settings, label: 'Asset Settings', path: '/assets/settings', minLevel: 3 },
    'depreciation-methods': { id: 'depreciation-methods', icon: TrendingUp, label: 'Depreciation Methods', path: '/assets/depreciation-methods', minLevel: 3 },
    'maintenance-types': { id: 'maintenance-types', icon: Wrench, label: 'Maintenance Types', path: '/assets/maintenance-types', minLevel: 3 },
    'depreciation-ledger': { id: 'depreciation-ledger', icon: FileText, label: 'Asset Depreciation Ledger', path: '/assets/reports/depreciation-ledger', minLevel: 3 },
    'roi-trends': { id: 'roi-trends', icon: TrendingUp, label: 'Asset ROI & Cost Trends', path: '/assets/reports/roi-trends', minLevel: 3 },
    'condition-distribution': { id: 'condition-distribution', icon: BarChart2, label: 'Asset Condition Distribution', path: '/assets/reports/condition-distribution', minLevel: 3 },
    'workorder-summary': { id: 'workorder-summary', icon: ClipboardCheck, label: 'Work Order Maintenance Summary', path: '/assets/reports/workorder-summary', minLevel: 3 },
    'fuel-consumption': { id: 'fuel-consumption', icon: Fuel, label: 'Fuel Consumption Report', path: '/assets/reports/fuel-consumption', minLevel: 3 },
    'custody-history': { id: 'custody-history', icon: History, label: 'Asset Custody & Transfer History', path: '/assets/reports/custody-history', minLevel: 3 },
    'team-performance': { id: 'team-performance', icon: Users, label: 'Maintenance Team Performance', path: '/assets/reports/team-performance', minLevel: 3 },
    'tax-expiry': { id: 'tax-expiry', icon: CalendarIcon, label: 'Tax Renewal Expiry Schedule', path: '/assets/reports/tax-expiry', minLevel: 3 },
    'cost-analysis': { id: 'cost-analysis', icon: DollarSign, label: 'Asset Maintenance Cost Analysis', path: '/assets/reports/cost-analysis', minLevel: 3 },
    'iot-sensor-stream': { id: 'iot-sensor-stream', icon: Activity, label: 'IoT Sensor Stream', minLevel: 4 },
    'asset-health-telemetry': { id: 'asset-health-telemetry', icon: TrendingUp, label: 'Asset Health Telemetry', minLevel: 4 },
    'threshold-alerts': { id: 'threshold-alerts', icon: ShieldAlert, label: 'Threshold Alert Engine', minLevel: 4 },

    'rentals': { id: 'rentals', icon: Truck, label: 'Rental Orders', minLevel: 4 },
    'contracts': { id: 'contracts', icon: FileText, label: 'Contracts', minLevel: 4 },
    'contract-templates': { id: 'contract-templates', icon: Settings, label: 'Templates', minLevel: 3 },
    'loans': { id: 'loans', icon: HandMetal, label: 'Internal Asset Loans', minLevel: 5 },

    'sales-invoices': { id: 'sales-invoices', icon: FileText, label: 'Sales Invoice', minLevel: 3 },
    'selling-workspace': { id: 'selling-workspace', icon: ShoppingBag, label: 'Selling Workspace', minLevel: 4 },
    'customers': { id: 'customers', icon: Users, label: 'Customer', minLevel: 4 },
    'quotations': { id: 'quotations', icon: FileText, label: 'Quotation', minLevel: 4 },
    'sales-orders': { id: 'sales-orders', icon: ShoppingCart, label: 'Sales Order', minLevel: 4 },
    'blanket-orders': { id: 'blanket-orders', icon: FileText, label: 'Blanket Order', minLevel: 3 },
    'sales-partners': { id: 'sales-partners', icon: Users, label: 'Sales Partner', minLevel: 3 },
    'sales-persons': { id: 'sales-persons', icon: Users, label: 'Sales Person', minLevel: 3 },
    'pos-profiles': { id: 'pos-profiles', icon: Receipt, label: 'Point-of-Sale Profile', minLevel: 3 },
    'pos-settings': { id: 'pos-settings', icon: Settings, label: 'POS Settings', minLevel: 2 },
    'pos-opening': { id: 'pos-opening', icon: Receipt, label: 'POS Opening Entry', minLevel: 4 },
    'pos-closing': { id: 'pos-closing', icon: Receipt, label: 'POS Closing Entry', minLevel: 4 },
    'loyalty-programs': { id: 'loyalty-programs', icon: Tag, label: 'Loyalty Program', minLevel: 3 },
    'loyalty-points': { id: 'loyalty-points', icon: Tag, label: 'Loyalty Point Entry', minLevel: 4 },
    'items': { id: 'items', icon: Package, label: 'Item', minLevel: 4 },
    'item-prices': { id: 'item-prices', icon: Tag, label: 'Item Price', minLevel: 3 },
    'price-lists': { id: 'price-lists', icon: Tag, label: 'Price List', minLevel: 3 },
    'item-groups': { id: 'item-groups', icon: FolderTree, label: 'Item Group', minLevel: 4 },
    'product-bundles': { id: 'product-bundles', icon: Package, label: 'Product Bundle', minLevel: 3 },
    'promotional-schemes': { id: 'promotional-schemes', icon: Tag, label: 'Promotional Scheme', minLevel: 3 },
    'pricing-rules': { id: 'pricing-rules', icon: Tag, label: 'Pricing Rule', minLevel: 3 },
    'shipping-rules': { id: 'shipping-rules', icon: Truck, label: 'Shipping Rule', minLevel: 3 },
    'coupon-codes': { id: 'coupon-codes', icon: Tag, label: 'Coupon Code', minLevel: 3 },
    'selling-settings': { id: 'selling-settings', icon: Settings, label: 'Selling Settings', minLevel: 2 },
    'terms-templates': { id: 'terms-templates', icon: FileText, label: 'Terms and Conditions Template', minLevel: 3 },
    'tax-templates': { id: 'tax-templates', icon: Receipt, label: 'Sales Taxes and Charges Template', minLevel: 3 },
    'utm-sources': { id: 'utm-sources', icon: Tag, label: 'UTM Source', minLevel: 3 },
    'customer-groups': { id: 'customer-groups', icon: Users, label: 'Customer Group', minLevel: 3 },
    'contacts': { id: 'contacts', icon: Users, label: 'Contact', minLevel: 4 },
    'addresses': { id: 'addresses', icon: MapPin, label: 'Address', minLevel: 4 },
    'territories': { id: 'territories', icon: MapPin, label: 'Territory', minLevel: 3 },
    'campaigns': { id: 'campaigns', icon: Tag, label: 'Campaign', minLevel: 3 },
    'sales-analytics': { id: 'sales-analytics', icon: TrendingUp, label: 'Sales Analytics', minLevel: 3 },
    'so-analysis': { id: 'so-analysis', icon: TrendingUp, label: 'Sales Order Analysis', minLevel: 3 },
    'sales-funnel': { id: 'sales-funnel', icon: TrendingUp, label: 'Sales Funnel', minLevel: 3 },
    'so-trends': { id: 'so-trends', icon: TrendingUp, label: 'Sales Order Trends', minLevel: 3 },
    'quotation-trends': { id: 'quotation-trends', icon: TrendingUp, label: 'Quotation Trends', minLevel: 3 },
    'customer-acquisition': { id: 'customer-acquisition', icon: TrendingUp, label: 'Customer Acquisition and Loyalty', minLevel: 3 },
    'inactive-customers': { id: 'inactive-customers', icon: Users, label: 'Inactive Customers', minLevel: 3 },
    'salesperson-summary': { id: 'salesperson-summary', icon: FileText, label: 'Sales Person-wise Transaction Summary', minLevel: 3 },
    'item-sales-history': { id: 'item-sales-history', icon: History, label: 'Item-wise Sales History', minLevel: 3 },
    'customer-directory': { id: 'customer-directory', icon: Users, label: 'Customer Addresses And Contacts', minLevel: 3 },
    'packing-stock': { id: 'packing-stock', icon: Package, label: 'Available Stock for Packing Items', minLevel: 3 },
    'pending-so-pr': { id: 'pending-so-pr', icon: ShoppingCart, label: 'Pending SO Items For Purchase Request', minLevel: 3 },
    'delivery-trends': { id: 'delivery-trends', icon: Truck, label: 'Delivery Note Trends', minLevel: 3 },
    'invoice-trends': { id: 'invoice-trends', icon: Receipt, label: 'Sales Invoice Trends', minLevel: 3 },
    'customer-credit-balance': { id: 'customer-credit-balance', icon: Receipt, label: 'Customer Credit Balance', minLevel: 3 },
    'dormant-customers': { id: 'dormant-customers', icon: Users, label: 'Customers Without Transactions', minLevel: 3 },
    'partner-commissions': { id: 'partner-commissions', icon: Receipt, label: 'Sales Partners Commission', minLevel: 3 },
    'territory-target-variance': { id: 'territory-target-variance', icon: TrendingUp, label: 'Territory Target Variance', minLevel: 3 },
    'salesperson-target-variance': { id: 'salesperson-target-variance', icon: TrendingUp, label: 'Sales Person Target Variance', minLevel: 3 },
    'partner-target-variance': { id: 'partner-target-variance', icon: TrendingUp, label: 'Sales Partner Target Variance', minLevel: 3 },

    'buying-workspace': { id: 'buying-workspace', icon: ShoppingBag, label: 'Buying Workspace', minLevel: 4 },
    'material-requests': { id: 'material-requests', icon: Package, label: 'Material Request', minLevel: 4 },
    'rfqs': { id: 'rfqs', icon: FileText, label: 'Request for Quotation', minLevel: 4 },
    'supplier-quotations': { id: 'supplier-quotations', icon: FileText, label: 'Supplier Quotation', minLevel: 4 },
    'buying-item-prices': { id: 'buying-item-prices', icon: Tag, label: 'Item Price', minLevel: 3 },
    'buying-price-lists': { id: 'buying-price-lists', icon: Tag, label: 'Price List', minLevel: 3 },
    'buying-product-bundles': { id: 'buying-product-bundles', icon: Package, label: 'Product Bundle', minLevel: 3 },
    'buying-item-groups': { id: 'buying-item-groups', icon: FolderTree, label: 'Item Group', minLevel: 3 },
    'buying-promotional-schemes': { id: 'buying-promotional-schemes', icon: Tag, label: 'Promotional Scheme', minLevel: 3 },
    'buying-pricing-rules': { id: 'buying-pricing-rules', icon: Tag, label: 'Pricing Rule', minLevel: 3 },
    'buying-settings': { id: 'buying-settings', icon: Settings, label: 'Buying Settings', minLevel: 2 },
    'suppliers': { id: 'suppliers', icon: Users, label: 'Supplier', minLevel: 4 },
    'supplier-groups': { id: 'supplier-groups', icon: Users, label: 'Supplier Group', minLevel: 3 },
    'supplier-contacts': { id: 'supplier-contacts', icon: Users, label: 'Contact', minLevel: 4 },
    'supplier-addresses': { id: 'supplier-addresses', icon: MapPin, label: 'Address', minLevel: 4 },
    'supplier-scorecards': { id: 'supplier-scorecards', icon: ShieldAlert, label: 'Supplier Scorecard', minLevel: 3 },
    'scorecard-variables': { id: 'scorecard-variables', icon: ShieldAlert, label: 'Supplier Scorecard Variable', minLevel: 3 },
    'scorecard-criteria': { id: 'scorecard-criteria', icon: ShieldAlert, label: 'Supplier Scorecard Criteria', minLevel: 3 },
    'scorecard-standings': { id: 'scorecard-standings', icon: ShieldAlert, label: 'Supplier Scorecard Standing', minLevel: 3 },
    'purchase-analytics': { id: 'purchase-analytics', icon: TrendingUp, label: 'Purchase Analytics', minLevel: 3 },
    'po-analysis': { id: 'po-analysis', icon: TrendingUp, label: 'Purchase Order Analysis', minLevel: 3 },
    'item-consumption': { id: 'item-consumption', icon: TrendingUp, label: 'Item Wise Consumption', minLevel: 3 },
    'items-to-order-receive': { id: 'items-to-order-receive', icon: ShoppingCart, label: 'Items to Order and Receive', minLevel: 3 },
    'po-trends': { id: 'po-trends', icon: TrendingUp, label: 'Purchase Order Trends', minLevel: 3 },
    'procurement-tracker': { id: 'procurement-tracker', icon: TrendingUp, label: 'Procurement Tracker', minLevel: 3 },
    'items-to-request': { id: 'items-to-request', icon: Package, label: 'Items To Be Requested', minLevel: 3 },
    'item-purchase-history': { id: 'item-purchase-history', icon: History, label: 'Item-wise Purchase History', minLevel: 3 },
    'purchase-receipt-trends': { id: 'purchase-receipt-trends', icon: TrendingUp, label: 'Purchase Receipt Trends', minLevel: 3 },
    'purchase-invoice-trends': { id: 'purchase-invoice-trends', icon: Receipt, label: 'Purchase Invoice Trends', minLevel: 3 },
    'subcontract-materials': { id: 'subcontract-materials', icon: Package, label: 'Subcontracted Raw Materials To Be Transferred', minLevel: 3 },
    'subcontract-received': { id: 'subcontract-received', icon: Package, label: 'Subcontracted Item To Be Received', minLevel: 3 },
    'rfq-comparison': { id: 'rfq-comparison', icon: FileText, label: 'Supplier Quotation Comparison', minLevel: 3 },
    'pr-to-rfq': { id: 'pr-to-rfq', icon: FileText, label: 'Material Requests for which Supplier Quotation Created', minLevel: 3 },
    'supplier-directory': { id: 'supplier-directory', icon: Users, label: 'Supplier Addresses And Contacts', minLevel: 3 },
    'import-supplier-invoice': { id: 'import-supplier-invoice', icon: Download, label: 'Import Supplier Invoice', minLevel: 3 },

    'stock-workspace': { id: 'stock-workspace', icon: Package, label: 'Stock Workspace', minLevel: 3 },
    'landed-cost-vouchers': { id: 'landed-cost-vouchers', icon: Receipt, label: 'Landed Cost Voucher', minLevel: 3 },
    'stock-product-bundles': { id: 'stock-product-bundles', icon: Package, label: 'Product Bundle', minLevel: 3 },
    'item-alternatives': { id: 'item-alternatives', icon: Package, label: 'Item Alternative', minLevel: 3 },
    'item-manufacturers': { id: 'item-manufacturers', icon: Package, label: 'Item Manufacturer', minLevel: 3 },
    'manufacturers': { id: 'manufacturers', icon: Building2, label: 'Manufacturer', minLevel: 3 },
    'serial-numbers': { id: 'serial-numbers', icon: Tag, label: 'Serial No', minLevel: 3 },
    'batches': { id: 'batches', icon: Tag, label: 'Batch', minLevel: 3 },
    'installation-notes': { id: 'installation-notes', icon: FileText, label: 'Installation Note', minLevel: 3 },
    'stock-settings': { id: 'stock-settings', icon: Settings, label: 'Stock Settings', minLevel: 2 },
    'brands': { id: 'brands', icon: Tag, label: 'Brand', minLevel: 3 },
    'item-attributes': { id: 'item-attributes', icon: FolderTree, label: 'Item Attribute', minLevel: 3 },
    'uoms': { id: 'uoms', icon: Package, label: 'UOM', minLevel: 3 },
    'uom-conversions': { id: 'uom-conversions', icon: Package, label: 'UOM Conversion Factor', minLevel: 3 },
    'item-tax-templates': { id: 'item-tax-templates', icon: Receipt, label: 'Item Tax Template', minLevel: 3 },
    'item-manufacturers': { id: 'item-manufacturers', icon: Factory, label: 'Item Manufacturers', minLevel: 3 },
    'stock-ledger': { id: 'stock-ledger', icon: History, label: 'Stock Ledger', minLevel: 3 },
    'stock-balance': { id: 'stock-balance', icon: Package, label: 'Stock Balance', minLevel: 3 },
    'stock-summary': { id: 'stock-summary', icon: TrendingUp, label: 'Stock Summary', minLevel: 3 },
    'stock-ageing': { id: 'stock-ageing', icon: Clock, label: 'Stock Ageing', minLevel: 3 },
    'stock-projected-qty': { id: 'stock-projected-qty', icon: Package, label: 'Stock Projected Qty', minLevel: 3 },
    'stock-analytics': { id: 'stock-analytics', icon: TrendingUp, label: 'Stock Analytics', minLevel: 3 },
    'batch-wise-balance': { id: 'batch-wise-balance', icon: History, label: 'Batch-wise Balance History', minLevel: 3 },
    'serial-no-status': { id: 'serial-no-status', icon: Tag, label: 'Serial No Status', minLevel: 3 },
    'item-shortage-report': { id: 'item-shortage-report', icon: ShieldAlert, label: 'Item Shortage Report', minLevel: 3 },

    'finance': { id: 'finance', icon: FolderTree, label: 'Chart of Accounts', minLevel: 2 },
    'cash-bank': { id: 'cash-bank', icon: Wallet, label: 'Cash & Bank', minLevel: 2 },
    'expenses': { id: 'expenses', icon: Receipt, label: 'Expenses (Opex/Capex)', minLevel: 2 },
    'journal-entries': { id: 'journal-entries', icon: FileText, label: 'Journal Entries', minLevel: 2 },
    'financial-reports': { id: 'financial-reports', icon: TrendingUp, label: 'Reports', minLevel: 2 },

    'accounting-workspace': { id: 'accounting-workspace', icon: Wallet, label: 'Accounting Workspace', minLevel: 2 },
    'chart-of-accounts': { id: 'chart-of-accounts', icon: FolderTree, label: 'Chart of Accounts', minLevel: 2 },
    'journal-entries-view': { id: 'journal-entries-view', icon: FileText, label: 'Journal Entry', minLevel: 2 },
    'payment-entries': { id: 'payment-entries', icon: Receipt, label: 'Payment Entry', minLevel: 2 },
    'payment-reconciliation': { id: 'payment-reconciliation', icon: RefreshCw, label: 'Payment Reconciliation', minLevel: 2 },
    'bank-accounts': { id: 'bank-accounts', icon: Wallet, label: 'Bank Account', minLevel: 2 },
    'bank-transactions': { id: 'bank-transactions', icon: TrendingUp, label: 'Bank Transaction', minLevel: 2 },
    'bank-clearance': { id: 'bank-clearance', icon: CheckCircle2, label: 'Bank Clearance', minLevel: 2 },
    'cashier-closing': { id: 'cashier-closing', icon: Lock, label: 'Cashier Closing Entry', minLevel: 2 },
    'cost-centers': { id: 'cost-centers', icon: Building2, label: 'Cost Center', minLevel: 2 },
    'accounting-dimensions': { id: 'accounting-dimensions', icon: Layers, label: 'Accounting Dimension', minLevel: 2 },
    'budgets-view': { id: 'budgets-view', icon: DollarSign, label: 'Budget', minLevel: 2 },
    'sales-tax-templates': { id: 'sales-tax-templates', icon: Receipt, label: 'Sales Tax Template', minLevel: 2 },
    'purchase-tax-templates-view': { id: 'purchase-tax-templates-view', icon: Receipt, label: 'Purchase Tax Template', minLevel: 2 },
    'tax-categories': { id: 'tax-categories', icon: Tag, label: 'Tax Category & Rules', minLevel: 2 },
    'tax-rules': { id: 'tax-rules', icon: Settings, label: 'Tax Rule', minLevel: 2 },
    'credit-notes': { id: 'credit-notes', icon: FileText, label: 'Credit Note', minLevel: 2 },
    'debit-notes': { id: 'debit-notes', icon: FileText, label: 'Debit Note', minLevel: 2 },
    'dunnings': { id: 'dunnings', icon: ShieldAlert, label: 'Dunning (Surat Tagihan)', minLevel: 2 },
    'balance-sheet': { id: 'balance-sheet', icon: BarChart2, label: 'Balance Sheet (Neraca)', minLevel: 2 },
    'profit-loss': { id: 'profit-loss', icon: TrendingUp, label: 'Profit and Loss Statement (Laba Rugi)', minLevel: 2 },
    'cash-flow': { id: 'cash-flow', icon: Wallet, label: 'Cash Flow Statement (Arus Kas)', minLevel: 2 },
    'trial-balance': { id: 'trial-balance', icon: FileText, label: 'Trial Balance (Neraca Saldo)', minLevel: 2 },
    'general-ledger-report': { id: 'general-ledger-report', icon: History, label: 'General Ledger Report', minLevel: 2 },
    'ar-aging': { id: 'ar-aging', icon: Clock, label: 'AR Aging Report', minLevel: 2 },
    'ap-aging': { id: 'ap-aging', icon: Clock, label: 'AP Aging Report', minLevel: 2 },

    'employees': { id: 'employees', icon: Users, label: 'Employees', minLevel: 3 },
    'designations': { id: 'designations', icon: Briefcase, label: 'Master Jabatan', minLevel: 3 },
    'employee-lifecycle': { id: 'employee-lifecycle', icon: History, label: 'Riwayat Karir', minLevel: 3 },
    'employee-360': { id: 'employee-360', icon: User, label: 'Profil 360', minLevel: 3 },
    'shifts': { id: 'shifts', icon: Clock, label: 'Manajemen Shift', minLevel: 3 },
    'attendance-logs': { id: 'attendance-logs', icon: Activity, label: 'Log Kehadiran & Rekap', minLevel: 3 },
    'overtime': { id: 'overtime', icon: FileSpreadsheet, label: 'Lembur (SPKL)', minLevel: 3 },
    'attendance-requests': { id: 'attendance-requests', icon: ClipboardCheck, label: 'Koreksi Absensi', minLevel: 3 },
    'departments': { id: 'departments', icon: Building2, label: 'Departments', minLevel: 3 },
    'attendance': { id: 'attendance', icon: Clock, label: 'Attendance', minLevel: 3 },
    'leaves': { id: 'leaves', icon: CalendarIcon, label: 'Leaves', minLevel: 3 },
    'salary-slips': { id: 'salary-slips', icon: FileText, label: 'Slip Gaji', minLevel: 3 },
    'payroll-processing': { id: 'payroll-processing', icon: DollarSign, label: 'Proses Penggajian', minLevel: 3 },
    'salary-assignments': { id: 'salary-assignments', icon: CreditCard, label: 'Penetapan Gaji', minLevel: 3 },
    'salary-structures': { id: 'salary-structures', icon: Layers, label: 'Struktur Gaji', minLevel: 3 },
    'employee-loans': { id: 'employee-loans', icon: HandCoins, label: 'Pinjaman & Kasbon', minLevel: 3 },
    'expense-claims': { id: 'expense-claims', icon: Receipt, label: 'Klaim Reimbursement', minLevel: 3 },
    'appraisal': { id: 'appraisal', icon: Award, label: 'Evaluasi Kinerja (KPI)', minLevel: 3 },
    'recruitment': { id: 'recruitment', icon: UserPlus, label: 'Rekrutmen & ATS', minLevel: 3 },
    'training-certifications': { id: 'training-certifications', icon: GraduationCap, label: 'Pelatihan & Sertifikasi', minLevel: 3 },
    'disciplinary-actions': { id: 'disciplinary-actions', icon: AlertOctagon, label: 'Surat Peringatan & Disiplin', minLevel: 3 },
    'driver-assignments': { id: 'driver-assignments', icon: Truck, label: 'Penugasan Driver & Alat', minLevel: 3 },
    'p2h-inspections': { id: 'p2h-inspections', icon: ClipboardCheck, label: 'Inspeksi Harian (P2H)', minLevel: 3 },
    'driver-safety-incidents': { id: 'driver-safety-incidents', icon: ShieldAlert, label: 'Insiden & Pelanggaran Driver', minLevel: 3 },

    'approvals': { id: 'approvals', icon: CheckSquare, label: 'Approval Center', minLevel: 3, showBadge: true },

    'users': { id: 'users', icon: Users, label: 'User Operations', minLevel: 2 },
    'roles': { id: 'roles', icon: Shield, label: 'Access Rights', minLevel: 1 },
    'approval-workflow-settings': { id: 'approval-workflow-settings', icon: Layers, label: 'Workflows', minLevel: 1 },
    'audit': { id: 'audit', icon: History, label: 'Audit Logs', minLevel: 2 },
    'companies': { id: 'companies', icon: Building2, label: 'Companies (Entitas)', minLevel: 2 },
    'company': { id: 'company', icon: Building2, label: 'Company Management', minLevel: 2 },
    'branch': { id: 'branch', icon: Building2, label: 'Branch Management', minLevel: 2 },
    'email-account': { id: 'email-account', icon: Mail, label: 'Email Accounts', minLevel: 2 },
    'settings': { id: 'settings', icon: Settings, label: 'App Settings', minLevel: 2 },
    'metadata-editor': { id: 'metadata-editor', icon: Database, label: 'Metadata & Schema', minLevel: 1, adminOnly: true },
    'profile': { id: 'profile', icon: UserCircle, label: 'My Profile', minLevel: 5 },
};


export default function AdminDashboard() {
    const { theme, setTheme } = useTheme();
    const [activeTab, setActiveTab] = useState<TabId>('dashboard');
    const { activeModule, setActiveModule, getVisibleMenuIds, launchpadConfig, setLaunchpadConfig } = useNavigationStore();

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };
    const [sidebarOpen, setSidebarOpen] = useState(true);
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
                                'uom-conversions', 'item-tax-templates', 'item-manufacturers', 'stock-tax-templates', 'stock-ledger', 'stock-balance',
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
                                'financial-reports', 'sales-invoices', 'purchase-bills'
                            ];
                            accIds.forEach(id => {
                                if (!ids.includes(id)) ids.push(id);
                            });
                            return { ...m, menuIds: ids };
                        }
                        if (m.id === 'hr') {
                            const ids = m.menuIds || [];
                            const hrModuleIds: MenuId[] = ['employees', 'attendance', 'leaves', 'salary-slips', 'payroll-processing', 'salary-assignments', 'salary-structures', 'designations', 'employee-lifecycle', 'shifts', 'attendance-logs', 'overtime', 'attendance-requests'];
                            hrModuleIds.forEach(id => {
                                if (!ids.includes(id)) ids.push(id);
                            });
                            return { ...m, menuIds: ids.filter((id: string) => id !== 'departments') };
                        }
                        if (m.id === 'admin') {
                            const ids = m.menuIds || [];
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

        return [
            ALL_NAV_ITEMS['dashboard'],
            ALL_NAV_ITEMS['assets-workspace'],
            ALL_NAV_ITEMS['stock-workspace'],
            ALL_NAV_ITEMS['buying-workspace'],
            ALL_NAV_ITEMS['selling-workspace'],
            ALL_NAV_ITEMS['accounting-workspace'],
            ...(activeModule === 'insights' && (insightsIds.length === 0 || insightsIds.includes('analytics')) ? [ALL_NAV_ITEMS['analytics']] : []),
            ...(activeModule === 'insights' && (insightsIds.length === 0 || insightsIds.includes('reports')) ? [ALL_NAV_ITEMS['reports']] : []),
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
                    }
                ]
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
                    }
                ]
            },
            {
                id: 'rental_module',
                label: 'Rental & Contracts',
                icon: Truck,
                minLevel: 4,
                children: getGroupItems(rentalIds, ['rentals', 'contracts', 'contract-templates'])
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
                    }
                ]
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
                    }
                ]
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
                    }
                ]
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
                    ...getGroupItems(hrIds, ['recruitment', 'training-certifications', 'disciplinary-actions', 'driver-assignments', 'p2h-inspections', 'driver-safety-incidents']),
                    { type: 'header', label: 'Operasional Driver & P2H' },
                    ...getGroupItems(hrIds, ['driver-assignments', 'p2h-inspections', 'driver-safety-incidents']),
                ]
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
                    ...getGroupItems(adminIds.filter(id => id !== 'contract-templates'), ['approvals', 'audit', 'settings']),
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
            'hr': ['dashboard', 'analytics', 'reports', 'hr_group'],
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
                className={`flex-none bg-card/80 backdrop-blur-xl border-r border-border transition-all duration-300 ease-in-out flex flex-col relative z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]
                ${sidebarOpen ? 'w-64' : 'w-20'} 
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
                absolute lg:relative h-full`}
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
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent relative z-10 global-scrollbar p-6 lg:p-8">
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
