-- Corob Service Analytics — self-hosted MySQL schema (Phase 1)
-- Run as: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS corob_service
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE corob_service;

-- Replaces domain_directory.json: one row per client company.
-- corob.com itself has no row here — internal staff are flagged via users.role.
CREATE TABLE companies (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(255) NOT NULL UNIQUE,
    email_domain  VARCHAR(255) NOT NULL UNIQUE,   -- e.g. 'asianpaints.com'
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Replaces Supabase Auth's user store. Passwords are bcrypt hashes.
CREATE TABLE users (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    role           ENUM('customer', 'corob_employee') NOT NULL,
    company_id     INT NULL,                       -- NULL for corob_employee
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT
);

-- Replaces the Redis "session:{id}:data" blob (Service Call upload, stateless per-login-session).
CREATE TABLE service_call_sessions (
    session_id   CHAR(36) PRIMARY KEY,             -- uuid4
    payload      LONGBLOB NOT NULL,                -- gzip-pickled DataFrame
    expires_at   DATETIME NOT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_expires (expires_at)
);

-- Replaces the Redis "pm_data:{company-slug}" blob (persistent, 30-day TTL per company).
CREATE TABLE pm_data (
    company_slug VARCHAR(255) PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    payload      LONGBLOB NOT NULL,                -- gzip-pickled DataFrame
    expires_at   DATETIME NOT NULL,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_expires (expires_at)
);

-- Replaces the Redis login_attempts / login_lockout counters.
CREATE TABLE login_attempts (
    device_ip_key VARCHAR(255) PRIMARY KEY,        -- f"{device_id}:{ip}"
    attempts      INT NOT NULL DEFAULT 0,
    window_expires_at   DATETIME NULL,
    locked_until        DATETIME NULL
);

-- Seed companies (from the old domain_directory.json).
INSERT INTO companies (name, email_domain) VALUES
    ('AKZO Nobel Paints', 'akzonobel.com'),
    ('Asian Paints Ltd', 'asianpaints.com'),
    ('Birla Opus Paints', 'birlaopus.com');

-- Seed users — REPLACE these password hashes before running in production.
-- Generate one with: python -c "import bcrypt; print(bcrypt.hashpw(b'change-me', bcrypt.gensalt()).decode())"
-- INSERT INTO users (email, password_hash, role, company_id) VALUES
--     ('someone@corob.com', '<bcrypt-hash>', 'corob_employee', NULL),
--     ('user@asianpaints.com', '<bcrypt-hash>', 'customer', (SELECT id FROM companies WHERE name='Asian Paints Ltd'));

-- A periodic cleanup job (cron calling a small script, or MySQL event scheduler) should delete
-- expired rows from service_call_sessions / pm_data / login_attempts, since MySQL has no native TTL:
--
-- SET GLOBAL event_scheduler = ON;
-- DELIMITER $$
-- CREATE EVENT purge_expired_cache
--   ON SCHEDULE EVERY 1 HOUR
--   DO BEGIN
--     DELETE FROM service_call_sessions WHERE expires_at < NOW();
--     DELETE FROM pm_data WHERE expires_at < NOW();
--     DELETE FROM login_attempts WHERE locked_until IS NOT NULL AND locked_until < NOW()
--                                    AND window_expires_at < NOW();
--   END$$
-- DELIMITER ;
