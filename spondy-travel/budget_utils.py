from decimal import Decimal, ROUND_HALF_UP

# Constantes de formato y tasas
MONEY_QUANT = Decimal("0.01")
IVA_RATE = Decimal("0.15")  # Tasa de IVA del 15%

def to_money(value) -> Decimal:
    """Normalize numeric input to a two-decimal Decimal."""
    return Decimal(str(value or "0")).quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)

def calculate_budget_total(entries, apply_iva=True) -> dict:
    """
    Calcula el subtotal, el monto del IVA y el total final.
    Retorna un diccionario con el desglose financiero.
    """
    subtotal = Decimal("0.00")

    for entry in entries:
        price = to_money(entry["price"])
        quantity = Decimal(str(entry.get("quantity", 1)))
        subtotal += price * quantity

    # Aseguramos que el subtotal tenga dos decimales
    subtotal = subtotal.quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)
    
    # Calculamos el IVA si aplica
    iva_amount = Decimal("0.00")
    if apply_iva:
        iva_amount = (subtotal * IVA_RATE).quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)
        
    # Suma final
    total = subtotal + iva_amount

    return {
        "subtotal": subtotal,
        "iva_rate": IVA_RATE if apply_iva else Decimal("0.00"),
        "iva_amount": iva_amount,
        "total": total
    }