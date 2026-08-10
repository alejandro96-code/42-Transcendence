import express from 'express';
import { formatErrorJson, isAuthenticated, validate } from './utils.js';
import { postsCreateSchema } from "./classes.js";
import { pool } from "./db.js";

async function remove_likes(req, res) {
    const likes = await pool.query(
        'SELECT likes FROM posts WHERE id = $1',
        [req.body.id]
    );
    
    let likes_array = [];

    if (!likes || !likes.rows || !likes.rows[0] || !likes.rows[0].likes) {
        let responseBody = formatErrorJson(404, "Not Found", "Post or likes not found");
        res.status(404).json(responseBody);
        return;
    } else {
        likes_array = likes.rows[0].likes;
    }

    if (likes_array && !likes_array.includes(req.body.id)) {
        let responseBody = formatErrorJson(409, "Conflict", "User already liked that post");
        res.status(409).json(responseBody);
        return;
    }

    const updated_post = await pool.query(
        'UPDATE posts SET likes = array_remove(likes, $2) WHERE id = $1',
        [req.body.id, req.body.user]
    );

    if (likes_array) {
        likes_array.push(req.body.id.toString());
    } else {
        likes_array = [req.body.id];
    }

    if (!updated_post || updated_post.rowCount === 0) {
        let responseBody = formatErrorJson(500, "Internal server error", "Couldn't UPDATE post");
        res.status(500).json(responseBody);
    } else {
        res.json({"post": req.body.id, "likes": likes_array});
    }
}

async function update_likes(req, res) {
    const likes = await pool.query(
        'SELECT likes FROM posts WHERE id = $1',
        [req.body.id]
    );
    
    let likes_array = [];

    if (likes && likes.rows) {
        if (likes.rows[0] && likes.rows[0].likes) {
            likes_array = likes.rows[0].likes;
        }
    } else {
        let responseBody = formatErrorJson(404, "Not Found", "Post or likes not found");
        res.status(404).json(responseBody);
        return;
    }

    if (likes_array && likes_array.includes(req.body.id)) {
        let responseBody = formatErrorJson(409, "Conflict", "User already liked that post");
        res.status(409).json(responseBody);
        return;
    }

    const updated_post = await pool.query(
        'UPDATE posts SET likes = array_append(likes, $2) where id = $1',
        [req.body.id, req.body.user]
    );

    if (likes_array) {
        likes_array.push(req.body.id.toString());
    } else {
        likes_array = [req.body.id];
    }

    if (!updated_post || updated_post.rowCount === 0) {
        let responseBody = formatErrorJson(500, "Internal server error", "Couldn't UPDATE post");
        res.status(500).json(responseBody);
    } else {
        res.json({"post": req.body.id, "likes": likes_array});
    }
}

async function read_comments(req, res) {
    const posts_lists = await pool.query(
        'SELECT * FROM posts WHERE parent = $1 FETCH FIRST $2 ROWS ONLY',
        [req.body.parent, req.body.amount || 50]
    );

    if (!posts_lists || posts_lists.rows.length === 0) {
        let responseBody = formatErrorJson(404, "Not Found", "No posts were found in database");
        res.status(404).json(responseBody);
    } else {
        res.json(posts_lists.rows);
    }
}

async function read_posts(req, res) {
    
    const targetUser = req.body.user || req.user.id;
    const posts_lists = await pool.query(
        'SELECT * FROM posts WHERE author_id = $1 FETCH FIRST $2 ROWS ONLY',
        [targetUser, req.body.amount || 50]
    );

    if (!posts_lists || posts_lists.rows.length === 0) {
        let responseBody = formatErrorJson(404, "Not Found", "No posts were found in database");
        res.status(404).json(responseBody);
    } else {
        res.json(posts_lists.rows);
    }
}

async function create_post(req, res) {
    const media = [];
    const authorId = req.user.id;
    const author_username = await pool.query(
        'SELECT username FROM users WHERE id = $1',
        [authorId]
    );

    if (!author_username || author_username.rows.length === 0) {
        let responseBody = formatErrorJson(404, "Not found", "Post author not found in Database");
        res.status(404).json(responseBody);
        return;
    }

    const parent = req.body.parent ? req.body.parent : 0;
    const new_post = await pool.query(
        `INSERT INTO posts (author_id, author_username, content, media, parent)
        VALUES($1, $2, $3, $4, $5) RETURNING *`,
        [
            authorId, 
            author_username.rows[0].username,
            req.body.content, 
            media, 
            parent
        ]
    );

    if (!new_post || new_post.rows.length === 0) {
        let responseBody = formatErrorJson(500, "Internal Server Error", "Something went bad on post creation");
        res.status(500).json(responseBody);
    } else {
        res.json(new_post.rows);
    }
}
export default function posts_endpoints(app, customPool) {

    const router = express.Router();
    router.use(express.json());
    router.use(isAuthenticated);
    router.delete("/likes", remove_likes);
    router.patch("/likes", update_likes);
    router.get("/", read_posts);
    router.get("/comments", read_comments);
    router.post("/", validate(postsCreateSchema), create_post);
    app.use("/api/posts", router);
}
