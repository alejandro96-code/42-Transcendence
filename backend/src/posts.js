import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Client } from 'pg';
import session from 'express-session';
import passport from 'passport';
import { formatErrorJson, isAuthenticated, validate } from './utils.js';
import { postsCreateSchema } from "./classes.js"

async function read_posts(req, res, pool) {

    const user = req.user

    console.log(user)

    const posts_lists = await pool.query(
            'SELECT * FROM posts WHERE creator_id = $1 FETCH FIRST $2 ROWS ONLY',
            [req.user], [req.params.amount || 50]
        );

    if (!posts_lists) {
        let responseBody = formatErrorJson(404, "Not Found", "No posts were found in database");
        res.status(404).json(responseBody);
    } else {
        res.json(posts_lists.rows);
    }
    
}

async function create_post(req, res, pool) {

    const media = [] // parse_media() TODO

    const new_post = await pool.query(
            `INSERT INTO posts (author_id, author_username, content, media, parent)
            VALUES($1, $2, $3, $4, $5, $6) RETURNING *
            `,
            [

            ]
        );

    if (!new_post) {
        let responseBody = formatErrorJson(400, "Bad request", "Bad request");
        res.status(400).json(responseBody);
    } else {
        res.json(new_post);
    }
    
}

const router = express.Router();

router.get("/", read_posts);

router.post("/", validate({ body: postsCreateSchema }), async (req, res) => {
    const responseBody = await create_post(req, res, pool);
    res.json(responseBody);
});


export default router;