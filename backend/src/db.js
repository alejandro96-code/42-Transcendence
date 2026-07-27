import pg from 'pg';

pg.types.setTypeParser(20, BigInt); // Type Id 20 = BIGINT | BIGSERIAL

export const pool = new pg.Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'transcendence',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
    });

export default pool