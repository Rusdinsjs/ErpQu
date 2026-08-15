use crate::domain::operational_erp::{DeliveryTrip, DeliveryTripStop};
use crate::repositories::delivery_trip_repository::DeliveryTripRepository;
use chrono::{DateTime, Utc};
use management_system_core::domain::errors::DomainError;
use std::sync::Arc;
use uuid::Uuid;

pub type DomainResult<T> = Result<T, DomainError>;

#[derive(Debug, Clone, serde::Deserialize)]
pub struct CreateDeliveryTripRequest {
    pub company_id: Uuid,
    pub driver_id: Option<Uuid>,
    pub vehicle_id: Option<Uuid>,
    pub stops: Vec<CreateDeliveryTripStopRequest>,
}

#[derive(Debug, Clone, serde::Deserialize)]
pub struct CreateDeliveryTripStopRequest {
    pub delivery_note_id: Uuid,
    pub stop_order: i32,
}

#[derive(Clone)]
pub struct DeliveryTripService {
    repository: Arc<DeliveryTripRepository>,
}

impl DeliveryTripService {
    pub fn new(repository: Arc<DeliveryTripRepository>) -> Self {
        Self { repository }
    }

    pub async fn create_delivery_trip(
        &self,
        req: CreateDeliveryTripRequest,
    ) -> DomainResult<(DeliveryTrip, Vec<DeliveryTripStop>)> {
        let mut tx = self
            .repository
            .pool()
            .begin()
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        let trip_id = Uuid::new_v4();
        let trip_number = format!(
            "TRIP-{}-{}",
            Utc::now().format("%Y%m%d"),
            Uuid::new_v4().to_string()[..8].to_uppercase()
        );

        let trip = DeliveryTrip {
            id: trip_id,
            company_id: req.company_id,
            trip_number,
            driver_id: req.driver_id,
            vehicle_id: req.vehicle_id,
            status: "DRAFT".to_string(),
            departure_time: None,
            arrival_time: None,
            created_at: Utc::now(),
        };

        let saved_trip = self
            .repository
            .create_delivery_trip(&mut tx, &trip)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        let mut saved_stops = Vec::new();
        for stop_req in req.stops {
            let stop = DeliveryTripStop {
                id: Uuid::new_v4(),
                trip_id,
                delivery_note_id: stop_req.delivery_note_id,
                stop_order: stop_req.stop_order,
                status: "PENDING".to_string(),
            };
            let saved_stop = self
                .repository
                .add_delivery_trip_stop(&mut tx, &stop)
                .await
                .map_err(|e| DomainError::Database(e.to_string()))?;
            saved_stops.push(saved_stop);
        }

        tx.commit()
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok((saved_trip, saved_stops))
    }

    pub async fn get_delivery_trip(
        &self,
        id: Uuid,
    ) -> DomainResult<Option<(DeliveryTrip, Vec<DeliveryTripStop>)>> {
        let trip = self
            .repository
            .get_delivery_trip(id)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        if let Some(trip) = trip {
            let stops = self
                .repository
                .get_delivery_trip_stops(trip.id)
                .await
                .map_err(|e| DomainError::Database(e.to_string()))?;
            Ok(Some((trip, stops)))
        } else {
            Ok(None)
        }
    }

    pub async fn list_delivery_trips(&self, company_id: Uuid) -> DomainResult<Vec<DeliveryTrip>> {
        self.repository
            .list_delivery_trips(company_id)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))
    }

    pub async fn update_delivery_trip_status(
        &self,
        id: Uuid,
        status: String,
        departure_time: Option<DateTime<Utc>>,
        arrival_time: Option<DateTime<Utc>>,
    ) -> DomainResult<DeliveryTrip> {
        self.repository
            .update_delivery_trip_status(id, &status, departure_time, arrival_time)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))
    }

    pub async fn update_delivery_trip_stop_status(
        &self,
        stop_id: Uuid,
        status: String,
    ) -> DomainResult<DeliveryTripStop> {
        self.repository
            .update_delivery_trip_stop_status(stop_id, &status)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))
    }
}
