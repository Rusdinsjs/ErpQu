import { lazy, Suspense } from 'react';
import { PageLoading } from '../ui';
import { ShieldAlert } from 'lucide-react';
import { MENU_TO_RESOURCE } from '../../config/launchpadConfig';

// Lazy load view components
const DashboardView = lazy(() => import('../../pages/Dashboard'));
const AssetsView = lazy(() => import('../../pages/Assets/Assets'));
const AssetsWorkspaceView = lazy(() => import('../../pages/Assets/AssetsWorkspace'));
const AssetsGenericView = lazy(() => import('../../pages/Assets/AssetsGenericView'));
const AssetSettingsView = lazy(() => import('../../pages/Assets/AssetSettingsView'));
const DepreciationMethodsView = lazy(() => import('../../pages/Assets/DepreciationMethodsView'));
const MaintenanceTypesView = lazy(() => import('../../pages/Assets/MaintenanceTypesView'));
const AssetDetailsView = lazy(() => import('../../pages/Assets/AssetDetails'));
const CategoriesView = lazy(() => import('../../pages/Assets/Categories'));
const WorkOrdersView = lazy(() => import('../../pages/WorkOrders/WorkOrders'));
const WorkOrderDetailsView = lazy(() => import('../../pages/WorkOrders/WorkOrderDetails'));
const ApprovalCenterView = lazy(() => import('../../pages/ApprovalCenter'));
const UsersView = lazy(() => import('../../pages/Users'));
const RolesView = lazy(() => import('../../pages/Roles'));
const ProfileView = lazy(() => import('../../pages/Profile'));
const ReportsView = lazy(() => import('../../pages/Reports/ReportCenter'));
const AuditModeView = lazy(() => import('../../pages/AuditMode'));
const AuditLogsView = lazy(() => import('../../pages/AuditLogs'));
const AssetLifecycleView = lazy(() => import('../../pages/Assets/AssetLifecycle'));
const AssetReportsContainer = lazy(() => import('../../pages/Assets/Reports/AssetReportsContainer'));
const ConversionsView = lazy(() => import('../../pages/Assets/Conversions'));
const FuelView = lazy(() => import('../../pages/Fuel/FuelDashboard'));
const IoTSensorStreamView = lazy(() => import('../../pages/Assets/IoTSensorStream'));
const AssetHealthTelemetryView = lazy(() => import('../../pages/Assets/AssetHealthTelemetry'));
const ThresholdAlertsView = lazy(() => import('../../pages/Assets/ThresholdAlerts'));
const RentalsView = lazy(() => import('../../pages/rentals/Rentals'));
const RentalFormView = lazy(() => import('../../pages/rentals/RentalForm'));
const RentalDetailView = lazy(() => import('../../pages/rentals/RentalDetail'));
const ContractListView = lazy(() => import('../../pages/Contracts/Contracts'));
const ContractDetailView = lazy(() => import('../../pages/Contracts/ContractDetail'));
const ContractAnalyticsView = lazy(() => import('../../pages/Contracts/ContractAnalytics'));
const ContractTemplatesView = lazy(() => import('../../pages/Contracts/ContractTemplates'));
const LoansView = lazy(() => import('../../pages/Loans'));
const LocationsView = lazy(() => import('../../pages/Assets/Locations'));
const EmployeesView = lazy(() => import('../../pages/HR/Employees'));
const DesignationsView = lazy(() => import('../../pages/HR/DesignationsView'));
const EmployeeLifecycleView = lazy(() => import('../../pages/HR/EmployeeLifecycleView'));
const Employee360View = lazy(() => import('../../pages/HR/Employee360View'));
const ShiftManagementView = lazy(() => import('../../pages/HR/ShiftManagementView'));
const AttendanceLogsView = lazy(() => import('../../pages/HR/AttendanceLogsView'));
const OvertimeManagementView = lazy(() => import('../../pages/HR/OvertimeManagementView'));
const AttendanceRequestsView = lazy(() => import('../../pages/HR/AttendanceRequestsView'));
const DepartmentsView = lazy(() => import('../../pages/HR/Departments'));
const AttendanceView = lazy(() => import('../../pages/HR/Attendance/AttendanceDashboard'));

const HrWorkspaceView = lazy(() => import('../../pages/HR/HrWorkspace'));

// HR Fase 7 - Driver Ops, P2H & Safety Incidents
const DriverAssignmentsView = lazy(() => import('../../pages/HR/DriverOps/DriverAssignmentsView'));
const P2hInspectionView = lazy(() => import('../../pages/HR/DriverOps/P2hInspectionView'));
const DriverSafetyIncidentsView = lazy(() => import('../../pages/HR/DriverOps/DriverSafetyIncidentsView'));

