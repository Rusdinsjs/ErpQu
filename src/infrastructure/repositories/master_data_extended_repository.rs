use sqlx::PgPool;
use uuid::Uuid;
use crate::domain::entities::master_data_extended::{Brand, ItemAttribute, ItemAlternative, ProductBundle, ProductBundleItem, Manufacturer, ItemTaxTemplate, ItemManufacturer};

pub struct MasterDataExtendedRepository {
    pool: PgPool,
}

impl MasterDataExtendedRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    // Brands
    pub async fn create_brand(&self, brand: &Brand) -> Result<Brand, sqlx::Error> {
        let rec = sqlx::query!(
            r#"
            INSERT INTO brands (id, company_id, brand_name, description, created_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, company_id, brand_name, description, created_at
            "#,
            brand.id,
            brand.company_id,
            brand.brand_name,
            brand.description,
            brand.created_at
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(Brand {
            id: rec.id,
            company_id: rec.company_id,
            brand_name: rec.brand_name,
            description: rec.description,
            created_at: rec.created_at,
        })
    }

    pub async fn list_brands(&self, company_id: Uuid) -> Result<Vec<Brand>, sqlx::Error> {
        let rows = sqlx::query!(
            r#"
            SELECT id, company_id, brand_name, description, created_at
            FROM brands
            WHERE company_id = $1
            ORDER BY brand_name ASC
            "#,
            company_id
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(|row| Brand {
            id: row.id,
            company_id: row.company_id,
            brand_name: row.brand_name,
            description: row.description,
            created_at: row.created_at,
        }).collect())
    }

    pub async fn delete_brand(&self, id: Uuid) -> Result<u64, sqlx::Error> {
        let result = sqlx::query!("DELETE FROM brands WHERE id = $1", id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected())
    }

    // Manufacturers
    pub async fn create_manufacturer(&self, manufacturer: &Manufacturer) -> Result<Manufacturer, sqlx::Error> {
        let rec = sqlx::query!(
            r#"
            INSERT INTO manufacturers (id, company_id, name, website, created_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, company_id, name, website, created_at
            "#,
            manufacturer.id,
            manufacturer.company_id,
            manufacturer.name,
            manufacturer.website,
            manufacturer.created_at
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(Manufacturer {
            id: rec.id,
            company_id: rec.company_id,
            name: rec.name,
            website: rec.website,
            created_at: rec.created_at,
        })
    }

    pub async fn list_manufacturers(&self, company_id: Uuid) -> Result<Vec<Manufacturer>, sqlx::Error> {
        let rows = sqlx::query!(
            r#"
            SELECT id, company_id, name, website, created_at
            FROM manufacturers
            WHERE company_id = $1
            ORDER BY name ASC
            "#,
            company_id
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(|row| Manufacturer {
            id: row.id,
            company_id: row.company_id,
            name: row.name,
            website: row.website,
            created_at: row.created_at,
        }).collect())
    }

    pub async fn delete_manufacturer(&self, id: Uuid) -> Result<u64, sqlx::Error> {
        let result = sqlx::query!("DELETE FROM manufacturers WHERE id = $1", id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected())
    }

    // Item Attributes
    pub async fn create_attribute(&self, attr: &ItemAttribute) -> Result<ItemAttribute, sqlx::Error> {
        let rec = sqlx::query!(
            r#"
            INSERT INTO item_attributes (id, company_id, attribute_name, created_at)
            VALUES ($1, $2, $3, $4)
            RETURNING id, company_id, attribute_name, created_at
            "#,
            attr.id,
            attr.company_id,
            attr.attribute_name,
            attr.created_at
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(ItemAttribute {
            id: rec.id,
            company_id: rec.company_id,
            attribute_name: rec.attribute_name,
            created_at: rec.created_at,
        })
    }

    pub async fn list_attributes(&self, company_id: Uuid) -> Result<Vec<ItemAttribute>, sqlx::Error> {
        let rows = sqlx::query!(
            r#"
            SELECT id, company_id, attribute_name, created_at
            FROM item_attributes
            WHERE company_id = $1
            ORDER BY attribute_name ASC
            "#,
            company_id
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(|row| ItemAttribute {
            id: row.id,
            company_id: row.company_id,
            attribute_name: row.attribute_name,
            created_at: row.created_at,
        }).collect())
    }

    pub async fn delete_attribute(&self, id: Uuid) -> Result<u64, sqlx::Error> {
        let result = sqlx::query!("DELETE FROM item_attributes WHERE id = $1", id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected())
    }

    // Item Alternatives
    pub async fn create_alternative(&self, alt: &ItemAlternative) -> Result<ItemAlternative, sqlx::Error> {
        let rec = sqlx::query!(
            r#"
            INSERT INTO item_alternatives (id, item_id, alternative_item_id, two_way, created_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, item_id, alternative_item_id, two_way, created_at
            "#,
            alt.id,
            alt.item_id,
            alt.alternative_item_id,
            alt.two_way,
            alt.created_at
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(ItemAlternative {
            id: rec.id,
            item_id: rec.item_id,
            alternative_item_id: rec.alternative_item_id,
            two_way: rec.two_way,
            created_at: rec.created_at,
            item_name: None,
            alternative_item_name: None,
        })
    }

    pub async fn list_alternatives(&self, company_id: Uuid) -> Result<Vec<ItemAlternative>, sqlx::Error> {
        // Find all alternatives for items belonging to this company
        let rows = sqlx::query!(
            r#"
            SELECT 
                a.id, a.item_id, a.alternative_item_id, a.two_way, a.created_at,
                i1.name as item_name,
                i2.name as alt_name
            FROM item_alternatives a
            JOIN inventory_items i1 ON a.item_id = i1.id
            JOIN inventory_items i2 ON a.alternative_item_id = i2.id
            WHERE i1.company_id = $1
            ORDER BY a.created_at DESC
            "#,
            company_id
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(|row| ItemAlternative {
            id: row.id,
            item_id: row.item_id,
            alternative_item_id: row.alternative_item_id,
            two_way: row.two_way,
            created_at: row.created_at,
            item_name: Some(row.item_name),
            alternative_item_name: Some(row.alt_name),
        }).collect())
    }

    pub async fn delete_alternative(&self, id: Uuid) -> Result<u64, sqlx::Error> {
        let result = sqlx::query!("DELETE FROM item_alternatives WHERE id = $1", id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected())
    }

    // Product Bundles
    pub async fn create_product_bundle(&self, bundle: &ProductBundle) -> Result<ProductBundle, sqlx::Error> {
        let mut tx = self.pool.begin().await?;

        let rec = sqlx::query!(
            r#"
            INSERT INTO product_bundles (id, company_id, new_item_code, description, created_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, company_id, new_item_code, description, created_at
            "#,
            bundle.id,
            bundle.company_id,
            bundle.new_item_code,
            bundle.description,
            bundle.created_at
        )
        .fetch_one(&mut *tx)
        .await?;

        let mut items = Vec::new();
        for item in &bundle.items {
            let item_rec = sqlx::query!(
                r#"
                INSERT INTO product_bundle_items (id, bundle_id, item_code, qty, created_at)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, bundle_id, item_code, qty, created_at
                "#,
                item.id,
                item.bundle_id,
                item.item_code,
                item.qty,
                item.created_at
            )
            .fetch_one(&mut *tx)
            .await?;

            items.push(ProductBundleItem {
                id: item_rec.id,
                bundle_id: item_rec.bundle_id,
                item_code: item_rec.item_code,
                qty: item_rec.qty,
                created_at: item_rec.created_at,
            });
        }

        tx.commit().await?;

        Ok(ProductBundle {
            id: rec.id,
            company_id: rec.company_id,
            new_item_code: rec.new_item_code,
            description: rec.description,
            created_at: rec.created_at,
            items,
        })
    }

    pub async fn list_product_bundles(&self, company_id: Uuid) -> Result<Vec<ProductBundle>, sqlx::Error> {
        let bundles = sqlx::query!(
            r#"
            SELECT id, company_id, new_item_code, description, created_at
            FROM product_bundles
            WHERE company_id = $1
            ORDER BY created_at DESC
            "#,
            company_id
        )
        .fetch_all(&self.pool)
        .await?;

        let mut result = Vec::new();
        for b in bundles {
            let items = sqlx::query!(
                r#"
                SELECT id, bundle_id, item_code, qty, created_at
                FROM product_bundle_items
                WHERE bundle_id = $1
                "#,
                b.id
            )
            .fetch_all(&self.pool)
            .await?;

            result.push(ProductBundle {
                id: b.id,
                company_id: b.company_id,
                new_item_code: b.new_item_code,
                description: b.description,
                created_at: b.created_at,
                items: items.into_iter().map(|i| ProductBundleItem {
                    id: i.id,
                    bundle_id: i.bundle_id,
                    item_code: i.item_code,
                    qty: i.qty,
                    created_at: i.created_at,
                }).collect(),
            });
        }

        Ok(result)
    }

    pub async fn delete_product_bundle(&self, id: Uuid) -> Result<u64, sqlx::Error> {
        let result = sqlx::query!("DELETE FROM product_bundles WHERE id = $1", id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected())
    }

    // Item Tax Templates
    pub async fn create_item_tax_template(&self, template: &ItemTaxTemplate) -> Result<ItemTaxTemplate, sqlx::Error> {
        let rec = sqlx::query!(
            r#"
            INSERT INTO item_tax_templates (id, company_id, title, tax_rate, created_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, company_id, title, tax_rate, created_at
            "#,
            template.id,
            template.company_id,
            template.title,
            template.tax_rate,
            template.created_at
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(ItemTaxTemplate {
            id: rec.id,
            company_id: rec.company_id,
            title: rec.title,
            tax_rate: rec.tax_rate,
            created_at: rec.created_at,
        })
    }

    pub async fn list_item_tax_templates(&self, company_id: Uuid) -> Result<Vec<ItemTaxTemplate>, sqlx::Error> {
        let rows = sqlx::query!(
            r#"
            SELECT id, company_id, title, tax_rate, created_at
            FROM item_tax_templates
            WHERE company_id = $1
            ORDER BY created_at DESC
            "#,
            company_id
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(|row| ItemTaxTemplate {
            id: row.id,
            company_id: row.company_id,
            title: row.title,
            tax_rate: row.tax_rate,
            created_at: row.created_at,
        }).collect())
    }

    pub async fn delete_item_tax_template(&self, id: Uuid) -> Result<u64, sqlx::Error> {
        let result = sqlx::query!("DELETE FROM item_tax_templates WHERE id = $1", id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected())
    }

    // Item Manufacturers
    pub async fn create_item_manufacturer(&self, mfg: &ItemManufacturer) -> Result<ItemManufacturer, sqlx::Error> {
        let rec = sqlx::query!(
            r#"
            INSERT INTO item_manufacturers (id, item_id, manufacturer_id, manufacturer_part_no, created_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, item_id, manufacturer_id, manufacturer_part_no, created_at
            "#,
            mfg.id,
            mfg.item_id,
            mfg.manufacturer_id,
            mfg.manufacturer_part_no,
            mfg.created_at
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(ItemManufacturer {
            id: rec.id,
            item_id: rec.item_id,
            manufacturer_id: rec.manufacturer_id,
            manufacturer_part_no: rec.manufacturer_part_no,
            created_at: rec.created_at,
            item_name: None,
            manufacturer_name: None,
        })
    }

    pub async fn list_item_manufacturers(&self, item_id: Uuid) -> Result<Vec<ItemManufacturer>, sqlx::Error> {
        let rows = sqlx::query!(
            r#"
            SELECT 
                im.id, im.item_id, im.manufacturer_id, im.manufacturer_part_no, im.created_at,
                i.item_name, m.name as manufacturer_name
            FROM item_manufacturers im
            JOIN inventory_items i ON im.item_id = i.id
            JOIN manufacturers m ON im.manufacturer_id = m.id
            WHERE im.item_id = $1
            ORDER BY im.created_at DESC
            "#,
            item_id
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(|row| ItemManufacturer {
            id: row.id,
            item_id: row.item_id,
            manufacturer_id: row.manufacturer_id,
            manufacturer_part_no: row.manufacturer_part_no,
            created_at: row.created_at,
            item_name: row.item_name,
            manufacturer_name: Some(row.manufacturer_name),
        }).collect())
    }

    pub async fn delete_item_manufacturer(&self, id: Uuid) -> Result<u64, sqlx::Error> {
        let result = sqlx::query!("DELETE FROM item_manufacturers WHERE id = $1", id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected())
    }
}
