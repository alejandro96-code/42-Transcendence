import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Client } from 'pg';
import session from 'express-session';
import passport from 'passport';
import { formatErrorJson, isAuthenticated } from './utils.js';

async function get_posts(req, res, pool) {

    const user = req.user

    const query_res = await pool.query(
            'SELECT * FROM posts WHERE creator_id = $1 FETCH FIRST $2 ROWS ONLY',
            [req.user], [req.params.amount || 50]
        );

    console.log(query_res);

    let posts_lists;

    if (!posts_lists) {
        let responseBody = formatErrorJson(404, "Not Found", "No posts were found in database");
        res.status(404).json(responseBody);
    } else {
        res.json(posts_lists.rows);
    }
    
}

async function create_post(req, res, pool) {

    const client = await new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'transcendence',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
    }).connect()

    const user = "mikus"

    const query_res = await client.query(
            'SELECT * FROM posts WHERE creator_id = $1 FETCH FIRST $2 ROWS ONLY',
            [req.user], [req.params.amount || 50]
        );

    console.log(query_res);

    let posts_lists;

    if (!posts_lists) {
        let responseBody = formatErrorJson(404, "Not Found", "No posts were found in database");
        res.status(404).json(responseBody);
    } else {
        res.json(posts_lists);
    }
    
}

function posts_endpoints(app, pool) {
    app.get("/api/posts", isAuthenticated, get_posts);
    
    app.post("/api/posts", async (req, res) => {
        const responseBody = await create_post(req, res);
        res.json(responseBody);
    });
}

export default posts_endpoints;