// Admin Dashboard - Main Container with Dark Theme
import { useState, lazy, Suspense, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, matchPath } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigationStore } from '../store/useNavigationStore';
import {
    LayoutDashboard, Package, FolderTree, Users, LogOut, Menu, X,
    FileText, Settings, Bell, ChevronDown, ChevronRight, ClipboardCheck,
    Truck, HandMetal, Building2, MapPin, Scan, UserCircle, Clock,
    Calendar as CalendarIcon, ArrowLeftRight, TrendingUp,
    Wallet, ShoppingCart, Receipt, History, Wrench, Fuel, Shield, Layers,
    CheckSquare, Box, Sun, Moon, ShieldAlert,
    Database, Mail, ShoppingBag, Tag, Download, RefreshCw, Lock, CheckCircle2, DollarSign, BarChart2
} from 'lucide-react';
import { getImageUrl } from '../utils/image';
import { PageLoading, Logo } from '../components/ui';
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '../api/settings';
import { useTheme } from '../contexts/ThemeContext';
import { AIChatWidget } from '../components/AI/AIChatWidget';
import { AdminContentRouter } from '../components/Admin/AdminContentRouter';
import { AdminHeaderBar } from '../components/Admin/AdminHeaderBar';
import type { MenuId, LaunchpadConfig } from '../config/launchpadConfig';
import { MENU_TO_RESOURCE, MENU_LABELS, DEFAULT_LAUNCHPAD_CONFIG } from '../config/launchpadConfig';

