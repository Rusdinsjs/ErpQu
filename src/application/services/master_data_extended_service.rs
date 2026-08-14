use uuid::Uuid;
use crate::domain::entities::master_data_extended::{Brand, ItemAttribute, ItemAlternative, ProductBundle, Manufacturer, ItemTaxTemplate, ItemManufacturer};
use crate::infrastructure::repositories::master_data_extended_repository::MasterDataExtendedRepository;

pub struct MasterDataExtendedService {
    repo: MasterDataExtendedRepository,
}

impl MasterDataExtendedService {
    pub fn new(repo: MasterDataExtendedRepository) -> Self {
        Self { repo }
    }

    // Brands
    pub async fn create_brand(&self, brand: Brand) -> Result<Brand, String> {
        self.repo.create_brand(&brand).await.map_err(|e| e.to_string())
    }

    pub async fn list_brands(&self, company_id: Uuid) -> Result<Vec<Brand>, String> {
        self.repo.list_brands(company_id).await.map_err(|e| e.to_string())
    }

    pub async fn delete_brand(&self, id: Uuid) -> Result<u64, String> {
        self.repo.delete_brand(id).await.map_err(|e| e.to_string())
    }

    // Manufacturers
    pub async fn create_manufacturer(&self, manufacturer: Manufacturer) -> Result<Manufacturer, String> {
        self.repo.create_manufacturer(&manufacturer).await.map_err(|e| e.to_string())
    }

    pub async fn list_manufacturers(&self, company_id: Uuid) -> Result<Vec<Manufacturer>, String> {
        self.repo.list_manufacturers(company_id).await.map_err(|e| e.to_string())
    }

    pub async fn delete_manufacturer(&self, id: Uuid) -> Result<u64, String> {
        self.repo.delete_manufacturer(id).await.map_err(|e| e.to_string())
    }

    // Item Attributes
    pub async fn create_attribute(&self, attr: ItemAttribute) -> Result<ItemAttribute, String> {
        self.repo.create_attribute(&attr).await.map_err(|e| e.to_string())
    }

    pub async fn list_attributes(&self, company_id: Uuid) -> Result<Vec<ItemAttribute>, String> {
        self.repo.list_attributes(company_id).await.map_err(|e| e.to_string())
    }

    pub async fn delete_attribute(&self, id: Uuid) -> Result<u64, String> {
        self.repo.delete_attribute(id).await.map_err(|e| e.to_string())
    }

    // Item Alternatives
    pub async fn create_alternative(&self, alt: ItemAlternative) -> Result<ItemAlternative, String> {
        self.repo.create_alternative(&alt).await.map_err(|e| e.to_string())
    }

    pub async fn list_alternatives(&self, company_id: Uuid) -> Result<Vec<ItemAlternative>, String> {
        self.repo.list_alternatives(company_id).await.map_err(|e| e.to_string())
    }

    pub async fn delete_alternative(&self, id: Uuid) -> Result<u64, String> {
        self.repo.delete_alternative(id).await.map_err(|e| e.to_string())
    }

    // Product Bundles
    pub async fn create_product_bundle(&self, bundle: ProductBundle) -> Result<ProductBundle, String> {
        self.repo.create_product_bundle(&bundle).await.map_err(|e| e.to_string())
    }

    pub async fn list_product_bundles(&self, company_id: Uuid) -> Result<Vec<ProductBundle>, String> {
        self.repo.list_product_bundles(company_id).await.map_err(|e| e.to_string())
    }

    pub async fn delete_bundle(&self, id: Uuid) -> Result<u64, String> {
        self.repo.delete_product_bundle(id).await.map_err(|e| e.to_string())
    }

    // Item Tax Templates
    pub async fn create_item_tax_template(&self, template: ItemTaxTemplate) -> Result<ItemTaxTemplate, String> {
        self.repo.create_item_tax_template(&template).await.map_err(|e| e.to_string())
    }

    pub async fn list_item_tax_templates(&self, company_id: Uuid) -> Result<Vec<ItemTaxTemplate>, String> {
        self.repo.list_item_tax_templates(company_id).await.map_err(|e| e.to_string())
    }

    pub async fn delete_item_tax_template(&self, id: Uuid) -> Result<u64, String> {
        self.repo.delete_item_tax_template(id).await.map_err(|e| e.to_string())
    }

    // Item Manufacturers
    pub async fn create_item_manufacturer(&self, mfg: ItemManufacturer) -> Result<ItemManufacturer, String> {
        self.repo.create_item_manufacturer(&mfg).await.map_err(|e| e.to_string())
    }

    pub async fn list_item_manufacturers(&self, item_id: Uuid) -> Result<Vec<ItemManufacturer>, String> {
        self.repo.list_item_manufacturers(item_id).await.map_err(|e| e.to_string())
    }

    pub async fn delete_item_manufacturer(&self, id: Uuid) -> Result<u64, String> {
        self.repo.delete_item_manufacturer(id).await.map_err(|e| e.to_string())
    }
}
