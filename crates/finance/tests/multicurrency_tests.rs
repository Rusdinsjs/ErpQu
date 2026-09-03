//! Multi-Currency Integration & Realized Forex Math Tests (QACC-008)

use management_system_finance::MultiCurrencyService;
use rust_decimal_macros::dec;

#[test]
fn test_forex_realized_gain() {
    // Invoice booked: USD 10,000 @ 15,500 IDR = 155,000,000 IDR
    // Payment settled: USD 10,000 @ 16,000 IDR = 160,000,000 IDR
    // Realized Gain = +5,000,000 IDR
    let booking_amount = dec!(10000.0);
    let booking_rate = dec!(15500.0);
    let settlement_rate = dec!(16000.0);

    let gain_loss = MultiCurrencyService::calculate_forex_gain_loss(
        booking_amount,
        booking_rate,
        settlement_rate,
    );

    assert_eq!(gain_loss, dec!(5000000.0));
}

#[test]
fn test_forex_realized_loss() {
    // Invoice booked: USD 5,000 @ 16,200 IDR = 81,000,000 IDR
    // Payment settled: USD 5,000 @ 15,800 IDR = 79,000,000 IDR
    // Realized Loss = -2,000,000 IDR
    let booking_amount = dec!(5000.0);
    let booking_rate = dec!(16200.0);
    let settlement_rate = dec!(15800.0);

    let gain_loss = MultiCurrencyService::calculate_forex_gain_loss(
        booking_amount,
        booking_rate,
        settlement_rate,
    );

    assert_eq!(gain_loss, dec!(-2000000.0));
}

#[test]
fn test_forex_zero_variance() {
    let booking_amount = dec!(2500.0);
    let rate = dec!(15750.0);

    let gain_loss = MultiCurrencyService::calculate_forex_gain_loss(booking_amount, rate, rate);

    assert_eq!(gain_loss, dec!(0.0));
}
