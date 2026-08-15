use crate::domain::entities::PurchaseBill;
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Clone)]
pub struct PurchaseBillRepository {
    pool: PgPool,
}

impl PurchaseBillRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn find_by_id(&self, id: Uuid) -> Result<Option<PurchaseBill>, sqlx::Error> {
        sqlx::query_as::<_, PurchaseBill>("SELECT * FROM purchase_bills WHERE id = $1")
            .bind(id)
            .fetch_optional(&self.pool)
            .await
    }

    pub async fn find_all(
        &self,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<PurchaseBill>, sqlx::Error> {
        sqlx::query_as::<_, PurchaseBill>(
            "SELECT * FROM purchase_bills ORDER BY bill_date DESC LIMIT $1 OFFSET $2",
        )
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.pool)
        .await
    }
}
