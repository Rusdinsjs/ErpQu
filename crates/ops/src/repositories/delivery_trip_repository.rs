use crate::domain::operational_erp::{DeliveryTrip, DeliveryTripStop};
use sqlx::PgPool;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Clone)]
pub struct DeliveryTripRepository {
    pool: PgPool,
}

impl DeliveryTripRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub fn pool(&self) -> &PgPool {
        &self.pool
    }

    pub async fn create_delivery_trip(
        &self,
        tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
        trip: &DeliveryTrip,
    ) -> Result<DeliveryTrip, sqlx::Error> {
        sqlx::query_as::<_, DeliveryTrip>(
            "INSERT INTO public.delivery_trips (id, company_id, trip_number, driver_id, vehicle_id, status, departure_time, arrival_time, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *"
        )
        .bind(trip.id)
        .bind(trip.company_id)
        .bind(&trip.trip_number)
        .bind(trip.driver_id)
        .bind(trip.vehicle_id)
        .bind(&trip.status)
        .bind(trip.departure_time)
        .bind(trip.arrival_time)
        .bind(trip.created_at)
        .fetch_one(&mut **tx)
        .await
    }

    pub async fn add_delivery_trip_stop(
        &self,
        tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
        stop: &DeliveryTripStop,
    ) -> Result<DeliveryTripStop, sqlx::Error> {
        sqlx::query_as::<_, DeliveryTripStop>(
            "INSERT INTO public.delivery_trip_stops (id, trip_id, delivery_note_id, stop_order, status)
             VALUES ($1, $2, $3, $4, $5) RETURNING *"
        )
        .bind(stop.id)
        .bind(stop.trip_id)
        .bind(stop.delivery_note_id)
        .bind(stop.stop_order)
        .bind(&stop.status)
        .fetch_one(&mut **tx)
        .await
    }

    pub async fn get_delivery_trip(&self, id: Uuid) -> Result<Option<DeliveryTrip>, sqlx::Error> {
        sqlx::query_as::<_, DeliveryTrip>(
            "SELECT * FROM public.delivery_trips WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
    }

    pub async fn get_delivery_trip_stops(&self, trip_id: Uuid) -> Result<Vec<DeliveryTripStop>, sqlx::Error> {
        sqlx::query_as::<_, DeliveryTripStop>(
            "SELECT * FROM public.delivery_trip_stops WHERE trip_id = $1 ORDER BY stop_order"
        )
        .bind(trip_id)
        .fetch_all(&self.pool)
        .await
    }

    pub async fn list_delivery_trips(&self, company_id: Uuid) -> Result<Vec<DeliveryTrip>, sqlx::Error> {
        sqlx::query_as::<_, DeliveryTrip>(
            "SELECT * FROM public.delivery_trips WHERE company_id = $1 ORDER BY created_at DESC"
        )
        .bind(company_id)
        .fetch_all(&self.pool)
        .await
    }

    pub async fn update_delivery_trip_status(
        &self,
        id: Uuid,
        status: &str,
        departure_time: Option<DateTime<Utc>>,
        arrival_time: Option<DateTime<Utc>>,
    ) -> Result<DeliveryTrip, sqlx::Error> {
        sqlx::query_as::<_, DeliveryTrip>(
            "UPDATE public.delivery_trips 
             SET status = $2,
                 departure_time = COALESCE($3, departure_time),
                 arrival_time = COALESCE($4, arrival_time)
             WHERE id = $1 RETURNING *"
        )
        .bind(id)
        .bind(status)
        .bind(departure_time)
        .bind(arrival_time)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn update_delivery_trip_stop_status(
        &self,
        stop_id: Uuid,
        status: &str,
    ) -> Result<DeliveryTripStop, sqlx::Error> {
        sqlx::query_as::<_, DeliveryTripStop>(
            "UPDATE public.delivery_trip_stops SET status = $2 WHERE id = $1 RETURNING *"
        )
        .bind(stop_id)
        .bind(status)
        .fetch_one(&self.pool)
        .await
    }
}
