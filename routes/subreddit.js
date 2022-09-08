const router = require('express').Router();
const subredditController = require('../controllers/subredditController');

router.post('/', subredditController.create_subreddit);

router.get('/:subreddit', subredditController.get_subreddit);
router.put('/:subreddit', subredditController.update_subreddit);

module.exports = router;
