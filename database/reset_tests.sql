SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE inv_movimientos_items;
TRUNCATE TABLE inv_movimientos;
TRUNCATE TABLE inv_ordenes_compra_items;
TRUNCATE TABLE inv_ordenes_compra;
UPDATE inventario_items SET cantidad = 0, costo_promedio = 0;
SET FOREIGN_KEY_CHECKS = 1;
