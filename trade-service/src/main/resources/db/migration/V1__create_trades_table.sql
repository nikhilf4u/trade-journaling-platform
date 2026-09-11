CREATE TABLE IF NOT EXISTS trades (
                                      id BIGSERIAL PRIMARY KEY,
                                      user_id BIGINT NOT NULL,
                                      market VARCHAR(20) NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    instrument_type VARCHAR(20),
    direction VARCHAR(10) NOT NULL,
    entry_price DECIMAL(15,2) NOT NULL,
    exit_price DECIMAL(15,2) NOT NULL,
    quantity INT NOT NULL,
    quote_currency VARCHAR(10) NOT NULL,
    pnl DECIMAL(15,2) GENERATED ALWAYS AS ((exit_price - entry_price) * quantity) STORED,
    entry_date TIMESTAMP NOT NULL,
    exit_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    notes TEXT,
    screenshot_url VARCHAR(255),
    CONSTRAINT chk_direction CHECK (direction IN ('BUY', 'SELL'))
    );

CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_market ON trades(market);
CREATE INDEX idx_trades_symbol ON trades(symbol);