DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures(
    id SERIAL PRIMARY KEY,
    -- get rid of first and last!
    signature TEXT NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);