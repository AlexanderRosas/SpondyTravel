from decimal import Decimal, ROUND_HALF_UP


MONEY_QUANT = Decimal("0.01")


def to_money(value) -> Decimal:
    """Normalize numeric input to a two-decimal Decimal."""
    return Decimal(str(value or "0")).quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)


def calculate_budget_total(entries) -> Decimal:
    total = Decimal("0.00")

    for entry in entries:
        price = to_money(entry["price"])
        quantity = Decimal(str(entry.get("quantity", 1)))
        total += price * quantity

    return total.quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)
