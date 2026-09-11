CREATE TABLE IF NOT EXISTS users (
                                     id BIGSERIAL PRIMARY KEY,
                                     email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    base_currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    total_capital DECIMAL(15,2) NOT NULL DEFAULT 10000,
    risk_per_trade_percent DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    max_daily_loss_percent DECIMAL(5,2) NOT NULL DEFAULT 3.0,
    max_drawdown_percent DECIMAL(5,2) NOT NULL DEFAULT 10.0,
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
    );

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_reset_token ON users(reset_token);