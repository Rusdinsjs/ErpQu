import { lazy, Suspense } from 'react';
import { PageLoading } from'../../../components/ui';
import { ShieldAlert } from 'lucide-react';
import { MENU_TO_RESOURCE } from'../../../config/launchpadConfig';

// Lazy load view components
const DashboardView = lazy(() => import('../../../pages/Dashboard'));
const AssetsView = lazy(() => import('../../assets/pages/Assets'));
const AssetsWorkspaceView = lazy(() => import('../../assets/pages/AssetsWorkspace'));
const AssetsGenericView = lazy(() => import('../../assets/pages/AssetsGenericView'));
const AssetSettingsView = lazy(() => import('../../assets/pages/AssetSettingsView'));
const DepreciationMethodsView = lazy(() => import('../../assets/pages/DepreciationMethodsView'));
const MaintenanceTypesView = lazy(() => import('../../assets/pages/MaintenanceTypesView'));
const AssetDetailsView = lazy(() => import('../../assets/pages/AssetDetails'));
const CategoriesView = lazy(() => import('../../assets/pages/Categories'));
const WorkOrdersView = lazy(() => import('../../work-orders/pages/WorkOrders'));
const WorkOrderDetailsView = lazy(() => import('../../work-orders/pages/WorkOrderDetails'));
const ApprovalCenterView = lazy(() => import('../pages/ApprovalCenter'));
const UsersView = lazy(() => import('../pages/Users'));
const RolesView = lazy(() => import('../pages/Roles'));
const ProfileView = lazy(() => import('../../../pages/Profile'));
const ReportsView = lazy(() => import('../../reports/pages/ReportCenter'));
const AuditModeView = lazy(() => import('../pages/AuditMode'));
const AuditLogsView = lazy(() => import('../pages/AuditLogs'));
const AssetLifecycleView = lazy(() => import('../../assets/pages/AssetLifecycle'));
const AssetReportsContainer = lazy(() => import('../../assets/pages/Reports/AssetReportsContainer'));
const ConversionsView = lazy(() => import('../../assets/pages/Conversions'));
const FuelView = lazy(() => import('../../fuel/pages/FuelDashboard'));
const IoTSensorStreamView = lazy(() => import('../../assets/pages/IoTSensorStream'));
const AssetHealthTelemetryView = lazy(() => import('../../assets/pages/AssetHealthTelemetry'));
const ThresholdAlertsView = lazy(() => import('../../assets/pages/ThresholdAlerts'));
const RentalsView = lazy(() => import('../../rentals/pages/Rentals'));
const RentalFormView = lazy(() => import('../../rentals/pages/RentalForm'));
const RentalDetailView = lazy(() => import('../../rentals/pages/RentalDetail'));
const ContractListView = lazy(() => import('../../contracts/pages/Contracts'));
const ContractDetailView = lazy(() => import('../../contracts/pages/ContractDetail'));
const ContractAnalyticsView = lazy(() => import('../../contracts/pages/ContractAnalytics'));
const ContractTemplatesView = lazy(() => import('../../contracts/pages/ContractTemplates'));
const LoansView = lazy(() => import('../../loans/pages/Loans'));
const LocationsView = lazy(() => import('../../assets/pages/Locations'));
const EmployeesView = lazy(() => import('../../hr/pages/Employees'));
const DesignationsView = lazy(() => import('../../hr/pages/DesignationsView'));
const EmployeeLifecycleView = lazy(() => import('../../hr/pages/EmployeeLifecycleView'));
const Employee360View = lazy(() => import('../../hr/pages/Employee360View'));
const ShiftManagementView = lazy(() => import('../../hr/pages/ShiftManagementView'));
const AttendanceLogsView = lazy(() => import('../../hr/pages/AttendanceLogsView'));
const OvertimeManagementView = lazy(() => import('../../hr/pages/OvertimeManagementView'));
const AttendanceRequestsView = lazy(() => import('../../hr/pages/AttendanceRequestsView'));
const DepartmentsView = lazy(() => import('../../hr/pages/Departments'));
const AttendanceView = lazy(() => import('../../hr/pages/Attendance/AttendanceDashboard'));

const HrWorkspaceView = lazy(() => import('../../hr/pages/HrWorkspace'));

