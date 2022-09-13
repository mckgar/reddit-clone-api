const Subreddit = require('../models/subreddit');
const { body, param, validationResult } = require('express-validator');
const passport = require('passport');
const User = require('../models/user');
const Post = require('../models/post');
const Comment = require('../models/comment');
const { default: mongoose } = require('mongoose');
require('../passport');

exports.create_subreddit = [
  passport.authenticate('jwt', { session: false }),
  (req, res, next) => {
    if (req.user.deleted) {
      res.sendStatus(403);
      return;
    }
    next();
  },
  body('subreddit')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Must include subreddit name')
    .isLength({ max: 20 })
    .withMessage('Subreddit name is too long')
    .escape()
    .custom(async value => {
      try {
        const search = await Subreddit.find({ name: value });
        if (search.length > 0) {
          return Promise.reject('Subreddit name is already in use');
        }
      } catch (err) {
        console.log(err);
        return Promise.reject('An error has occured');
      }
    }),
  async (req, res, next) => {
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
      await new Subreddit(
        {
          name: req.body.subreddit,
          creator: req.user.username
        }
      ).save();
      await Subreddit.updateOne(
        { name: req.body.subreddit },
        { $push: { moderators: req.user.username } }
      );
      await User.updateOne(
        { username: req.user.username },
        { $push: { moderator: req.body.subreddit } }
      );
      res.sendStatus(201);
      return;
    } catch (err) {
      next(err);
    }
  }
];

