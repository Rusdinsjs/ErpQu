import type { ElementType } from 'react';

export type TabId =
    | 'dashboard'
    | 'assets-workspace' | 'buying-workspace' | 'selling-workspace' | 'stock-workspace' | 'accounting-workspace'
    | 'assets'
    | 'asset-settings' | 'depreciation-methods' | 'maintenance-types'
    | 'depreciation-ledger' | 'roi-trends' | 'condition-distribution' | 'workorder-summary' | 'fuel-consumption' | 'custody-history' | 'team-performance' | 'tax-expiry' | 'cost-analysis'
    | 'iot-sensor-stream' | 'asset-health-telemetry' | 'threshold-alerts'
    | 'categories'
    | 'inventory-categories'
    | 'inventory-items'
    | 'warehouses'
    | 'stock-opname'
    | 'stock-entry'
    | 'material-request'
    | 'purchase-receipt'
    | 'quality-inspection'
    | 'delivery-trip'
    | 'delivery-notes' | 'pick-lists' | 'landed-cost-vouchers' | 'stock-product-bundles'
    | 'item-alternatives' | 'item-manufacturers' | 'manufacturers' | 'serial-numbers' | 'batches' | 'installation-notes'
    | 'stock-settings' | 'brands' | 'item-attributes' | 'uoms' | 'uom-conversions' | 'stock-tax-templates'
    | 'stock-ledger' | 'stock-balance' | 'stock-summary' | 'stock-ageing' | 'stock-projected-qty' | 'stock-analytics'
    | 'batch-wise-balance' | 'serial-no-status' | 'item-shortage-report'
    | 'chart-of-accounts' | 'journal-entries-view' | 'payment-entries' | 'payment-reconciliation'
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
    | 'hr-workspace'
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
    | 'purchases'
    | 'purchase-overview'
    | 'purchase-quotes'
    | 'purchase-orders'
    | 'purchase-shipments'
    | 'purchase-bills'
    | 'material-requests' | 'rfqs' | 'supplier-quotations'
    | 'buying-item-prices' | 'buying-price-lists' | 'buying-product-bundles' | 'buying-item-groups' | 'buying-promotional-schemes' | 'buying-pricing-rules'
    | 'buying-settings' | 'delivery-note' | 'pick-list' | 'installation-note'
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
    | 'profile'
    | 'period-closing'
    | 'exchange-rates'
    | 'webhooks';

export interface NavItem {
    id: TabId;
    icon: ElementType;
    label: string;
    adminOnly?: boolean;
    minLevel?: number; // 1=SuperAdmin, 2=Admin, 3=Manager, 4=Staff, 5=Viewer
    showBadge?: boolean;
    path?: string;
}

export interface NavGroup {
    id: string;
    label: string;
    icon: ElementType;
    children: NavEntry[];
    minLevel?: number;
    showBadge?: boolean;
}

export interface NavHeader {
    type: 'header';
    label: string;
    minLevel?: number;
}

export type NavEntry = NavItem | NavGroup | NavHeader;

export const isNavGroup = (entry: NavEntry): entry is NavGroup => {
    return 'children' in entry;
};

export const isNavHeader = (entry: NavEntry): entry is NavHeader => {
    return 'type' in entry && entry.type === 'header';
};
