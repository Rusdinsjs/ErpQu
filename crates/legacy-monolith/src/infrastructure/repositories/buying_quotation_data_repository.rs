use sqlx::PgPool;
use uuid::Uuid;
use crate::domain::entities::buying_quotation_data::*;
use chrono::Utc;

pub struct BuyingQuotationDataRepository {
    pool: PgPool,
}

impl BuyingQuotationDataRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    // --- Request For Quotation ---
    pub async fn create_request_for_quotation(&self, req: CreateRequestForQuotationRequest, company_id: Uuid) -> Result<RequestForQuotation, sqlx::Error> {
        sqlx::query_as!(
            RequestForQuotation,
            r#"
            INSERT INTO requests_for_quotation (company_id, rfq_number, transaction_date, status, tc_name, terms)
            VALUES ($1, $2, COALESCE($3, CURRENT_DATE), 'Draft', $4, $5)
            RETURNING id, company_id, rfq_number, transaction_date, status, tc_name, terms, created_at
            "#,
            company_id, req.rfq_number, req.transaction_date, req.tc_name, req.terms
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_requests_for_quotation(&self, company_id: Uuid) -> Result<Vec<RequestForQuotation>, sqlx::Error> {
        sqlx::query_as!(
            RequestForQuotation,
            "SELECT * FROM requests_for_quotation WHERE company_id = $1 ORDER BY created_at DESC",
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }

    // --- Supplier Quotation ---
    pub async fn create_supplier_quotation(&self, req: CreateSupplierQuotationRequest, company_id: Uuid) -> Result<SupplierQuotation, sqlx::Error> {
        sqlx::query_as!(
            SupplierQuotation,
            r#"
            INSERT INTO supplier_quotations (company_id, quotation_number, vendor_id, rfq_id, transaction_date, valid_till, subtotal, total_tax, grand_total, status)
            VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE), $6, $7, $8, $9, 'Draft')
            RETURNING id, company_id, quotation_number, vendor_id, rfq_id, transaction_date, valid_till, subtotal, total_tax, grand_total, status, created_at
            "#,
            company_id, req.quotation_number, req.vendor_id, req.rfq_id, req.transaction_date, req.valid_till, req.subtotal, req.total_tax, req.grand_total
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_supplier_quotations(&self, company_id: Uuid) -> Result<Vec<SupplierQuotation>, sqlx::Error> {
        sqlx::query_as!(
            SupplierQuotation,
            "SELECT * FROM supplier_quotations WHERE company_id = $1 ORDER BY created_at DESC",
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }

    // --- Subcontracting Order ---
    pub async fn create_subcontracting_order(&self, req: CreateSubcontractingOrderRequest, company_id: Uuid) -> Result<SubcontractingOrder, sqlx::Error> {
        sqlx::query_as!(
            SubcontractingOrder,
            r#"
            INSERT INTO subcontracting_orders (company_id, order_number, vendor_id, transaction_date, status)
            VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), 'Draft')
            RETURNING id, company_id, order_number, vendor_id, transaction_date, status, created_at
            "#,
            company_id, req.order_number, req.vendor_id, req.transaction_date
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_subcontracting_orders(&self, company_id: Uuid) -> Result<Vec<SubcontractingOrder>, sqlx::Error> {
        sqlx::query_as!(
            SubcontractingOrder,
            "SELECT * FROM subcontracting_orders WHERE company_id = $1 ORDER BY created_at DESC",
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }
}
