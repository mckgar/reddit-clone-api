const Subreddit = require('../models/subreddit');
const { body, param, validationResult } = require('express-validator');
const passport = require('passport');
const User = require('../models/user');
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