const RecruitmentAtsView = lazy(() => import('../../pages/HR/Recruitment/RecruitmentAtsView'));
const TrainingCertificationsView = lazy(() => import('../../pages/HR/Training/TrainingCertificationsView'));
const DisciplinaryActionsView = lazy(() => import('../../pages/HR/Discipline/DisciplinaryActionsView'));

const EmployeeLoansView = lazy(() => import('../../pages/HR/Loans/EmployeeLoansView'));
const ExpenseClaimsView = lazy(() => import('../../pages/HR/Claims/ExpenseClaimsView'));
const AppraisalView = lazy(() => import('../../pages/HR/Appraisal/AppraisalView'));

// HR Fase 4 - Payroll
const SalarySlipsView = lazy(() => import('../../pages/HR/Payroll/SalarySlipsView'));
const PayrollProcessingView = lazy(() => import('../../pages/HR/Payroll/PayrollProcessingView'));
const SalaryAssignmentsView = lazy(() => import('../../pages/HR/Payroll/SalaryAssignmentsView'));
const SalaryStructuresView = lazy(() => import('../../pages/HR/Payroll/SalaryStructuresView'));

const LeaveDashboardView = lazy(() => import('../../pages/HR/Leaves/LeaveDashboard'));
const ChartOfAccountsView = lazy(() => import('../../pages/Finance/ChartOfAccounts'));
const JournalEntriesView = lazy(() => import('../../pages/Finance/JournalEntries'));
const JournalEntryFormView = lazy(() => import('../../pages/Finance/JournalEntryForm'));
const GeneralLedgerView = lazy(() => import('../../pages/Finance/GeneralLedger'));
const TrialBalanceView = lazy(() => import('../../pages/Finance/TrialBalance'));
const FinancialReportsView = lazy(() => import('../../pages/Finance/FinancialReports'));
const CashBankView = lazy(() => import('../../pages/Finance/CashBank'));
const SalesOverviewView = lazy(() => import('../../pages/Finance/SalesOverview'));
const SalesInvoicesView = lazy(() => import('../../pages/Finance/SalesInvoices'));
const SalesQuotesView = lazy(() => import('../../pages/Finance/SalesQuotes'));
const SalesOrdersView = lazy(() => import('../../pages/Finance/SalesOrders'));
const SalesShipmentsView = lazy(() => import('../../pages/Finance/SalesShipments'));
const PurchaseOverviewView = lazy(() => import('../../pages/Finance/PurchaseOverview'));
const PurchaseQuotesView = lazy(() => import('../../pages/Finance/PurchaseQuotes'));
const PurchaseOrdersView = lazy(() => import('../../pages/Finance/PurchaseOrders'));
const PurchaseShipmentsView = lazy(() => import('../../pages/Finance/PurchaseShipments'));
const PurchaseBillsView = lazy(() => import('../../pages/Finance/PurchaseBills'));
const MaintenanceTemplatesView = lazy(() => import('../../pages/Maintenance/MaintenanceTemplates'));
const MaintenanceSchedulesView = lazy(() => import('../../pages/Maintenance/MaintenanceSchedules'));
const MaintenanceTeamsView = lazy(() => import('../../pages/Maintenance/MaintenanceTeams'));
const WorkflowBuilderView = lazy(() => import('../../pages/Settings/WorkflowBuilder').then(m => ({ default: m.WorkflowBuilder })));
const SettingsView = lazy(() => import('../../pages/Settings'));
const SystemResetView = lazy(() => import('../../pages/SystemReset'));
const InventoryItemsView = lazy(() => import('../../pages/Inventory/InventoryItems'));
const InventoryDetailView = lazy(() => import('../../pages/Inventory/InventoryDetail'));
const InventoryCategoriesView = lazy(() => import('../../pages/Inventory/InventoryCategories'));
const StockOpnameView = lazy(() => import('../../pages/Inventory/StockOpname'));
const StockEntryView = lazy(() => import('../../pages/Inventory/StockEntry'));
const MaterialRequestView = lazy(() => import('../../pages/Inventory/MaterialRequest'));
const WarehousesView = lazy(() => import('../../pages/Inventory/Warehouses'));
const PurchaseReceiptsView = lazy(() => import('../../pages/Inventory/PurchaseReceipts'));
const DeliveryNotesView = lazy(() => import('../../pages/Inventory/DeliveryNotes'));
const PickListsView = lazy(() => import('../../pages/Inventory/PickLists'));
const InstallationNotesView = lazy(() => import('../../pages/Inventory/InstallationNotes'));
const QualityInspectionsView = lazy(() => import('../../pages/Operations/QualityInspections'));
const DeliveryTripsView = lazy(() => import('../../pages/Operations/DeliveryTrips'));
const Uoms = lazy(() => import('../../pages/Inventory/Uoms'));
const UomConversions = lazy(() => import('../../pages/Inventory/UomConversions'));
const SerialNumbers = lazy(() => import('../../pages/Inventory/SerialNumbers'));
const Batches = lazy(() => import('../../pages/Inventory/Batches'));
const Brands = lazy(() => import('../../pages/Inventory/Brands'));
const ItemAttributes = lazy(() => import('../../pages/Inventory/ItemAttributes'));
const ItemAlternatives = lazy(() => import('../../pages/Inventory/ItemAlternatives'));
const ProductBundles = lazy(() => import('../../pages/Inventory/ProductBundles'));
const Manufacturers = lazy(() => import('../../pages/Inventory/Manufacturers'));
const QualityInspections = lazy(() => import('../../pages/Inventory/QualityInspections'));
const LandedCostVouchers = lazy(() => import('../../pages/Inventory/LandedCostVouchers'));

