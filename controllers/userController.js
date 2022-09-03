const User = require('../models/user');
const Post = require('../models/post');
const Comment = require('../models/comment');
const { body, param, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const mongoose = require('mongoose');
require('../passport');

exports.create_user = [
  body('username')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Username is required')
    .custom(async value => {
      try {
        const search = await User.find({ username: value });
        if (search.length > 0) {
          return Promise.reject('Username is already in use')
        }
      } catch (err) {
        return Promise.reject('An error has occured');
      }
    })
    .escape(),
  body('password')
    .trim()
    .isLength({ min: 8 })
    .withMessage('Password must be length 8 or greater')
    .escape(),
  async (req, res, next) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      res.status(400).json(
        {
          errors: error.array()
        }
      );
      return;
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User(
      {
        username: req.body.username,
        password: hashedPassword
      }
    );
    try {
      await user.save();
      const payload = {
        username: user.username
      };
      const opts = {};
      opts.expiresIn = 600;
      const token = jwt.sign(payload, process.env.JWT_SECRET, opts);
      res.status(201).json(
        {
          token
        }
      );
      return;
    } catch (err) {
      next(err)
    }
  }
];

exports.get_user = [
  param('username')
    .trim()
    .escape(),
  async (req, res, next) => {
    const user = await User.findOne({ username: req.params.username });
    if (user) {
      res.status(200).json({
        username: user.username,
        post_score: user.post_score,
        comment_score: user.comment_score,
        admin: user.admin,
        moderator: user.moderator,
        posts: user.posts,
        comments: user.comments
      });
      return;
    }
    next();
  }
];

exports.delete_user = [
  passport.authenticate('jwt', { session: false }),
  param('username')
    .trim()
    .escape(),
  async (req, res, next) => {
    if (req.params.username !== req.user.username && !req.user.admin) {
      res.sendStatus(403);
      return;
    }
    try {
      const user = await User.findOne({ username: req.params.username });
      if (user) {
        await user.delete();
        res.sendStatus(200);
        return;
      }
      res.status(404).json(
        {
          message: `User ${req.params.username} does not exist`
        }
      );
      return;
    } catch (err) {
      next(err);
    }
  }
];

exports.update_user = [
  passport.authenticate('jwt', { session: false }),
  param('username')
    .trim()
    .escape(),
  body('email')
    .trim()
    .escape()
    .isEmail()
    .withMessage('Must submit a valid email')
    .optional(),
  body('password')
    .trim()
    .isLength({ min: 8 })
    .withMessage('Password must be length 8 or greater')
    .escape()
    .optional(),
  body('admin')
    .trim()
    .escape()
    .isBoolean()
    .optional(),
  async (req, res, next) => {
    if (req.user.username !== req.params.username && !req.user.admin) {
      res.sendStatus(403);
      return;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json(
        {
          errors: errors.array()
        }
      );
      return;
    }
    try {
      const updates = {};
      if (req.body.email) updates.email = req.body.email;
      if (req.body.password) {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        updates.password = hashedPassword;
      }
      if (req.body.admin) {
        if (!req.user.admin) {
          res.sendStatus(403);
          return;
        }
        updates.admin = req.body.admin;
      }
      const user = await User.findOneAndUpdate({ username: req.params.username }, updates);
      if (user) {
        res.sendStatus(200);
        return;
      }
      next();
      return;
    } catch (err) {
      next(err)
    }
  }
];

exports.create_user_post = [
  passport.authenticate('jwt', { session: false }),
  param('username')
    .trim()
    .escape(),
  body('title')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Title is required')
    .escape(),
  body('content')
    .trim()
    .escape()
    .isLength({ max: 10000 })
    .withMessage('Content is too long'),
  async (req, res, next) => {
    if (req.user.username !== req.params.username) {
      res.sendStatus(403);
      return;
    }
    const user = await User.findOne({ username: req.params.username });
    if (user) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json(
          {
            errors: errors.array()
          }
        );
        return;
      }
      try {
        const post = new Post({
          title: req.body.title,
          content: req.body.content,
          author: req.user.username,
          user_post: true

        });
        const saved = await post.save();
        await User.findOneAndUpdate(
          { username: req.params.username },
          { $push: { posts: saved._id } }
        );
        res.status(201).json({
          post_id: saved._id
        });
        return;
      } catch (err) {
        next(err);
      }
    }
    next();
  }
];

exports.get_user_post = [
  param('username')
    .trim()
    .escape(),
  param('postid')
    .trim()
    .escape(),
  async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.postid)) {
      next();
      return;
    }
    try {
      const user = await User.findOne({ username: req.params.username }).populate('posts');
      if (user && !user.deleted) {
        const post = user.posts.filter(post =>
          post._id.toString() === req.params.postid
        )[0];
        if (post) {
          const comments = await Comment.find({ post_parent: post._id });
          res.status(200).json(
            {
              user: {
                username: req.params.username,
                post_score: user.post_score,
                comment_score: user.comment_score,
                admin: user.admin,
                moderator: user.moderator
              },
              post: {
                title: post.title,
                content: post.content,
                author: post.author,
                score: post.score,
                date_posted: post.date_posted,
                date_edited: post.date_edited
              },
              comments
            }
          );
          return;
        }
      }
      next();
    } catch (err) {
      next(err);
    }
  }
];

