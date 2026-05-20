from decimal import Decimal

from budget_utils import calculate_budget_total


def test_calculate_budget_total_accumulates_service_prices_with_quantities():
    entries = [
        {"price": Decimal("15.25"), "quantity": 2},
        {"price": Decimal("40.50"), "quantity": 1},
        {"price": Decimal("9.99"), "quantity": 3},
    ]

    assert calculate_budget_total(entries) == Decimal("100.97")


def test_calculate_budget_total_reflects_removed_items():
    entries_before_removal = [
        {"price": Decimal("35.00"), "quantity": 1},
        {"price": Decimal("12.50"), "quantity": 2},
        {"price": Decimal("35.00"), "quantity": 1},
    ]
    entries_after_removal = [
        {"price": Decimal("35.00"), "quantity": 1},
        {"price": Decimal("12.50"), "quantity": 2},
    ]

    assert calculate_budget_total(entries_before_removal) == Decimal("95.00")
    assert calculate_budget_total(entries_after_removal) == Decimal("60.00")


def test_calculate_budget_total_returns_zero_for_empty_budget():
    assert calculate_budget_total([]) == Decimal("0.00")


def test_calculate_budget_total_avoids_float_rounding_errors():
    entries = [
        {"price": 0.1, "quantity": 1},
        {"price": 0.2, "quantity": 1},
    ]

    assert calculate_budget_total(entries) == Decimal("0.30")
