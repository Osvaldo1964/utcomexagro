-- Añadir IVA a catálogo de ítems
ALTER TABLE inventario_items ADD COLUMN iva_porcentaje DECIMAL(5,2) DEFAULT 0.00;

-- Añadir IVA a detalle de órdenes de compra
ALTER TABLE inv_ordenes_compra_items ADD COLUMN iva_porcentaje DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE inv_ordenes_compra_items ADD COLUMN iva_valor DECIMAL(12,2) DEFAULT 0.00;

-- Añadir IVA a detalle de movimientos
ALTER TABLE inv_movimientos_items ADD COLUMN iva_porcentaje DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE inv_movimientos_items ADD COLUMN iva_valor DECIMAL(12,2) DEFAULT 0.00;
