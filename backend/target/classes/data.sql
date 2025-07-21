-- Initialize default admin user (password is 'admin123') if none exists
MERGE INTO users (id, username, email, password, is_admin) 
KEY(id)
VALUES (1, 'admin', 'admin@procost.com', '$2a$10$aWAyPT1PnWoYr/kvL3heDOkS0B9W/Gn1hzRSTSTgLrfdLJqaFZRDu', true);

-- Fix user sequence
ALTER TABLE users ALTER COLUMN id RESTART WITH 2;

-- Add currency column if it doesn't exist
ALTER TABLE factories ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD' NOT NULL;

-- Add pallet and terminal charge columns if they don't exist
ALTER TABLE factories ADD COLUMN IF NOT EXISTS pallet_charge DOUBLE DEFAULT 0.0;
ALTER TABLE factories ADD COLUMN IF NOT EXISTS terminal_charge DOUBLE DEFAULT 0.0;

-- Initialize or update factories with currency values and charges
MERGE INTO factories (id, name, location, currency, pallet_charge, terminal_charge) 
KEY(id)
VALUES (1, 'Skagerak', 'Norway', 'DKK', 0.30, 0.20);
MERGE INTO factories (id, name, location, currency, pallet_charge, terminal_charge)
KEY(id)
VALUES (2, 'Factory B', 'Delhi', 'USD', 0.25, 0.18);
MERGE INTO factories (id, name, location, currency, pallet_charge, terminal_charge)
KEY(id) 
VALUES (3, 'Factory C', 'Bangalore', 'USD', 0.25, 0.15);

-- Initialize packaging rates for Skagerak factory
MERGE INTO packaging_rates (id, prod_type, product, box_qty, pack, transport_mode, packaging_rate, factory_id)
KEY(id)
VALUES (1, 'Frozen', 'Salmon', '10kg', 'Box', 'Sea', 1.25, 1);
MERGE INTO packaging_rates (id, prod_type, product, box_qty, pack, transport_mode, packaging_rate, factory_id)
KEY(id)
VALUES (2, 'Frozen', 'Salmon', '20kg', 'Box', 'Sea', 1.50, 1);
MERGE INTO packaging_rates (id, prod_type, product, box_qty, pack, transport_mode, packaging_rate, factory_id)
KEY(id)
VALUES (3, 'Frozen', 'Salmon', '10kg', 'Box', 'Air', 2.00, 1);
MERGE INTO packaging_rates (id, prod_type, product, box_qty, pack, transport_mode, packaging_rate, factory_id)
KEY(id)
VALUES (4, 'Fresh', 'Salmon', '5kg', 'Styrofoam', 'Air', 2.50, 1);
MERGE INTO packaging_rates (id, prod_type, product, box_qty, pack, transport_mode, packaging_rate, factory_id)
KEY(id)
VALUES (5, 'Fresh', 'Cod', '5kg', 'Styrofoam', 'Air', 2.25, 1);

-- Initialize rate tables for Skagerak factory
MERGE INTO rate_tables (id, product, trim_type, rm_spec, rate_per_kg, factory_id)
KEY(id)
VALUES (1, 'Salmon', 'Fillet', 'Premium', 12.50, 1);
MERGE INTO rate_tables (id, product, trim_type, rm_spec, rate_per_kg, factory_id)
KEY(id)
VALUES (2, 'Salmon', 'Fillet', 'Standard', 10.00, 1);
MERGE INTO rate_tables (id, product, trim_type, rm_spec, rate_per_kg, factory_id)
KEY(id)
VALUES (3, 'Salmon', 'Whole', 'HOG', 8.50, 1);
MERGE INTO rate_tables (id, product, trim_type, rm_spec, rate_per_kg, factory_id)
KEY(id)
VALUES (4, 'Cod', 'Fillet', 'Premium', 9.50, 1);
MERGE INTO rate_tables (id, product, trim_type, rm_spec, rate_per_kg, factory_id)
KEY(id)
VALUES (5, 'Cod', 'Fillet', 'Standard', 8.00, 1);

-- Initialize packaging rates for Factory B
MERGE INTO packaging_rates (id, prod_type, product, box_qty, pack, transport_mode, packaging_rate, factory_id)
KEY(id)
VALUES (6, 'Frozen', 'Shrimp', '5kg', 'Box', 'Sea', 1.00, 2);
MERGE INTO packaging_rates (id, prod_type, product, box_qty, pack, transport_mode, packaging_rate, factory_id)
KEY(id)
VALUES (7, 'Frozen', 'Shrimp', '10kg', 'Box', 'Sea', 1.30, 2);
MERGE INTO packaging_rates (id, prod_type, product, box_qty, pack, transport_mode, packaging_rate, factory_id)
KEY(id)
VALUES (8, 'Fresh', 'Shrimp', '2kg', 'Vacuum', 'Air', 1.80, 2);

-- Initialize rate tables for Factory B
MERGE INTO rate_tables (id, product, trim_type, rm_spec, rate_per_kg, factory_id)
KEY(id)
VALUES (6, 'Shrimp', 'Peeled', 'Premium', 15.50, 2);
MERGE INTO rate_tables (id, product, trim_type, rm_spec, rate_per_kg, factory_id)
KEY(id)
VALUES (7, 'Shrimp', 'Peeled', 'Standard', 13.00, 2);
MERGE INTO rate_tables (id, product, trim_type, rm_spec, rate_per_kg, factory_id)
KEY(id)
VALUES (8, 'Shrimp', 'Whole', 'HOSO', 10.50, 2);

