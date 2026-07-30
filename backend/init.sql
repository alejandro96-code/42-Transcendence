-- Script de inicialización de la base de datos
-- Este archivo se ejecuta automáticamente cuando se crea el contenedor de PostgreSQL
-- Se ha creado la tabla como el formato que tiene la tabla de 42

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    intra_id VARCHAR(50) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100),
    full_name VARCHAR(100),
    user_role VARCHAR(6),
    title VARCHAR(25) DEFAULT "Student",
    bio VARCHAR(140) DEFAULT "I'm using Transcendence!",
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    FOREIGN KEY (author_id) REFERENCES users(id),
    author_username VARCHAR(50),
    content VARCHAR(240),
    likes INT[],
    media TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    parent INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    content VARCHAR(240),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS friends (
    id SERIAL PRIMARY KEY,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    accepted BOOLEAN,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);