CREATE TABLE app_users (
    id UUID PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    role VARCHAR(16) NOT NULL CHECK (role IN ('WAITER', 'KITCHEN', 'CASHIER', 'ADMIN')),
    active BOOLEAN NOT NULL,
    token_version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE auth_guard (id INTEGER PRIMARY KEY);
INSERT INTO auth_guard (id) VALUES (1);