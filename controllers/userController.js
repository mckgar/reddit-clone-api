const User = require('../models/user');
const { body, param, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
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
      res.sendStatus(404);
      return;
    } catch (err) {
      next(err)
    }
  }
];
