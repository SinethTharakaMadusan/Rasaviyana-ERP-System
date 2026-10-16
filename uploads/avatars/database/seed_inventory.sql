-- Seed data for inventory table
INSERT INTO inventory (product_name, code, category, stock_qty, unit, status, created_at) VALUES
('Chilli Powder 50g', 'CP-50', 'Powders', 5, 'Packets', 'Low Stock', '2026-02-11 15:52:57'),
('Chilli Powder 100g', 'CP-100', 'Powders', 59, 'Packets', 'In Stock', '2026-02-11 15:52:57'),
('Chilli Powder 500g', 'CP-500', 'Powders', 12, 'Packets', 'In Stock', '2026-02-11 15:52:57'),
('Turmeric Powder 50g', 'TP-50', 'Powders', 25, 'Packets', 'In Stock', '2026-02-11 15:52:57'),
('Turmeric Powder 100g', 'TP-100', 'Powders', 0, 'Packets', 'Out of Stock', '2026-02-11 15:52:57');
