-- Script de criação do banco de dados MySQL
CREATE DATABASE IF NOT EXISTS digital_equipamentos;
USE digital_equipamentos;

CREATE TABLE IF NOT EXISTS documents (
    collection_name VARCHAR(255) NOT NULL,
    id VARCHAR(255) NOT NULL,
    data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (collection_name, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
