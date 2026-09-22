CREATE TABLE IF NOT EXISTS measurement_profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  garment_hint VARCHAR(50) NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_mprofiles_user FOREIGN KEY (customer_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_mprofiles_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS measurement_values (
  profile_id BIGINT UNSIGNED NOT NULL,
  field_key VARCHAR(40) NOT NULL,
  value_cm DECIMAL(5,1) NOT NULL,
  PRIMARY KEY (profile_id, field_key),
  CONSTRAINT chk_mfield CHECK (field_key IN ('bust','waist','hip','shoulder','armhole','sleeve_length','kurti_length','dress_length','neck_width','front_neck_depth','back_neck_depth','pant_length','palazzo_length','inseam','thigh','bottom_width')),
  CONSTRAINT chk_mvalue CHECK (value_cm BETWEEN 2.0 AND 250.0),
  CONSTRAINT fk_mvalues_profile FOREIGN KEY (profile_id) REFERENCES measurement_profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
