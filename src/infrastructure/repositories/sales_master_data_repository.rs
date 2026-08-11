use sqlx::PgPool;
use uuid::Uuid;
use crate::domain::entities::sales_master_data::*;

pub struct SalesMasterDataRepository {
    pool: PgPool,
}

impl SalesMasterDataRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    // --- Customer Groups ---
    pub async fn create_customer_group(&self, req: CreateCustomerGroupRequest, company_id: Uuid) -> Result<CustomerGroup, sqlx::Error> {
        sqlx::query_as!(
            CustomerGroup,
            r#"
            INSERT INTO customer_groups (company_id, group_name, parent_group_id, is_group)
            VALUES ($1, $2, $3, $4)
            RETURNING id, company_id, group_name, parent_group_id, is_group, created_at
            "#,
            company_id, req.group_name, req.parent_group_id, req.is_group
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_customer_groups(&self, company_id: Uuid) -> Result<Vec<CustomerGroup>, sqlx::Error> {
        sqlx::query_as!(
            CustomerGroup,
            "SELECT * FROM customer_groups WHERE company_id = $1 ORDER BY created_at DESC",
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }

    // --- Customer Contacts ---
    pub async fn create_customer_contact(&self, req: CreateCustomerContactRequest) -> Result<CustomerContact, sqlx::Error> {
        sqlx::query_as!(
            CustomerContact,
            r#"
            INSERT INTO customer_contacts (client_id, first_name, last_name, email, phone, is_primary)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, client_id, first_name, last_name, email, phone, is_primary, created_at
            "#,
            req.client_id, req.first_name, req.last_name, req.email, req.phone, req.is_primary
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_customer_contacts(&self) -> Result<Vec<CustomerContact>, sqlx::Error> {
        sqlx::query_as!(
            CustomerContact,
            "SELECT * FROM customer_contacts ORDER BY created_at DESC"
        )
        .fetch_all(&self.pool)
        .await
    }

    // --- Customer Addresses ---
    pub async fn create_customer_address(&self, req: CreateCustomerAddressRequest) -> Result<CustomerAddress, sqlx::Error> {
        sqlx::query_as!(
            CustomerAddress,
            r#"
            INSERT INTO customer_addresses (client_id, address_title, address_line1, address_line2, city, state, country, pincode, is_primary_billing, is_primary_shipping)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, client_id, address_title, address_line1, address_line2, city, state, country, pincode, is_primary_billing, is_primary_shipping, created_at
            "#,
            req.client_id, req.address_title, req.address_line1, req.address_line2, req.city, req.state, req.country, req.pincode, req.is_primary_billing, req.is_primary_shipping
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_customer_addresses(&self) -> Result<Vec<CustomerAddress>, sqlx::Error> {
        sqlx::query_as!(
            CustomerAddress,
            "SELECT * FROM customer_addresses ORDER BY created_at DESC"
        )
        .fetch_all(&self.pool)
        .await
    }

    // --- Territories ---
    pub async fn create_territory(&self, req: CreateTerritoryRequest, company_id: Uuid) -> Result<Territory, sqlx::Error> {
        sqlx::query_as!(
            Territory,
            r#"
            INSERT INTO territories (company_id, territory_name, parent_territory_id, target_amount)
            VALUES ($1, $2, $3, $4)
            RETURNING id, company_id, territory_name, parent_territory_id, target_amount, created_at
            "#,
            company_id, req.territory_name, req.parent_territory_id, req.target_amount
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_territories(&self, company_id: Uuid) -> Result<Vec<Territory>, sqlx::Error> {
        sqlx::query_as!(
            Territory,
            "SELECT * FROM territories WHERE company_id = $1 ORDER BY created_at DESC",
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }

    // --- Sales Partners ---
    pub async fn create_sales_partner(&self, req: CreateSalesPartnerRequest, company_id: Uuid) -> Result<SalesPartner, sqlx::Error> {
        sqlx::query_as!(
            SalesPartner,
            r#"
            INSERT INTO sales_partners (company_id, partner_name, partner_type, commission_rate, contact_person, email, phone, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, company_id, partner_name, partner_type, commission_rate, contact_person, email, phone, status, created_at
            "#,
            company_id, req.partner_name, req.partner_type, req.commission_rate, req.contact_person, req.email, req.phone, req.status
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_sales_partners(&self, company_id: Uuid) -> Result<Vec<SalesPartner>, sqlx::Error> {
        sqlx::query_as!(
            SalesPartner,
            "SELECT * FROM sales_partners WHERE company_id = $1 ORDER BY created_at DESC",
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }

    // --- Sales Persons ---
    pub async fn create_sales_person(&self, req: CreateSalesPersonRequest, company_id: Uuid) -> Result<SalesPerson, sqlx::Error> {
        sqlx::query_as!(
            SalesPerson,
            r#"
            INSERT INTO sales_persons (company_id, sales_person_name, employee_id, parent_sales_person_id, commission_rate, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, company_id, sales_person_name, employee_id, parent_sales_person_id, commission_rate, status, created_at
            "#,
            company_id, req.sales_person_name, req.employee_id, req.parent_sales_person_id, req.commission_rate, req.status
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn list_sales_persons(&self, company_id: Uuid) -> Result<Vec<SalesPerson>, sqlx::Error> {
        sqlx::query_as!(
            SalesPerson,
            "SELECT * FROM sales_persons WHERE company_id = $1 ORDER BY created_at DESC",
            company_id
        )
        .fetch_all(&self.pool)
        .await
    }
}