const StockLedgerReport = lazy(() => import('../../pages/Inventory/StockLedgerReport'));
const StockBalanceReport = lazy(() => import('../../pages/Inventory/StockBalanceReport'));
const StockAgeingReport = lazy(() => import('../../pages/Inventory/StockAgeingReport'));
const StockProjectedQtyReport = lazy(() => import('../../pages/Inventory/StockProjectedQtyReport'));
const StockSettings = lazy(() => import('../../pages/Inventory/StockSettings'));
const ItemTaxTemplates = lazy(() => import('../../pages/Inventory/ItemTaxTemplates'));
const ItemManufacturers = lazy(() => import('../../pages/Inventory/ItemManufacturers'));
const StockAnalytics = lazy(() => import('../../pages/Inventory/StockAnalytics'));
const StockSummaryReport = lazy(() => import('../../pages/Inventory/StockSummaryReport'));
const BatchBalanceReport = lazy(() => import('../../pages/Inventory/BatchBalanceReport'));
const SerialNoStatusReport = lazy(() => import('../../pages/Inventory/SerialNoStatusReport'));
const ItemShortageReport = lazy(() => import('../../pages/Inventory/ItemShortageReport'));

const TaxRenewalsView = lazy(() => import('../../pages/TaxRenewals/TaxRenewals'));
const ExpensesView = lazy(() => import('../../pages/Finance/Expenses'));
const AnalyticsDashboardView = lazy(() => import('../../pages/AnalyticsDashboard'));
const MetadataEditorView = lazy(() => import('../../pages/Metadata/MetadataEditor'));
const CompanyManagementView = lazy(() => import('../../pages/Company/CompanyManagement').then(m => ({ default: m.CompanyManagement })));
const BranchView = lazy(() => import('../../pages/Organization/Branch'));
const EmailAccountView = lazy(() => import('../../pages/Organization/EmailAccount'));
const SellingWorkspaceView = lazy(() => import('../../pages/Selling/SellingWorkspace'));
const CustomersView = lazy(() => import('../../pages/Selling/CustomersView'));
const BlanketOrdersView = lazy(() => import('../../pages/Selling/BlanketOrdersView'));
const SalesTeamView = lazy(() => import('../../pages/Selling/SalesTeamView'));
const PointOfSaleView = lazy(() => import('../../pages/Selling/PointOfSaleView'));
const SalesPricingView = lazy(() => import('../../pages/Selling/SalesPricingView'));
const SalesMasterExtendedView = lazy(() => import('../../pages/Selling/SalesMasterExtended'));
const SalesReportsView = lazy(() => import('../../pages/Selling/SalesReportsView'));

const SellingGenericView = lazy(() => import('../../pages/Selling/SellingGenericView'));
const BuyingWorkspaceView = lazy(() => import('../../pages/Buying/BuyingWorkspace'));
const RequestsForQuotationView = lazy(() => import('../../pages/Buying/RequestsForQuotation'));
const SupplierQuotationsView = lazy(() => import('../../pages/Buying/SupplierQuotations'));
const SuppliersView = lazy(() => import('../../pages/Buying/SuppliersView'));
const SupplierMasterExtendedView = lazy(() => import('../../pages/Buying/SupplierMasterExtended'));
const SupplierScorecardView = lazy(() => import('../../pages/Buying/SupplierScorecardView'));
const PurchaseReportsView = lazy(() => import('../../pages/Buying/PurchaseReportsView'));

