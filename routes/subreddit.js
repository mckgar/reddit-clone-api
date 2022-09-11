const router = require('express').Router();
const subredditController = require('../controllers/subredditController');

router.post('/', subredditController.create_subreddit);

router.get('/:subreddit', subredditController.get_subreddit);
router.put('/:subreddit', subredditController.update_subreddit);
router.post('/:subreddit', subredditController.create_post);

router.get('/:subreddit/:postid', subredditController.get_post);
router.put('/:subreddit/:postid', subredditController.update_post);
router.delete('/:subreddit/:postid', subredditController.delete_post);
router.post('/:subreddit/:postid', subredditController.create_comment);

router.put('/:subreddit/:postid/:commentid', subredditController.update_comment);
router.delete('/:subreddit/:postid/:commentid', subredditController.delete_comment);
router.post('/:subreddit/:postid/:commentid', subredditController.create_comment_child);

module.exports = router;
