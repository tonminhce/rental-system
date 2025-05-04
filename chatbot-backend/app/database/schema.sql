-- Database schema for real estate chatbot

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    area DECIMAL(10,2) NOT NULL,
    property_type VARCHAR(50) NOT NULL, -- room, apartment, house
    transaction_type VARCHAR(50) NOT NULL, -- rent, sale
    source_url VARCHAR(255),
    province VARCHAR(100) DEFAULT 'TPHCM',
    district VARCHAR(100) NOT NULL,
    ward VARCHAR(100),
    street VARCHAR(255),
    latitude DECIMAL(10,8) CHECK (latitude BETWEEN -90 AND 90),
    longitude DECIMAL(11,8) CHECK (longitude BETWEEN -180 AND 180),
    displayed_address TEXT,
    status VARCHAR(50) DEFAULT 'active',
    bedrooms INT,
    bathrooms INT,
    contact_name VARCHAR(100),
    contact_phone VARCHAR(20),
    post_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    -- Indexes for common queries
    INDEX idx_district (district),
    INDEX idx_status (status),
    INDEX idx_price (price),
    INDEX idx_property_type (property_type),
    INDEX idx_transaction_type (transaction_type),
    -- Index for location-based queries
    INDEX idx_location (latitude, longitude)
);

-- Property images table
CREATE TABLE IF NOT EXISTS property_images (
    id BIGINT NOT NULL AUTO_INCREMENT,
    property_id BIGINT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    INDEX idx_property_id (property_id)
);

-- Chat history table
CREATE TABLE IF NOT EXISTS chat_history (
    id BIGINT NOT NULL AUTO_INCREMENT,
    thread_id VARCHAR(100) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    INDEX idx_thread_id (thread_id)
);

-- User wallet table
CREATE TABLE IF NOT EXISTS user_wallet (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    INDEX idx_user_id (user_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id VARCHAR(255) NOT NULL,
    property_id BIGINT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('rent', 'buy')),
    contract_start_date DATE NOT NULL,
    contract_end_date DATE,
    deposit_amount DECIMAL(15,2) NOT NULL,
    monthly_payment DECIMAL(15,2),
    total_amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'deposit_paid', 'confirmed', 'active', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    FOREIGN KEY (property_id) REFERENCES properties(id),
    INDEX idx_user_id (user_id),
    INDEX idx_property_id (property_id),
    INDEX idx_status (status)
); 