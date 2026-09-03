//! ABC Inventory Analysis Engine Tests (Pareto 80/20 Rule)

use chrono::Utc;
use management_system_inventory::domain::abc_analysis::{AbcAnalysisEngine, AbcClass};
use management_system_inventory::domain::entities::inventory::InventoryItem;
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use uuid::Uuid;

fn make_item(name: &str, qty: Decimal, cost: Decimal) -> InventoryItem {
    InventoryItem {
        id: Uuid::new_v4(),
        category_id: Uuid::new_v4(),
        unit_id: 1,
        sku: format!("SKU-{}", name),
        name: name.to_string(),
        description: None,
        min_stock: Decimal::ZERO,
        max_stock: Decimal::ZERO,
        current_quantity: qty,
        average_cost: cost,
        last_purchase_price: cost,
        is_active: true,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    }
}

#[test]
fn test_abc_analysis_empty_inventory() {
    let report = AbcAnalysisEngine::calculate(&[]);
    assert_eq!(report.total_items, 0);
    assert_eq!(report.total_inventory_valuation, Decimal::ZERO);
    assert_eq!(report.class_a_items_count, 0);
}

#[test]
fn test_abc_analysis_pareto_distribution() {
    // Total inventory setup:
    // Item 1: High value (Qty 10 @ 7,000,000 = 70,000,000) -> 70% of total
    // Item 2: Medium value (Qty 20 @ 1,000,000 = 20,000,000) -> 20% of total
    // Item 3: Low value (Qty 100 @ 100,000 = 10,000,000) -> 10% of total
    // Total Valuation = 100,000,000
    let items = vec![
        make_item("Heavy Engine", dec!(10.0), dec!(7000000.0)),
        make_item("Alternator", dec!(20.0), dec!(1000000.0)),
        make_item("Bolts & Nuts", dec!(100.0), dec!(100000.0)),
    ];

    let report = AbcAnalysisEngine::calculate(&items);

    assert_eq!(report.total_items, 3);
    assert_eq!(report.total_inventory_valuation, dec!(100000000.0));

    // First item is Class A
    assert_eq!(report.items[0].name, "Heavy Engine");
    assert_eq!(report.items[0].class, AbcClass::A);
    assert_eq!(report.items[0].cumulative_percentage, dec!(70.0));

    // Second item is Class B
    assert_eq!(report.items[1].name, "Alternator");
    assert_eq!(report.items[1].class, AbcClass::B);
    assert_eq!(report.items[1].cumulative_percentage, dec!(90.0));

    // Third item is Class C
    assert_eq!(report.items[2].name, "Bolts & Nuts");
    assert_eq!(report.items[2].class, AbcClass::C);
    assert_eq!(report.items[2].cumulative_percentage, dec!(100.0));

    assert_eq!(report.class_a_items_count, 1);
    assert_eq!(report.class_b_items_count, 1);
    assert_eq!(report.class_c_items_count, 1);
}

#[test]
fn test_abc_analysis_single_item() {
    let items = vec![make_item("Solo Item", dec!(5.0), dec!(1000.0))];
    let report = AbcAnalysisEngine::calculate(&items);

    assert_eq!(report.total_items, 1);
    assert_eq!(report.class_a_items_count, 1);
    assert_eq!(report.items[0].class, AbcClass::A);
    assert_eq!(report.class_a_percentage_of_value, dec!(100.0));
}