const BuyingGenericView = lazy(() => import('../../pages/Buying/BuyingGenericView'));
const StockWorkspaceView = lazy(() => import('../../pages/Inventory/StockWorkspace'));
const StockGenericView = lazy(() => import('../../pages/Inventory/StockGenericView'));
const AccountingWorkspaceView = lazy(() => import('../../pages/Finance/AccountingWorkspace'));
const AccountingGenericView = lazy(() => import('../../pages/Finance/AccountingGenericView'));
const PaymentEntriesView = lazy(() => import('../../pages/Finance/PaymentEntries'));
const CostCentersView = lazy(() => import('../../pages/Finance/CostCenters'));
const BudgetsView = lazy(() => import('../../pages/Finance/Budgets'));
const AgingReportsView = lazy(() => import('../../pages/Finance/AgingReports'));
const BankAccountsView = lazy(() => import('../../pages/Finance/BankAccounts'));
const CreditDebitNotesView = lazy(() => import('../../pages/Finance/CreditDebitNotes'));
const CashFlowReportView = lazy(() => import('../../pages/Finance/CashFlowReport'));
const TaxTemplatesView = lazy(() => import('../../pages/Finance/TaxTemplates'));
const POSSettingsView = lazy(() => import('../../pages/Selling/POSSettingsView'));
const PosOpeningEntriesView = lazy(() => import('../../pages/Selling/PosOpeningEntriesView'));
const PosClosingEntriesView = lazy(() => import('../../pages/Selling/PosClosingEntriesView'));
const LoyaltyPointEntriesView = lazy(() => import('../../pages/Selling/LoyaltyPointEntriesView'));
const OutboxManagementView = lazy(() => import('../../pages/Settings/OutboxManagementView'));
const PeriodClosingView = lazy(() => import('../../pages/Finance/PeriodClosingView'));
const ExchangeRatesView = lazy(() => import('../../pages/Finance/ExchangeRatesView'));
const ItemPricesView = lazy(() => import('../../pages/Selling/ItemPricesView'));
const PriceListsView = lazy(() => import('../../pages/Selling/PriceListsView'));
const SellingSettingsView = lazy(() => import('../../pages/Selling/SellingSettingsView'));
const BuyingSettingsView = lazy(() => import('../../pages/Buying/BuyingSettingsView'));
const TermsTemplatesView = lazy(() => import('../../pages/Selling/TermsTemplatesView'));
const SubcontractingView = lazy(() => import('../../pages/Buying/SubcontractingView'));
const SupplierInvoiceImportView = lazy(() => import('../../pages/Buying/SupplierInvoiceImportView'));
const SalesTargetVariancesView = lazy(() => import('../../pages/Selling/SalesTargetVariancesView'));
const DunningsView = lazy(() => import('../../pages/Finance/DunningsView'));
const AccountingDimensionsView = lazy(() => import('../../pages/Finance/AccountingDimensionsView'));
const BuyingPricingView = lazy(() => import('../../pages/Buying/BuyingPricingView'));
const WebhooksManagementView = lazy(() => import('../../pages/Settings/WebhooksManagementView'));


interface AdminContentRouterProps {
    activeTab: string;
    selectedAssetId: string | null;
    assetViewMode: 'list' | 'details' | 'lifecycle';
    selectedWorkOrderId: string | null;
    selectedInventoryId: string | null;
    selectedRentalId: string | null;
    selectedContractId: string | null;
    selectedEmployeeId?: string | null;
    hasPermission: (perm: string) => boolean;
    setActiveTab: (tab: string) => void;
    navigate: (path: string) => void;
}

