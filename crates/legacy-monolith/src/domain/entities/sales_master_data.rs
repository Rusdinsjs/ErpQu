use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CustomerGroup {
    pub id: Uuid,
    pub company_id: Uuid,
    pub group_name: String,
    pub parent_group_id: Option<Uuid>,
    pub is_group: Option<bool>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CustomerContact {
    pub id: Uuid,
    pub client_id: Uuid,
    pub first_name: String,
    pub last_name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub is_primary: Option<bool>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CustomerAddress {
    pub id: Uuid,
    pub client_id: Uuid,
    pub address_title: String,
    pub address_line1: String,
    pub address_line2: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub country: Option<String>,
    pub pincode: Option<String>,
    pub is_primary_billing: Option<bool>,
    pub is_primary_shipping: Option<bool>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Territory {
    pub id: Uuid,
    pub company_id: Uuid,
    pub territory_name: String,
    pub parent_territory_id: Option<Uuid>,
    pub target_amount: Option<f64>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SalesPartner {
    pub id: Uuid,
    pub company_id: Uuid,
    pub partner_name: String,
    pub partner_type: Option<String>,
    pub commission_rate: Option<f64>,
    pub contact_person: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub status: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SalesPerson {
    pub id: Uuid,
    pub company_id: Uuid,
    pub sales_person_name: String,
    pub employee_id: Option<Uuid>,
    pub parent_sales_person_id: Option<Uuid>,
    pub commission_rate: Option<f64>,
    pub status: Option<String>,
    pub created_at: DateTime<Utc>,
}

// Request Data Transfer Objects (DTOs)

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCustomerGroupRequest {
    pub group_name: String,
    pub parent_group_id: Option<Uuid>,
    pub is_group: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCustomerContactRequest {
    pub client_id: Uuid,
    pub first_name: String,
    pub last_name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub is_primary: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCustomerAddressRequest {
    pub client_id: Uuid,
    pub address_title: String,
    pub address_line1: String,
    pub address_line2: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub country: Option<String>,
    pub pincode: Option<String>,
    pub is_primary_billing: Option<bool>,
    pub is_primary_shipping: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTerritoryRequest {
    pub territory_name: String,
    pub parent_territory_id: Option<Uuid>,
    pub target_amount: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSalesPartnerRequest {
    pub partner_name: String,
    pub partner_type: Option<String>,
    pub commission_rate: Option<f64>,
    pub contact_person: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSalesPersonRequest {
    pub sales_person_name: String,
    pub employee_id: Option<Uuid>,
    pub parent_sales_person_id: Option<Uuid>,
    pub commission_rate: Option<f64>,
    pub status: Option<String>,
}
