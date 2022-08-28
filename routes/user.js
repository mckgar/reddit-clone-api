const router = require('express').Router();
const userController = require('../controllers/userController');

router.post('/', userController.create_user);

router.get('/:username', userController.get_user);
router.delete('/:username', userController.delete_user);
router.put('/:username', userController.update_user);

module.exports = router;