export function AdminContentRouter({
    activeTab,
    selectedAssetId,
    assetViewMode,
    selectedWorkOrderId,
    selectedInventoryId,
    selectedRentalId,
    selectedContractId,
    selectedEmployeeId,
    hasPermission,
    setActiveTab,
    navigate
}: AdminContentRouterProps) {

    // Access Denied View Component
    const renderAccessDenied = () => (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-card/40 backdrop-blur border border-border/40 rounded-2xl shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-4 border border-red-500/20">
                <ShieldAlert size={32} />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Akses Dibatasi (403 Forbidden)</h2>
            <p className="text-muted-foreground max-w-md text-sm mb-6">
                Peran atau hak akses akun Anda tidak memiliki izin untuk membuka modul ini. Silakan hubungi Administrator jika Anda memerlukan akses.
            </p>
            <button
                onClick={() => { setActiveTab('dashboard'); navigate('/dashboard'); }}
                className="px-5 py-2.5 bg-primary text-primary-foreground font-medium rounded-xl text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
                Kembali ke Dashboard
            </button>
        </div>
    );

    // Route Authorization Guard
    if (activeTab !== 'dashboard' && activeTab !== 'profile') {
        const resourceId = (MENU_TO_RESOURCE as Record<string, string>)[activeTab] || activeTab.replace(/-/g, '_');

        let hasAccess = hasPermission(`${resourceId}.read`) ||
            hasPermission(`${resourceId}.view`) ||
            hasPermission(`${resourceId}.*`);

        if (!hasAccess && resourceId === 'work_order') {
            hasAccess = hasPermission('maintenance.read') || hasPermission('maintenance.view') || hasPermission('maintenance.*');
        }
        if (!hasAccess && resourceId === 'approval_center') {
            hasAccess = hasPermission('approval_center.read') || hasPermission('approval_center.view') || hasPermission('approval_center.*') || hasPermission('maintenance.approve') || hasPermission('work_order.approve_cost');
        }

        if (!hasAccess) {
            return renderAccessDenied();
        }
    }

    // Special case for deep views
    if (activeTab === 'assets' && selectedAssetId) {
        if (assetViewMode === 'lifecycle') {
            return <Suspense fallback={<PageLoading />}><AssetLifecycleView assetId={selectedAssetId} /></Suspense>;
        } else if (assetViewMode === 'details') {
            return <Suspense fallback={<PageLoading />}><AssetDetailsView assetId={selectedAssetId} /></Suspense>;
        }
    }
    if (activeTab === 'work-orders' && selectedWorkOrderId) {
        return <Suspense fallback={<PageLoading />}><WorkOrderDetailsView workOrderId={selectedWorkOrderId} /></Suspense>;
    }

    const VIEW_MAP: Record<string, () => React.ReactNode> = {
        'dashboard': () => <DashboardView />,
        'assets-workspace': () => <AssetsWorkspaceView />,
        'assets': () => <AssetsView />,
        'categories': () => <CategoriesView />,
        'asset-audit': () => <AuditModeView />,
        'asset-lifecycle': () => <AssetLifecycleView assetId="" />,
        'fuel': () => <FuelView />,
        'loans': () => <LoansView />,
        'asset-settings': () => <AssetSettingsView />,
        'depreciation-methods': () => <DepreciationMethodsView />,
        'maintenance-types': () => <MaintenanceTypesView />,
        'depreciation-ledger': () => <AssetReportsContainer reportId="depreciation-ledger" />,
        'roi-trends': () => <AssetReportsContainer reportId="roi-trends" />,
        'condition-distribution': () => <AssetReportsContainer reportId="condition-distribution" />,
        'workorder-summary': () => <AssetReportsContainer reportId="workorder-summary" />,
        'fuel-consumption': () => <AssetReportsContainer reportId="fuel-consumption" />,
        'custody-history': () => <AssetReportsContainer reportId="custody-history" />,
        'team-performance': () => <AssetReportsContainer reportId="team-performance" />,
        'tax-expiry': () => <AssetReportsContainer reportId="tax-expiry" />,
        'cost-analysis': () => <AssetReportsContainer reportId="cost-analysis" />,
        'iot-sensor-stream': () => <IoTSensorStreamView />,
        'asset-health-telemetry': () => <AssetHealthTelemetryView />,
        'threshold-alerts': () => <ThresholdAlertsView />,
        'inventory-categories': () => <InventoryCategoriesView />,
        'warehouses': () => <WarehousesView />,
        'inventory-items': () => selectedInventoryId ? <InventoryDetailView itemId={selectedInventoryId} /> : <InventoryItemsView />,
        'stock-opname': () => <StockOpnameView />,
        'stock-entry': () => <StockEntryView />,
        'material-request': () => <MaterialRequestView />,
        'purchase-receipt': () => <PurchaseReceiptsView />,
        'delivery-note': () => <DeliveryNotesView />,
        'pick-list': () => <PickListsView />,
        'installation-note': () => <InstallationNotesView />,
        'quality-inspection': () => <QualityInspectionsView />,
        'delivery-trip': () => <DeliveryTripsView />,
        'locations': () => <LocationsView />,
        'work-orders': () => <WorkOrdersView />,
        'conversions': () => <ConversionsView />,
        'rentals': () => selectedRentalId ? <RentalDetailView rentalId={selectedRentalId} /> : <RentalsView />,
        'rental-form': () => <RentalFormView />,
        'contracts': () => selectedContractId ? <ContractDetailView /> : <ContractListView />,
        'approval-workflow-settings': () => <WorkflowBuilderView />,
        'contract-detail': () => <ContractDetailView />,
        'contract-analytics': () => <ContractAnalyticsView />,
        'contract-templates': () => <ContractTemplatesView />,
        'employees': () => <EmployeesView />,
        'designations': () => <DesignationsView />,
        'employee-lifecycle': () => <EmployeeLifecycleView />,
        'employee-360': () => <Employee360View employeeId={selectedEmployeeId || undefined} />,
        'shifts': () => <ShiftManagementView />,
        'attendance-logs': () => <AttendanceLogsView />,
        'overtime': () => <OvertimeManagementView />,
        'attendance-requests': () => <AttendanceRequestsView />,
        'attendance': () => <AttendanceView />,
        'leaves': () => <LeaveDashboardView />,
        'hr-workspace': () => <HrWorkspaceView />,

        // HR Fase 4 - Payroll
        'salary-slips': () => <SalarySlipsView />,
        'payroll-processing': () => <PayrollProcessingView />,
        'salary-assignments': () => <SalaryAssignmentsView />,
        'salary-structures': () => <SalaryStructuresView />,

        // HR Fase 5 - Loans, Claims & KPI
        'employee-loans': () => <EmployeeLoansView />,
        'expense-claims': () => <ExpenseClaimsView />,
        'appraisal': () => <AppraisalView />,

        // HR Fase 6 - Recruitment ATS, Training & Disciplinary Actions
        'recruitment': () => <RecruitmentAtsView />,
        'training-certifications': () => <TrainingCertificationsView />,
        'disciplinary-actions': () => <DisciplinaryActionsView />,

        // HR Fase 7 - Driver Ops, P2H & Safety Incidents
        'driver-assignments': () => <DriverAssignmentsView />,
        'p2h-inspections': () => <P2hInspectionView />,
        'driver-safety-incidents': () => <DriverSafetyIncidentsView />,

        'approvals': () => <ApprovalCenterView />,
        'reports': () => <ReportsView />,
        'users': () => <UsersView />,
        'roles': () => <RolesView />,
        'departments': () => <DepartmentsView />,
        'companies': () => <CompanyManagementView />,
        'company': () => <CompanyManagementView />,
        'branch': () => <BranchView />,
        'email-account': () => <EmailAccountView />,
        'audit': () => <AuditLogsView />,
        'system-audit': () => <AuditLogsView />,
        'outbox-management': () => <OutboxManagementView />,
        'finance': () => <ChartOfAccountsView />,
        'journal-entries': () => <JournalEntriesView />,
        'journal-form': () => <JournalEntryFormView />,
        'general-ledger': () => <GeneralLedgerView />,
        'trial-balance': () => <TrialBalanceView />,
        'financial-reports': () => <FinancialReportsView />,
        'period-closing': () => <PeriodClosingView />,
        'exchange-rates': () => <ExchangeRatesView />,
        'cash-bank': () => <CashBankView />,
        'expenses': () => <ExpensesView />,
        'sales': () => <SalesOverviewView />,
        'sales-overview': () => <SalesOverviewView />,
        'sales-quotes': () => <SalesQuotesView />,
        'sales-orders': () => <SalesOrdersView />,
        'sales-shipments': () => <SalesShipmentsView />,
        'sales-invoices': () => <SalesInvoicesView />,
        'selling-workspace': () => <SellingWorkspaceView />,
        'customers': () => <CustomersView />,
        'quotations': () => <SalesQuotesView />,
        'blanket-orders': () => <BlanketOrdersView />,
        'sales-partners': () => <SalesTeamView />,
        'sales-persons': () => <SalesTeamView />,
        'pos-profiles': () => <PointOfSaleView />,
        'pos-settings': () => <POSSettingsView />,
        'pos-opening': () => <PosOpeningEntriesView />,
        'pos-closing': () => <PosClosingEntriesView />,
        'loyalty-programs': () => <PointOfSaleView />,
        'loyalty-points': () => <LoyaltyPointEntriesView />,
        'items': () => <InventoryItemsView />,
        'item-prices': () => <ItemPricesView />,
        'price-lists': () => <PriceListsView />,
        'item-groups': () => <InventoryCategoriesView />,
        'product-bundles': () => <ProductBundles />,
        'promotional-schemes': () => <SalesPricingView />,
        'pricing-rules': () => <SalesPricingView />,
        'shipping-rules': () => <SalesPricingView />,
        'coupon-codes': () => <SalesPricingView />,
        'selling-settings': () => <SellingSettingsView />,
        'terms-templates': () => <TermsTemplatesView />,
        'tax-templates': () => <TaxTemplatesView />,
        'utm-sources': () => <SalesMasterExtendedView />,
        'customer-groups': () => <SalesMasterExtendedView />,
        'contacts': () => <CustomersView />,
        'addresses': () => <CustomersView />,
        'territories': () => <SalesMasterExtendedView />,
        'campaigns': () => <SalesMasterExtendedView />,
        'sales-analytics': () => <SalesReportsView />,
        'so-analysis': () => <SalesReportsView />,
        'sales-funnel': () => <SalesReportsView />,
        'so-trends': () => <SalesReportsView />,
        'quotation-trends': () => <SalesReportsView />,
        'customer-acquisition': () => <SalesReportsView />,
        'inactive-customers': () => <SalesReportsView />,
        'salesperson-summary': () => <SalesReportsView />,
        'item-sales-history': () => <SalesReportsView />,
        'customer-directory': () => <CustomersView />,
        'packing-stock': () => <SalesReportsView />,
        'pending-so-pr': () => <SalesReportsView />,
        'delivery-trends': () => <SalesReportsView />,
        'invoice-trends': () => <SalesReportsView />,
        'customer-credit-balance': () => <SalesReportsView />,
        'dormant-customers': () => <SalesReportsView />,
        'partner-commissions': () => <SalesTeamView />,
        'territory-target-variance': () => <SalesTargetVariancesView type="territory" />,
        'salesperson-target-variance': () => <SalesTargetVariancesView type="salesperson" />,
        'partner-target-variance': () => <SalesTargetVariancesView type="partner" />,
        'purchase-overview': () => <PurchaseOverviewView />,
        'purchase-quotes': () => <PurchaseQuotesView />,
        'purchase-orders': () => <PurchaseOrdersView />,
        'purchase-shipments': () => <PurchaseShipmentsView />,
        'purchase-bills': () => <PurchaseBillsView />,
        'buying-workspace': () => <BuyingWorkspaceView />,
        'material-requests': () => <MaterialRequestView />,
        'rfqs': () => <RequestsForQuotationView />,
        'supplier-quotations': () => <SupplierQuotationsView />,
        'buying-item-prices': () => <ItemPricesView buyingOnly />,
        'buying-price-lists': () => <PriceListsView buyingOnly />,
        'buying-product-bundles': () => <ProductBundles />,
        'buying-item-groups': () => <InventoryCategoriesView />,
        'buying-promotional-schemes': () => <BuyingPricingView mode="schemes" />,
        'buying-pricing-rules': () => <BuyingPricingView mode="rules" />,
        'buying-settings': () => <BuyingSettingsView />,
        'purchase-tax-templates': () => <TaxTemplatesView />,
        'buying-terms-templates': () => <TermsTemplatesView buyingOnly />,
        'suppliers': () => <SuppliersView />,
        'supplier-groups': () => <SupplierMasterExtendedView />,
        'supplier-contacts': () => <SupplierMasterExtendedView />,
        'supplier-addresses': () => <SupplierMasterExtendedView />,
        'supplier-scorecards': () => <SupplierScorecardView />,
        'scorecard-variables': () => <SupplierScorecardView />,
        'scorecard-criteria': () => <SupplierScorecardView />,
        'scorecard-standings': () => <SupplierScorecardView />,
        'purchase-analytics': () => <PurchaseReportsView />,
        'po-analysis': () => <PurchaseReportsView />,
        'item-consumption': () => <PurchaseReportsView />,
        'items-to-order-receive': () => <PurchaseReportsView />,
        'po-trends': () => <PurchaseReportsView />,
        'procurement-tracker': () => <PurchaseReportsView />,
        'items-to-request': () => <PurchaseReportsView />,
        'item-purchase-history': () => <PurchaseReportsView />,
        'purchase-receipt-trends': () => <PurchaseReportsView />,
        'purchase-invoice-trends': () => <PurchaseReportsView />,
        'subcontract-materials': () => <SubcontractingView mode="order" />,
        'subcontract-received': () => <SubcontractingView mode="received" />,
        'rfq-comparison': () => <SupplierQuotationsView />,
        'pr-to-rfq': () => <RequestsForQuotationView />,
        'supplier-directory': () => <SuppliersView />,
        'import-supplier-invoice': () => <SupplierInvoiceImportView />,
        'stock-workspace': () => <StockWorkspaceView />,
        'delivery-notes': () => <DeliveryNotesView />,
        'pick-lists': () => <PickListsView />,
        'landed-cost-vouchers': () => <LandedCostVouchers />,
        'stock-product-bundles': () => <ProductBundles />,
        'item-alternatives': () => <ItemAlternatives />,
        'item-manufacturers': () => <ItemManufacturers />,
        'manufacturers': () => <Manufacturers />,
        'serial-numbers': () => <SerialNumbers />,
        'batches': () => <Batches />,
        'stock-ledger': () => <StockLedgerReport />,
        'stock-balance': () => <StockBalanceReport />,
        'stock-ageing': () => <StockAgeingReport />,
        'stock-projected-qty': () => <StockProjectedQtyReport />,
        'installation-notes': () => <InstallationNotesView />,
        'stock-settings': () => <StockSettings />,
        'brands': () => <Brands />,
        'item-attributes': () => <ItemAttributes />,
        'uoms': () => <Uoms />,
        'uom-conversions': () => <UomConversions />,
        'item-tax-templates': () => <ItemTaxTemplates />,
        'stock-summary': () => <StockSummaryReport />,
        'stock-analytics': () => <StockAnalytics />,
        'batch-wise-balance': () => <BatchBalanceReport />,
        'serial-no-status': () => <SerialNoStatusReport />,
        'item-shortage-report': () => <ItemShortageReport />,
        'accounting-workspace': () => <AccountingWorkspaceView />,
        'journal-entries-view': () => <JournalEntriesView />,
        'payment-entries': () => <PaymentEntriesView />,
        'payment-reconciliation': () => <PaymentEntriesView />,
        'bank-accounts': () => <BankAccountsView />,
        'bank-transactions': () => <CashBankView />,
        'bank-clearance': () => <BankAccountsView />,
        'cashier-closing': () => <CashBankView />,
        'cost-centers': () => <CostCentersView />,
        'accounting-dimensions': () => <AccountingDimensionsView />,
        'budgets-view': () => <BudgetsView />,
        'budgets': () => <BudgetsView />,
        'sales-tax-templates': () => <TaxTemplatesView />,
        'purchase-tax-templates-view': () => <TaxTemplatesView />,
        'tax-categories': () => <TaxTemplatesView />,
        'tax-rules': () => <TaxTemplatesView />,
        'credit-notes': () => <CreditDebitNotesView />,
        'debit-notes': () => <CreditDebitNotesView />,
        'dunnings': () => <DunningsView />,
        'balance-sheet': () => <FinancialReportsView />,
        'profit-loss': () => <FinancialReportsView />,
        'cash-flow': () => <CashFlowReportView />,
        'general-ledger-report': () => <GeneralLedgerView />,
        'ar-aging': () => <AgingReportsView />,
        'ap-aging': () => <AgingReportsView />,
        'maintenance-templates': () => <MaintenanceTemplatesView />,
        'maintenance-schedules': () => <MaintenanceSchedulesView />,
        'maintenance-teams': () => <MaintenanceTeamsView />,
        'analytics': () => <AnalyticsDashboardView />,
        'metadata-editor': () => <MetadataEditorView />,
        'tax-renewals': () => <TaxRenewalsView />,
        'settings': () => <SettingsView />,
        'system-reset': () => <SystemResetView />,
        'webhooks': () => <WebhooksManagementView />,
        'profile': () => <ProfileView />,
    };

    const GenericDocTypePlaceholder = ({ doctype }: { doctype: string }) => (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400 mt-20">
            <h2 className="text-2xl mb-4 font-bold capitalize text-gray-800 dark:text-gray-200">{doctype.replace(/-/g, ' ')}</h2>
            <p>This is a dynamically registered DocType.</p>
            <p className="text-sm mt-2">A generic list and form view needs to be mapped in AdminContentRouter for full functionality.</p>
        </div>
    );

    const renderActiveView = () => {
        const renderFn = VIEW_MAP[activeTab];
        return renderFn ? renderFn() : <GenericDocTypePlaceholder doctype={activeTab} />;
    };

    return (
        <Suspense fallback={<PageLoading />}>
            {renderActiveView()}
        </Suspense>
    );
}
