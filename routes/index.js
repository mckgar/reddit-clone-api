const express = require('express');
const router = express.Router();
const userRoute = require('./user');
const loginRoute = require('./login');
const subredditRoute = require('./subreddit');
const passport = require('passport');
const User = require('../models/user');
const Post = require('../models/post');
const { query, validationResult } = require('express-validator');

router.get('/',
  passport.authenticate('jwt', { failureRedirect: '/all', session: false }),
  query('start')
    .trim()
    .escape()
    .isNumeric()
    .optional(),
  query('order')
    .trim()
    .escape()
    .isAlpha()
    .optional(),
  query('time')
    .trim()
    .escape()
    .isAlpha()
    .optional(),
  async (req, res, next) => {
    let start = 0;
    let order = 'hot';
    let time = 'all';
    if (validationResult(req).isEmpty()) {
      if (req.query.start) start = req.query.start;
      if (req.query.order) order = req.query.order;
      if (req.query.time) time = req.query.time;
    }
    try {
      const user = await User.findOne({ username: req.user.username });
      let posts;
      if (order === 'new') {
        posts = await Post.find(
          {
            $or:
              [
                { username: { $in: user.following }, user_post: true },
                { subreddit: { $in: user.subscriptions } }
              ]
          }
        ).sort({ date_posted: 'desc' });
      } else if (order === 'top') {
        let timeLimit = 0;
        switch (time) {
          case 'year':
            timeLimit = Date.now().valueOf() - 31557600000;
            break;
          case 'month':
            timeLimit = Date.now().valueOf() - 2678400000;
            break;
          case 'week':
            timeLimit = Date.now().valueOf() - 604800000;
            break;
          case 'day':
            timeLimit = Date.now().valueOf() - 86400000;
            break;
          case 'hour':
            timeLimit = Date.now().valueOf() - 3600000;
            break;
          default:
            break;
        }
        posts = await Post.find(
          {
            $or:
              [
                { username: { $in: user.following }, user_post: true, date_posted: { $gte: new Date(timeLimit) } },
                { subreddit: { $in: user.subscriptions }, date_posted: { $gte: new Date(timeLimit) } }
              ]
          }
        ).sort({ score: 'desc' });
      } else {
        posts = await Post.find(
          {
            $or:
              [
                { username: { $in: user.following }, user_post: true },
                { subreddit: { $in: user.subscriptions } }
              ]
          }
        );
        posts = posts.sort((a, b) => {
          const aTimeUp = Date.now().valueOf() - a.date_posted.valueOf();
          const bTimeUp = Date.now().valueOf() - b.date_posted.valueOf();
          return (b.score / bTimeUp) - (a.score / aTimeUp);
        });
      }
      res.status(200).json(
        {
          posts: posts.slice(start, start + 20)
        }
      );
      return;
    } catch (err) {
      next(err);
    }
  }
);

router.get('/all',
  query('start')
    .trim()
    .escape()
    .isNumeric()
    .optional(),
  query('order')
    .trim()
    .escape()
    .isAlpha()
    .optional(),
  query('time')
    .trim()
    .escape()
    .isAlpha()
    .optional(),
  async (req, res, next) => {
    let start = 0;
    let order = 'hot';
    let time = 'all';
    if (validationResult(req).isEmpty()) {
      if (req.query.start) start = req.query.start;
      if (req.query.order) order = req.query.order;
      if (req.query.time) time = req.query.time;
    }
    try {
      let posts;
      if (order === 'new') {
        posts = await Post.find({ user_post: false }).sort({ date_posted: 'desc' });
      } else if (order === 'top') {
        let timeLimit = 0;
        switch (time) {
          case 'year':
            timeLimit = Date.now().valueOf() - 31557600000;
            break;
          case 'month':
            timeLimit = Date.now().valueOf() - 2678400000;
            break;
          case 'week':
            timeLimit = Date.now().valueOf() - 604800000;
            break;
          case 'day':
            timeLimit = Date.now().valueOf() - 86400000;
            break;
          case 'hour':
            timeLimit = Date.now().valueOf() - 3600000;
            break;
          default:
            break;
        }
        posts = await Post.find(
          { date_posted: { $gte: new Date(timeLimit) }, user_post: false })
          .sort({ score: 'desc' });
      } else {
        posts = await Post.find({ user_post: false });
        posts = posts.sort((a, b) => {
          const aTimeUp = Date.now().valueOf() - a.date_posted.valueOf();
          const bTimeUp = Date.now().valueOf() - b.date_posted.valueOf();
          return (b.score / bTimeUp) - (a.score / aTimeUp);
        });
      }
      res.status(200).json(
        {
          posts: posts.slice(start, start + 20)
        }
      );
      return;
    } catch (err) {
      next(err);
    }
  }
);

router.use('/user', userRoute);
router.use('/login', loginRoute);
router.use('/r', subredditRoute);

module.exports = router;
