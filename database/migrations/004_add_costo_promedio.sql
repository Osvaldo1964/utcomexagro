-- Añadir Costo Promedio Ponderado a inventario_items
ALTER TABLE inventario_items ADD COLUMN costo_promedio DECIMAL(12,2) DEFAULT 0.00;
