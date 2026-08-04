-- Script de inicialización de la base de datos
-- Este archivo se ejecuta automáticamente cuando se crea el contenedor de PostgreSQL
-- Se ha creado la tabla como el formato que tiene la tabla de 42

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    intra_id VARCHAR(50) UNIQUE,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100),
    full_name VARCHAR(100),
    user_role VARCHAR(6),
    title VARCHAR(25) DEFAULT "Student",
    bio VARCHAR(140) DEFAULT "I'm using Transcendence!",
    avatar_url TEXT,
    password_hash TEXT,
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
    FOREIGN KEY (sender_id) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content VARCHAR(1000),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT messages_different_users CHECK (sender_id <> recipient_id)
);

CREATE INDEX IF NOT EXISTS chat_messages_idx
    ON chat_messages (sender_id, recipient_id, created_at);

CREATE TABLE IF NOT EXISTS friends (
    id SERIAL PRIMARY KEY,
    FOREIGN KEY (sender_id) INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT friend_requests_different_users CHECK (requester_id <> recipient_id),
    CONSTRAINT friend_requests_unique_pair UNIQUE (requester_id, recipient_id)
);

CREATE INDEX IF NOT EXISTS friend_requests_recipient_idx
    ON friend_requests (recipient_id, status, created_at DESC);
