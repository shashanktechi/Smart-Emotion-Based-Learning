CREATE DATABASE IF NOT EXISTS college;
USE college;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS content_modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    base_content TEXT NOT NULL,
    adaptive_payloads JSON NOT NULL COMMENT 'Contains hints, visual aids, and simplified summaries',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS session_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    module_id INT NOT NULL,
    emotion_state VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (module_id) REFERENCES content_modules(id)
);

-- Seed MVP Content
INSERT INTO content_modules (title, base_content, adaptive_payloads) VALUES (
    'Introduction to Gravity',
    'Gravity is a fundamental interaction which causes mutual attraction between all things that have mass.',
    '{"hint": "Think of it like an invisible rubber band pulling objects together.", "simplified": "Bigger objects pull smaller objects towards them."}'
);
