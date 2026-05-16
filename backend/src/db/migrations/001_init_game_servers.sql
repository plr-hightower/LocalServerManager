START TRANSACTION;

CREATE TABLE IF NOT EXISTS game_servers (
    server_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    game_container VARCHAR(50) NOT NULL,          
    container_id CHAR(64) NOT NULL,               
    ram_alloc_mb INT NOT NULL,                    
    max_num_players INT NOT NULL DEFAULT 5,
    status VARCHAR(30) NOT NULL DEFAULT 'starting', 
    host_port INT NOT NULL,
    default_host_port VARCHAR(10) NULL,           
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_host_port UNIQUE (host_port)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

COMMIT;