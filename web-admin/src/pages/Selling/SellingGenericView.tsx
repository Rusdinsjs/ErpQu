import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, Filter, Download, ArrowLeft, CheckCircle2, RefreshCw, BarChart2, FileText
} from 'lucide-react';
import { Button, Input, Badge } from '../../components/ui';
import { DocTypeFormModal } from '../../components/Forms/DocTypeFormModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientApi } from '../../api/client-management';
import { quotationApi } from '../../api/quotation';
import { salesMasterDataApi } from '../../api/sales-master-data';
import { salesPricingDataApi } from '../../api/sales-pricing-data';
import { salesPosDataApi } from '../../api/sales-pos-data';
import { salesSetupDataApi } from '../../api/sales-setup-data';
import { toast } from 'sonner';

interface Props {
    title: string;
    description: string;
    type: 'table' | 'settings' | 'report';
    sampleData?: any[];
}

export default function SellingGenericView({ title, description, type, sampleData = [] }: Props) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);

    // Dynamic Data Fetching
    const { data: clientsResponse, isLoading: clientsLoading } = useQuery({
        queryKey: ['clients'],
        queryFn: () => clientApi.list(),
        enabled: title === 'Customer'
    });

    const { data: quotationsResponse, isLoading: quotationsLoading } = useQuery({
        queryKey: ['quotations'],
        queryFn: () => quotationApi.list(),
        enabled: title === 'Quotation'
    });

    // Phase 1 Master Data
    const { data: customerGroupsResponse, isLoading: customerGroupsLoading } = useQuery({
        queryKey: ['customer-groups'],
        queryFn: () => salesMasterDataApi.listCustomerGroups(),
        enabled: title === 'Customer Group'
    });
    
    const { data: contactsResponse, isLoading: contactsLoading } = useQuery({
        queryKey: ['contacts'],
        queryFn: () => salesMasterDataApi.listContacts(),
        enabled: title === 'Contact'
    });

    const { data: addressesResponse, isLoading: addressesLoading } = useQuery({
        queryKey: ['addresses'],
        queryFn: () => salesMasterDataApi.listAddresses(),
        enabled: title === 'Address'
    });

    const { data: territoriesResponse, isLoading: territoriesLoading } = useQuery({
        queryKey: ['territories'],
        queryFn: () => salesMasterDataApi.listTerritories(),
        enabled: title === 'Territory'
    });

    const { data: salesPartnersResponse, isLoading: salesPartnersLoading } = useQuery({
        queryKey: ['sales-partners'],
        queryFn: () => salesMasterDataApi.listSalesPartners(),
        enabled: title === 'Sales Partner'
    });

    const { data: salesPersonsResponse, isLoading: salesPersonsLoading } = useQuery({
        queryKey: ['sales-persons'],
        queryFn: () => salesMasterDataApi.listSalesPersons(),
        enabled: title === 'Sales Person'
    });

    // Phase 2 Pricing Data
    const { data: priceListsResponse, isLoading: priceListsLoading } = useQuery({
        queryKey: ['price-lists'],
        queryFn: () => salesPricingDataApi.listPriceLists(),
        enabled: title === 'Price List'
    });
    const { data: itemPricesResponse, isLoading: itemPricesLoading } = useQuery({
        queryKey: ['item-prices'],
        queryFn: () => salesPricingDataApi.listItemPrices(),
        enabled: title === 'Item Price'
    });
    const { data: productBundlesResponse, isLoading: productBundlesLoading } = useQuery({
        queryKey: ['product-bundles'],
        queryFn: () => salesPricingDataApi.listProductBundles(),
        enabled: title === 'Product Bundle'
    });
    const { data: pricingRulesResponse, isLoading: pricingRulesLoading } = useQuery({
        queryKey: ['pricing-rules'],
        queryFn: () => salesPricingDataApi.listPricingRules(),
        enabled: title === 'Pricing Rule'
    });
    const { data: promotionalSchemesResponse, isLoading: promotionalSchemesLoading } = useQuery({
        queryKey: ['promotional-schemes'],
        queryFn: () => salesPricingDataApi.listPromotionalSchemes(),
        enabled: title === 'Promotional Scheme'
    });
    const { data: couponCodesResponse, isLoading: couponCodesLoading } = useQuery({
        queryKey: ['coupon-codes'],
        queryFn: () => salesPricingDataApi.listCouponCodes(),
        enabled: title === 'Coupon Code'
    });

    // Phase 3 POS Data
    const { data: posProfilesResponse, isLoading: posProfilesLoading } = useQuery({
        queryKey: ['pos-profiles'],
        queryFn: () => salesPosDataApi.listPosProfiles(),
        enabled: title === 'POS Profile' || title === 'POS Profiles'
    });
    const { data: posSettingsResponse, isLoading: posSettingsLoading } = useQuery({
        queryKey: ['pos-settings'],
        queryFn: () => salesPosDataApi.listPosSettings(),
        enabled: title === 'POS Settings'
    });
    const { data: posOpeningEntriesResponse, isLoading: posOpeningEntriesLoading } = useQuery({
        queryKey: ['pos-opening-entries'],
        queryFn: () => salesPosDataApi.listPosOpeningEntries(),
        enabled: title === 'POS Opening Entry'
    });
    const { data: posClosingEntriesResponse, isLoading: posClosingEntriesLoading } = useQuery({
        queryKey: ['pos-closing-entries'],
        queryFn: () => salesPosDataApi.listPosClosingEntries(),
        enabled: title === 'POS Closing Entry'
    });
    const { data: loyaltyProgramsResponse, isLoading: loyaltyProgramsLoading } = useQuery({
        queryKey: ['loyalty-programs'],
        queryFn: () => salesPosDataApi.listLoyaltyPrograms(),
        enabled: title === 'Loyalty Program' || title === 'Loyalty Programs'
    });
    const { data: loyaltyPointEntriesResponse, isLoading: loyaltyPointEntriesLoading } = useQuery({
        queryKey: ['loyalty-point-entries'],
        queryFn: () => salesPosDataApi.listLoyaltyPointEntries(),
        enabled: title === 'Loyalty Points Entry' || title === 'Loyalty Point Entry'
    });

    // Phase 4 Setup Data
    const { data: blanketOrdersResponse, isLoading: blanketOrdersLoading } = useQuery({
        queryKey: ['blanket-orders'],
        queryFn: () => salesSetupDataApi.listBlanketOrders(),
        enabled: title === 'Blanket Order'
    });
    const { data: shippingRulesResponse, isLoading: shippingRulesLoading } = useQuery({
        queryKey: ['shipping-rules'],
        queryFn: () => salesSetupDataApi.listShippingRules(),
        enabled: title === 'Shipping Rule'
    });
    const { data: sellingSettingsResponse, isLoading: sellingSettingsLoading } = useQuery({
        queryKey: ['selling-settings'],
        queryFn: () => salesSetupDataApi.listSellingSettings(),
        enabled: title === 'Selling Settings'
    });
    const { data: termsTemplatesResponse, isLoading: termsTemplatesLoading } = useQuery({
        queryKey: ['terms-templates'],
        queryFn: () => salesSetupDataApi.listTermsAndConditionsTemplates(),
        enabled: title === 'Terms & Conditions Template'
    });
    const { data: taxTemplatesResponse, isLoading: taxTemplatesLoading } = useQuery({
        queryKey: ['tax-templates'],
        queryFn: () => salesSetupDataApi.listSalesTaxesTemplates(),
        enabled: title === 'Sales Taxes Template'
    });
    const { data: utmSourcesResponse, isLoading: utmSourcesLoading } = useQuery({
        queryKey: ['utm-sources'],
        queryFn: () => salesSetupDataApi.listUtmSources(),
        enabled: title === 'UTM Source'
    });
    const { data: campaignsResponse, isLoading: campaignsLoading } = useQuery({
        queryKey: ['campaigns'],
        queryFn: () => salesSetupDataApi.listCampaigns(),
        enabled: title === 'Campaign'
    });

    const getActiveData = () => {
        if (title === 'Customer') return Array.isArray(clientsResponse?.data) ? clientsResponse.data : (clientsResponse as any)?.data?.data || [];
        if (title === 'Quotation') return Array.isArray(quotationsResponse?.data) ? quotationsResponse.data : (quotationsResponse as any)?.data?.data || [];
        if (title === 'Customer Group') return Array.isArray(customerGroupsResponse?.data) ? customerGroupsResponse.data : (customerGroupsResponse as any)?.data?.data || [];
        if (title === 'Contact') return Array.isArray(contactsResponse?.data) ? contactsResponse.data : (contactsResponse as any)?.data?.data || [];
        if (title === 'Address') return Array.isArray(addressesResponse?.data) ? addressesResponse.data : (addressesResponse as any)?.data?.data || [];
        if (title === 'Territory') return Array.isArray(territoriesResponse?.data) ? territoriesResponse.data : (territoriesResponse as any)?.data?.data || [];
        if (title === 'Sales Partner') return Array.isArray(salesPartnersResponse?.data) ? salesPartnersResponse.data : (salesPartnersResponse as any)?.data?.data || [];
        if (title === 'Sales Person') return Array.isArray(salesPersonsResponse?.data) ? salesPersonsResponse.data : (salesPersonsResponse as any)?.data?.data || [];
        if (title === 'Price List') return Array.isArray(priceListsResponse?.data) ? priceListsResponse.data : (priceListsResponse as any)?.data?.data || [];
        if (title === 'Item Price') return Array.isArray(itemPricesResponse?.data) ? itemPricesResponse.data : (itemPricesResponse as any)?.data?.data || [];
        if (title === 'Product Bundle') return Array.isArray(productBundlesResponse?.data) ? productBundlesResponse.data : (productBundlesResponse as any)?.data?.data || [];
        if (title === 'Pricing Rule') return Array.isArray(pricingRulesResponse?.data) ? pricingRulesResponse.data : (pricingRulesResponse as any)?.data?.data || [];
        if (title === 'Promotional Scheme') return Array.isArray(promotionalSchemesResponse?.data) ? promotionalSchemesResponse.data : (promotionalSchemesResponse as any)?.data?.data || [];
        if (title === 'Coupon Code') return Array.isArray(couponCodesResponse?.data) ? couponCodesResponse.data : (couponCodesResponse as any)?.data?.data || [];
        if (title === 'POS Profile' || title === 'POS Profiles') return Array.isArray(posProfilesResponse?.data) ? posProfilesResponse.data : (posProfilesResponse as any)?.data?.data || [];
        if (title === 'POS Settings') return Array.isArray(posSettingsResponse?.data) ? posSettingsResponse.data : (posSettingsResponse as any)?.data?.data || [];
        if (title === 'POS Opening Entry') return Array.isArray(posOpeningEntriesResponse?.data) ? posOpeningEntriesResponse.data : (posOpeningEntriesResponse as any)?.data?.data || [];
        if (title === 'POS Closing Entry') return Array.isArray(posClosingEntriesResponse?.data) ? posClosingEntriesResponse.data : (posClosingEntriesResponse as any)?.data?.data || [];
        if (title === 'Loyalty Program' || title === 'Loyalty Programs') return Array.isArray(loyaltyProgramsResponse?.data) ? loyaltyProgramsResponse.data : (loyaltyProgramsResponse as any)?.data?.data || [];
        if (title === 'Loyalty Points Entry' || title === 'Loyalty Point Entry') return Array.isArray(loyaltyPointEntriesResponse?.data) ? loyaltyPointEntriesResponse.data : (loyaltyPointEntriesResponse as any)?.data?.data || [];
        if (title === 'Blanket Order') return Array.isArray(blanketOrdersResponse?.data) ? blanketOrdersResponse.data : (blanketOrdersResponse as any)?.data?.data || [];
        if (title === 'Shipping Rule') return Array.isArray(shippingRulesResponse?.data) ? shippingRulesResponse.data : (shippingRulesResponse as any)?.data?.data || [];
        if (title === 'Selling Settings') return Array.isArray(sellingSettingsResponse?.data) ? sellingSettingsResponse.data : (sellingSettingsResponse as any)?.data?.data || [];
        if (title === 'Terms & Conditions Template') return Array.isArray(termsTemplatesResponse?.data) ? termsTemplatesResponse.data : (termsTemplatesResponse as any)?.data?.data || [];
        if (title === 'Sales Taxes Template') return Array.isArray(taxTemplatesResponse?.data) ? taxTemplatesResponse.data : (taxTemplatesResponse as any)?.data?.data || [];
        if (title === 'UTM Source') return Array.isArray(utmSourcesResponse?.data) ? utmSourcesResponse.data : (utmSourcesResponse as any)?.data?.data || [];
        if (title === 'Campaign') return Array.isArray(campaignsResponse?.data) ? campaignsResponse.data : (campaignsResponse as any)?.data?.data || [];
        return sampleData;
    };

    const activeData = getActiveData();

    const isLoading = title === 'Customer' ? clientsLoading :
        title === 'Quotation' ? quotationsLoading :
        title === 'Customer Group' ? customerGroupsLoading :
        title === 'Contact' ? contactsLoading :
        title === 'Address' ? addressesLoading :
        title === 'Territory' ? territoriesLoading :
        title === 'Sales Partner' ? salesPartnersLoading :
        title === 'Sales Person' ? salesPersonsLoading :
        title === 'Price List' ? priceListsLoading :
        title === 'Item Price' ? itemPricesLoading :
        title === 'Product Bundle' ? productBundlesLoading :
        title === 'Pricing Rule' ? pricingRulesLoading :
        title === 'Promotional Scheme' ? promotionalSchemesLoading :
        title === 'Coupon Code' ? couponCodesLoading :
        (title === 'POS Profile' || title === 'POS Profiles') ? posProfilesLoading :
        title === 'POS Settings' ? posSettingsLoading :
        title === 'POS Opening Entry' ? posOpeningEntriesLoading :
        title === 'POS Closing Entry' ? posClosingEntriesLoading :
        (title === 'Loyalty Program' || title === 'Loyalty Programs') ? loyaltyProgramsLoading :
        (title === 'Loyalty Points Entry' || title === 'Loyalty Point Entry') ? loyaltyPointEntriesLoading :
        title === 'Blanket Order' ? blanketOrdersLoading :
        title === 'Shipping Rule' ? shippingRulesLoading :
        title === 'Selling Settings' ? sellingSettingsLoading :
        title === 'Terms & Conditions Template' ? termsTemplatesLoading :
        title === 'Sales Taxes Template' ? taxTemplatesLoading :
        title === 'UTM Source' ? utmSourcesLoading :
        title === 'Campaign' ? campaignsLoading : false;

    // Dynamic Save Mutation
    const saveCustomer = useMutation({
        mutationFn: clientApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            setCreateModalOpen(false);
            toast.success('Customer berhasil dibuat');
        }
    });

    const saveQuotation = useMutation({
        mutationFn: quotationApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotations'] });
            setCreateModalOpen(false);
            toast.success('Quotation berhasil dibuat');
        }
    });

    const saveCustomerGroup = useMutation({
        mutationFn: salesMasterDataApi.createCustomerGroup,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customer-groups'] }); setCreateModalOpen(false); toast.success('Customer Group dibuat'); }
    });
    
    const saveContact = useMutation({
        mutationFn: salesMasterDataApi.createContact,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contacts'] }); setCreateModalOpen(false); toast.success('Contact dibuat'); }
    });

    const saveAddress = useMutation({
        mutationFn: salesMasterDataApi.createAddress,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['addresses'] }); setCreateModalOpen(false); toast.success('Address dibuat'); }
    });

    const saveTerritory = useMutation({
        mutationFn: salesMasterDataApi.createTerritory,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['territories'] }); setCreateModalOpen(false); toast.success('Territory dibuat'); }
    });

    const saveSalesPartner = useMutation({
        mutationFn: salesMasterDataApi.createSalesPartner,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sales-partners'] }); setCreateModalOpen(false); toast.success('Sales Partner dibuat'); }
    });

    const saveSalesPerson = useMutation({
        mutationFn: salesMasterDataApi.createSalesPerson,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sales-persons'] }); setCreateModalOpen(false); toast.success('Sales Person dibuat'); }
    });

    const savePriceList = useMutation({
        mutationFn: salesPricingDataApi.createPriceList,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['price-lists'] }); setCreateModalOpen(false); toast.success('Price List dibuat'); }
    });
    const saveItemPrice = useMutation({
        mutationFn: salesPricingDataApi.createItemPrice,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['item-prices'] }); setCreateModalOpen(false); toast.success('Item Price dibuat'); }
    });
    const saveProductBundle = useMutation({
        mutationFn: salesPricingDataApi.createProductBundle,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['product-bundles'] }); setCreateModalOpen(false); toast.success('Product Bundle dibuat'); }
    });
    const savePricingRule = useMutation({
        mutationFn: salesPricingDataApi.createPricingRule,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pricing-rules'] }); setCreateModalOpen(false); toast.success('Pricing Rule dibuat'); }
    });
    const savePromotionalScheme = useMutation({
        mutationFn: salesPricingDataApi.createPromotionalScheme,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['promotional-schemes'] }); setCreateModalOpen(false); toast.success('Promotional Scheme dibuat'); }
    });
    const saveCouponCode = useMutation({
        mutationFn: salesPricingDataApi.createCouponCode,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['coupon-codes'] }); setCreateModalOpen(false); toast.success('Coupon Code dibuat'); }
    });

    const savePosProfile = useMutation({
        mutationFn: salesPosDataApi.createPosProfile,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pos-profiles'] }); setCreateModalOpen(false); toast.success('POS Profile dibuat'); }
    });
    const savePosSettings = useMutation({
        mutationFn: salesPosDataApi.createPosSettings,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pos-settings'] }); setCreateModalOpen(false); toast.success('POS Settings dibuat'); }
    });
    const savePosOpeningEntry = useMutation({
        mutationFn: salesPosDataApi.createPosOpeningEntry,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pos-opening-entries'] }); setCreateModalOpen(false); toast.success('POS Opening Entry dibuat'); }
    });
    const savePosClosingEntry = useMutation({
        mutationFn: salesPosDataApi.createPosClosingEntry,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pos-closing-entries'] }); setCreateModalOpen(false); toast.success('POS Closing Entry dibuat'); }
    });
    const saveLoyaltyProgram = useMutation({
        mutationFn: salesPosDataApi.createLoyaltyProgram,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['loyalty-programs'] }); setCreateModalOpen(false); toast.success('Loyalty Program dibuat'); }
    });
    const saveLoyaltyPointEntry = useMutation({
        mutationFn: salesPosDataApi.createLoyaltyPointEntry,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['loyalty-point-entries'] }); setCreateModalOpen(false); toast.success('Loyalty Points Entry dibuat'); }
    });

    const saveBlanketOrder = useMutation({
        mutationFn: salesSetupDataApi.createBlanketOrder,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['blanket-orders'] }); setCreateModalOpen(false); toast.success('Blanket Order dibuat'); }
    });
    const saveShippingRule = useMutation({
        mutationFn: salesSetupDataApi.createShippingRule,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['shipping-rules'] }); setCreateModalOpen(false); toast.success('Shipping Rule dibuat'); }
    });
    const saveSellingSettings = useMutation({
        mutationFn: salesSetupDataApi.createSellingSettings,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['selling-settings'] }); setCreateModalOpen(false); toast.success('Selling Settings dibuat'); }
    });
    const saveTermsTemplate = useMutation({
        mutationFn: salesSetupDataApi.createTermsAndConditionsTemplate,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['terms-templates'] }); setCreateModalOpen(false); toast.success('Terms & Conditions Template dibuat'); }
    });
    const saveTaxTemplate = useMutation({
        mutationFn: salesSetupDataApi.createSalesTaxesTemplate,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tax-templates'] }); setCreateModalOpen(false); toast.success('Sales Taxes Template dibuat'); }
    });
    const saveUtmSource = useMutation({
        mutationFn: salesSetupDataApi.createUtmSource,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['utm-sources'] }); setCreateModalOpen(false); toast.success('UTM Source dibuat'); }
    });
    const saveCampaign = useMutation({
        mutationFn: salesSetupDataApi.createCampaign,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['campaigns'] }); setCreateModalOpen(false); toast.success('Campaign dibuat'); }
    });

    const handleSave = (formData: any) => {
        if (title === 'Customer') {
            saveCustomer.mutate({
                name: formData.customer_name || 'New Customer',
                client_code: `CUST-${Date.now()}`,
                company_name: formData.customer_name,
                notes: `Group: ${formData.customer_group}, Type: ${formData.customer_type}`
            });
        } else if (title === 'Quotation') {
            saveQuotation.mutate({
                quotation_number: formData.naming_series || `QT-${Date.now()}`,
                client_id: formData.customer_name, // This assumes DocType returned the UUID
                date: formData.transaction_date,
                valid_until: formData.valid_till,
                status: 'Draft',
                items: formData.items || []
            });
        } else if (title === 'Customer Group') {
            saveCustomerGroup.mutate({
                group_name: formData.customer_group_name || 'New Group',
                is_group: formData.is_group === 'Yes'
            });
        } else if (title === 'Contact') {
            saveContact.mutate({
                client_id: formData.customer_name, // Map customer/client field
                first_name: formData.first_name || 'Name',
                last_name: formData.last_name,
                email: formData.email_id,
                phone: formData.mobile_no
            });
        } else if (title === 'Address') {
            saveAddress.mutate({
                client_id: formData.customer_name, // Map customer/client field
                address_title: formData.address_title || 'Address',
                address_line1: formData.address_line1 || '-',
                address_line2: formData.address_line2,
                city: formData.city,
                state: formData.state,
                country: formData.country,
                pincode: formData.pincode
            });
        } else if (title === 'Territory') {
            saveTerritory.mutate({
                territory_name: formData.territory_name || 'New Territory'
            });
        } else if (title === 'Sales Partner') {
            saveSalesPartner.mutate({
                partner_name: formData.partner_name || 'New Partner',
                commission_rate: parseFloat(formData.commission_rate || 0)
            });
        } else if (title === 'Sales Person') {
            saveSalesPerson.mutate({
                sales_person_name: formData.sales_person_name || 'New Sales Person',
                commission_rate: parseFloat(formData.commission_rate || 0)
            });
        } else if (title === 'Price List') {
            savePriceList.mutate({
                price_list_name: formData.price_list_name || 'New Price List',
                currency: formData.currency,
                buying: formData.buying === 'Yes',
                selling: formData.selling === 'Yes',
                enabled: formData.enabled === 'Yes'
            });
        } else if (title === 'Item Price') {
            saveItemPrice.mutate({
                price_list_id: formData.price_list, // Map this appropriately if needed
                item_id: formData.item_code,
                price_list_rate: parseFloat(formData.price_list_rate || 0),
                valid_from: formData.valid_from,
                valid_upto: formData.valid_upto
            });
        } else if (title === 'Product Bundle') {
            saveProductBundle.mutate({
                new_item_code: formData.new_item_code || 'BNDL',
                description: formData.description
            });
        } else if (title === 'Pricing Rule') {
            savePricingRule.mutate({
                title: formData.title || 'Rule',
                apply_on: formData.apply_on,
                discount_percentage: parseFloat(formData.discount_percentage || 0),
                enabled: formData.enabled === 'Yes'
            });
        } else if (title === 'Promotional Scheme') {
            savePromotionalScheme.mutate({
                name: formData.name || 'Promo',
                description: formData.description,
                enabled: formData.enabled === 'Yes'
            });
        } else if (title === 'Coupon Code') {
            saveCouponCode.mutate({
                coupon_name: formData.coupon_name || 'Coupon',
                coupon_code: formData.coupon_code || 'CODE',
                discount_percentage: parseFloat(formData.discount_percentage || 0),
                valid_from: formData.valid_from,
                valid_upto: formData.valid_upto
            });
        } else if (title === 'POS Profile' || title === 'POS Profiles') {
            savePosProfile.mutate({
                profile_name: formData.profile_name || 'POS Profile',
                warehouse_id: formData.warehouse || formData.warehouse_id,
                cash_account_id: formData.cash_account || formData.cash_account_id,
                is_active: formData.is_active === 'Yes'
            });
        } else if (title === 'POS Settings') {
            savePosSettings.mutate({
                allow_discount_change: formData.allow_discount_change === 'Yes',
                allow_rate_change: formData.allow_rate_change === 'Yes',
                auto_print_receipt: formData.auto_print_receipt === 'Yes'
            });
        } else if (title === 'POS Opening Entry') {
            savePosOpeningEntry.mutate({
                pos_profile_id: formData.pos_profile || formData.pos_profile_id,
                user_id: formData.user || formData.user_id,
                opening_amount: parseFloat(formData.opening_amount || 0)
            });
        } else if (title === 'POS Closing Entry') {
            savePosClosingEntry.mutate({
                pos_profile_id: formData.pos_profile || formData.pos_profile_id,
                user_id: formData.user || formData.user_id,
                pos_opening_entry_id: formData.pos_opening_entry || null,
                period_start_date: new Date().toISOString(),
                grand_total: parseFloat(formData.grand_total || 0),
                net_total: parseFloat(formData.net_total || 0),
                total_quantity: parseFloat(formData.total_quantity || 0)
            });
        } else if (title === 'Loyalty Program' || title === 'Loyalty Programs') {
            saveLoyaltyProgram.mutate({
                program_name: formData.program_name || 'Loyalty',
                auto_opt_in: formData.auto_opt_in === 'Yes',
                conversion_factor: parseFloat(formData.conversion_factor || 1),
                expiry_duration_in_days: parseInt(formData.expiry_duration_in_days || '365')
            });
        } else if (title === 'Loyalty Points Entry' || title === 'Loyalty Point Entry') {
            saveLoyaltyPointEntry.mutate({
                loyalty_program_id: formData.loyalty_program || formData.loyalty_program_id,
                client_id: formData.customer || formData.client_id,
                loyalty_points: parseInt(formData.loyalty_points || '10')
            });
        } else if (title === 'Blanket Order') {
            saveBlanketOrder.mutate({
                order_number: formData.order_number || `BO-${Date.now()}`,
                client_id: formData.customer || formData.client_id,
                from_date: formData.from_date || new Date().toISOString(),
                to_date: formData.to_date || new Date().toISOString()
            });
        } else if (title === 'Shipping Rule') {
            saveShippingRule.mutate({
                name: formData.name || 'Shipping Rule',
                shipping_amount: parseFloat(formData.shipping_amount || 0)
            });
        } else if (title === 'Selling Settings') {
            saveSellingSettings.mutate({
                so_required: formData.so_required === 'Yes',
                dn_required: formData.dn_required === 'Yes',
                allow_negative_stock: formData.allow_negative_stock === 'Yes'
            });
        } else if (title === 'Terms & Conditions Template') {
            saveTermsTemplate.mutate({
                title: formData.title || 'Terms',
                terms_content: formData.terms_content || 'Terms...'
            });
        } else if (title === 'Sales Taxes Template') {
            saveTaxTemplate.mutate({
                title: formData.title || 'Tax Template',
                rate: parseFloat(formData.rate || 0)
            });
        } else if (title === 'UTM Source') {
            saveUtmSource.mutate({
                name: formData.name || 'Source'
            });
        } else if (title === 'Campaign') {
            saveCampaign.mutate({
                campaign_name: formData.campaign_name || 'Campaign'
            });
        } else {
            toast.success(`${title} disimpan (Local State)`);
            setCreateModalOpen(false);
        }
    };

    return (
        <div className="p-6 space-y-6 bg-background min-h-screen">
            {/* Header / Breadcrumb */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/selling')}
                        className="p-2 rounded-xl bg-card border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => { }}>
                        <Download size={16} className="mr-2" /> Export
                    </Button>
                    <Button onClick={() => setCreateModalOpen(true)}>
                        <Plus size={16} className="mr-2" /> Tambah Baru
                    </Button>
                </div>
            </div>

            {/* Filter / Action Toolbar */}
            <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-96">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={`Cari dalam ${title.toLowerCase()}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <Button variant="outline" size="sm">
                        <Filter size={14} className="mr-1.5" /> Filter
                    </Button>
                    <Button variant="outline" size="sm">
                        <RefreshCw size={14} className="mr-1.5" /> Refresh
                    </Button>
                </div>
            </div>

            {/* Table / Content View */}
            <div className="rounded-2xl bg-card border border-border/60 shadow-sm overflow-hidden p-6">
                {type === 'report' ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <h3 className="font-semibold text-foreground flex items-center gap-2">
                                <BarChart2 size={18} className="text-primary" /> Ringkasan Laporan Penjualan
                            </h3>
                            <span className="text-xs text-muted-foreground">Updated live</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="p-4 rounded-xl bg-muted/40 border border-border/40">
                                <span className="text-xs text-muted-foreground">Total Entri</span>
                                <p className="text-xl font-bold text-foreground mt-1">0 Records</p>
                            </div>
                            <div className="p-4 rounded-xl bg-muted/40 border border-border/40">
                                <span className="text-xs text-muted-foreground">Total Nilai</span>
                                <p className="text-xl font-bold text-foreground mt-1">Rp 0,00</p>
                            </div>
                            <div className="p-4 rounded-xl bg-muted/40 border border-border/40">
                                <span className="text-xs text-muted-foreground">Pencapaian Target</span>
                                <p className="text-xl font-bold text-emerald-500 mt-1">100%</p>
                            </div>
                            <div className="p-4 rounded-xl bg-muted/40 border border-border/40">
                                <span className="text-xs text-muted-foreground">Status</span>
                                <p className="text-xl font-bold text-cyan-500 mt-1">Normal</p>
                            </div>
                        </div>
                        <div className="py-12 text-center text-muted-foreground">
                            <FileText size={48} className="mx-auto text-muted-foreground/40 mb-3" />
                            <p className="font-medium text-foreground">Belum Ada Data Laporan</p>
                            <p className="text-xs text-muted-foreground mt-1">Data akan muncul secara otomatis berdasarkan akumulasi transaksi penjualan Anda.</p>
                        </div>
                    </div>
                ) : title !== 'report' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/40 text-muted-foreground uppercase text-xs font-semibold">
                                <tr>
                                    {title === 'Customer' ? (
                                        <>
                                            <th className="px-6 py-4">Kode</th>
                                            <th className="px-6 py-4">Nama Customer</th>
                                            <th className="px-6 py-4">Perusahaan</th>
                                            <th className="px-6 py-4">Kontak</th>
                                        </>
                                    ) : title === 'Quotation' ? (
                                        <>
                                            <th className="px-6 py-4">Nomor</th>
                                            <th className="px-6 py-4">Customer ID</th>
                                            <th className="px-6 py-4">Tanggal</th>
                                            <th className="px-6 py-4 text-right">Total</th>
                                            <th className="px-6 py-4 text-center">Status</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="px-6 py-4">Data ID</th>
                                            <th className="px-6 py-4">Nama / Judul</th>
                                            <th className="px-6 py-4">Dibuat Pada</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {isLoading ? (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center animate-pulse">Memuat data...</td></tr>
                                ) : activeData.length > 0 ? (
                                    activeData.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                                            {title === 'Customer' ? (
                                                <>
                                                    <td className="px-6 py-4 font-mono text-xs">{item.client_code}</td>
                                                    <td className="px-6 py-4 font-medium text-foreground">{item.name}</td>
                                                    <td className="px-6 py-4 text-foreground">{item.company_name || '-'}</td>
                                                    <td className="px-6 py-4 text-foreground">{item.phone || item.email || '-'}</td>
                                                </>
                                            ) : title === 'Quotation' ? (
                                                <>
                                                    <td className="px-6 py-4 font-mono text-xs text-primary">{item.quotation_number}</td>
                                                    <td className="px-6 py-4 text-foreground truncate max-w-[150px]">{item.client_id}</td>
                                                    <td className="px-6 py-4 font-mono text-xs">{new Date(item.date).toLocaleDateString('id-ID')}</td>
                                                    <td className="px-6 py-4 text-right font-semibold text-foreground">
                                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.total_amount)}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <Badge variant="default" className="text-[10px] uppercase">{item.status}</Badge>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{item.id?.split('-')[0]}</td>
                                                    <td className="px-6 py-4 font-medium text-foreground">
                                                        {item.group_name || item.first_name || item.address_title || item.territory_name || item.partner_name || item.sales_person_name || item.price_list_name || item.new_item_code || item.title || item.coupon_name || item.name || item.profile_name || item.program_name || item.status || item.order_number || item.campaign_name || 'Tanpa Nama'}
                                                    </td>
                                                    <td className="px-6 py-4 font-mono text-xs">{new Date(item.created_at || Date.now()).toLocaleDateString('id-ID')}</td>
                                                </>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                                            Belum ada data {title}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="py-16 text-center text-muted-foreground">
                        <CheckCircle2 size={48} className="mx-auto text-emerald-500/80 mb-3" />
                        <h3 className="text-lg font-semibold text-foreground">Error UI State</h3>
                    </div>
                )}
            </div>

            {/* ERPNext Compliant DocType Form Modal */}
            <DocTypeFormModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                title={title}
                moduleName="Selling"
                onSave={handleSave}
            />
        </div>
    );
}
