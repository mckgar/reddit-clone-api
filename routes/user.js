const router = require('express').Router();
const userController = require('../controllers/userController');

router.post('/', userController.create_user);

router.get('/:username', userController.get_user);
router.delete('/:username', userController.delete_user);
router.put('/:username', userController.update_user);
router.post('/:username', userController.create_user_post);

router.get('/:username/:postid', userController.get_user_post);
router.put('/:username/:postid', userController.update_user_post);
router.delete('/:username/:postid', userController.delete_user_post);
router.post('/:username/:postid', userController.create_comment);

router.put('/:username/:postid/:commentid', userController.update_comment);
router.delete('/:username/:postid/:commentid', userController.delete_comment);
router.post('/:username/:postid/:commentid', userController.create_comment_child);

module.exports = router;
