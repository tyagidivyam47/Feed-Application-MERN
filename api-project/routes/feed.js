const express = require('express');
const { body } = require('express-validator')

const feedController = require("../controller/feed");
const isAuth = require("../middleware/is-auth");

const route = express.Router();

route.get("/posts", isAuth, feedController.getPosts);

route.post(
    "/posts",
    isAuth,
    [
        body('title').trim().isLength({ min: 3 }),
        body('content').trim().isLength({ min: 3 })
    ],
    feedController.createPost);

route.get("/posts:postId", isAuth, feedController.getSinglePost)

route.put(
    "/posts/:postId",
    isAuth,
    [
        body('title').trim().isLength({ min: 3 }),
        body('content').trim().isLength({ min: 3 })
    ],
    feedController.updatePosts
);

route.delete("/posts/:postId", isAuth, feedController.deletePost)


module.exports = route;