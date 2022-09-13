const User = require('../models/user');
const Post = require('../models/post');
const Comment = require('../models/comment');
const { body, param, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const mongoose = require('mongoose');
const Subreddit = require('../models/subreddit');
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
        const updates = {
          deleted: true,
          password: null,
          post_score: null,
          comment_score: null,
          email: null,
          admin: null,
          moderator: null,
          subscriptions: null,
          following: null,
          followers: null,
          blocked: null,
          posts: null,
          comments: null,
          upvoted_posts: null,
          upvoted_comments: null,
          downvoted_posts: null,
          downvoted_comments: null,
          chats: null
        };
        if (user.following.length > 0) {
          for (const following of user.following) {
            await following.updateOne(
              { $pull: { followers: req.user.username } }
            );
          }
        }
        if (user.followers.length > 0) {
          for (const follower of user.followers) {
            await follower.updateOne(
              { $pull: { following: req.user.username } }
            );
          }
        }
        //remove from subreddit subscribers when made
        //remove from subreddit moderators when made
        //remove from chats when made
        await Post.updateMany(
          { author: req.params.username },
          { author: '[Deleted]' }
        );
        await Comment.updateMany(
          { author: req.params.username },
          { author: '[Deleted]' }
        );
        await user.updateOne(updates);
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
  body('subscribe')
    .trim()
    .escape()
    .isLength({ max: 20 })
    .withMessage('Invalid subreddit')
    .custom(async value => {
      try {
        const subreddit = await Subreddit.findOne({ name: value });
        if (subreddit && !subreddit.banned) {
          return true;
        } else {
          return Promise.reject('Invalid subreddit');
        }
      } catch (err) {
        console.log(err);
        return Promise.reject('An error has occured');
      }
    })
    .optional(),
  body('follow')
    .trim()
    .escape()
    .isLength({ max: 20 })
    .withMessage('Invalid user')
    .custom(async value => {
      try {
        const user = await User.findOne({ username: value });
        if (user && !user.deleted) {
          return true;
        } else {
          return Promise.reject('Invalid user');
        }
      } catch (err) {
        console.log(err);
        return Promise.reject('An error has occured');
      }
    })
    .optional(),
  async (req, res, next) => {
    if ((req.user.username !== req.params.username && !req.user.admin)
      || (req.body.admin && !req.user.admin)
      || ((req.body.email || req.body.password) && req.user.username !== req.params.username)
    ) {
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
      if (req.body.subscribe && req.params.username === req.user.username) {
        const subreddit = await Subreddit.findOne({ name: req.body.subscribe });
        const user = await User.findOne({ username: req.params.username });
        if (!user.subscriptions.find(s => s === req.body.subscribe)) {
          await user.updateOne(
            { $push: { subscriptions: req.body.subscribe } }
          );
          await subreddit.updateOne(
            { $push: { subscribers: req.params.username } }
          );
          res.sendStatus(200);
          return;
        } else {
          await user.updateOne(
            { $pull: { subscriptions: req.body.subscribe } }
          );
          await subreddit.updateOne(
            { $pull: { subscribers: req.params.username } }
          );
          res.sendStatus(200);
          return;
        }
      }
      if (req.body.follow && req.params.username === req.user.username) {
        const follower = await User.findOne({ username: req.params.username });
        const user = await User.findOne({ username: req.body.follow });
        if (!follower.following.find(s => s === req.body.follow)) {
          await follower.updateOne(
            { $push: { following: req.body.follow } }
          );
          await user.updateOne(
            { $push: { followers: req.params.username } }
          );
          res.sendStatus(200);
          return;
        } else {
          await follower.updateOne(
            { $pull: { following: req.body.follow } }
          );
          await user.updateOne(
            { $pull: { followers: req.params.username } }
          );
          res.sendStatus(200);
          return;
        }
      }
      const updates = {};
      if (req.body.email) updates.email = req.body.email;
      if (req.body.password) {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        updates.password = hashedPassword;
      }
      if (req.body.admin) updates.admin = req.body.admin;
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
  body('vote')
    .trim()
    .escape()
    .custom(value => {
      if (value !== 'upvote' && value !== 'downvote') {
        throw new Error('Invalid vote operation');
      } else {
        return true;
      }
    })
    .optional(),
  async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.postid)) {
      next();
      return;
    }
    if (req.body.vote) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        if (errors.array().find(e => e.param === 'vote')) {
          res.status(400).json(
            {
              errors: errors.array()
            }
          );
          return;
        }
      }
      try {
        const post = await Post.findById(req.params.postid);
        if (post) {
          const voter = await User.findOne({ username: req.user.username });
          if (req.body.vote === 'upvote') {
            const hasUpvoted = voter.upvoted_posts.find(p => p.toString() === req.params.postid.toString());
            const hasDownvoted = voter.downvoted_posts.find(p => p.toString() === req.params.postid.toString());
            if (hasUpvoted) {
              await post.updateOne(
                { $inc: { score: -1 } }
              );
              await voter.updateOne(
                { $pull: { upvoted_posts: post._id } }
              );
            } else if (hasDownvoted) {
              await post.updateOne(
                { $inc: { score: 2 } }
              );
              await voter.updateOne(
                { $pull: { downvoted_posts: post._id } }
              );
              await voter.updateOne(
                { $push: { upvoted_posts: post._id } }
              );
            } else {
              await post.updateOne(
                { $inc: { score: 1 } }
              );
              await voter.updateOne(
                { $push: { upvoted_posts: post._id } }
              );
            }
            res.sendStatus(200);
            return;
          } else {
            const hasUpvoted = voter.upvoted_posts.find(p => p.toString() === req.params.postid.toString());
            const hasDownvoted = voter.downvoted_posts.find(p => p.toString() === req.params.postid.toString());
            if (hasDownvoted) {
              await post.updateOne(
                { $inc: { score: 1 } }
              );
              await voter.updateOne(
                { $pull: { downvoted_posts: post._id } }
              );
            } else if (hasUpvoted) {
              await post.updateOne(
                { $inc: { score: -2 } }
              );
              await voter.updateOne(
                { $pull: { upvoted_posts: post._id } }
              );
              await voter.updateOne(
                { $push: { downvoted_posts: post._id } }
              );
            } else {
              await post.updateOne(
                { $inc: { score: -1 } }
              );
              await voter.updateOne(
                { $push: { downvoted_posts: post._id } }
              );
            }
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
    if (req.user.username !== req.params.username && !req.user.admin) {
      res.sendStatus(403);
      return;
    }
    try {
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
        const updates = {};
        updates.content = req.body.content;
        updates.date_edited = Date.now();
        const post = await Post.findByIdAndUpdate(req.params.postid, updates);
        if (post) {
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
  body('vote')
    .trim()
    .escape()
    .custom(value => {
      if (value !== 'upvote' && value !== 'downvote') {
        throw new Error('Invalid vote operation');
      } else {
        return true;
      }
    })
    .optional(),
  async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.postid)
      || !mongoose.Types.ObjectId.isValid(req.params.commentid)) {
      next();
      return;
    }
    if (req.body.vote) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        if (errors.array().find(e => e.param === 'vote')) {
          res.status(400).json(
            {
              errors: errors.array()
            }
          );
          return;
        }
      }
      try {
        const comment = await Comment.findById(req.params.commentid);
        if (comment) {
          const voter = await User.findOne({ username: req.user.username });
          if (req.body.vote === 'upvote') {
            const hasUpvoted = voter.upvoted_comments.find(p => p.toString() === req.params.commentid.toString());
            const hasDownvoted = voter.downvoted_comments.find(p => p.toString() === req.params.commentid.toString());
            if (hasUpvoted) {
              await comment.updateOne(
                { $inc: { score: -1 } }
              );
              await voter.updateOne(
                { $pull: { upvoted_posts: comment._id } }
              );
            } else if (hasDownvoted) {
              await comment.updateOne(
                { $inc: { score: 2 } }
              );
              await voter.updateOne(
                { $pull: { downvoted_comments: comment._id } }
              );
              await voter.updateOne(
                { $push: { upvoted_comments: comment._id } }
              );
            } else {
              await comment.updateOne(
                { $inc: { score: 1 } }
              );
              await voter.updateOne(
                { $push: { upvoted_comments: comment._id } }
              );
            }
            res.sendStatus(200);
            return;
          } else {
            const hasUpvoted = voter.upvoted_comments.find(p => p.toString() === req.params.commentid.toString());
            const hasDownvoted = voter.downvoted_comments.find(p => p.toString() === req.params.commentid.toString());
            if (hasDownvoted) {
              await comment.updateOne(
                { $inc: { score: 1 } }
              );
              await voter.updateOne(
                { $pull: { downvoted_comments: comment._id } }
              );
            } else if (hasUpvoted) {
              await comment.updateOne(
                { $inc: { score: -2 } }
              );
              await voter.updateOne(
                { $pull: { upvoted_comments: comment._id } }
              );
              await voter.updateOne(
                { $push: { downvoted_comments: comment._id } }
              );
            } else {
              await comment.updateOne(
                { $inc: { score: -1 } }
              );
              await voter.updateOne(
                { $push: { downvoted_comments: comment._id } }
              );
            }
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
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          res.status(400).json(
            {
              errors: errors.array()
            }
          );
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
