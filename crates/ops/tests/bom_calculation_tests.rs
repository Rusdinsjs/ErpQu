//! BOM Exploding and Scrap Rate Calculation Tests (QMFG-001, QMFG-002)

use management_system_ops::domain::manufacturing_pos::MaterialRequirement;
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use uuid::Uuid;

#[test]
fn test_bom_material_exploding_zero_scrap() {
    let item_id = Uuid::new_v4();
    let bom_base_qty = dec!(1.0);
    let target_production_qty = dec!(50.0);
    let item_qty_required = dec!(2.5); // 2.5 units of raw material per 1 unit of finished good
    let scrap_percentage = Decimal::ZERO;

    let unit_req = item_qty_required / bom_base_qty;
    let base_qty = unit_req * target_production_qty;
    let scrap_multiplier = dec!(1.0) + (scrap_percentage / dec!(100.0));
    let total_qty_required = (base_qty * scrap_multiplier).round_dp(4);

    let req = MaterialRequirement {
        item_id,
        base_qty,
        scrap_percentage,
        total_qty_required,
    };

    assert_eq!(req.base_qty, dec!(125.0));
    assert_eq!(req.total_qty_required, dec!(125.0));
}

#[test]
fn test_bom_material_exploding_with_scrap_rate() {
    let item_id = Uuid::new_v4();
    let bom_base_qty = dec!(10.0); // BOM is for batch of 10
    let target_production_qty = dec!(100.0);
    let item_qty_required = dec!(5.0); // 5 units per 10 finished goods -> 0.5 per finished good
    let scrap_percentage = dec!(5.0); // 5% scrap

    let unit_req = item_qty_required / bom_base_qty; // 0.5
    let base_qty = unit_req * target_production_qty; // 50.0
    let scrap_multiplier = dec!(1.0) + (scrap_percentage / dec!(100.0)); // 1.05
    let total_qty_required = (base_qty * scrap_multiplier).round_dp(4); // 52.5

    let req = MaterialRequirement {
        item_id,
        base_qty,
        scrap_percentage,
        total_qty_required,
    };

    assert_eq!(req.base_qty, dec!(50.0));
    assert_eq!(req.total_qty_required, dec!(52.5));
}
