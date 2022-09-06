const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

router.post('/', [
  body('username')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Username is required')
    .escape(),
  body('password')
    .trim()
    .escape()
    .isLength({ min: 1 })
    .withMessage('Password is required'),
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
      const user = await User.findOne({ username: req.body.username });
      if (user) {
        const valid = await bcrypt.compare(req.body.password, user.password);
        if (valid) {
          const payload = {
            username: user.username
          };
          const opt = {};
          opt.expiresIn = 600;
          const token = jwt.sign(payload, process.env.JWT_SECRET, opt);
          res.status(200).json(
            {
              token
            }
          );
          return;
        }
      }
      res.status(400).json(
        {
          errors: 'Username or password is incorrect'
        }
      );
      return;
    } catch (err) {
      next(err);
    }
  }
]);

module.exports = router;