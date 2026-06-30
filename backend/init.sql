-- Script de inicialización de la base de datos
-- Este archivo se ejecuta automáticamente cuando se crea el contenedor de PostgreSQL
-- Se ha creado la tabla como el formato que tiene la tabla de 42

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    intra_id VARCHAR(50) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100),
    full_name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    author_id BIGINT,
    author_username VARCHAR(50),
    content VARCHAR(240),
    likes INT DEFAULT 0,
    media TEXT[]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    parent BIGINT DEFAULT 0
);