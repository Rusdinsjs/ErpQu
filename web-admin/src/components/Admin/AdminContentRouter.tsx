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
const DepartmentsView = lazy(() => import('../../pages/HR/Departments'));
const AttendanceView = lazy(() => import('../../pages/HR/Attendance/AttendanceDashboard'));
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
const SellingGenericView = lazy(() => import('../../pages/Selling/SellingGenericView'));
const BuyingWorkspaceView = lazy(() => import('../../pages/Buying/BuyingWorkspace'));
const BuyingGenericView = lazy(() => import('../../pages/Buying/BuyingGenericView'));
const StockWorkspaceView = lazy(() => import('../../pages/Inventory/StockWorkspace'));
const StockGenericView = lazy(() => import('../../pages/Inventory/StockGenericView'));
const AccountingWorkspaceView = lazy(() => import('../../pages/Finance/AccountingWorkspace'));
const AccountingGenericView = lazy(() => import('../../pages/Finance/AccountingGenericView'));

interface AdminContentRouterProps {
    activeTab: string;
    selectedAssetId: string | null;
    assetViewMode: 'list' | 'details' | 'lifecycle';
    selectedWorkOrderId: string | null;
    selectedInventoryId: string | null;
    selectedRentalId: string | null;
    selectedContractId: string | null;
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
            case 'attendance': return <AttendanceView />;
            case 'leaves': return <LeaveDashboardView />;
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
            case 'customers': return <SellingGenericView title="Customer" description="Kelola data pelanggan & batas kredit" type="table" />;
            case 'quotations': return <SellingGenericView title="Quotation" description="Penawaran harga penjualan" type="table" />;
            case 'blanket-orders': return <SellingGenericView title="Blanket Order" description="Kontrak pesanan payung bertahap" type="table" />;
            case 'sales-partners': return <SellingGenericView title="Sales Partner" description="Mitra & reseller penjualan" type="table" />;
            case 'sales-persons': return <SellingGenericView title="Sales Person" description="Tim & wiraniaga sales" type="table" />;
            case 'pos-profiles': return <SellingGenericView title="POS Profile" description="Profil & terminal kasir POS" type="table" />;
            case 'pos-settings': return <SellingGenericView title="POS Settings" description="Pengaturan operasional kasir POS" type="settings" />;
            case 'pos-opening': return <SellingGenericView title="POS Opening Entry" description="Pembuka shift & modal awal kasir" type="table" />;
            case 'pos-closing': return <SellingGenericView title="POS Closing Entry" description="Penutupan shift & rekonsiliasi kasir" type="table" />;
            case 'loyalty-programs': return <SellingGenericView title="Loyalty Program" description="Skema & aturan poin loyalitas" type="settings" />;
            case 'loyalty-points': return <SellingGenericView title="Loyalty Point Entry" description="Riwayat poin loyalitas pelanggan" type="table" />;
            case 'items': return <InventoryItemsView />;
            case 'item-prices': return <SellingGenericView title="Item Price" description="Harga khusus produk per price list" type="table" />;
            case 'price-lists': return <SellingGenericView title="Price List" description="Daftar harga standar penjualan & pembelian" type="table" />;
            case 'item-groups': return <InventoryCategoriesView />;
            case 'product-bundles': return <SellingGenericView title="Product Bundle" description="Paket bundling produk & komponen" type="table" />;
            case 'promotional-schemes': return <SellingGenericView title="Promotional Scheme" description="Skema promosi & diskon bertingkat" type="table" />;
            case 'pricing-rules': return <SellingGenericView title="Pricing Rule" description="Aturan otomatisasi diskon & marjin" type="table" />;
            case 'shipping-rules': return <SellingGenericView title="Shipping Rule" description="Aturan biaya ongkos kirim" type="table" />;
            case 'coupon-codes': return <SellingGenericView title="Coupon Code" description="Kupon promo & voucher diskon" type="table" />;
            case 'selling-settings': return <SellingGenericView title="Selling Settings" description="Pengaturan umum modul penjualan" type="settings" />;
            case 'terms-templates': return <SellingGenericView title="Terms & Conditions Template" description="Template syarat & ketentuan legal" type="table" />;
            case 'tax-templates': return <SellingGenericView title="Sales Taxes Template" description="Template pajak & biaya penjualan" type="table" />;
            case 'utm-sources': return <SellingGenericView title="UTM Source" description="Sumber lead marketing & analytics" type="table" />;
            case 'customer-groups': return <SellingGenericView title="Customer Group" description="Kelompok & klasifikasi pelanggan" type="table" />;
            case 'contacts': return <SellingGenericView title="Contact" description="Kontak personal pelanggan" type="table" />;
            case 'addresses': return <SellingGenericView title="Address" description="Alamat penagihan & pengiriman" type="table" />;
            case 'territories': return <SellingGenericView title="Territory" description="Wilayah & teritori penjualan" type="table" />;
            case 'campaigns': return <SellingGenericView title="Campaign" description="Kampanye pemasaran & budget" type="table" />;
            case 'sales-analytics': return <SellingGenericView title="Sales Analytics" description="Laporan analisis performa penjualan" type="report" />;
            case 'so-analysis': return <SellingGenericView title="Sales Order Analysis" description="Laporan analisis pemenuhan SO" type="report" />;
            case 'sales-funnel': return <SellingGenericView title="Sales Funnel" description="Laporan pipeline & konversi lead" type="report" />;
            case 'so-trends': return <SellingGenericView title="Sales Order Trends" description="Laporan tren pesanan penjualan" type="report" />;
            case 'quotation-trends': return <SellingGenericView title="Quotation Trends" description="Laporan tren penawaran harga" type="report" />;
            case 'customer-acquisition': return <SellingGenericView title="Customer Acquisition & Loyalty" description="Laporan akuisisi & loyalitas pelanggan" type="report" />;
            case 'inactive-customers': return <SellingGenericView title="Inactive Customers" description="Laporan pelanggan tidak aktif" type="report" />;
            case 'salesperson-summary': return <SellingGenericView title="Sales Person Summary" description="Ringkasan transaksi per wiraniaga" type="report" />;
            case 'item-sales-history': return <SellingGenericView title="Item Sales History" description="Riwayat penjualan per produk" type="report" />;
            case 'customer-directory': return <SellingGenericView title="Customer Directory" description="Daftar alamat & kontak pelanggan" type="report" />;
            case 'packing-stock': return <SellingGenericView title="Available Stock for Packing" description="Laporan stok siap packing" type="report" />;
            case 'pending-so-pr': return <SellingGenericView title="Pending SO Items for PR" description="Item SO pending untuk procurement" type="report" />;
            case 'delivery-trends': return <SellingGenericView title="Delivery Note Trends" description="Laporan tren pengiriman barang" type="report" />;
            case 'invoice-trends': return <SellingGenericView title="Sales Invoice Trends" description="Laporan tren faktur penjualan" type="report" />;
            case 'customer-credit-balance': return <SellingGenericView title="Customer Credit Balance" description="Laporan saldo kredit & piutang pelanggan" type="report" />;
            case 'dormant-customers': return <SellingGenericView title="Customers Without Transactions" description="Laporan pelanggan tanpa transaksi" type="report" />;
            case 'partner-commissions': return <SellingGenericView title="Sales Partners Commission" description="Laporan komisi mitra penjualan" type="report" />;
            case 'territory-target-variance': return <SellingGenericView title="Territory Target Variance" description="Varian target wilayah vs realisasi" type="report" />;
            case 'salesperson-target-variance': return <SellingGenericView title="Sales Person Target Variance" description="Varian target sales vs realisasi" type="report" />;
            case 'partner-target-variance': return <SellingGenericView title="Sales Partner Target Variance" description="Varian target mitra vs realisasi" type="report" />;
            case 'purchase-overview': return <PurchaseOverviewView />;
            case 'purchase-quotes': return <PurchaseQuotesView />;
            case 'purchase-orders': return <PurchaseOrdersView />;
            case 'purchase-shipments': return <PurchaseShipmentsView />;
            case 'purchase-bills': return <PurchaseBillsView />;
            case 'buying-workspace': return <BuyingWorkspaceView />;
            case 'material-requests': return <BuyingGenericView title="Material Request" description="Permintaan bahan & barang internal" type="table" />;
            case 'rfqs': return <BuyingGenericView title="Request for Quotation (RFQ)" description="Permintaan penawaran harga ke supplier" type="table" />;
            case 'supplier-quotations': return <BuyingGenericView title="Supplier Quotation" description="Penawaran harga dari supplier" type="table" />;
            case 'buying-item-prices': return <BuyingGenericView title="Item Price (Buying)" description="Harga beli khusus barang per supplier" type="table" />;
            case 'buying-price-lists': return <BuyingGenericView title="Price List (Buying)" description="Master daftar harga beli" type="table" />;
            case 'buying-product-bundles': return <BuyingGenericView title="Product Bundle" description="Paket bundling komponen pembelian" type="table" />;
            case 'buying-item-groups': return <InventoryCategoriesView />;
            case 'buying-promotional-schemes': return <BuyingGenericView title="Promotional Scheme (Buying)" description="Skema diskon & promosi supplier" type="table" />;
            case 'buying-pricing-rules': return <BuyingGenericView title="Pricing Rule (Buying)" description="Aturan otomatisasi harga beli" type="table" />;
            case 'buying-settings': return <BuyingGenericView title="Buying Settings" description="Pengaturan umum modul pembelian" type="settings" />;
            case 'purchase-tax-templates': return <BuyingGenericView title="Purchase Taxes Template" description="Template pajak & biaya pembelian" type="table" />;
            case 'buying-terms-templates': return <BuyingGenericView title="Terms & Conditions (Buying)" description="Template syarat & ketentuan pembelian" type="table" />;
            case 'suppliers': return <BuyingGenericView title="Supplier (Vendor)" description="Master data supplier & vendor" type="table" />;
            case 'supplier-groups': return <BuyingGenericView title="Supplier Group" description="Kelompok & klasifikasi supplier" type="table" />;
            case 'supplier-contacts': return <BuyingGenericView title="Supplier Contact" description="Kontak personil supplier" type="table" />;
            case 'supplier-addresses': return <BuyingGenericView title="Supplier Address" description="Alamat resmi vendor & pabrik" type="table" />;
            case 'supplier-scorecards': return <BuyingGenericView title="Supplier Scorecard" description="Penilaian & evaluasi kerja vendor" type="table" />;
            case 'scorecard-variables': return <BuyingGenericView title="Scorecard Variable" description="Variabel penilaian supplier" type="settings" />;
            case 'scorecard-criteria': return <BuyingGenericView title="Scorecard Criteria" description="Kriteria evaluasi vendor" type="settings" />;
            case 'scorecard-standings': return <BuyingGenericView title="Scorecard Standing" description="Peringkat & ranking supplier" type="report" />;
            case 'purchase-analytics': return <BuyingGenericView title="Purchase Analytics" description="Analisis & grafik statistik pembelian" type="report" />;
            case 'po-analysis': return <BuyingGenericView title="Purchase Order Analysis" description="Laporan analisis status PO" type="report" />;
            case 'item-consumption': return <BuyingGenericView title="Item Consumption Report" description="Laporan konsumsi & pemakaian barang" type="report" />;
            case 'items-to-order-receive': return <BuyingGenericView title="Items To Receive" description="Barang dipesan yang belum diterima" type="report" />;
            case 'po-trends': return <BuyingGenericView title="Purchase Order Trends" description="Laporan tren volume order pembelian" type="report" />;
            case 'procurement-tracker': return <BuyingGenericView title="Procurement Tracker" description="Pelacakan real-time siklus pengadaan" type="report" />;
            case 'items-to-request': return <BuyingGenericView title="Items To Request" description="Rekomendasi pemesanan ulang barang" type="report" />;
            case 'item-purchase-history': return <BuyingGenericView title="Item Purchase History" description="Riwayat harga & pembelian per item" type="report" />;
            case 'purchase-receipt-trends': return <BuyingGenericView title="Purchase Receipt Trends" description="Laporan tren penerimaan barang" type="report" />;
            case 'purchase-invoice-trends': return <BuyingGenericView title="Purchase Invoice Trends" description="Laporan tren faktur pembelian" type="report" />;
            case 'subcontract-materials': return <BuyingGenericView title="Subcontract Material Order" description="Order bahan baku ke subkontraktor" type="table" />;
            case 'subcontract-received': return <BuyingGenericView title="Subcontract Material Received" description="Penerimaan hasil subkontrak" type="table" />;
            case 'rfq-comparison': return <BuyingGenericView title="RFQ Supplier Comparison" description="Perbandingan harga antar supplier" type="report" />;
            case 'pr-to-rfq': return <BuyingGenericView title="Material Request to RFQ" description="Konversi permintaan bahan ke RFQ" type="table" />;
            case 'supplier-directory': return <BuyingGenericView title="Supplier Directory" description="Direktori alamat & kontak vendor" type="report" />;
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
            case 'payment-entries': return <AccountingGenericView title="Payment Entry" description="Pencatatan pembayaran & penerimaan kas" type="table" />;
            case 'payment-reconciliation': return <AccountingGenericView title="Payment Reconciliation" description="Rekonsiliasi pembayaran dengan faktur" type="table" />;
            case 'bank-accounts': return <AccountingGenericView title="Bank Account" description="Master rekening bank perusahaan" type="table" />;
            case 'bank-transactions': return <AccountingGenericView title="Bank Transaction" description="Riwayat mutasi & transaksi rekening bank" type="table" />;
            case 'bank-clearance': return <AccountingGenericView title="Bank Clearance" description="Penyelesaian & kliring cek/giro bank" type="table" />;
            case 'cashier-closing': return <AccountingGenericView title="Cashier Closing" description="Penutupan kasir & serah terima kas" type="table" />;
            case 'cost-centers': return <AccountingGenericView title="Cost Center" description="Pusat biaya & alokasi departemen" type="table" />;
            case 'accounting-dimensions': return <AccountingGenericView title="Accounting Dimension" description="Dimensi analisis akuntansi kustom" type="table" />;
            case 'budgets-view': return <AccountingGenericView title="Budget" description="Penganggaran & kontrol batas biaya" type="table" />;
            case 'sales-tax-templates': return <AccountingGenericView title="Sales Tax Template" description="Template pajak penjualan" type="table" />;
            case 'purchase-tax-templates-view': return <AccountingGenericView title="Purchase Tax Template" description="Template pajak pembelian" type="table" />;
            case 'tax-categories': return <AccountingGenericView title="Tax Category" description="Kategori & aturan pengenaan pajak" type="table" />;
            case 'tax-rules': return <AccountingGenericView title="Tax Rule" description="Aturan otomatisasi penentuan pajak" type="table" />;
            case 'credit-notes': return <AccountingGenericView title="Credit Note" description="Nota kredit / retur penjualan" type="table" />;
            case 'debit-notes': return <AccountingGenericView title="Debit Note" description="Nota debit / retur pembelian" type="table" />;
            case 'dunnings': return <AccountingGenericView title="Dunning" description="Surat peringatan & penagihan piutang" type="table" />;
            case 'balance-sheet': return <AccountingGenericView title="Balance Sheet" description="Laporan neraca keuangan perusahaan" type="report" />;
            case 'profit-loss': return <AccountingGenericView title="Profit & Loss Statement" description="Laporan laba rugi operasional" type="report" />;
            case 'cash-flow': return <AccountingGenericView title="Cash Flow Statement" description="Laporan arus kas masuk & keluar" type="report" />;
            case 'general-ledger-report': return <AccountingGenericView title="General Ledger Report" description="Laporan buku besar seluruh akun" type="report" />;
            case 'ar-aging': return <AccountingGenericView title="Accounts Receivable (AR) Ageing" description="Laporan umur piutang pelanggan" type="report" />;
            case 'ap-aging': return <AccountingGenericView title="Accounts Payable (AP) Ageing" description="Laporan umur hutang supplier" type="report" />;
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