exports.update_user_post = [
  passport.authenticate('jwt', { session: false }),
  param('username')
    .trim()
    .escape(),
  param('postid')
    .trim()
    .escape(),
  body('content')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Content is required')
    .escape()
    .isLength({ max: 10000 })
    .withMessage('Content is too long'),
  async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.postid)) {
      next();
      return;
    }
    if (req.user.username !== req.params.username && !req.user.admin) {
      res.sendStatus(403);
      return;
    }
    const user = await User.findOne({ username: req.params.username });
    if (user) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json(
          {
            errors: errors.array()
          }
        );
        return;
      }
      try {
        const updates = {};
        updates.content = req.body.content;
        updates.date_edited = Date.now();
        const post = await Post.findByIdAndUpdate(req.params.postid, updates);
        if (post) {
          res.sendStatus(200);
          return;
        }
      } catch (err) {
        next(err);
      }
    }
    next();
    return;
  }
];

exports.delete_user_post = [
  passport.authenticate('jwt', { session: false }),
  param('username')
    .trim()
    .escape(),
  param('postid')
    .trim()
    .escape(),
  async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.postid)) {
      next();
      return;
    }
    if (req.user.username !== req.params.username && !req.user.admin) {
      res.sendStatus(403);
      return;
    }
    const user = await User.findOne({ username: req.params.username });
    if (user) {
      try {
        const deleteUpdate = {};
        if (req.user.username === req.params.username) {
          deleteUpdate.title = '[Deleted by user]';
          deleteUpdate.content = '[Deleted by user]';
          deleteUpdate.author = '[Deleted]';
        } else {
          deleteUpdate.title = '[Removed by admin]';
          deleteUpdate.content = '[Removed by admin]';
          deleteUpdate.author = '[Removed]';
        }
        const post = await Post.findByIdAndUpdate(req.params.postid, deleteUpdate);
        await User.findOneAndUpdate(
          { username: req.params.username },
          { $pull: { posts: req.params.postid } }
        );
        if (post) {
          res.sendStatus(200);
          return;
        }
      } catch (err) {
        next(err);
      }
    }
    next();
    return;
  }
];

exports.create_comment = [
  passport.authenticate('jwt', { session: false }),
  param('username')
    .trim()
    .escape(),
  param('postid')
    .trim()
    .escape(),
  body('content')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Content is required')
    .escape()
    .isLength({ max: 10000 })
    .withMessage('Content is too long'),
  async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.postid)) {
      next();
      return;
    }
    try {
      const originalPoster = await User.findOne({ username: req.params.username });
      if (!originalPoster || originalPoster.deleted) {
        next();
        return;
      }
      const post = await Post.findById(req.params.postid);
      if (post) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          res.status(400).json(
            {
              errors: errors.array()
            }
          );
          return;
        }
        const comment = await new Comment(
          {
            content: req.body.content,
            author: req.user.username,
            post_parent: req.params.postid
          }
        ).save();
        await User.findOneAndUpdate(
          { username: req.user.username },
          { $push: { comments: comment._id } }
        )
        res.sendStatus(201);
        return;
      }
      next();
    } catch (err) {
      next(err);
    }
  }
];

exports.update_comment = [
  passport.authenticate('jwt', { session: false }),
  param('username')
    .trim()
    .escape(),
  param('postid')
    .trim()
    .escape(),
  param('commentid')
    .trim()
    .escape(),
  body('content')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Content is required')
    .escape()
    .isLength({ max: 10000 })
    .withMessage('Content is too long'),
  async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.postid)
      || !mongoose.Types.ObjectId.isValid(req.params.commentid)) {
      next();
      return;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json(
        {
          errors: errors.array()
        }
      );
      return;
    }
    try {
      const originalPoster = await User.findOne({ username: req.params.username });
      if (!originalPoster) {
        next();
        return;
      }
      const comment = await Comment.findById(req.params.commentid);
      if (comment && comment.post_parent.toString() === req.params.postid) {
        if (req.user.username !== comment.author) {
          res.sendStatus(403);
          return;
        }
        const updates = {
          content: req.body.content,
          date_edited: Date.now()
        }
        await comment.updateOne(updates);
        res.sendStatus(200);
        return;
      }
      next();
      return;
    } catch (err) {
      next(err);
    }
  }
];

