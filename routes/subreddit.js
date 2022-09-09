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


module.exports = router;