exports.get_subreddit = [
  param('subreddit')
    .trim()
    .escape(),
  async (req, res, next) => {
    try {
      const subreddit = await Subreddit.findOne({ name: req.params.subreddit }).populate('posts');
      if (subreddit) {
        const info = {
          banned: subreddit.banned
        };
        if (subreddit.banned) {
          info.date_banned = subreddit.date_banned;
        } else {
          info.description = subreddit.description;
          info.creator = subreddit.creator;
          info.date_created = subreddit.date_created;
          info.subscribers = subreddit.subscribers.length;
          info.moderators = subreddit.moderators;
        }
        res.status(200).json(
          {
            info,
            posts: subreddit.posts
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

exports.update_subreddit = [
  passport.authenticate('jwt', { session: false }),
  param('subreddit')
    .trim()
    .escape(),
  body('description')
    .trim()
    .escape()
    .isLength({ max: 10000 })
    .withMessage('Description is too long')
    .optional(),
  body('addModerator')
    .trim()
    .escape()
    .isLength({ min: 1 })
    .withMessage('Invalid username')
    .isLength({ max: 20 })
    .withMessage('Invalid username')
    .custom(async value => {
      try {
        const user = await User.findOne({ username: value });
        if (!user) {
          return Promise.reject('User not found')
        }
      } catch (err) {
        console.log(err);
        return Promise.reject('An error has occured')
      }
    })
    .optional(),
  body('removeModerator')
    .trim()
    .escape()
    .isLength({ min: 1 })
    .withMessage('Invalid username')
    .isLength({ max: 20 })
    .withMessage('Invalid username')
    .custom(async value => {
      try {
        const user = await User.findOne({ username: value });
        if (!user) {
          return Promise.reject('User not found')
        }
      } catch (err) {
        console.log(err);
        return Promise.reject('An error has occured')
      }
    })
    .optional(),
  body('ban')
    .trim()
    .escape()
    .isBoolean()
    .optional(),
  (req, res, next) => {
    const isMod = req.user.moderator.filter(a => a === req.params.subreddit).length;
    if ((!req.user.admin && !isMod)
      || ((req.body.ban === false || req.body.ban) && !req.user.admin)) {
      res.sendStatus(403);
      return;
    }
    next();
  },
  async (req, res, next) => {
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
      const sub = await Subreddit.findOne({ name: req.params.subreddit });
      if (!sub) {
        next();
        return;
      }
      if (req.body.description) {
        await Subreddit.updateOne(
          { name: req.params.subreddit },
          { description: req.body.description }
        );
      }
      if (req.body.addModerator) {
        await Subreddit.findOneAndUpdate(
          { name: req.params.subreddit },
          { $push: { moderators: req.body.addModerator } }
        );
        await User.findOneAndUpdate(
          { username: req.body.addModerator },
          { $push: { moderator: req.params.subreddit } }
        );
      }
      if (req.body.removeModerator) {
        await Subreddit.findOneAndUpdate(
          { name: req.params.subreddit },
          { $pull: { moderators: req.body.removeModerator } }
        );
        await User.findOneAndUpdate(
          { username: req.body.removeModerator },
          { $pull: { moderator: req.params.subreddit } }
        );
      }
      if (typeof req.body.ban !== undefined) {
        await Subreddit.findOneAndUpdate(
          { name: req.params.subreddit },
          { banned: req.body.ban }
        );
      }
      res.sendStatus(200);
      return;
    } catch (err) {
      next(err);
    }
  }
];

exports.create_post = [
  passport.authenticate('jwt', { session: false }),
  param('subreddit')
    .trim()
    .escape(),
  body('title')
    .trim()
    .escape()
    .isLength({ min: 1 })
    .withMessage('Title is required')
    .isLength({ max: 300 })
    .withMessage('Title is too long'),
  body('content')
    .trim()
    .escape()
    .isLength({ max: 300 })
    .withMessage('Content is too long')
    .optional(),
  async (req, res, next) => {
    const errors = validationResult(req);
    try {
      const subreddit = await Subreddit.findOne({ name: req.params.subreddit });
      if (subreddit) {
        if (subreddit.banned_users.find(user => { return user === req.user.username })) {
          res.sendStatus(403);
          return;
        }
        if (!errors.isEmpty()) {
          res.status(400).json(
            {
              errors: errors.array()
            }
          );
          return;
        }
        const post = new Post({
          title: req.body.post,
          author: req.user.username
        });
        if (req.body.content) post.content = req.body.content;
        const saved = await post.save();
        await User.findOneAndUpdate(
          { username: req.user.username },
          { $push: { posts: saved._id } }
        );
        await Subreddit.findOneAndUpdate(
          { name: req.params.subreddit },
          { $push: { posts: saved._id } }
        );
        res.status(201).json(
          {
            post_id: saved._id
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

exports.get_post = [
  param('subreddit')
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
      const subreddit = await Subreddit.findOne({ name: req.params.subreddit });
      if (subreddit) {
        const info = {
          banned: subreddit.banned
        };
        if (subreddit.banned) {
          info.date_banned = subreddit.date_banned;
          res.status(200).json(
            {
              info
            }
          );
          return;
        }
        info.description = subreddit.description;
        info.creator = subreddit.creator;
        info.date_created = subreddit.date_created;
        info.subscribers = subreddit.subscribers.length;
        info.moderators = subreddit.moderators;
        const post = await Post.findById(req.params.postid);
        if (post && post.subreddit === req.params.subreddit) {
          const postInfo = {
            title: post.title,
            content: post.content,
            author: post.author,
            score: post.score,
            date_posted: post.date_posted,
            date_edited: post.date_edited
          };
          const comments = await Comment.find({ post_parent: req.params.postid });
          res.status(200).json(
            {
              info,
              post: postInfo,
              comments
            }
          );
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

exports.update_post = [
  passport.authenticate('jwt', { session: false }),
  param('subreddit')
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
    .isLength({ max: 50000 })
    .withMessage('Post content is too long')
    .optional(),
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
        const subreddit = await Subreddit.findOne({ name: req.params.subreddit });
        if (subreddit) {
          if (subreddit.banned) {
            res.sendStatus(403);
            return;
          }
          const post = await Post.findById(req.params.postid);
          if (post && post.subreddit === req.params.subreddit) {
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
        }
        next();
        return;
      } catch (err) {
        next(err);
      }
    }
    try {
      const subreddit = await Subreddit.findOne({ name: req.params.subreddit });
      if (subreddit) {
        if (subreddit.banned) {
          res.sendStatus(403);
          return;
        }
        const post = await Post.findById(req.params.postid);
        if (post && post.subreddit === req.params.subreddit) {
          if (req.user.username !== post.author && !req.user.admin) {
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
          await post.updateOne(
            { content: req.body.content }
          );
          res.status(200).json();
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

exports.delete_post = [
  passport.authenticate('jwt', { session: false }),
  param('subreddit')
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
      const subreddit = await Subreddit.findOne({ name: req.params.subreddit });
      if (subreddit) {
        const post = await Post.findById(req.params.postid);
        if (post && post.subreddit === req.params.subreddit) {
          const update = {
            author: '[Deleted]'
          };
          if (req.user.username === post.author) {
            update.title = '[Deleted by user]';
            update.content = '[Deleted by user]';
          } else if (subreddit.moderators.find(user => { return user === req.user.username })) {
            update.title = '[Removed by mods]';
            update.content = '[Removed by mods]';
          } else if (req.user.admin) {
            update.title = '[Removed by admins]';
            update.content = '[Removed by admins]';
          } else {
            res.sendStatus(403);
            return;
          }
          await User.findOneAndUpdate(
            { username: post.author },
            { $push: { posts: req.params.postid } }
          );
          await post.updateOne(update);
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

exports.create_comment = [
  passport.authenticate('jwt', { session: false }),
  param('subreddit')
    .trim()
    .escape(),
  param('postid')
    .trim()
    .escape(),
  body('content')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Comment is required')
    .escape()
    .isLength({ max: 10000 })
    .withMessage('Comment is too long'),
  async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.postid)) {
      next();
      return;
    }
    try {
      const subreddit = await Subreddit.findOne({ name: req.params.subreddit });
      if (subreddit) {
        if (subreddit.banned_users.find(user => { return user === req.user.username })
          || subreddit.banned) {
          res.sendStatus(403);
          return;
        }
        const post = await Post.findById(req.params.postid);
        if (post && post.subreddit === req.params.subreddit) {
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
          );
          res.sendStatus(201);
          return;
        }
      }
      next();
      return;
    } catch (err) {
      next(err)
    }
  }
];

exports.update_comment = [
  passport.authenticate('jwt', { session: false }),
  param('subreddit')
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
    .withMessage('Comment is required')
    .escape()
    .isLength({ max: 10000 })
    .withMessage('Comment is too long'),
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
        const subreddit = await Subreddit.findOne({ name: req.params.subreddit });
        if (subreddit) {
          if (subreddit.banned) {
            res.sendStatus(403);
            return;
          }
          const post = await Post.findById(req.params.postid);
          if (post && post.subreddit === req.params.subreddit) {
            const comment = await Comment.findById(req.params.commentid);
            if (comment && comment.post_parent.toString() === req.params.postid) {
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
          }
        }
        next();
        return;
      } catch (err) {
        next(err);
      }
    }
    try {
      const subreddit = await Subreddit.findOne({ name: req.params.subreddit });
      if (subreddit) {
        if (subreddit.banned) {
          res.sendStatus(403);
          return;
        }
        const post = await Post.findById(req.params.postid);
        if (post && post.subreddit === req.params.subreddit) {
          const comment = await Comment.findById(req.params.commentid);
          if (comment && comment.post_parent.toString() === post._id.toString()) {
            if (req.user.username !== comment.author && !req.user.admin) {
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
            await comment.updateOne(
              {
                content: req.body.content,
                date_edited: Date.now()
              }
            );
            res.sendStatus(200);
            return;
          }
        }
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
  param('subreddit')
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
      const subreddit = await Subreddit.findOne({ name: req.params.subreddit });
      if (subreddit) {
        const post = await Post.findById(req.params.postid);
        if (post && post.subreddit === req.params.subreddit) {
          const comment = await Comment.findById(req.params.commentid);
          if (comment && comment.post_parent.toString() === post._id.toString()) {
            const updates = {
              author: '[Deleted]'
            };
            if (req.user.username === comment.author) {
              updates.content = '[Deleted by user]';
            } else if (subreddit.moderators.find(mod => { return mod === req.user.username })) {
              updates.content = '[Removed by mods]';
            } else if (req.user.admin) {
              updates.content = '[Removed by admins]';
            } else {
              res.sendStatus(403);
              return;
            }
            await User.findOneAndUpdate(
              { username: comment.author },
              { $pull: { comments: req.params.commentid } }
            );
            await comment.updateOne(updates);
            res.sendStatus(200);
            return;
          }
        }
      }
      next();
      return;
    } catch (err) {
      next(err);
    }
    res.sendStatus(200);
    return;
  }
];

exports.create_comment_child = [
  passport.authenticate('jwt', { session: false }),
  param('subreddit')
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
    .withMessage('Comment is required')
    .escape()
    .isLength({ max: 10000 })
    .withMessage('Comment is too long'),
  async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.postid)
      || !mongoose.Types.ObjectId.isValid(req.params.commentid)) {
      next();
      return;
    }
    try {
      const subreddit = await Subreddit.findOne({ name: req.params.subreddit });
      if (subreddit) {
        if (subreddit.banned_users.find(user => { return user === req.user.username })
          || subreddit.banned) {
          res.sendStatus(403);
          return;
        }
        const post = await Post.findById(req.params.postid);
        if (post && post.subreddit === req.params.subreddit) {
          const parent = await Comment.findById(req.params.commentid);
          if (parent && parent.post_parent.toString() === req.params.postid) {
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
                post_parent: req.params.postid,
                comment_parent: req.params.commentid
              }
            ).save();
            await User.findOneAndUpdate(
              { username: req.user.username },
              { $push: { comments: comment._id } }
            );
            res.sendStatus(201);
            return;
          }
        }
      }
      next();
      return;
    } catch (err) {
      next(err)
    }
  }
];
