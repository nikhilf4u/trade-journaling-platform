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
    stoploss DECIMAL(15,2),
    target DECIMAL(15,2),
    mfe DECIMAL(15,2),
    mae DECIMAL(15,2),
    is_missed BOOLEAN NOT NULL DEFAULT FALSE,
    missed_reason_type VARCHAR(50),
    missed_reason VARCHAR(500),
    confidence_level INT,
    pnl DECIMAL(15,2) GENERATED ALWAYS AS (
                                              CASE
                                              WHEN direction = 'BUY'  THEN (exit_price - entry_price) * quantity
    WHEN direction = 'SELL' THEN (entry_price - exit_price) * quantity
    ELSE 0
    END
    ) STORED,
    long_time_frame_bias VARCHAR(30),
    entry_date TIMESTAMP NOT NULL,
    exit_date TIMESTAMP NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_direction CHECK (direction IN ('BUY', 'SELL'))
    );

CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_market ON trades(market);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_entry_date ON trades(entry_date);
CREATE INDEX IF NOT EXISTS idx_trades_is_missed ON trades(is_missed);
CREATE INDEX IF NOT EXISTS idx_trades_user_missed ON trades(user_id, is_missed);
-- Screenshots table
CREATE TABLE IF NOT EXISTS trade_screenshots (
                                                 id BIGSERIAL PRIMARY KEY,
                                                 trade_id BIGINT NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    label VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
    );

CREATE INDEX IF NOT EXISTS idx_screenshots_trade_id ON trade_screenshots(trade_id);
