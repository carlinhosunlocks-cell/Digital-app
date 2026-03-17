-- digital_equipamentos.sql
CREATE DATABASE IF NOT EXISTS digital_equipamentos;
USE digital_equipamentos;

-- Tabela de Usuários
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'EMPLOYEE', 'CLIENT') NOT NULL,
    department VARCHAR(50),
    position VARCHAR(50),
    salary DECIMAL(10,2),
    hire_date DATE,
    avatar VARCHAR(255),
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Ordens de Serviço
CREATE TABLE service_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    description TEXT,
    status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
    assigned_to_id INT,
    order_date DATE,
    priority ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'MEDIUM',
    FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabela de Inventário
CREATE TABLE inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sku VARCHAR(50) UNIQUE,
    category VARCHAR(50),
    quantity INT DEFAULT 0,
    min_quantity INT DEFAULT 10,
    price DECIMAL(10,2),
    unit VARCHAR(20),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Tickets de Suporte
CREATE TABLE tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    subject VARCHAR(200) NOT NULL,
    description TEXT,
    status ENUM('OPEN', 'IN_PROGRESS', 'CLOSED') DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de Mensagens dos Tickets
CREATE TABLE ticket_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    sender_id INT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de Solicitações de RH
CREATE TABLE hr_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    type ENUM('VACATION', 'SICK_LEAVE', 'BONUS', 'OTHER') NOT NULL,
    start_date DATE,
    end_date DATE,
    reason TEXT,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    amount DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de Registro de Ponto
CREATE TABLE time_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    type ENUM('CLOCK_IN', 'CLOCK_OUT') NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    location VARCHAR(255),
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Dados Iniciais (Admin Padrão: admin@admin.com / senha: admin)
INSERT INTO users (name, email, password, role, department, position) 
VALUES ('Administrador Master', 'admin@admin.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN', 'Gestão', 'Diretor');