// Define the available tabs
type TabId =
    | 'dashboard'
    | 'assets'
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
    | 'stock-settings' | 'brands' | 'item-attributes' | 'uoms' | 'uom-conversions' | 'stock-tax-templates'
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
    | 'clients'
    | 'loans'
    | 'fuel'
    | 'employees'
    | 'attendance'
    | 'leaves'
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
    | 'buying-settings' | 'purchase-tax-templates' | 'buying-terms-templates'
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

    'assets': { id: 'assets', icon: Box, label: 'All Assets', minLevel: 5 },
    'asset-lifecycle': { id: 'asset-lifecycle', icon: History, label: 'Asset Lifecycle', minLevel: 4 },
    'categories': { id: 'categories', icon: FolderTree, label: 'Asset Categories', minLevel: 4 },
    'locations': { id: 'locations', icon: MapPin, label: 'Locations', minLevel: 4 },
    'asset-audit': { id: 'asset-audit', icon: Scan, label: 'Asset Audit', minLevel: 4 },

    'inventory-items': { id: 'inventory-items', icon: Package, label: 'Items', minLevel: 4 },
    'inventory-categories': { id: 'inventory-categories', icon: FolderTree, label: 'Inventory Categories', minLevel: 4 },
    'warehouses': { id: 'warehouses', icon: Database, label: 'Warehouses', minLevel: 3 },
    'stock-opname': { id: 'stock-opname', icon: Scan, label: 'Stock Opname', minLevel: 3 },
    'stock-entry': { id: 'stock-entry', icon: ClipboardCheck, label: 'Stock Entry', minLevel: 3 },
    'material-request': { id: 'material-request', icon: FileText, label: 'Material Request', minLevel: 3 },
    'purchase-receipt': { id: 'purchase-receipt', icon: ClipboardCheck, label: 'Purchase Receipt', minLevel: 3 },
    'quality-inspection': { id: 'quality-inspection', icon: Scan, label: 'Quality Inspection', minLevel: 3 },
    'delivery-trip': { id: 'delivery-trip', icon: Truck, label: 'Delivery Trip', minLevel: 3 },
    'conversions': { id: 'conversions', icon: ArrowLeftRight, label: 'Conversions', minLevel: 3 },

    'purchase-bills': { id: 'purchase-bills', icon: FileText, label: 'Vendor Bills', minLevel: 3 },

    'work-orders': { id: 'work-orders', icon: ClipboardCheck, label: 'Work Orders', minLevel: 4 },
    'maintenance-schedules': { id: 'maintenance-schedules', icon: CalendarIcon, label: 'PM Schedules', minLevel: 3 },
    'maintenance-templates': { id: 'maintenance-templates', icon: FileText, label: 'Maintenance SOP', minLevel: 3 },
    'maintenance-teams': { id: 'maintenance-teams', icon: Users, label: 'Maintenance Teams', minLevel: 3 },
    'fuel': { id: 'fuel', icon: Fuel, label: 'Fuel Management', minLevel: 4 },
    'tax-renewals': { id: 'tax-renewals', icon: Receipt, label: 'Tax & Documents', minLevel: 3 },

    'rentals': { id: 'rentals', icon: Truck, label: 'Rental Orders', minLevel: 4 },
    'contracts': { id: 'contracts', icon: FileText, label: 'Contracts', minLevel: 4 },
    'contract-templates': { id: 'contract-templates', icon: Settings, label: 'Templates', minLevel: 3 },
    'loans': { id: 'loans', icon: HandMetal, label: 'Internal Loans', minLevel: 5 },

    'sales-invoices': { id: 'sales-invoices', icon: FileText, label: 'Sales Invoices', minLevel: 3 },
    'selling-workspace': { id: 'selling-workspace', icon: ShoppingBag, label: 'Selling Workspace', minLevel: 4 },
    'customers': { id: 'customers', icon: Users, label: 'Customers', minLevel: 4 },
    'quotations': { id: 'quotations', icon: FileText, label: 'Quotations', minLevel: 4 },
    'sales-orders': { id: 'sales-orders', icon: ShoppingCart, label: 'Sales Orders', minLevel: 4 },
    'blanket-orders': { id: 'blanket-orders', icon: FileText, label: 'Blanket Orders', minLevel: 3 },
    'sales-partners': { id: 'sales-partners', icon: Users, label: 'Sales Partners', minLevel: 3 },
    'sales-persons': { id: 'sales-persons', icon: Users, label: 'Sales Persons', minLevel: 3 },
    'pos-profiles': { id: 'pos-profiles', icon: Receipt, label: 'POS Profiles', minLevel: 3 },
    'pos-settings': { id: 'pos-settings', icon: Settings, label: 'POS Settings', minLevel: 2 },
    'pos-opening': { id: 'pos-opening', icon: Receipt, label: 'POS Opening Entry', minLevel: 4 },
    'pos-closing': { id: 'pos-closing', icon: Receipt, label: 'POS Closing Entry', minLevel: 4 },
    'loyalty-programs': { id: 'loyalty-programs', icon: Tag, label: 'Loyalty Programs', minLevel: 3 },
    'loyalty-points': { id: 'loyalty-points', icon: Tag, label: 'Loyalty Points Entry', minLevel: 4 },
    'items': { id: 'items', icon: Package, label: 'Items', minLevel: 4 },
    'item-prices': { id: 'item-prices', icon: Tag, label: 'Item Prices', minLevel: 3 },
    'price-lists': { id: 'price-lists', icon: Tag, label: 'Price Lists', minLevel: 3 },
    'item-groups': { id: 'item-groups', icon: FolderTree, label: 'Item Groups', minLevel: 4 },
    'product-bundles': { id: 'product-bundles', icon: Package, label: 'Product Bundles', minLevel: 3 },
    'promotional-schemes': { id: 'promotional-schemes', icon: Tag, label: 'Promotional Schemes', minLevel: 3 },
    'pricing-rules': { id: 'pricing-rules', icon: Tag, label: 'Pricing Rules', minLevel: 3 },
    'shipping-rules': { id: 'shipping-rules', icon: Truck, label: 'Shipping Rules', minLevel: 3 },
    'coupon-codes': { id: 'coupon-codes', icon: Tag, label: 'Coupon Codes', minLevel: 3 },
    'selling-settings': { id: 'selling-settings', icon: Settings, label: 'Selling Settings', minLevel: 2 },
    'terms-templates': { id: 'terms-templates', icon: FileText, label: 'Terms & Conditions', minLevel: 3 },
    'tax-templates': { id: 'tax-templates', icon: Receipt, label: 'Sales Taxes Templates', minLevel: 3 },
    'utm-sources': { id: 'utm-sources', icon: Tag, label: 'UTM Sources', minLevel: 3 },
    'customer-groups': { id: 'customer-groups', icon: Users, label: 'Customer Groups', minLevel: 3 },
    'contacts': { id: 'contacts', icon: Users, label: 'Contacts', minLevel: 4 },
    'addresses': { id: 'addresses', icon: MapPin, label: 'Addresses', minLevel: 4 },
    'territories': { id: 'territories', icon: MapPin, label: 'Territories', minLevel: 3 },
    'campaigns': { id: 'campaigns', icon: Tag, label: 'Campaigns', minLevel: 3 },
    'sales-analytics': { id: 'sales-analytics', icon: TrendingUp, label: 'Sales Analytics', minLevel: 3 },
    'so-analysis': { id: 'so-analysis', icon: TrendingUp, label: 'Sales Order Analysis', minLevel: 3 },
    'sales-funnel': { id: 'sales-funnel', icon: TrendingUp, label: 'Sales Funnel', minLevel: 3 },
    'so-trends': { id: 'so-trends', icon: TrendingUp, label: 'Sales Order Trends', minLevel: 3 },
    'quotation-trends': { id: 'quotation-trends', icon: TrendingUp, label: 'Quotation Trends', minLevel: 3 },
    'customer-acquisition': { id: 'customer-acquisition', icon: TrendingUp, label: 'Customer Acquisition & Loyalty', minLevel: 3 },
    'inactive-customers': { id: 'inactive-customers', icon: Users, label: 'Inactive Customers', minLevel: 3 },
    'salesperson-summary': { id: 'salesperson-summary', icon: FileText, label: 'Sales Person Summary', minLevel: 3 },
    'item-sales-history': { id: 'item-sales-history', icon: History, label: 'Item Sales History', minLevel: 3 },
    'customer-directory': { id: 'customer-directory', icon: Users, label: 'Customer Directory', minLevel: 3 },
    'packing-stock': { id: 'packing-stock', icon: Package, label: 'Available Stock for Packing', minLevel: 3 },
    'pending-so-pr': { id: 'pending-so-pr', icon: ShoppingCart, label: 'Pending SO Items for PR', minLevel: 3 },
    'delivery-trends': { id: 'delivery-trends', icon: Truck, label: 'Delivery Note Trends', minLevel: 3 },
    'invoice-trends': { id: 'invoice-trends', icon: Receipt, label: 'Sales Invoice Trends', minLevel: 3 },
    'customer-credit-balance': { id: 'customer-credit-balance', icon: Receipt, label: 'Customer Credit Balance', minLevel: 3 },
    'dormant-customers': { id: 'dormant-customers', icon: Users, label: 'Customers Without Transactions', minLevel: 3 },
    'partner-commissions': { id: 'partner-commissions', icon: Receipt, label: 'Sales Partners Commission', minLevel: 3 },
    'territory-target-variance': { id: 'territory-target-variance', icon: TrendingUp, label: 'Territory Target Variance', minLevel: 3 },
    'salesperson-target-variance': { id: 'salesperson-target-variance', icon: TrendingUp, label: 'Sales Person Target Variance', minLevel: 3 },
    'partner-target-variance': { id: 'partner-target-variance', icon: TrendingUp, label: 'Sales Partner Target Variance', minLevel: 3 },
    'clients': { id: 'clients', icon: Building2, label: 'Clients / Partners', minLevel: 4 },

    'buying-workspace': { id: 'buying-workspace', icon: ShoppingBag, label: 'Buying Workspace', minLevel: 4 },
    'material-requests': { id: 'material-requests', icon: Package, label: 'Material Requests', minLevel: 4 },
    'rfqs': { id: 'rfqs', icon: FileText, label: 'Requests for Quotation (RFQ)', minLevel: 4 },
    'supplier-quotations': { id: 'supplier-quotations', icon: FileText, label: 'Supplier Quotations', minLevel: 4 },
    'buying-item-prices': { id: 'buying-item-prices', icon: Tag, label: 'Item Prices (Buying)', minLevel: 3 },
    'buying-price-lists': { id: 'buying-price-lists', icon: Tag, label: 'Price Lists (Buying)', minLevel: 3 },
    'buying-product-bundles': { id: 'buying-product-bundles', icon: Package, label: 'Product Bundles', minLevel: 3 },
    'buying-item-groups': { id: 'buying-item-groups', icon: FolderTree, label: 'Item Groups', minLevel: 3 },
    'buying-promotional-schemes': { id: 'buying-promotional-schemes', icon: Tag, label: 'Promotional Schemes', minLevel: 3 },
    'buying-pricing-rules': { id: 'buying-pricing-rules', icon: Tag, label: 'Pricing Rules', minLevel: 3 },
    'buying-settings': { id: 'buying-settings', icon: Settings, label: 'Buying Settings', minLevel: 2 },
    'purchase-tax-templates': { id: 'purchase-tax-templates', icon: Receipt, label: 'Purchase Taxes Templates', minLevel: 3 },
    'buying-terms-templates': { id: 'buying-terms-templates', icon: FileText, label: 'Terms & Conditions', minLevel: 3 },
    'suppliers': { id: 'suppliers', icon: Users, label: 'Suppliers (Vendors)', minLevel: 4 },
    'supplier-groups': { id: 'supplier-groups', icon: Users, label: 'Supplier Groups', minLevel: 3 },
    'supplier-contacts': { id: 'supplier-contacts', icon: Users, label: 'Supplier Contacts', minLevel: 4 },
    'supplier-addresses': { id: 'supplier-addresses', icon: MapPin, label: 'Supplier Addresses', minLevel: 4 },
    'supplier-scorecards': { id: 'supplier-scorecards', icon: ShieldAlert, label: 'Supplier Scorecard', minLevel: 3 },
    'scorecard-variables': { id: 'scorecard-variables', icon: ShieldAlert, label: 'Scorecard Variables', minLevel: 3 },
    'scorecard-criteria': { id: 'scorecard-criteria', icon: ShieldAlert, label: 'Scorecard Criteria', minLevel: 3 },
    'scorecard-standings': { id: 'scorecard-standings', icon: ShieldAlert, label: 'Scorecard Standings', minLevel: 3 },
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
    'subcontract-materials': { id: 'subcontract-materials', icon: Package, label: 'Subcontracted Raw Materials', minLevel: 3 },
    'subcontract-received': { id: 'subcontract-received', icon: Package, label: 'Subcontracted Item To Be Received', minLevel: 3 },
    'rfq-comparison': { id: 'rfq-comparison', icon: FileText, label: 'Supplier Quotation Comparison', minLevel: 3 },
    'pr-to-rfq': { id: 'pr-to-rfq', icon: FileText, label: 'Material Requests for Quote', minLevel: 3 },
    'supplier-directory': { id: 'supplier-directory', icon: Users, label: 'Supplier Addresses & Contacts', minLevel: 3 },
    'import-supplier-invoice': { id: 'import-supplier-invoice', icon: Download, label: 'Import Supplier Invoice', minLevel: 3 },

    'stock-workspace': { id: 'stock-workspace', icon: Package, label: 'Stock Workspace', minLevel: 3 },
    'delivery-notes': { id: 'delivery-notes', icon: Truck, label: 'Delivery Notes (Surat Jalan)', minLevel: 4 },
    'pick-lists': { id: 'pick-lists', icon: FileText, label: 'Pick Lists', minLevel: 3 },
    'landed-cost-vouchers': { id: 'landed-cost-vouchers', icon: Receipt, label: 'Landed Cost Vouchers', minLevel: 3 },
    'stock-product-bundles': { id: 'stock-product-bundles', icon: Package, label: 'Product Bundles', minLevel: 3 },
    'item-alternatives': { id: 'item-alternatives', icon: Package, label: 'Item Alternatives', minLevel: 3 },
    'item-manufacturers': { id: 'item-manufacturers', icon: Package, label: 'Item Manufacturers', minLevel: 3 },
    'manufacturers': { id: 'manufacturers', icon: Building2, label: 'Manufacturers', minLevel: 3 },
    'serial-numbers': { id: 'serial-numbers', icon: Tag, label: 'Serial Numbers', minLevel: 3 },
    'batches': { id: 'batches', icon: Tag, label: 'Batches', minLevel: 3 },
    'installation-notes': { id: 'installation-notes', icon: FileText, label: 'Installation Notes', minLevel: 3 },
    'stock-settings': { id: 'stock-settings', icon: Settings, label: 'Stock Settings', minLevel: 2 },
    'brands': { id: 'brands', icon: Tag, label: 'Brands', minLevel: 3 },
    'item-attributes': { id: 'item-attributes', icon: FolderTree, label: 'Item Attributes', minLevel: 3 },
    'uoms': { id: 'uoms', icon: Package, label: 'Units of Measure (UOM)', minLevel: 3 },
    'uom-conversions': { id: 'uom-conversions', icon: Package, label: 'UOM Conversion Factors', minLevel: 3 },
    'stock-tax-templates': { id: 'stock-tax-templates', icon: Receipt, label: 'Item Tax Templates', minLevel: 3 },
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
    'bank-accounts': { id: 'bank-accounts', icon: Wallet, label: 'Bank Accounts', minLevel: 2 },
    'bank-transactions': { id: 'bank-transactions', icon: TrendingUp, label: 'Bank Transactions', minLevel: 2 },
    'bank-clearance': { id: 'bank-clearance', icon: CheckCircle2, label: 'Bank Clearance', minLevel: 2 },
    'cashier-closing': { id: 'cashier-closing', icon: Lock, label: 'Cashier Closing Entry', minLevel: 2 },
    'cost-centers': { id: 'cost-centers', icon: Building2, label: 'Cost Center', minLevel: 2 },
    'accounting-dimensions': { id: 'accounting-dimensions', icon: Layers, label: 'Accounting Dimension', minLevel: 2 },
    'budgets-view': { id: 'budgets-view', icon: DollarSign, label: 'Budget', minLevel: 2 },
    'sales-tax-templates': { id: 'sales-tax-templates', icon: Receipt, label: 'Sales Taxes and Charges Template', minLevel: 2 },
    'purchase-tax-templates-view': { id: 'purchase-tax-templates-view', icon: Receipt, label: 'Purchase Taxes and Charges Template', minLevel: 2 },
    'tax-categories': { id: 'tax-categories', icon: Tag, label: 'Tax Category', minLevel: 2 },
    'tax-rules': { id: 'tax-rules', icon: Settings, label: 'Tax Rule', minLevel: 2 },
    'credit-notes': { id: 'credit-notes', icon: FileText, label: 'Credit Note', minLevel: 2 },
    'debit-notes': { id: 'debit-notes', icon: FileText, label: 'Debit Note', minLevel: 2 },
    'dunnings': { id: 'dunnings', icon: ShieldAlert, label: 'Dunning', minLevel: 2 },
    'balance-sheet': { id: 'balance-sheet', icon: BarChart2, label: 'Balance Sheet (Neraca)', minLevel: 2 },
    'profit-loss': { id: 'profit-loss', icon: TrendingUp, label: 'Profit and Loss Statement', minLevel: 2 },
    'cash-flow': { id: 'cash-flow', icon: Wallet, label: 'Cash Flow Statement', minLevel: 2 },
    'trial-balance': { id: 'trial-balance', icon: FileText, label: 'Trial Balance', minLevel: 2 },
    'general-ledger-report': { id: 'general-ledger-report', icon: History, label: 'General Ledger Report', minLevel: 2 },
    'ar-aging': { id: 'ar-aging', icon: Clock, label: 'Accounts Receivable (AR) Aging', minLevel: 2 },
    'ap-aging': { id: 'ap-aging', icon: Clock, label: 'Accounts Payable (AP) Aging', minLevel: 2 },

    'employees': { id: 'employees', icon: Users, label: 'Employees', minLevel: 3 },
    'departments': { id: 'departments', icon: Building2, label: 'Departments', minLevel: 3 },
    'attendance': { id: 'attendance', icon: Clock, label: 'Attendance', minLevel: 3 },
    'leaves': { id: 'leaves', icon: CalendarIcon, label: 'Leaves', minLevel: 3 },

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
        asset_operations: false,
        maintenance_group: false,
        hrd_group: false,
        master_data: false,
        rental_group: false,
        finance_group: false,
        inventory_group: false,
        settings_group: false
    });
    const [notifOpen, setNotifOpen] = useState(false);
    const [logoutModalOpen, setLogoutModalOpen] = useState(false);

    // For sub-views that need parameters
    const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null);
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
    const [selectedInventoryId, setSelectedInventoryId] = useState<string | null>(null);
    const [assetViewMode, setAssetViewMode] = useState<'list' | 'lifecycle' | 'details'>('list');
    const [selectedRentalId, setSelectedRentalId] = useState<string | null>(null);
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
                            if (!ids.includes('conversions')) ids.push('conversions');
                            if (!ids.includes('categories')) ids.push('categories');
                            if (!ids.includes('locations')) ids.push('locations');
                            return { ...m, menuIds: ids };
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
                                'buying-product-bundles', 'buying-item-groups', 'buying-promotional-schemes',
                                'buying-pricing-rules', 'buying-settings', 'purchase-tax-templates',
                                'buying-terms-templates', 'suppliers', 'supplier-groups', 'supplier-contacts',
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
                                'uom-conversions', 'stock-tax-templates', 'stock-ledger', 'stock-balance',
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
                                'financial-reports'
                            ];
                            accIds.forEach(id => {
                                if (!ids.includes(id)) ids.push(id);
                            });
                            return { ...m, menuIds: ids };
                        }
                        if (m.id === 'hr') {
                            const ids = m.menuIds || [];
                            return { ...m, menuIds: ids.filter((id: string) => id !== 'departments') };
                        }
                        if (m.id === 'admin') {
                            const ids = m.menuIds || [];
                            return { ...m, menuIds: ids.filter((id: string) => 
                                id !== 'locations' &&
                                id !== 'approval-workflow-settings' &&
                                id !== 'users' &&
                                id !== 'roles' &&
                                id !== 'inventory-categories' &&
                                id !== 'categories' &&
                                id !== 'maintenance-templates'
                            ) };
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

        const assetDetailMatch = matchPath('/assets/:id', path);
        if (assetDetailMatch?.params.id) {
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
        } else if (path === '/') {
            setActiveTab('dashboard');
            setSelectedAssetId(null);
            setAssetViewMode('list');
            setSelectedWorkOrderId(null);
            setSelectedRentalId(null);
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

        const getGroupItems = (moduleIds: string[], preferredOrder: string[], allowedFilter?: string[]) => {
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
            ...(insightsIds.length === 0 || insightsIds.includes('analytics') ? [ALL_NAV_ITEMS['analytics']] : []),
            ...(insightsIds.length === 0 || insightsIds.includes('reports') ? [ALL_NAV_ITEMS['reports']] : []),
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
                id: 'asset_operations',
                label: 'Assets',
                icon: Box,
                minLevel: 5,
                children: getGroupItems(assetIds, ['assets', 'categories', 'locations', 'asset-lifecycle', 'asset-audit'], ['assets', 'categories', 'locations', 'asset-lifecycle', 'asset-audit'])
            },
            {
                id: 'inventory_group',
                label: 'Supply Chain & Inventory',
                icon: Package,
                minLevel: 4,
                children: [
                    ...getGroupItems(supplyChainIds, [
                        'stock-workspace', 'stock-entry', 'delivery-notes', 'purchase-receipt',
                        'material-request', 'pick-lists', 'delivery-trip', 'stock-opname',
                        'landed-cost-vouchers', 'inventory-items', 'inventory-categories'
                    ]),
                    {
                        id: 'serial_batch_subgroup',
                        label: 'Serial No and Batch',
                        icon: Tag,
                        minLevel: 3,
                        children: getGroupItems(supplyChainIds, [
                            'serial-numbers', 'batches', 'installation-notes'
                        ])
                    },
                    {
                        id: 'stock_setup_subgroup',
                        label: 'Setup',
                        icon: Settings,
                        minLevel: 3,
                        children: getGroupItems(supplyChainIds, [
                            'stock-settings', 'warehouses', 'brands', 'item-attributes',
                            'uoms', 'uom-conversions', 'stock-tax-templates', 'stock-product-bundles',
                            'item-alternatives', 'item-manufacturers', 'manufacturers', 'quality-inspection'
                        ])
                    },
                    {
                        id: 'stock_reports_subgroup',
                        label: 'Reports',
                        icon: FileText,
                        minLevel: 3,
                        children: getGroupItems(supplyChainIds, [
                            'stock-ledger', 'stock-balance', 'stock-summary', 'stock-ageing',
                            'stock-projected-qty', 'stock-analytics', 'batch-wise-balance',
                            'serial-no-status', 'item-shortage-report'
                        ])
                    }
                ]
            },
            {
                id: 'maintenance_group',
                label: 'Field Operations',
                icon: Wrench,
                minLevel: 5,
                children: getGroupItems(fieldOpsIds, ['work-orders', 'maintenance-schedules', 'maintenance-templates', 'maintenance-teams', 'fuel', 'tax-renewals', 'loans'], ['work-orders', 'maintenance-schedules', 'maintenance-templates', 'maintenance-teams', 'fuel', 'tax-renewals', 'loans'])
            },
            {
                id: 'rental_module',
                label: 'Rental & Contracts',
                icon: Truck,
                minLevel: 4,
                children: getGroupItems(rentalIds, ['rentals', 'contracts', 'contract-templates'], ['rentals', 'contracts', 'contract-templates'])
            },
            {
                id: 'procurement_group',
                label: 'Procurement & Buying',
                icon: ShoppingCart,
                minLevel: 3,
                children: [
                    ...getGroupItems(procurementIds, [
                        'buying-workspace', 'material-requests', 'purchase-orders', 'purchase-bills',
                        'rfqs', 'supplier-quotations'
                    ]),
                    {
                        id: 'buying_setup_subgroup',
                        label: 'Setup',
                        icon: Settings,
                        minLevel: 3,
                        children: getGroupItems(procurementIds, [
                            'suppliers', 'supplier-groups', 'supplier-contacts', 'supplier-addresses',
                            'buying-item-prices', 'buying-price-lists', 'buying-product-bundles',
                            'buying-item-groups', 'buying-promotional-schemes', 'buying-pricing-rules',
                            'buying-settings', 'purchase-tax-templates', 'buying-terms-templates',
                            'supplier-scorecards', 'scorecard-variables', 'scorecard-criteria', 'scorecard-standings'
                        ])
                    },
                    {
                        id: 'buying_reports_subgroup',
                        label: 'Reports',
                        icon: FileText,
                        minLevel: 3,
                        children: getGroupItems(procurementIds, [
                            'purchase-analytics', 'po-analysis', 'item-consumption', 'items-to-order-receive',
                            'po-trends', 'procurement-tracker', 'items-to-request', 'item-purchase-history',
                            'purchase-receipt-trends', 'purchase-invoice-trends', 'subcontract-materials',
                            'subcontract-received', 'rfq-comparison', 'pr-to-rfq', 'supplier-directory',
                            'import-supplier-invoice', 'purchase-receipt'
                        ])
                    }
                ]
            },
            {
                id: 'commercial_group',
                label: 'Commercial & Selling',
                icon: TrendingUp,
                minLevel: 3,
                children: [
                    ...getGroupItems(commercialIds, [
                        'selling-workspace', 'customers', 'quotations', 'sales-orders', 'sales-invoices',
                        'blanket-orders', 'sales-partners', 'sales-persons', 'clients'
                    ]),
                    {
                        id: 'pos_subgroup',
                        label: 'POS',
                        icon: ShoppingBag,
                        minLevel: 3,
                        children: getGroupItems(commercialIds, [
                            'pos-profiles', 'pos-settings', 'pos-opening', 'pos-closing', 'loyalty-programs', 'loyalty-points'
                        ])
                    },
                    {
                        id: 'items_pricing_subgroup',
                        label: 'Items & Pricing',
                        icon: Tag,
                        minLevel: 3,
                        children: getGroupItems(commercialIds, [
                            'items', 'item-prices', 'price-lists', 'item-groups', 'product-bundles',
                            'promotional-schemes', 'pricing-rules', 'shipping-rules', 'coupon-codes'
                        ])
                    },
                    {
                        id: 'setup_subgroup',
                        label: 'Setup',
                        icon: Settings,
                        minLevel: 3,
                        children: getGroupItems(commercialIds, [
                            'selling-settings', 'terms-templates', 'tax-templates', 'utm-sources',
                            'customer-groups', 'contacts', 'addresses', 'territories', 'campaigns'
                        ])
                    },
                    {
                        id: 'reports_subgroup',
                        label: 'Reports',
                        icon: FileText,
                        minLevel: 3,
                        children: getGroupItems(commercialIds, [
                            'sales-analytics', 'so-analysis', 'sales-funnel', 'so-trends', 'quotation-trends',
                            'customer-acquisition', 'inactive-customers', 'salesperson-summary', 'item-sales-history',
                            'customer-directory', 'packing-stock', 'pending-so-pr', 'delivery-trends', 'invoice-trends',
                            'customer-credit-balance', 'dormant-customers', 'partner-commissions',
                            'territory-target-variance', 'salesperson-target-variance', 'partner-target-variance'
                        ])
                    }
                ]
            },
            {
                id: 'finance_group',
                label: 'Finance & Accounting',
                icon: Wallet,
                minLevel: 2,
                children: [
                    ...getGroupItems(financeIds, [
                        'accounting-workspace', 'chart-of-accounts', 'journal-entries-view',
                        'payment-entries', 'payment-reconciliation', 'credit-notes', 'debit-notes', 'dunnings'
                    ]),
                    {
                        id: 'cash_bank_subgroup',
                        label: 'Cash & Bank',
                        icon: Wallet,
                        minLevel: 2,
                        children: getGroupItems(financeIds, [
                            'bank-accounts', 'bank-transactions', 'bank-clearance', 'cashier-closing', 'cash-bank', 'expenses'
                        ])
                    },
                    {
                        id: 'acc_setup_subgroup',
                        label: 'Setup & Taxes',
                        icon: Settings,
                        minLevel: 2,
                        children: getGroupItems(financeIds, [
                            'cost-centers', 'accounting-dimensions', 'budgets-view', 'sales-tax-templates',
                            'purchase-tax-templates-view', 'tax-categories', 'tax-rules'
                        ])
                    },
                    {
                        id: 'fin_reports_subgroup',
                        label: 'Financial Statements',
                        icon: FileText,
                        minLevel: 2,
                        children: getGroupItems(financeIds, [
                            'balance-sheet', 'profit-loss', 'cash-flow', 'trial-balance',
                            'general-ledger-report', 'ar-aging', 'ap-aging', 'financial-reports'
                        ])
                    }
                ]
            },
            {
                id: 'hr_group',
                label: 'Human Resources',
                icon: Users,
                minLevel: 3,
                children: getGroupItems(hrIds, ['employees', 'attendance', 'leaves'])
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

        // Helper: collect all leaf menu IDs from a nav entry
        const getLeafIds = (entry: NavEntry): string[] => {
            if (isNavHeader(entry)) return [];
            if (isNavGroup(entry)) {
                return entry.children.flatMap(getLeafIds);
            }
            return [(entry as NavItem).id];
        };

        // Filter: keep items/groups that have at least one visible menu ID
        return navItems.filter(item => {
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
                    navigate(`/${item.id}`);
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
                    setActiveTab={setActiveTab}
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
                        hasPermission={hasPermission}
                        setActiveTab={setActiveTab}
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
