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

// HR Fase 4 - Payroll

// HR Fase 5 - Loans, Claims & KPI

// HR Fase 6 - Recruitment ATS, Training & Disciplinary Actions

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

    const renderActiveView = () => {
        switch (activeTab) {
            case 'dashboard': return <DashboardView />;
            case 'assets-workspace': return <AssetsWorkspaceView />;
            case 'assets': return <AssetsView />;
            case 'categories': return <CategoriesView />;
            case 'asset-audit': return <AssetsGenericView title="Asset Audit Session" description="Sesi audit & stok opname aset fisik" type="table" />;
            case 'asset-lifecycle': return <AssetLifecycleView assetId="" />;
            case 'fuel': return <FuelView />;
            case 'loans': return <AssetsGenericView title="Internal Asset Loans" description="Peminjaman aset antar unit internal" type="table" />;
            case 'asset-settings': return <AssetSettingsView />;
            case 'depreciation-methods': return <DepreciationMethodsView />;
            case 'maintenance-types': return <MaintenanceTypesView />;
            case 'depreciation-ledger': return <AssetReportsContainer reportId="depreciation-ledger" />;
            case 'roi-trends': return <AssetReportsContainer reportId="roi-trends" />;
            case 'condition-distribution': return <AssetReportsContainer reportId="condition-distribution" />;
            case 'workorder-summary': return <AssetReportsContainer reportId="workorder-summary" />;
            case 'fuel-consumption': return <AssetReportsContainer reportId="fuel-consumption" />;
            case 'custody-history': return <AssetReportsContainer reportId="custody-history" />;
            case 'team-performance': return <AssetReportsContainer reportId="team-performance" />;
            case 'tax-expiry': return <AssetReportsContainer reportId="tax-expiry" />;
            case 'cost-analysis': return <AssetReportsContainer reportId="cost-analysis" />;
            case 'iot-sensor-stream': return <IoTSensorStreamView />;
            case 'asset-health-telemetry': return <AssetHealthTelemetryView />;
            case 'threshold-alerts': return <ThresholdAlertsView />;
            case 'inventory-categories': return <InventoryCategoriesView />;
            case 'warehouses': return <WarehousesView />;
            case 'inventory-items':
                if (selectedInventoryId) return <InventoryDetailView itemId={selectedInventoryId} />;
                return <InventoryItemsView />;
            case 'stock-opname': return <StockOpnameView />;
            case 'stock-entry': return <StockEntryView />;
            case 'material-request': return <MaterialRequestView />;
            case 'purchase-receipt': return <PurchaseReceiptsView />;
            case 'delivery-note': return <DeliveryNotesView />;
            case 'pick-list': return <PickListsView />;
            case 'installation-note': return <InstallationNotesView />;
            case 'quality-inspection': return <QualityInspectionsView />;
            case 'delivery-trip': return <DeliveryTripsView />;
            case 'locations': return <LocationsView />;
            case 'work-orders': return <WorkOrdersView />;
            case 'conversions': return <ConversionsView />;
            case 'rentals':
                if (selectedRentalId) return <RentalDetailView rentalId={selectedRentalId} />;
                return <RentalsView />;
            case 'rental-form':
                return <RentalFormView />;
            case 'contracts':
                if (selectedContractId) return <ContractDetailView />;
                return <ContractListView />;
            case 'approval-workflow-settings':
                return <WorkflowBuilderView />;
            case 'contract-detail':
                return <ContractDetailView />;
            case 'contract-analytics':
                return <ContractAnalyticsView />;
            case 'contract-templates':
                return <ContractTemplatesView />;
            case 'loans': return <LoansView />;
            case 'fuel': return <FuelView />;
            case 'employees': return <EmployeesView />;
            case 'designations': return <DesignationsView />;
            case 'employee-lifecycle': return <EmployeeLifecycleView />;
            case 'employee-360': return <Employee360View employeeId={selectedEmployeeId || undefined} />;
            case 'shifts': return <ShiftManagementView />;
            case 'attendance-logs': return <AttendanceLogsView />;
            case 'overtime': return <OvertimeManagementView />;
            case 'attendance-requests': return <AttendanceRequestsView />;
            case 'attendance': return <AttendanceView />;
            case 'leaves': return <LeaveDashboardView />;

            // HR Fase 4 - Payroll
            case 'salary-slips': return <SalarySlipsView />;
            case 'payroll-processing': return <PayrollProcessingView />;
            case 'salary-assignments': return <SalaryAssignmentsView />;
            case 'salary-structures': return <SalaryStructuresView />;

            // HR Fase 5 - Loans, Claims & KPI
            case 'employee-loans': return <EmployeeLoansView />;
            case 'expense-claims': return <ExpenseClaimsView />;
            case 'appraisal': return <AppraisalView />;

            // HR Fase 6 - Recruitment ATS, Training & Disciplinary Actions
            case 'recruitment': return <RecruitmentAtsView />;
            case 'training-certifications': return <TrainingCertificationsView />;
            case 'disciplinary-actions': return <DisciplinaryActionsView />;

            // HR Fase 7 - Driver Ops, P2H & Safety Incidents
            case 'driver-assignments': return <DriverAssignmentsView />;
            case 'p2h-inspections': return <P2hInspectionView />;
            case 'driver-safety-incidents': return <DriverSafetyIncidentsView />;




            case 'approvals': return <ApprovalCenterView />;
            case 'reports': return <ReportsView />;
            case 'users': return <UsersView />;
            case 'roles': return <RolesView />;
            case 'departments': return <DepartmentsView />;
            case 'companies': return <CompanyManagementView />;
            case 'company': return <CompanyManagementView />;
            case 'branch': return <BranchView />;
            case 'email-account': return <EmailAccountView />;
            case 'audit': return <AuditLogsView />;
            case 'asset-audit': return <AuditModeView />;
            case 'system-audit': return <AuditLogsView />;
            case 'finance': return <ChartOfAccountsView />;
            case 'journal-entries': return <JournalEntriesView />;
            case 'journal-form': return <JournalEntryFormView />;
            case 'general-ledger': return <GeneralLedgerView />;
            case 'trial-balance': return <TrialBalanceView />;
            case 'financial-reports': return <FinancialReportsView />;
            case 'cash-bank': return <CashBankView />;
            case 'expenses': return <ExpensesView />;
            case 'sales': return <SalesOverviewView />;
            case 'sales-overview': return <SalesOverviewView />;
            case 'sales-quotes': return <SalesQuotesView />;
            case 'sales-orders': return <SalesOrdersView />;
            case 'sales-shipments': return <SalesShipmentsView />;
            case 'sales-invoices': return <SalesInvoicesView />;
            case 'selling-workspace': return <SellingWorkspaceView />;
            case 'customers': return <CustomersView />;
            case 'quotations': return <SalesQuotesView />;
            case 'blanket-orders': return <BlanketOrdersView />;
            case 'sales-partners': return <SalesTeamView />;
            case 'sales-persons': return <SalesTeamView />;
            case 'pos-profiles': return <PointOfSaleView />;
            case 'pos-settings': return <PointOfSaleView />;
            case 'pos-opening': return <PointOfSaleView />;
            case 'pos-closing': return <PointOfSaleView />;
            case 'loyalty-programs': return <PointOfSaleView />;
            case 'loyalty-points': return <PointOfSaleView />;
            case 'items': return <InventoryItemsView />;
            case 'item-prices': return <SellingGenericView title="Item Price" description="Harga khusus produk per price list" type="table" />;
            case 'price-lists': return <SellingGenericView title="Price List" description="Daftar harga standar penjualan & pembelian" type="table" />;
            case 'item-groups': return <InventoryCategoriesView />;
            case 'product-bundles': return <SellingGenericView title="Product Bundle" description="Paket bundling produk & komponen" type="table" />;
            case 'promotional-schemes': return <SalesPricingView />;
            case 'pricing-rules': return <SalesPricingView />;
            case 'shipping-rules': return <SalesPricingView />;
            case 'coupon-codes': return <SalesPricingView />;
            case 'selling-settings': return <SellingGenericView title="Selling Settings" description="Pengaturan umum modul penjualan" type="settings" />;
            case 'terms-templates': return <SellingGenericView title="Terms & Conditions Template" description="Template syarat & ketentuan legal" type="table" />;
            case 'tax-templates': return <TaxTemplatesView />;
            case 'utm-sources': return <SalesMasterExtendedView />;
            case 'customer-groups': return <SalesMasterExtendedView />;
            case 'contacts': return <CustomersView />;
            case 'addresses': return <CustomersView />;
            case 'territories': return <SalesMasterExtendedView />;
            case 'campaigns': return <SalesMasterExtendedView />;
            case 'sales-analytics': return <SalesReportsView />;
            case 'so-analysis': return <SalesReportsView />;
            case 'sales-funnel': return <SalesReportsView />;
            case 'so-trends': return <SalesReportsView />;
            case 'quotation-trends': return <SalesReportsView />;
            case 'customer-acquisition': return <SalesReportsView />;
            case 'inactive-customers': return <SalesReportsView />;
            case 'salesperson-summary': return <SalesReportsView />;
            case 'item-sales-history': return <SalesReportsView />;
            case 'customer-directory': return <CustomersView />;
            case 'packing-stock': return <SalesReportsView />;
            case 'pending-so-pr': return <SalesReportsView />;
            case 'delivery-trends': return <SalesReportsView />;
            case 'invoice-trends': return <SalesReportsView />;
            case 'customer-credit-balance': return <SalesReportsView />;
            case 'dormant-customers': return <SalesReportsView />;
            case 'partner-commissions': return <SalesTeamView />;
            case 'territory-target-variance': return <SellingGenericView title="Territory Target Variance" description="Varian target wilayah vs realisasi" type="report" />;
            case 'salesperson-target-variance': return <SellingGenericView title="Sales Person Target Variance" description="Varian target sales vs realisasi" type="report" />;
            case 'partner-target-variance': return <SellingGenericView title="Sales Partner Target Variance" description="Varian target mitra vs realisasi" type="report" />;
            case 'purchase-overview': return <PurchaseOverviewView />;
            case 'purchase-quotes': return <PurchaseQuotesView />;
            case 'purchase-orders': return <PurchaseOrdersView />;
            case 'purchase-shipments': return <PurchaseShipmentsView />;
            case 'purchase-bills': return <PurchaseBillsView />;
            case 'buying-workspace': return <BuyingWorkspaceView />;
            case 'material-requests': return <MaterialRequestView />;
            case 'rfqs': return <RequestsForQuotationView />;
            case 'supplier-quotations': return <SupplierQuotationsView />;
            case 'buying-item-prices': return <BuyingGenericView title="Item Price (Buying)" description="Harga beli khusus barang per supplier" type="table" />;
            case 'buying-price-lists': return <BuyingGenericView title="Price List (Buying)" description="Master daftar harga beli" type="table" />;
            case 'buying-product-bundles': return <BuyingGenericView title="Product Bundle" description="Paket bundling komponen pembelian" type="table" />;
            case 'buying-item-groups': return <InventoryCategoriesView />;
            case 'buying-promotional-schemes': return <BuyingGenericView title="Promotional Scheme (Buying)" description="Skema diskon & promosi supplier" type="table" />;
            case 'buying-pricing-rules': return <BuyingGenericView title="Pricing Rule (Buying)" description="Aturan otomatisasi harga beli" type="table" />;
            case 'buying-settings': return <BuyingGenericView title="Buying Settings" description="Pengaturan umum modul pembelian" type="settings" />;
            case 'purchase-tax-templates': return <TaxTemplatesView />;
            case 'buying-terms-templates': return <BuyingGenericView title="Terms & Conditions (Buying)" description="Template syarat & ketentuan pembelian" type="table" />;
            case 'suppliers': return <SuppliersView />;
            case 'supplier-groups': return <SupplierMasterExtendedView />;
            case 'supplier-contacts': return <SupplierMasterExtendedView />;
            case 'supplier-addresses': return <SupplierMasterExtendedView />;
            case 'supplier-scorecards': return <SupplierScorecardView />;
            case 'scorecard-variables': return <SupplierScorecardView />;
            case 'scorecard-criteria': return <SupplierScorecardView />;
            case 'scorecard-standings': return <SupplierScorecardView />;
            case 'purchase-analytics': return <PurchaseReportsView />;
            case 'po-analysis': return <PurchaseReportsView />;
            case 'item-consumption': return <PurchaseReportsView />;
            case 'items-to-order-receive': return <PurchaseReportsView />;
            case 'po-trends': return <PurchaseReportsView />;
            case 'procurement-tracker': return <PurchaseReportsView />;
            case 'items-to-request': return <PurchaseReportsView />;
            case 'item-purchase-history': return <PurchaseReportsView />;
            case 'purchase-receipt-trends': return <PurchaseReportsView />;
            case 'purchase-invoice-trends': return <PurchaseReportsView />;
            case 'subcontract-materials': return <BuyingGenericView title="Subcontract Material Order" description="Order bahan baku ke subkontraktor" type="table" />;
            case 'subcontract-received': return <BuyingGenericView title="Subcontract Material Received" description="Penerimaan hasil subkontrak" type="table" />;
            case 'rfq-comparison': return <SupplierQuotationsView />;
            case 'pr-to-rfq': return <RequestsForQuotationView />;
            case 'supplier-directory': return <SuppliersView />;
            case 'import-supplier-invoice': return <BuyingGenericView title="Import Supplier Invoice" description="Impor massal faktur supplier" type="settings" />;
            case 'stock-workspace': return <StockWorkspaceView />;
            case 'delivery-notes': return <DeliveryNotesView />;
            case 'pick-lists': return <PickListsView />;
            case 'delivery-trip': return <DeliveryTripsView />;
            case 'landed-cost-vouchers': return <StockGenericView title="Landed Cost Voucher" description="Alokasi biaya tambahan ke harga barang" type="table" />;
            case 'stock-product-bundles': return <ProductBundles />;
            case 'item-alternatives': return <ItemAlternatives />;
            case 'item-manufacturers': return <StockGenericView title="Item Manufacturer" description="Produsen & pabrikan item" type="table" />;
            case 'manufacturers': return <Manufacturers />;
            case 'serial-numbers': return <SerialNumbers />;
            case 'batches': return <Batches />;
            case 'quality-inspection': return <QualityInspections />;
            case 'landed-cost-vouchers': return <LandedCostVouchers />;
            case 'stock-ledger': return <StockLedgerReport />;
            case 'stock-balance': return <StockBalanceReport />;
            case 'stock-ageing': return <StockAgeingReport />;
            case 'stock-projected-qty': return <StockProjectedQtyReport />;
            case 'installation-notes': return <InstallationNotesView />;
            case 'stock-settings': return <StockSettings />;
            case 'brands': return <Brands />;
            case 'item-attributes': return <ItemAttributes />;
            case 'uoms': return <Uoms />;
            case 'uom-conversions': return <UomConversions />;
            case 'item-tax-templates': return <ItemTaxTemplates />;
            case 'item-manufacturers': return <ItemManufacturers />;
            case 'warehouses': return <Warehouses />;
            case 'stock-summary': return <StockSummaryReport />;
            case 'stock-ageing': return <StockGenericView title="Stock Ageing" description="Laporan umur barang & stok mati" type="report" />;
            case 'stock-projected-qty': return <StockGenericView title="Stock Projected Qty" description="Proyeksi kebutuhan & kecukupan persediaan" type="report" />;
            case 'stock-analytics': return <StockAnalytics />;
            case 'batch-wise-balance': return <BatchBalanceReport />;
            case 'serial-no-status': return <SerialNoStatusReport />;
            case 'item-shortage-report': return <ItemShortageReport />;
            case 'accounting-workspace': return <AccountingWorkspaceView />;
            case 'journal-entries-view': return <JournalEntriesView />;
            case 'payment-entries': return <PaymentEntriesView />;
            case 'payment-reconciliation': return <PaymentEntriesView />;
            case 'bank-accounts': return <BankAccountsView />;
            case 'bank-transactions': return <CashBankView />;
            case 'bank-clearance': return <BankAccountsView />;
            case 'cashier-closing': return <CashBankView />;
            case 'cost-centers': return <CostCentersView />;
            case 'accounting-dimensions': return <CostCentersView />;
            case 'budgets-view': return <BudgetsView />;
            case 'budgets': return <BudgetsView />;
            case 'sales-tax-templates': return <TaxTemplatesView />;
            case 'purchase-tax-templates-view': return <TaxTemplatesView />;
            case 'tax-categories': return <TaxTemplatesView />;
            case 'tax-rules': return <TaxTemplatesView />;
            case 'credit-notes': return <CreditDebitNotesView />;
            case 'debit-notes': return <CreditDebitNotesView />;
            case 'dunnings': return <AgingReportsView />;
            case 'balance-sheet': return <FinancialReportsView />;
            case 'profit-loss': return <FinancialReportsView />;
            case 'cash-flow': return <CashFlowReportView />;
            case 'general-ledger-report': return <GeneralLedgerView />;
            case 'ar-aging': return <AgingReportsView />;
            case 'ap-aging': return <AgingReportsView />;
            case 'maintenance-templates': return <MaintenanceTemplatesView />;
            case 'maintenance-schedules': return <MaintenanceSchedulesView />;
            case 'maintenance-teams': return <MaintenanceTeamsView />;
            case 'analytics': return <AnalyticsDashboardView />;
            case 'metadata-editor': return <MetadataEditorView />;
            case 'tax-renewals': return <TaxRenewalsView />;
            case 'settings': return <SettingsView />;
            case 'profile': return <ProfileView />;
            default: return <DashboardView />;
        }
    };

    return (
        <Suspense fallback={<PageLoading />}>
            {renderActiveView()}
        </Suspense>
    );
}
