-- Usuario local de prueba para desarrollo.
-- Credenciales: admin / admin123
-- La contraseña usa el mismo formato scrypt (salt:hash) que el backend.

INSERT INTO users (
    intra_id,
    username,
    email,
    full_name,
    avatar_url,
    profession,
    description,
    password_hash
)
VALUES (
    'Admin-user',
    'admin',
    'admin@example.com',
    'Administrator',
    '/img/Not_image.png',
    'Administrator of Social Page',
    'Administrator of Social page that can do all',
    '0123456789abcdef0123456789abcdef:b73d71a9980ff5c0b357becdf2a10bba8841da7a1ad820ce28e15f2b8622fcdb8942397c8791c6c12807bb5afbd4a9ec855dfa0207d3e4b753a103246e03c0ee'
)
ON CONFLICT (username) DO UPDATE SET
    intra_id = EXCLUDED.intra_id,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    profession = EXCLUDED.profession,
    description = EXCLUDED.description,
    password_hash = EXCLUDED.password_hash,
    updated_at = CURRENT_TIMESTAMP;