// HR Fase 7 - Driver Ops, P2H & Safety Incidents
const DriverAssignmentsView = lazy(() => import('../../hr/pages/DriverOps/DriverAssignmentsView'));
const P2hInspectionView = lazy(() => import('../../hr/pages/DriverOps/P2hInspectionView'));
const DriverSafetyIncidentsView = lazy(() => import('../../hr/pages/DriverOps/DriverSafetyIncidentsView'));

const RecruitmentAtsView = lazy(() => import('../../hr/pages/Recruitment/RecruitmentAtsView'));
const TrainingCertificationsView = lazy(() => import('../../hr/pages/Training/TrainingCertificationsView'));
const DisciplinaryActionsView = lazy(() => import('../../hr/pages/Discipline/DisciplinaryActionsView'));

const EmployeeLoansView = lazy(() => import('../../hr/pages/Loans/EmployeeLoansView'));
const ExpenseClaimsView = lazy(() => import('../../hr/pages/Claims/ExpenseClaimsView'));
const AppraisalView = lazy(() => import('../../hr/pages/Appraisal/AppraisalView'));

// HR Fase 4 - Payroll
const SalarySlipsView = lazy(() => import('../../hr/pages/Payroll/SalarySlipsView'));
const PayrollProcessingView = lazy(() => import('../../hr/pages/Payroll/PayrollProcessingView'));
const SalaryAssignmentsView = lazy(() => import('../../hr/pages/Payroll/SalaryAssignmentsView'));
const SalaryStructuresView = lazy(() => import('../../hr/pages/Payroll/SalaryStructuresView'));

const LeaveDashboardView = lazy(() => import('../../hr/pages/Leaves/LeaveDashboard'));
const ChartOfAccountsView = lazy(() => import('../../finance/pages/ChartOfAccounts'));
const JournalEntriesView = lazy(() => import('../../finance/pages/JournalEntries'));
const JournalEntryFormView = lazy(() => import('../../finance/pages/JournalEntryForm'));
const GeneralLedgerView = lazy(() => import('../../finance/pages/GeneralLedger'));
const TrialBalanceView = lazy(() => import('../../finance/pages/TrialBalance'));
const FinancialReportsView = lazy(() => import('../../finance/pages/FinancialReports'));
const CashBankView = lazy(() => import('../../finance/pages/CashBank'));
const SalesOverviewView = lazy(() => import('../../finance/pages/SalesOverview'));
const SalesInvoicesView = lazy(() => import('../../finance/pages/SalesInvoices'));
const SalesQuotesView = lazy(() => import('../../finance/pages/SalesQuotes'));
const SalesOrdersView = lazy(() => import('../../finance/pages/SalesOrders'));
const SalesShipmentsView = lazy(() => import('../../finance/pages/SalesShipments'));
const PurchaseOverviewView = lazy(() => import('../../finance/pages/PurchaseOverview'));
const PurchaseQuotesView = lazy(() => import('../../finance/pages/PurchaseQuotes'));
const PurchaseOrdersView = lazy(() => import('../../finance/pages/PurchaseOrders'));
const PurchaseShipmentsView = lazy(() => import('../../finance/pages/PurchaseShipments'));
const PurchaseBillsView = lazy(() => import('../../finance/pages/PurchaseBills'));
const MaintenanceTemplatesView = lazy(() => import('../../work-orders/pages/MaintenanceTemplates'));
const MaintenanceSchedulesView = lazy(() => import('../../work-orders/pages/MaintenanceSchedules'));
const MaintenanceTeamsView = lazy(() => import('../../work-orders/pages/MaintenanceTeams'));
const WorkflowBuilderView = lazy(() => import('../../settings/pages/WorkflowBuilder').then(m => ({ default: m.WorkflowBuilder })));
const SettingsView = lazy(() => import('../../settings/pages/Settings'));
const SystemResetView = lazy(() => import('../../settings/pages/SystemReset'));
const InventoryItemsView = lazy(() => import('../../inventory/pages/InventoryItems'));
const InventoryDetailView = lazy(() => import('../../inventory/pages/InventoryDetail'));
const InventoryCategoriesView = lazy(() => import('../../inventory/pages/InventoryCategories'));
const StockOpnameView = lazy(() => import('../../inventory/pages/StockOpname'));
const StockEntryView = lazy(() => import('../../inventory/pages/StockEntry'));
const MaterialRequestView = lazy(() => import('../../inventory/pages/MaterialRequest'));
const WarehousesView = lazy(() => import('../../inventory/pages/Warehouses'));
const PurchaseReceiptsView = lazy(() => import('../../inventory/pages/PurchaseReceipts'));
const DeliveryNotesView = lazy(() => import('../../inventory/pages/DeliveryNotes'));
const PickListsView = lazy(() => import('../../inventory/pages/PickLists'));
const InstallationNotesView = lazy(() => import('../../inventory/pages/InstallationNotes'));
const QualityInspectionsView = lazy(() => import('../../operations/pages/QualityInspections'));
const DeliveryTripsView = lazy(() => import('../../operations/pages/DeliveryTrips'));
const Uoms = lazy(() => import('../../inventory/pages/Uoms'));
const UomConversions = lazy(() => import('../../inventory/pages/UomConversions'));
const SerialNumbers = lazy(() => import('../../inventory/pages/SerialNumbers'));
const Batches = lazy(() => import('../../inventory/pages/Batches'));
const Brands = lazy(() => import('../../inventory/pages/Brands'));
const ItemAttributes = lazy(() => import('../../inventory/pages/ItemAttributes'));
const ItemAlternatives = lazy(() => import('../../inventory/pages/ItemAlternatives'));
const ProductBundles = lazy(() => import('../../inventory/pages/ProductBundles'));
const Manufacturers = lazy(() => import('../../inventory/pages/Manufacturers'));
const QualityInspections = lazy(() => import('../../inventory/pages/QualityInspections'));
const LandedCostVouchers = lazy(() => import('../../inventory/pages/LandedCostVouchers'));

