ALTER TABLE app_users ADD COLUMN full_name VARCHAR(120);
ALTER TABLE orders ADD COLUMN created_by_name VARCHAR(120);
ALTER TABLE order_items ADD COLUMN ordered_by_name VARCHAR(120);
ALTER TABLE order_items ADD COLUMN cooked_by_name VARCHAR(120);
ALTER TABLE order_items ADD COLUMN served_by_name VARCHAR(120);
ALTER TABLE invoices ADD COLUMN cashier_name VARCHAR(120);

