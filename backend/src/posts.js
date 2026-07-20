import express from 'express';
import { formatErrorJson, isAuthenticated, validate } from './utils.js';
import { postsCreateSchema } from "./classes.js"
import { pool } from "./db.js"

async function read_posts(req, res) {

    const user = req.user

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

async function create_post(req, res) {

    const media = [] // parse_media() TODO

    console.log(req.body)

    const author_username = await pool.query(
            'SELECT username FROM users WHERE id = $1',
            [
                req.body.author_id
            ]
        );

    console.log(author_username)

    if (!author_username || author_username.rows.length === 0) {
        let responseBody = formatErrorJson(404, "Not found", "Post author not found in Database");
        res.status(404).json(responseBody);
        return;
    }

    const parent = req.body.parent ? req.body.parent : 0

    console.log(author_username.rows[0].username)

    const new_post = await pool.query(
            `INSERT INTO posts (author_id, author_username, content, media, parent)
            VALUES($1, $2, $3, $4, $5) RETURNING *
            `,
            [
                req.body.author_id, author_username.rows[0].username,
                req.body.content, media, parent
            ]
        );

    console.log(new_post)

    if (!new_post || new_post.rows.length === 0) {
        let responseBody = formatErrorJson(500, "Internal Server Error", "Something went bad on post creation");
        res.status(500).json(responseBody);
    } else {
        res.json(new_post.rows);
    }
    
}

const router = express.Router();

router.use(express.json());

router.get("/", read_posts);

router.post("/", async (req, res) => {
    const responseBody = await create_post(req, res);
    res.json(responseBody);
});


export default router;