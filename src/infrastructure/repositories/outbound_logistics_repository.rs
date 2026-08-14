use sqlx::PgPool;
use uuid::Uuid;
use crate::domain::entities::outbound_logistics::{
    DeliveryNote, DeliveryNoteItem, PickList, PickListItem, DeliveryTrip, DeliveryTripStop,
    InstallationNote, StockReconciliation, StockReconciliationItem,
};

pub struct OutboundLogisticsRepository {
    pool: PgPool,
}

impl OutboundLogisticsRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    // 1. Delivery Notes
    pub async fn create_delivery_note(&self, note: &DeliveryNote) -> Result<DeliveryNote, sqlx::Error> {
        let mut tx = self.pool.begin().await?;

        let rec = sqlx::query!(
            r#"
            INSERT INTO delivery_notes (id, company_id, delivery_note_number, customer_id, transaction_date, posting_time, warehouse_id, status, grand_total, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, company_id, delivery_note_number, customer_id, transaction_date, posting_time, warehouse_id, status, grand_total, created_at
            "#,
            note.id,
            note.company_id,
            note.delivery_note_number,
            note.customer_id,
            note.transaction_date,
            note.posting_time,
            note.warehouse_id,
            note.status,
            note.grand_total,
            note.created_at
        )
        .fetch_one(&mut *tx)
        .await?;

        let mut items = Vec::new();
        for item in &note.items {
            let item_rec = sqlx::query!(
                r#"
                INSERT INTO delivery_note_items (id, delivery_note_id, item_id, qty, rate, amount, batch_no, serial_no)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id, delivery_note_id, item_id, qty, rate, amount, batch_no, serial_no
                "#,
                item.id,
                item.delivery_note_id,
                item.item_id,
                item.qty,
                item.rate,
                item.amount,
                item.batch_no,
                item.serial_no
            )
            .fetch_one(&mut *tx)
            .await?;

            items.push(DeliveryNoteItem {
                id: item_rec.id,
                delivery_note_id: item_rec.delivery_note_id,
                item_id: item_rec.item_id,
                qty: item_rec.qty,
                rate: item_rec.rate,
                amount: item_rec.amount,
                batch_no: item_rec.batch_no,
                serial_no: item_rec.serial_no,
            });
        }

        tx.commit().await?;

        Ok(DeliveryNote {
            id: rec.id,
            company_id: rec.company_id,
            delivery_note_number: rec.delivery_note_number,
            customer_id: rec.customer_id,
            transaction_date: rec.transaction_date,
            posting_time: rec.posting_time,
            warehouse_id: rec.warehouse_id,
            status: rec.status,
            grand_total: rec.grand_total,
            created_at: rec.created_at,
            items,
        })
    }

    pub async fn list_delivery_notes(&self, company_id: Uuid) -> Result<Vec<DeliveryNote>, sqlx::Error> {
        let notes = sqlx::query!(
            r#"
            SELECT id, company_id, delivery_note_number, customer_id, transaction_date, posting_time, warehouse_id, status, grand_total, created_at
            FROM delivery_notes
            WHERE company_id = $1
            ORDER BY created_at DESC
            "#,
            company_id
        )
        .fetch_all(&self.pool)
        .await?;

        let mut result = Vec::new();
        for note in notes {
            let items = sqlx::query!(
                r#"
                SELECT id, delivery_note_id, item_id, qty, rate, amount, batch_no, serial_no
                FROM delivery_note_items
                WHERE delivery_note_id = $1
                "#,
                note.id
            )
            .fetch_all(&self.pool)
            .await?;

            result.push(DeliveryNote {
                id: note.id,
                company_id: note.company_id,
                delivery_note_number: note.delivery_note_number,
                customer_id: note.customer_id,
                transaction_date: note.transaction_date,
                posting_time: note.posting_time,
                warehouse_id: note.warehouse_id,
                status: note.status,
                grand_total: note.grand_total,
                created_at: note.created_at,
                items: items.into_iter().map(|i| DeliveryNoteItem {
                    id: i.id,
                    delivery_note_id: i.delivery_note_id,
                    item_id: i.item_id,
                    qty: i.qty,
                    rate: i.rate,
                    amount: i.amount,
                    batch_no: i.batch_no,
                    serial_no: i.serial_no,
                }).collect(),
            });
        }

        Ok(result)
    }

    pub async fn delete_delivery_note(&self, id: Uuid) -> Result<u64, sqlx::Error> {
        let result = sqlx::query!("DELETE FROM delivery_notes WHERE id = $1 AND status = 'Draft'", id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected())
    }

    pub async fn submit_delivery_note(&self, id: Uuid) -> Result<DeliveryNote, String> {
        let mut tx = self.pool.begin().await.map_err(|e| e.to_string())?;

        // 1. Update status to Submitted
        let result = sqlx::query!(
            r#"
            UPDATE delivery_notes SET status = 'Submitted' 
            WHERE id = $1 AND status = 'Draft'
            RETURNING id
            "#,
            id
        )
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

        if result.is_none() {
            return Err("Delivery Note not found or already submitted".to_string());
        }

        // 2. Fetch all items in this delivery note
        let items = sqlx::query!(
            r#"
            SELECT item_id, qty, rate 
            FROM delivery_note_items 
            WHERE delivery_note_id = $1
            "#,
            id
        )
        .fetch_all(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

        // 3. For each item, reduce stock and record movement
        for item in items {
            // Deduct quantity from inventory_items
            let update_res = sqlx::query!(
                r#"
                UPDATE inventory_items
                SET current_quantity = current_quantity - $1
                WHERE id = $2 AND current_quantity >= $1
                RETURNING id
                "#,
                item.qty,
                item.item_id
            )
            .fetch_optional(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;

            if update_res.is_none() {
                return Err(format!("Insufficient stock for item ID {}", item.item_id));
            }

            // Create inventory_movement (OUT_USAGE)
            let total_val = item.qty * item.rate;
            sqlx::query!(
                r#"
                INSERT INTO inventory_movements (item_id, movement_type, quantity, unit_price, total_value, reference_id)
                VALUES ($1, 'OUT_USAGE', $2, $3, $4, $5)
                "#,
                item.item_id,
                item.qty,
                item.rate,
                total_val,
                id
            )
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
        }

        tx.commit().await.map_err(|e| e.to_string())?;

        // 4. Return the updated delivery note
        // We can just fetch it again to satisfy the return type, but here we'll just query it
        let note = sqlx::query!(
            r#"
            SELECT id, company_id, delivery_note_number, customer_id, transaction_date, posting_time, warehouse_id, status, grand_total, created_at
            FROM delivery_notes
            WHERE id = $1
            "#,
            id
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        let note_items = sqlx::query!(
            r#"
            SELECT id, delivery_note_id, item_id, qty, rate, amount, batch_no, serial_no
            FROM delivery_note_items
            WHERE delivery_note_id = $1
            "#,
            id
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        Ok(DeliveryNote {
            id: note.id,
            company_id: note.company_id,
            delivery_note_number: note.delivery_note_number,
            customer_id: note.customer_id,
            transaction_date: note.transaction_date,
            posting_time: note.posting_time,
            warehouse_id: note.warehouse_id,
            status: note.status,
            grand_total: note.grand_total,
            created_at: note.created_at,
            items: note_items.into_iter().map(|i| DeliveryNoteItem {
                id: i.id,
                delivery_note_id: i.delivery_note_id,
                item_id: i.item_id,
                qty: i.qty,
                rate: i.rate,
                amount: i.amount,
                batch_no: i.batch_no,
                serial_no: i.serial_no,
            }).collect(),
        })
    }

    // 2. Pick Lists
    pub async fn create_pick_list(&self, pl: &PickList) -> Result<PickList, sqlx::Error> {
        let mut tx = self.pool.begin().await?;

        let rec = sqlx::query!(
            r#"
            INSERT INTO pick_lists (id, company_id, pick_list_number, purpose, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, company_id, pick_list_number, purpose, status, created_at
            "#,
            pl.id,
            pl.company_id,
            pl.pick_list_number,
            pl.purpose,
            pl.status,
            pl.created_at
        )
        .fetch_one(&mut *tx)
        .await?;

        let mut items = Vec::new();
        for item in &pl.items {
            let item_rec = sqlx::query!(
                r#"
                INSERT INTO pick_list_items (id, pick_list_id, item_id, warehouse_id, qty, picked_qty)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, pick_list_id, item_id, warehouse_id, qty, picked_qty
                "#,
                item.id,
                item.pick_list_id,
                item.item_id,
                item.warehouse_id,
                item.qty,
                item.picked_qty
            )
            .fetch_one(&mut *tx)
            .await?;

            items.push(PickListItem {
                id: item_rec.id,
                pick_list_id: item_rec.pick_list_id,
                item_id: item_rec.item_id,
                warehouse_id: item_rec.warehouse_id,
                qty: item_rec.qty,
                picked_qty: item_rec.picked_qty,
            });
        }

        tx.commit().await?;

        Ok(PickList {
            id: rec.id,
            company_id: rec.company_id,
            pick_list_number: rec.pick_list_number,
            purpose: rec.purpose,
            status: rec.status,
            created_at: rec.created_at,
            items,
        })
    }

    pub async fn list_pick_lists(&self, company_id: Uuid) -> Result<Vec<PickList>, sqlx::Error> {
        let pls = sqlx::query!(
            r#"
            SELECT id, company_id, pick_list_number, purpose, status, created_at
            FROM pick_lists
            WHERE company_id = $1
            ORDER BY created_at DESC
            "#,
            company_id
        )
        .fetch_all(&self.pool)
        .await?;

        let mut result = Vec::new();
        for pl in pls {
            let items = sqlx::query!(
                r#"
                SELECT id, pick_list_id, item_id, warehouse_id, qty, picked_qty
                FROM pick_list_items
                WHERE pick_list_id = $1
                "#,
                pl.id
            )
            .fetch_all(&self.pool)
            .await?;

            result.push(PickList {
                id: pl.id,
                company_id: pl.company_id,
                pick_list_number: pl.pick_list_number,
                purpose: pl.purpose,
                status: pl.status,
                created_at: pl.created_at,
                items: items.into_iter().map(|i| PickListItem {
                    id: i.id,
                    pick_list_id: i.pick_list_id,
                    item_id: i.item_id,
                    warehouse_id: i.warehouse_id,
                    qty: i.qty,
                    picked_qty: i.picked_qty,
                }).collect(),
            });
        }

        Ok(result)
    }

    pub async fn delete_pick_list(&self, id: Uuid) -> Result<u64, sqlx::Error> {
        let result = sqlx::query!("DELETE FROM pick_lists WHERE id = $1 AND status = 'Draft'", id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected())
    }

    // 3. Delivery Trips
    pub async fn create_delivery_trip(&self, trip: &DeliveryTrip) -> Result<DeliveryTrip, sqlx::Error> {
        let mut tx = self.pool.begin().await?;

        let rec = sqlx::query!(
            r#"
            INSERT INTO delivery_trips (id, company_id, trip_number, driver_id, vehicle_id, status, departure_time, arrival_time, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, company_id, trip_number, driver_id, vehicle_id, status, departure_time, arrival_time, created_at, updated_at
            "#,
            trip.id,
            trip.company_id,
            trip.trip_number,
            trip.driver_id,
            trip.vehicle_id,
            trip.status,
            trip.departure_time,
            trip.arrival_time,
            trip.created_at,
            trip.updated_at
        )
        .fetch_one(&mut *tx)
        .await?;

        let mut stops = Vec::new();
        for stop in &trip.stops {
            let stop_rec = sqlx::query!(
                r#"
                INSERT INTO delivery_trip_stops (id, trip_id, delivery_note_id, stop_order, customer_address, estimated_arrival, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id, trip_id, delivery_note_id, stop_order, customer_address, estimated_arrival, status
                "#,
                stop.id,
                stop.trip_id,
                stop.delivery_note_id,
                stop.stop_order,
                stop.customer_address,
                stop.estimated_arrival,
                stop.status
            )
            .fetch_one(&mut *tx)
            .await?;

            stops.push(DeliveryTripStop {
                id: stop_rec.id,
                trip_id: stop_rec.trip_id,
                delivery_note_id: stop_rec.delivery_note_id,
                stop_order: stop_rec.stop_order,
                customer_address: stop_rec.customer_address,
                estimated_arrival: stop_rec.estimated_arrival,
                status: stop_rec.status,
            });
        }

        tx.commit().await?;

        Ok(DeliveryTrip {
            id: rec.id,
            company_id: rec.company_id,
            trip_number: rec.trip_number,
            driver_id: rec.driver_id,
            vehicle_id: rec.vehicle_id,
            status: rec.status,
            departure_time: rec.departure_time,
            arrival_time: rec.arrival_time,
            created_at: rec.created_at,
            updated_at: rec.updated_at,
            stops,
        })
    }

    pub async fn list_delivery_trips(&self, company_id: Uuid) -> Result<Vec<DeliveryTrip>, sqlx::Error> {
        let trips = sqlx::query!(
            r#"
            SELECT id, company_id, trip_number, driver_id, vehicle_id, status, departure_time, arrival_time, created_at, updated_at
            FROM delivery_trips
            WHERE company_id = $1
            ORDER BY created_at DESC
            "#,
            company_id
        )
        .fetch_all(&self.pool)
        .await?;

        let mut result = Vec::new();
        for trip in trips {
            let stops = sqlx::query!(
                r#"
                SELECT id, trip_id, delivery_note_id, stop_order, customer_address, estimated_arrival, status
                FROM delivery_trip_stops
                WHERE trip_id = $1
                ORDER BY stop_order ASC
                "#,
                trip.id
            )
            .fetch_all(&self.pool)
            .await?;

            result.push(DeliveryTrip {
                id: trip.id,
                company_id: trip.company_id,
                trip_number: trip.trip_number,
                driver_id: trip.driver_id,
                vehicle_id: trip.vehicle_id,
                status: trip.status,
                departure_time: trip.departure_time,
                arrival_time: trip.arrival_time,
                created_at: trip.created_at,
                updated_at: trip.updated_at,
                stops: stops.into_iter().map(|s| DeliveryTripStop {
                    id: s.id,
                    trip_id: s.trip_id,
                    delivery_note_id: s.delivery_note_id,
                    stop_order: s.stop_order,
                    customer_address: s.customer_address,
                    estimated_arrival: s.estimated_arrival,
                    status: s.status,
                }).collect(),
            });
        }

        Ok(result)
    }

    pub async fn delete_delivery_trip(&self, id: Uuid) -> Result<u64, sqlx::Error> {
        let result = sqlx::query!("DELETE FROM delivery_trips WHERE id = $1 AND status = 'Draft'", id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected())
    }

    // 4. Installation Notes
    pub async fn create_installation_note(&self, note: &InstallationNote) -> Result<InstallationNote, sqlx::Error> {
        let rec = sqlx::query!(
            r#"
            INSERT INTO installation_notes (id, company_id, note_number, customer_id, inst_date, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, company_id, note_number, customer_id, inst_date, status, created_at
            "#,
            note.id,
            note.company_id,
            note.note_number,
            note.customer_id,
            note.inst_date,
            note.status,
            note.created_at
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(InstallationNote {
            id: rec.id,
            company_id: rec.company_id,
            note_number: rec.note_number,
            customer_id: rec.customer_id,
            inst_date: rec.inst_date,
            status: rec.status,
            created_at: rec.created_at,
        })
    }

    pub async fn list_installation_notes(&self, company_id: Uuid) -> Result<Vec<InstallationNote>, sqlx::Error> {
        let rows = sqlx::query!(
            r#"
            SELECT id, company_id, note_number, customer_id, inst_date, status, created_at
            FROM installation_notes
            WHERE company_id = $1
            ORDER BY created_at DESC
            "#,
            company_id
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(|row| InstallationNote {
            id: row.id,
            company_id: row.company_id,
            note_number: row.note_number,
            customer_id: row.customer_id,
            inst_date: row.inst_date,
            status: row.status,
            created_at: row.created_at,
        }).collect())
    }

    pub async fn delete_installation_note(&self, id: Uuid) -> Result<u64, sqlx::Error> {
        let result = sqlx::query!("DELETE FROM installation_notes WHERE id = $1", id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected())
    }

    // 5. Stock Reconciliations
    pub async fn create_stock_reconciliation(&self, rec: &StockReconciliation) -> Result<StockReconciliation, sqlx::Error> {
        let mut tx = self.pool.begin().await?;

        let sr_rec = sqlx::query!(
            r#"
            INSERT INTO stock_reconciliations (id, company_id, reconciliation_number, posting_date, posting_time, warehouse_id, purpose, status, remarks, created_at, created_by, updated_at, updated_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING id, company_id, reconciliation_number, posting_date, posting_time, warehouse_id, purpose, status, remarks, created_at, created_by, updated_at, updated_by
            "#,
            rec.id,
            rec.company_id,
            rec.reconciliation_number,
            rec.posting_date,
            rec.posting_time,
            rec.warehouse_id,
            rec.purpose,
            rec.status,
            rec.remarks,
            rec.created_at,
            rec.created_by,
            rec.updated_at,
            rec.updated_by
        )
        .fetch_one(&mut *tx)
        .await?;

        let mut items = Vec::new();
        for item in &rec.items {
            let item_rec = sqlx::query!(
                r#"
                INSERT INTO stock_reconciliation_items (id, reconciliation_id, item_id, warehouse_id, qty, valuation_rate, amount, current_qty, current_valuation_rate, difference_qty, batch_no, serial_no, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING id, reconciliation_id, item_id, warehouse_id, qty, valuation_rate, amount, current_qty, current_valuation_rate, difference_qty, batch_no, serial_no, created_at
                "#,
                item.id,
                item.reconciliation_id,
                item.item_id,
                item.warehouse_id,
                item.qty,
                item.valuation_rate,
                item.amount,
                item.current_qty,
                item.current_valuation_rate,
                item.difference_qty,
                item.batch_no,
                item.serial_no,
                item.created_at
            )
            .fetch_one(&mut *tx)
            .await?;

            items.push(StockReconciliationItem {
                id: item_rec.id,
                reconciliation_id: item_rec.reconciliation_id,
                item_id: item_rec.item_id,
                warehouse_id: item_rec.warehouse_id,
                qty: item_rec.qty,
                valuation_rate: item_rec.valuation_rate,
                amount: item_rec.amount,
                current_qty: item_rec.current_qty,
                current_valuation_rate: item_rec.current_valuation_rate,
                difference_qty: item_rec.difference_qty,
                batch_no: item_rec.batch_no,
                serial_no: item_rec.serial_no,
                created_at: item_rec.created_at,
            });
        }

        tx.commit().await?;

        Ok(StockReconciliation {
            id: sr_rec.id,
            company_id: sr_rec.company_id,
            reconciliation_number: sr_rec.reconciliation_number,
            posting_date: sr_rec.posting_date,
            posting_time: sr_rec.posting_time,
            warehouse_id: sr_rec.warehouse_id,
            purpose: sr_rec.purpose,
            status: sr_rec.status,
            remarks: sr_rec.remarks,
            created_at: sr_rec.created_at,
            created_by: sr_rec.created_by,
            updated_at: sr_rec.updated_at,
            updated_by: sr_rec.updated_by,
            items,
        })
    }

    pub async fn list_stock_reconciliations(&self, company_id: Uuid) -> Result<Vec<StockReconciliation>, sqlx::Error> {
        let srs = sqlx::query!(
            r#"
            SELECT id, company_id, reconciliation_number, posting_date, posting_time, warehouse_id, purpose, status, remarks, created_at, created_by, updated_at, updated_by
            FROM stock_reconciliations
            WHERE company_id = $1
            ORDER BY created_at DESC
            "#,
            company_id
        )
        .fetch_all(&self.pool)
        .await?;

        let mut result = Vec::new();
        for sr in srs {
            let items = sqlx::query!(
                r#"
                SELECT id, reconciliation_id, item_id, warehouse_id, qty, valuation_rate, amount, current_qty, current_valuation_rate, difference_qty, batch_no, serial_no, created_at
                FROM stock_reconciliation_items
                WHERE reconciliation_id = $1
                "#,
                sr.id
            )
            .fetch_all(&self.pool)
            .await?;

            result.push(StockReconciliation {
                id: sr.id,
                company_id: sr.company_id,
                reconciliation_number: sr.reconciliation_number,
                posting_date: sr.posting_date,
                posting_time: sr.posting_time,
                warehouse_id: sr.warehouse_id,
                purpose: sr.purpose,
                status: sr.status,
                remarks: sr.remarks,
                created_at: sr.created_at,
                created_by: sr.created_by,
                updated_at: sr.updated_at,
                updated_by: sr.updated_by,
                items: items.into_iter().map(|i| StockReconciliationItem {
                    id: i.id,
                    reconciliation_id: i.reconciliation_id,
                    item_id: i.item_id,
                    warehouse_id: i.warehouse_id,
                    qty: i.qty,
                    valuation_rate: i.valuation_rate,
                    amount: i.amount,
                    current_qty: i.current_qty,
                    current_valuation_rate: i.current_valuation_rate,
                    difference_qty: i.difference_qty,
                    batch_no: i.batch_no,
                    serial_no: i.serial_no,
                    created_at: i.created_at,
                }).collect(),
            });
        }

        Ok(result)
    }

    pub async fn delete_stock_reconciliation(&self, id: Uuid) -> Result<u64, sqlx::Error> {
        let result = sqlx::query!("DELETE FROM stock_reconciliations WHERE id = $1 AND status = 'Draft'", id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected())
    }
}
