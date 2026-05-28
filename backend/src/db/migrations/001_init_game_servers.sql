START TRANSACTION;

CREATE TABLE servers (
    server_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    game_container ENUM('minecraft', 'valheim') NOT NULL,
    container_id CHAR(64) NOT NULL,
    ram_alloc_mb INT NOT NULL,
    max_num_players INT DEFAULT 5 NOT NULL,
    status ENUM('started', 'starting', 'stopped', 'stopping', 'error') DEFAULT 'starting' NOT NULL,
    host_port INT NOT NULL,
    default_host_port VARCHAR(50),
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    game_settings JSON NOT NULL,
    
    CONSTRAINT chk_port CHECK (host_port BETWEEN 6000 AND 65535),
    INDEX idx_game_container (game_container),
    INDEX idx_status (status)
);

COMMIT;