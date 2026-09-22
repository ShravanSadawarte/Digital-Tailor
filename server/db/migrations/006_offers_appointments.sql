CREATE TABLE IF NOT EXISTS offers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description VARCHAR(1000) NULL,
  discount_type VARCHAR(20) NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  min_order DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  scope_category_id BIGINT UNSIGNED NULL,
  first_order_only TINYINT(1) NOT NULL DEFAULT 0,
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  usage_limit INT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_discount_type CHECK (discount_type IN ('percent','flat')),
  CONSTRAINT chk_discount_value CHECK (discount_value >= 0),
  CONSTRAINT fk_offers_scope FOREIGN KEY (scope_category_id) REFERENCES garment_categories (id) ON DELETE SET NULL,
  CONSTRAINT fk_offers_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  INDEX idx_offers_active (is_active, ends_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS offer_usage (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  offer_id BIGINT UNSIGNED NOT NULL,
  order_id BIGINT UNSIGNED NOT NULL UNIQUE,
  customer_id BIGINT UNSIGNED NOT NULL,
  discount_given DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ouse_offer FOREIGN KEY (offer_id) REFERENCES offers (id) ON DELETE RESTRICT,
  CONSTRAINT fk_ouse_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT fk_ouse_customer FOREIGN KEY (customer_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS appointments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NOT NULL,
  order_id BIGINT UNSIGNED NULL,
  reason VARCHAR(40) NOT NULL,
  scheduled_at DATETIME NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'REQUESTED',
  notes VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_appt_reason CHECK (reason IN ('measurement','fabric-drop','design-discussion','trial','delivery','other')),
  CONSTRAINT chk_appt_status CHECK (status IN ('REQUESTED','CONFIRMED','COMPLETED','CANCELLED')),
  CONSTRAINT fk_appt_customer FOREIGN KEY (customer_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_appt_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE SET NULL,
  INDEX idx_appt_sched (scheduled_at, status),
  INDEX idx_appt_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
