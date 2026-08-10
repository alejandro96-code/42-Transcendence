-- Usuario local de prueba para desarrollo.
-- Credenciales: mockuser / mockpass123
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
    'mock-user-001',
    'mockuser',
    'mockuser@example.test',
    'Usuario Mock',
    'https://via.placeholder.com/96?text=MU',
    'Desarrollador/a',
    'Usuario de prueba creado con make mock-user.',
    '0123456789abcdef0123456789abcdef:c10c20060f292ede4dc69a8c538d657d2171f5aeba911215f9a6bb524137ef7436ef822a71a1c3d1848ce6be6d31e91b0230bcd5ad776b5391e07c06456c41fd'
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
