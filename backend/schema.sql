-- Chat Application Database Schema
-- Database: chat_app

CREATE DATABASE IF NOT EXISTS chat_app;
USE chat_app;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Chats Table (1:1 chat pairs with canonical ordering user_low_id < user_high_id)
CREATE TABLE IF NOT EXISTS chats (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_low_id BIGINT NOT NULL,
  user_high_id BIGINT NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_chat_pair (user_low_id, user_high_id),
  KEY fk_chat_user_high (user_high_id),
  CONSTRAINT fk_chat_user_low FOREIGN KEY (user_low_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_chat_user_high FOREIGN KEY (user_high_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT check_chat_pair CHECK (user_low_id < user_high_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3. Chat Participants Table
CREATE TABLE IF NOT EXISTS chat_participants (
  id BIGINT NOT NULL AUTO_INCREMENT,
  chat_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  joined_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_chat_participant (chat_id, user_id),
  KEY fk_participant_user (user_id),
  CONSTRAINT fk_participant_chat FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE,
  CONSTRAINT fk_participant_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Seed initial demonstration users if table is empty
INSERT IGNORE INTO users (id, name, email) VALUES
(1, 'Biswajit', 'biswajit@example.com'),
(2, 'Rahul', 'rahul@example.com'),
(3, 'Amit', 'amit@example.com');