exports.delete_comment = [
  passport.authenticate('jwt', { session: false }),
  param('username')
    .trim()
    .escape(),
  param('postid')
    .trim()
    .escape(),
  param('commentid')
    .trim()
    .escape(),
  async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.postid)
      || !mongoose.Types.ObjectId.isValid(req.params.commentid)) {
      next();
      return;
    }
    try {
      const originalPoster = await User.findOne({ username: req.params.username });
      if (!originalPoster) {
        next();
        return;
      }
      if (await Post.findById(req.params.postid)) {
        const comment = await Comment.findById(req.params.commentid);
        if (comment) {
          if (!comment.author
            || req.user.username !== comment.author && !req.user.admin) {
            res.sendStatus(403);
            return;
          }
          const updates = {};
          if (req.user.username === comment.author) {
            updates.content = '[Deleted]';
            updates.author = '[Deleted]';
          } else {
            updates.content = '[Removed]';
            updates.author = '[Removed]';
          }
          await User.findOneAndUpdate(
            { username: comment.author },
            { $pull: { comments: comment._id } }
          );
          await comment.updateOne(updates);
          res.sendStatus(200);
          return;
        }
      }
      next();
      return;
    } catch (err) {
      next(err);
    }
  }
];

exports.create_comment_child = [
  passport.authenticate('jwt', { session: false }),
  param('username')
    .trim()
    .escape(),
  param('postid')
    .trim()
    .escape(),
  param('commentid')
    .trim()
    .escape(),
  body('content')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Content is required')
    .escape()
    .isLength({ max: 10000 })
    .withMessage('Content is too long'),
  async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.postid)
      || !mongoose.Types.ObjectId.isValid(req.params.commentid)) {
      next();
      return;
    }
    try {
      const originalPoster = await User.findOne({ username: req.params.username });
      if (!originalPoster || originalPoster.deleted) {
        next();
        return;
      }
      const post = await Post.findById(req.params.postid);
      if (post) {
        const parentComment = await Comment.findById(req.params.commentid);
        if (parentComment) {
          const errors = validationResult(req);
          if (!errors.isEmpty()) {
            res.status(400).json(
              {
                errors: errors.array()
              }
            );
            return;
          }
          const childComment = await new Comment(
            {
              content: req.body.content,
              author: req.user.username,
              post_parent: req.params.postid,
              comment_parent: req.params.commentid
            }
          ).save();
          await User.findOneAndUpdate(
            { username: req.user.username },
            { $push: { comments: childComment._id } }
          );
          res.sendStatus(201);
          return;
        }
      }
      next();
      return;
    } catch (err) {
      next(err);
    }
  }
];

exports.get_user_comments = [
  param('username')
    .trim()
    .escape(),
  async (req, res, next) => {
    try {
      const user = await User.findOne({ username: req.params.username }).populate('comments');
      if (user && !user.deleted) {
        const comments = user.comments.sort((a, b) => a.date_posted <= b.date_posted);
        res.status(200).json(
          {
            post_score: user.post_score,
            comment_score: user.comment_score,
            admin: user.admin,
            moderator: user.moderator,
            comments
          }
        );
        return;
      }
      next();
      return;
    } catch (err) {
      next(err);
    }
  }
];

exports.get_user_posts = [
  param('username')
    .trim()
    .escape(),
  async (req, res, next) => {
    try {
      const user = await User.findOne({ username: req.params.username }).populate('posts');
      if (user && !user.deleted) {
        const posts = user.posts.sort((a, b) => a.date_posted <= b.date_posted);
        res.status(200).json(
          {
            post_score: user.post_score,
            comment_score: user.comment_score,
            admin: user.admin,
            moderator: user.moderator,
            posts
          }
        );
        return;
      }
      next();
      return;
    } catch (err) {
      next(err);
    }
  }
];

exports.get_user_upvotes = [
  passport.authenticate('jwt', { session: false }),
  param('username')
    .trim()
    .escape(),
  async (req, res, next) => {
    if (req.user.username !== req.params.username) {
      res.sendStatus(403);
      return;
    }
    try {
      const user = await User.findOne({ username: req.params.username }).populate(['upvoted_posts', 'upvoted_comments']);
      if (user && !user.deleted) {
        const upvotedPosts = user.upvoted_posts.sort((a, b) => a.date_posted <= b.date_posted);
        const upvotedComments = user.upvoted_comments.sort((a, b) => a.date_posted <= b.date_posted);
        res.status(200).json(
          {
            post_score: user.post_score,
            comment_score: user.comment_score,
            admin: user.admin,
            moderator: user.moderator,
            upvotedPosts,
            upvotedComments
          }
        );
        return;
      }
      next();
      return;
    } catch (err) {
      next(err);
    }
  }
];

exports.get_user_downvotes = [
  passport.authenticate('jwt', { session: false }),
  param('username')
    .trim()
    .escape(),
  async (req, res, next) => {
    if (req.user.username !== req.params.username) {
      res.sendStatus(403);
      return;
    }
    try {
      const user = await User.findOne({ username: req.params.username }).populate(['downvoted_posts', 'downvoted_comments']);
      if (user && !user.deleted) {
        const downvotedPosts = user.downvoted_posts.sort((a, b) => a.date_posted <= b.date_posted);
        const downvotedComments = user.downvoted_comments.sort((a, b) => a.date_posted <= b.date_posted);
        res.status(200).json(
          {
            post_score: user.post_score,
            comment_score: user.comment_score,
            admin: user.admin,
            moderator: user.moderator,
            downvotedPosts,
            downvotedComments
          }
        );
        return;
      }
      next();
      return;
    } catch (err) {
      next(err);
    }
  }
];
