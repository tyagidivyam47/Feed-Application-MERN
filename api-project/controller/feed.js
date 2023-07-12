const { validationResult } = require('express-validator');

const io = require('../socket');
const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = async (req, res, next) => {

    try {
        const posts = await Post.find().populate('creator');
        if (!posts) {
            const error = new Error("No Posts Found!!");
            throw error             // Error can be thrown inside then block 
        }                           // The thrown error inside will be treated as err in catch, so we can throw err inside then if catch 
        res.status(200).json({
            message: "Posts Fetched Successfully",
            posts: posts
        })

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.createPost = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation Failed');
        error.statusCode = 422;
        throw error;
    }
    const imageUrl = req.file.path;
    const title = req.body.title;
    const content = req.body.content;
    let creator;

    const post = new Post({
        title: title,
        content: content,
        imageUrl: imageUrl,
        creator: req.userId
    })

    try {
        await post.save();
        const user = await User.findById(req.userId)
        creator = user;
        user.posts.push(post);
        await user.save();
        io.getIo().emit('posts', { action: 'create', post: post })
        res.status(201).json({
            message: 'Post Created Successfully',
            post: post,
            creator: creator
        })
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.getSinglePost = (req, res, next) => {
    const postId = req.params.postId;

    Post.findById(postId)
        .then((post) => {
            if (!post) {
                const error = new Error("Could not find any post");
                // The thrown error inside will be treated as err in catch, so we can throw err inside then if catch exist 
                throw error
            }
            res.status(200).json({ message: "Posts Fetched", post: post })
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
}

exports.updatePosts = (req, res, next) => {
    const postId = req.params.postId;
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const error = new Error('Validation Failed');
        error.statusCode = 422;
        throw error;
    }

    if (req.file) {
        imageUrl = req.file.path;
    }
    if (!imageUrl) {
        throw new Error("No file picked");
    }

    Post.findById(postId)
        .then((post) => {
            if (!post) {
                const error = new Error("No Posts Found!!");
                throw error             // Error can be thrown inside then block 
            }
            if (post.creator.toString() !== req.userId) {
                const error = new Error("Not authorised to Edit")
                error.statusCode = 403;
                throw error;
            }
            post.title = title;
            post.content = content;
            post.imageUrl = imageUrl;
            return post.save();
        })
        .then((result) => {
            io.getIo().emit('posts', { action: 'update', post: result })
            res.status(200).json({ message: "Post Updated", post: result })
        })
        .catch((err) => {
            console.log(err);
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
}

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .then((post) => {
            if (!post) {
                const error = new Error("No Posts Found!!");
                throw error             // Error can be thrown inside then block 
            }
            if (post.creator.toString() !== req.userId) {
                const error = new Error("Not authorised to delete")
                error.statusCode = 403;
                throw error;
            }
            // Check if the user is logged in
            return Post.findByIdAndDelete(postId);
        })
        .then((result) => {
            io.getIo().emit('posts', { action: 'delete', post: postId })
            return User.findById(req.userId);
        })
        .then((user) => {
            user.posts.pull(postId);
            user.save();
        })
        .then((result) => {
            res.status(200).json({ message: "Post Deleted" })
        })
        .catch((err) => {
            console.log(err);
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
}