const StockLedgerReport = lazy(() => import('../../inventory/pages/StockLedgerReport'));
const StockBalanceReport = lazy(() => import('../../inventory/pages/StockBalanceReport'));
const StockAgeingReport = lazy(() => import('../../inventory/pages/StockAgeingReport'));
const StockProjectedQtyReport = lazy(() => import('../../inventory/pages/StockProjectedQtyReport'));
const StockSettings = lazy(() => import('../../inventory/pages/StockSettings'));
const ItemTaxTemplates = lazy(() => import('../../inventory/pages/ItemTaxTemplates'));
const ItemManufacturers = lazy(() => import('../../inventory/pages/ItemManufacturers'));
const StockAnalytics = lazy(() => import('../../inventory/pages/StockAnalytics'));
const StockSummaryReport = lazy(() => import('../../inventory/pages/StockSummaryReport'));
const BatchBalanceReport = lazy(() => import('../../inventory/pages/BatchBalanceReport'));
const SerialNoStatusReport = lazy(() => import('../../inventory/pages/SerialNoStatusReport'));
const ItemShortageReport = lazy(() => import('../../inventory/pages/ItemShortageReport'));

const TaxRenewalsView = lazy(() => import('../../tax-renewals/pages/TaxRenewals'));
const ExpensesView = lazy(() => import('../../finance/pages/Expenses'));
const AnalyticsDashboardView = lazy(() => import('../../../pages/AnalyticsDashboard'));
const MetadataEditorView = lazy(() => import('../../settings/pages/MetadataEditor'));
const CompanyManagementView = lazy(() => import('../../company/pages/CompanyManagement').then(m => ({ default: m.CompanyManagement })));
const BranchView = lazy(() => import('../../company/pages/Branch'));
const EmailAccountView = lazy(() => import('../../company/pages/EmailAccount'));
const SellingWorkspaceView = lazy(() => import('../../selling/pages/SellingWorkspace'));
const CustomersView = lazy(() => import('../../selling/pages/CustomersView'));
const BlanketOrdersView = lazy(() => import('../../selling/pages/BlanketOrdersView'));
const SalesTeamView = lazy(() => import('../../selling/pages/SalesTeamView'));
const PointOfSaleView = lazy(() => import('../../selling/pages/PointOfSaleView'));
const SalesPricingView = lazy(() => import('../../selling/pages/SalesPricingView'));
const SalesMasterExtendedView = lazy(() => import('../../selling/pages/SalesMasterExtended'));
const SalesReportsView = lazy(() => import('../../selling/pages/SalesReportsView'));

const SellingGenericView = lazy(() => import('../../selling/pages/SellingGenericView'));
const BuyingWorkspaceView = lazy(() => import('../../buying/pages/BuyingWorkspace'));
const RequestsForQuotationView = lazy(() => import('../../buying/pages/RequestsForQuotation'));
const SupplierQuotationsView = lazy(() => import('../../buying/pages/SupplierQuotations'));
const SuppliersView = lazy(() => import('../../buying/pages/SuppliersView'));
const SupplierMasterExtendedView = lazy(() => import('../../buying/pages/SupplierMasterExtended'));
const SupplierScorecardView = lazy(() => import('../../buying/pages/SupplierScorecardView'));
const PurchaseReportsView = lazy(() => import('../../buying/pages/PurchaseReportsView'));

