CREATE TABLE categories (
    id UUID PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE menu_items (
    id UUID PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES categories (id),
    name VARCHAR(120) NOT NULL,
    description VARCHAR(500),
    price_vnd BIGINT NOT NULL CHECK (price_vnd >= 0),
    image_url VARCHAR(500),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE restaurant_tables (
    id UUID PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    status VARCHAR(30) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE orders (
    id UUID PRIMARY KEY,
    table_id UUID NOT NULL REFERENCES restaurant_tables (id),
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_orders_status_submitted_at ON orders (status, submitted_at);
CREATE INDEX idx_orders_table_id_status ON orders (table_id, status);

CREATE TABLE order_items (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders (id),
    menu_item_id UUID NOT NULL REFERENCES menu_items (id),
    item_name VARCHAR(120) NOT NULL,
    unit_price_vnd BIGINT NOT NULL CHECK (unit_price_vnd >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    note VARCHAR(300),
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_order_items_order_id ON order_items (order_id);
CREATE INDEX idx_order_items_menu_item_id ON order_items (menu_item_id);

CREATE TABLE invoices (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL UNIQUE REFERENCES orders (id),
    subtotal_vnd BIGINT NOT NULL CHECK (subtotal_vnd >= 0),
    discount_vnd BIGINT NOT NULL CHECK (discount_vnd >= 0),
    vat_vnd BIGINT NOT NULL CHECK (vat_vnd >= 0),
    total_vnd BIGINT NOT NULL CHECK (total_vnd >= 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE payments (
    id UUID PRIMARY KEY,
    invoice_id UUID NOT NULL UNIQUE REFERENCES invoices (id),
    amount_vnd BIGINT NOT NULL CHECK (amount_vnd >= 0),
    method VARCHAR(20) NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE NOT NULL
);