-- Initialize charge rates for Skagerak factory (DKK)
MERGE INTO charge_rates (id, charge_name, product_type, product, subtype, rate_value, factory_id)
KEY(id)
VALUES (1, 'Filleting Rate', 'Fresh', 'Salmon', 'Fillet', 2.00, 1);
MERGE INTO charge_rates (id, charge_name, product_type, product, subtype, rate_value, factory_id)
KEY(id)
VALUES (2, 'Filleting Rate', 'Frozen', 'Salmon', 'Fillet', 1.50, 1);
MERGE INTO charge_rates (id, charge_name, product_type, product, subtype, rate_value, factory_id)
KEY(id)
VALUES (3, 'Filleting Rate', 'Fresh', 'Cod', 'Fillet', 1.75, 1);
MERGE INTO charge_rates (id, charge_name, product_type, product, subtype, rate_value, factory_id)
KEY(id)
VALUES (4, 'Filleting Rate', 'Frozen', 'Cod', 'Fillet', 1.25, 1);
MERGE INTO charge_rates (id, charge_name, product_type, product, subtype, rate_value, factory_id)
KEY(id)
VALUES (5, 'Pallet Charge', 'Fresh', 'Salmon', '', 0.30, 1);
MERGE INTO charge_rates (id, charge_name, product_type, product, subtype, rate_value, factory_id)
KEY(id)
VALUES (6, 'Pallet Charge', 'Frozen', 'Salmon', '', 0.30, 1);
MERGE INTO charge_rates (id, charge_name, product_type, product, subtype, rate_value, factory_id)
KEY(id)
VALUES (7, 'Skagerrak Handling', 'Fresh', 'Salmon', '', 0.25, 1);
MERGE INTO charge_rates (id, charge_name, product_type, product, subtype, rate_value, factory_id)
KEY(id)
VALUES (8, 'Skagerrak Handling', 'Frozen', 'Salmon', '', 0.25, 1);
MERGE INTO charge_rates (id, charge_name, product_type, product, subtype, rate_value, factory_id)
KEY(id)
VALUES (9, 'Freezing Rate', 'Frozen', 'Salmon', 'Tunnel Freezing', 1.65, 1);
MERGE INTO charge_rates (id, charge_name, product_type, product, subtype, rate_value, factory_id)
KEY(id)
VALUES (10, 'Freezing Rate', 'Frozen', 'Salmon', 'Gyro Freezing', 2.00, 1);
MERGE INTO charge_rates (id, charge_name, product_type, product, subtype, rate_value, factory_id)
KEY(id)
VALUES (11, 'Terminal Charge', 'Fresh', 'Salmon', '', 0.20, 1);
MERGE INTO charge_rates (id, charge_name, product_type, product, subtype, rate_value, factory_id)
KEY(id)
VALUES (12, 'Terminal Charge', 'Frozen', 'Salmon', '', 0.15, 1);

-- Initialize charge rates for Factory B (USD)
MERGE INTO charge_rates (id, charge_name, product_type, product, subtype, rate_value, factory_id)
KEY(id)
VALUES (13, 'Filleting Rate', 'Fresh', 'Shrimp', 'Peeled', 1.20, 2);
MERGE INTO charge_rates (id, charge_name, product_type, product, subtype, rate_value, factory_id)
KEY(id)
VALUES (14, 'Filleting Rate', 'Frozen', 'Shrimp', 'Peeled', 1.00, 2);
MERGE INTO charge_rates (id, charge_name, product_type, product, subtype, rate_value, factory_id)
KEY(id)
VALUES (15, 'Pallet Charge', 'Fresh', 'Shrimp', '', 0.25, 2);
MERGE INTO charge_rates (id, charge_name, product_type, product, subtype, rate_value, factory_id)
KEY(id)
VALUES (16, 'Pallet Charge', 'Frozen', 'Shrimp', '', 0.25, 2);
MERGE INTO charge_rates (id, charge_name, product_type, product, subtype, rate_value, factory_id)
KEY(id)
VALUES (17, 'Freezing Rate', 'Frozen', 'Shrimp', 'Tunnel Freezing', 1.40, 2);
MERGE INTO charge_rates (id, charge_name, product_type, product, subtype, rate_value, factory_id)
KEY(id)
VALUES (18, 'Freezing Rate', 'Frozen', 'Shrimp', 'Gyro Freezing', 1.80, 2);
MERGE INTO charge_rates (id, charge_name, product_type, product, subtype, rate_value, factory_id)
KEY(id)
VALUES (19, 'Terminal Charge', 'Fresh', 'Shrimp', '', 0.18, 2);
MERGE INTO charge_rates (id, charge_name, product_type, product, subtype, rate_value, factory_id)
KEY(id)
VALUES (20, 'Terminal Charge', 'Frozen', 'Shrimp', '', 0.12, 2);

-- Fix sequences to match the max IDs already in the tables
ALTER TABLE packaging_rates ALTER COLUMN id RESTART WITH 9;
ALTER TABLE rate_tables ALTER COLUMN id RESTART WITH 9;
ALTER TABLE charge_rates ALTER COLUMN id RESTART WITH 21;
ALTER TABLE factories ALTER COLUMN id RESTART WITH 4;