const BuyingGenericView = lazy(() => import('../../buying/pages/BuyingGenericView'));
const StockWorkspaceView = lazy(() => import('../../inventory/pages/StockWorkspace'));
const StockGenericView = lazy(() => import('../../inventory/pages/StockGenericView'));
const AccountingWorkspaceView = lazy(() => import('../../finance/pages/AccountingWorkspace'));
const AccountingGenericView = lazy(() => import('../../finance/pages/AccountingGenericView'));
const PaymentEntriesView = lazy(() => import('../../finance/pages/PaymentEntries'));
const CostCentersView = lazy(() => import('../../finance/pages/CostCenters'));
const BudgetsView = lazy(() => import('../../finance/pages/Budgets'));
const AgingReportsView = lazy(() => import('../../finance/pages/AgingReports'));
const BankAccountsView = lazy(() => import('../../finance/pages/BankAccounts'));
const CreditDebitNotesView = lazy(() => import('../../finance/pages/CreditDebitNotes'));
const CashFlowReportView = lazy(() => import('../../finance/pages/CashFlowReport'));
const TaxTemplatesView = lazy(() => import('../../finance/pages/TaxTemplates'));
const POSSettingsView = lazy(() => import('../../selling/pages/POSSettingsView'));
const PosOpeningEntriesView = lazy(() => import('../../selling/pages/PosOpeningEntriesView'));
const PosClosingEntriesView = lazy(() => import('../../selling/pages/PosClosingEntriesView'));
const LoyaltyPointEntriesView = lazy(() => import('../../selling/pages/LoyaltyPointEntriesView'));
const OutboxManagementView = lazy(() => import('../../settings/pages/OutboxManagementView'));
const PeriodClosingView = lazy(() => import('../../finance/pages/PeriodClosingView'));
const ExchangeRatesView = lazy(() => import('../../finance/pages/ExchangeRatesView'));
const ItemPricesView = lazy(() => import('../../selling/pages/ItemPricesView'));
const PriceListsView = lazy(() => import('../../selling/pages/PriceListsView'));
const SellingSettingsView = lazy(() => import('../../selling/pages/SellingSettingsView'));
const BuyingSettingsView = lazy(() => import('../../buying/pages/BuyingSettingsView'));
const TermsTemplatesView = lazy(() => import('../../selling/pages/TermsTemplatesView'));
const SubcontractingView = lazy(() => import('../../buying/pages/SubcontractingView'));
const SupplierInvoiceImportView = lazy(() => import('../../buying/pages/SupplierInvoiceImportView'));
const SalesTargetVariancesView = lazy(() => import('../../selling/pages/SalesTargetVariancesView'));
const DunningsView = lazy(() => import('../../finance/pages/DunningsView'));
const AccountingDimensionsView = lazy(() => import('../../finance/pages/AccountingDimensionsView'));
const BuyingPricingView = lazy(() => import('../../buying/pages/BuyingPricingView'));
const WebhooksManagementView = lazy(() => import('../../settings/pages/WebhooksManagementView'));

// Phase 3 & 4 Enterprise Views
const AbcInventoryAnalysisView = lazy(() => import('../../inventory/pages/AbcInventoryAnalysisView'));
const LowStockAlertsView = lazy(() => import('../../inventory/pages/LowStockAlertsView'));
const CrmPipelineView = lazy(() => import('../../selling/pages/CrmPipelineView'));
const CrmAnalyticsView = lazy(() => import('../../selling/pages/CrmAnalyticsView'));
const BomManagementView = lazy(() => import('../../operations/pages/BomManagementView'));
const ProductionOrdersView = lazy(() => import('../../operations/pages/ProductionOrdersView'));

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
        // Phase 3 & 4 Enterprise Views
        'inventory-abc': () => <AbcInventoryAnalysisView />,
        'inventory-alerts': () => <LowStockAlertsView />,
        'crm-leads': () => <CrmPipelineView />,
        'crm-opportunities': () => <CrmPipelineView />,
        'crm-pipeline': () => <CrmPipelineView />,
        'crm-analytics': () => <CrmAnalyticsView />,
        'boms': () => <BomManagementView />,
        'production-orders': () => <ProductionOrdersView />,
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
