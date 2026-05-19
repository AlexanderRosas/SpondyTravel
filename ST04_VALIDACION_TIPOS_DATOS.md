# ST-04: Validación de Tipos de Datos en PostgreSQL

## Objetivo
Asegurar que los precios se manejen como `DECIMAL(10,2)` en PostgreSQL, evitando errores de redondeo en cálculos de presupuesto.

## Cambios Implementados

### 1. Base de Datos (init.sql)
**Estado anterior**: Tabla `services` ya tenía `price DECIMAL(10, 2)` ✅

```sql
CREATE TABLE IF NOT EXISTS services (
    ...
    price DECIMAL(10, 2) NOT NULL,
    ...
);
```

### 2. Modelo SQLAlchemy (main.py)
**Cambio realizado**: Especificar precisión en `Numeric` column

**Antes**:
```python
price = Column(Numeric)
```

**Después**:
```python
price = Column(Numeric(10, 2), nullable=False)
```

### 3. Validaciones en Pydantic (main.py)

#### 3.1 Validación de Precios en Entrada
Agregado `@field_validator` en `TourServiceCreate` y `TourServiceUpdate`:

```python
@field_validator('price')
@classmethod
def validate_price(cls, v):
    """Validate price: must be positive and have max 2 decimal places"""
    if v <= 0:
        raise ValueError("El precio debe ser mayor a 0")
    # Check if price has more than 2 decimal places
    price_str = f"{v:.10f}".rstrip('0')
    if '.' in price_str:
        decimals = len(price_str.split('.')[1])
        if decimals > 2:
            raise ValueError("El precio no puede tener más de 2 decimales")
    return round(v, 2)
```

**Validaciones**:
- ✅ Precio > 0
- ✅ Máximo 2 decimales
- ✅ Redondeo automático a 2 decimales

#### 3.2 Cálculo de Presupuesto con Decimal
Actualizado `calculate_itinerary_total()` para usar `Decimal` en lugar de `float`:

```python
def calculate_itinerary_total(itinerary: Itinerary, db: Session) -> float:
    """
    Calcula el total presupuestado del itinerario usando Decimal para precisión exacta.
    Evita errores de redondeo inherentes a los cálculos con float.
    """
    total = Decimal('0.00')
    for item in itinerary.items:
        service = db.query(TourService).filter(TourService.id == item.service_id).first()
        if service:
            # Usar Decimal para precisión exacta
            service_price = Decimal(str(service.price))
            total += service_price * Decimal(str(item.quantity))
    # Redondear a 2 decimales y convertir a float para la API
    return float(total.quantize(Decimal('0.01')))
```

**Beneficios**:
- 🎯 Precisión exacta (no errores de redondeo binario)
- 🔢 Cantidad × Precio se calcula con exactitud
- 📊 Total final redondeado correctamente a 2 decimales

## Pruebas de Validación

### Caso 1: Precio válido
```
Input: 85.50
Output: 85.50 ✅
```

### Caso 2: Precio con más de 2 decimales (rechazado)
```
Input: 85.555
Output: Error - "El precio no puede tener más de 2 decimales" ❌
```

### Caso 3: Precio negativo (rechazado)
```
Input: -50.00
Output: Error - "El precio debe ser mayor a 0" ❌
```

### Caso 4: Cálculo de Presupuesto (3 items × $85.50 cada uno)
```
Item 1: 85.50 × 1 = 85.50
Item 2: 35.00 × 1 = 35.00
Item 3: 120.00 × 1 = 120.00
Total: 240.50 (exacto, sin errores de redondeo)
```

## Stack de Tecnologías Utilizadas

| Componente | Tipo de Dato | Precisión | Notas |
|---|---|---|---|
| PostgreSQL | `DECIMAL(10,2)` | Exacta | 8 dígitos enteros, 2 decimales |
| SQLAlchemy | `Numeric(10,2)` | Exacta | Mapea a DECIMAL en DB |
| Pydantic | `float` | Validado | Con validador custom a 2 decimales |
| Python Backend | `Decimal` | Exacta | Para cálculos, conversión a float en respuesta |
| Frontend | `Number` | Mostrado | `toFixed(2)` para presentación |

## Checklist de Validación

- ✅ Tabla `services` tiene `DECIMAL(10,2)` en PostgreSQL
- ✅ Modelo SQLAlchemy usa `Numeric(10,2)`
- ✅ Validador Pydantic rechaza precios con >2 decimales
- ✅ Cálculo de presupuesto usa `Decimal` para exactitud
- ✅ Frontend muestra precios con 2 decimales (`toFixed(2)`)
- ✅ No hay conversión prematura a `float` en cálculos

## Notas de Implementación

1. **¿Por qué Decimal en Python?**
   - `float` en Python usa representación binaria (IEEE 754)
   - Valores como `0.1 + 0.2 = 0.30000000000000004` (impreciso)
   - `Decimal` almacena números como strings internamente (exacto)

2. **¿Por qué no Decimal en toda la API?**
   - JSON no soporta `Decimal` nativamente
   - Convertimos a `float` solo en la respuesta JSON
   - Los cálculos internos usan `Decimal` para precisión

3. **Flujo de un Precio**:
   ```
   Frontend Input (string) → Pydantic (float + validator) → 
   DB (DECIMAL) → Backend (Decimal para cálculos) → 
   API Response (float con 2 decimales)
   ```

## Archivos Modificados

1. `spondy-travel/main.py`
   - Línea: Agregado `from decimal import Decimal`
   - Línea: Cambiado `price = Column(Numeric)` → `price = Column(Numeric(10, 2), nullable=False)`
   - Línea: Agregado validador `@field_validator('price')` en `TourServiceCreate`
   - Línea: Actualizado `calculate_itinerary_total()` para usar `Decimal`

## Referencias

- [Decimal Documentation](https://docs.python.org/3/library/decimal.html)
- [PostgreSQL DECIMAL Type](https://www.postgresql.org/docs/current/datatype-numeric.html)
- [SQLAlchemy Numeric](https://docs.sqlalchemy.org/en/20/core/types.html#sqlalchemy.Numeric)
