use axum::{
    routing::{get, post},
    Router,
};
use crate::api::handlers::BuyingScorecardDataHandler;

pub fn buying_scorecard_data_routes(handler: BuyingScorecardDataHandler) -> Router {
    Router::new()
        // Supplier Scorecard
        .route("/supplier-scorecards", post(BuyingScorecardDataHandler::create_supplier_scorecard).get(BuyingScorecardDataHandler::list_supplier_scorecards))
        // Supplier Scorecard Variable
        .route("/supplier-scorecard-variables", post(BuyingScorecardDataHandler::create_supplier_scorecard_variable).get(BuyingScorecardDataHandler::list_supplier_scorecard_variables))
        // Supplier Scorecard Criteria
        .route("/supplier-scorecard-criteria", post(BuyingScorecardDataHandler::create_supplier_scorecard_criteria).get(BuyingScorecardDataHandler::list_supplier_scorecard_criteria))
        // Supplier Scorecard Standing
        .route("/supplier-scorecard-standings", post(BuyingScorecardDataHandler::create_supplier_scorecard_standing).get(BuyingScorecardDataHandler::list_supplier_scorecard_standings))
        .with_state(handler)
}
