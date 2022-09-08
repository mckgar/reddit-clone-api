const express = require('express');
const router = express.Router();
const userRoute = require('./user');
const loginRoute = require('./login');
const subredditRoute = require('./subreddit');

router.use('/user', userRoute);
router.use('/login', loginRoute);
router.use('/r', subredditRoute);

module.exports = router;
